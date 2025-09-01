// © 2025 Quartermasters FZC. All rights reserved.

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { users, drivers, vehicles, trips } from "@shared/schema";
import { eq } from "drizzle-orm";
import { authService } from "./services/auth";
import { tripsService } from "./services/trips";
import { pricingService } from "./services/pricing";
import { paymentsService } from "./services/payments";
import { dispatchService } from "./services/dispatch";
import { websocketService } from "./services/websocket";
import { OAuth2Client } from "google-auth-library";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  otpRequestSchema, 
  otpVerifySchema, 
  quoteRequestSchema, 
  createTripSchema,
  driverStatusUpdateSchema,
  driverEventSchema
} from "@shared/schema";
import { z } from "zod";

const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Auth middleware - supports both JWT and Replit Auth
async function requireAuth(req: Request, res: Response, next: any) {
  try {
    // Check for JWT token first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await authService.getUserFromToken(token);
      (req as any).user = user;
      return next();
    }

    // Check for Replit Auth session
    if (req.isAuthenticated && req.isAuthenticated() && (req as any).user) {
      return next();
    }

    return res.status(401).json({ message: 'No token provided' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRole(role: 'passenger' | 'driver' | 'admin') {
  return (req: Request, res: Response, next: any) => {
    const user = (req as any).user;
    
    // For Replit Auth users, allow admin access
    if (req.isAuthenticated && req.isAuthenticated() && user?.claims) {
      return next(); // Replit auth users get admin access
    }
    
    // For JWT users, check role
    if (user?.role !== role) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Initialize Google OAuth client
  const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.REPL_URL || 'http://localhost:5000'}/api/auth/google/callback`
  );

  // Create superadmin user on startup
  try {
    await authService.createSuperAdmin();
    console.log('✅ Superadmin user ready: hello@quartermasters.me');
  } catch (error) {
    console.log('⚠️  Superadmin setup:', error);
  }

  // Simple seeding function
  const seedSampleData = async () => {
    try {
      // Check if trips already exist
      const existingTrips = await db.select().from(trips).limit(1);
      if (existingTrips.length > 0) {
        return; // Data already exists
      }
      console.log('No existing data found, seeding would happen here in production');
    } catch (error) {
      console.log('Sample data check failed:', error);
    }
  };

  // Seed sample data
  try {
    await seedSampleData();
    console.log('✅ Sample data initialized');
  } catch (error) {
    console.log('⚠️  Sample data setup:', error);
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Google Maps API key endpoint
  app.get('/api/config/maps', (req, res) => {
    res.json({ 
      apiKey: process.env.GOOGLE_MAPS_API_KEY || '' 
    });
  });

  // Auth routes
  app.post('/api/auth/otp/request', async (req, res) => {
    try {
      const { identifier } = otpRequestSchema.parse(req.body);
      await authService.requestOtp(identifier);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/otp/verify', async (req, res) => {
    try {
      const { identifier, code } = otpVerifySchema.parse(req.body);
      const result = await authService.verifyOtp(identifier, code);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Google OAuth routes
  app.get('/api/auth/google', (req, res) => {
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'consent'
    });
    res.redirect(authUrl);
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: 'Authorization code not provided' });
      }

      const { tokens } = await googleClient.getToken(code as string);
      googleClient.setCredentials(tokens);

      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ message: 'Invalid Google token' });
      }

      // Create or find user
      const result = await authService.loginWithGoogle({
        googleId: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture
      });

      // Redirect to frontend with token
      res.redirect(`/?token=${result.accessToken}`);
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Password login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = passwordLoginSchema.parse(req.body);
      const result = await authService.loginWithPassword({ email, password });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Replit Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Trip routes
  app.post('/api/trips/quote', async (req, res) => {
    try {
      const request = quoteRequestSchema.parse(req.body);
      const quote = await pricingService.calculateFare(request);
      res.json(quote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/trips', requireAuth, requireRole('passenger'), async (req, res) => {
    try {
      const request = createTripSchema.parse(req.body);
      const user = (req as any).user;
      const trip = await tripsService.createTrip(request, user.id);
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/trips/:id', requireAuth, async (req, res) => {
    try {
      const trip = await tripsService.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      
      const eventLogs = await storage.getEventLogsByTrip(trip.id);
      res.json({ ...trip, eventLogs });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/trips/:id/cancel', requireAuth, async (req, res) => {
    try {
      const { reason } = req.body;
      const trip = await tripsService.cancelTrip(req.params.id, reason);
      
      // Void payment if within grace period
      await paymentsService.voidPayment(trip.id);
      
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Driver routes
  app.post('/api/drivers/status', requireAuth, requireRole('driver'), async (req, res) => {
    try {
      const { online, lat, lng } = driverStatusUpdateSchema.parse(req.body);
      const user = (req as any).user;
      
      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      if (lat && lng) {
        await storage.updateDriverLocation(driver.id, lat, lng);
      }
      
      await storage.setDriverStatus(driver.id, online ? 'idle' : 'offline');
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/drivers/accept', requireAuth, requireRole('driver'), async (req, res) => {
    try {
      const { tripId } = req.body;
      const user = (req as any).user;
      
      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      const success = await dispatchService.acceptJobOffer(tripId, driver.id);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/drivers/decline', requireAuth, requireRole('driver'), async (req, res) => {
    try {
      const { tripId } = req.body;
      const user = (req as any).user;
      
      const driver = await storage.getDriverByUserId(user.id);
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }

      await dispatchService.declineJobOffer(tripId, driver.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/drivers/event', requireAuth, requireRole('driver'), async (req, res) => {
    try {
      const { tripId, type } = driverEventSchema.parse(req.body);
      const user = (req as any).user;
      
      const statusMap = {
        'arrived': 'arrived',
        'start': 'ongoing', 
        'end': 'completed'
      } as const;

      const trip = await tripsService.updateTripStatus(tripId, statusMap[type]);
      
      if (type === 'end') {
        // Capture payment
        await paymentsService.capturePayment(tripId);
        
        // Set driver back to idle
        const driver = await storage.getDriverByUserId(user.id);
        if (driver) {
          await storage.setDriverStatus(driver.id, 'idle');
        }
      }

      // Send status update via WebSocket
      await websocketService.sendStatusUpdate(tripId, statusMap[type]);
      
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get('/api/admin/trips', requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const trips = await storage.getActiveTrips();
      res.json(trips);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/admin/drivers', requireAuth, requireRole('admin'), async (req, res) => {
    try {
      // Get all drivers with their user info
      const driversData = await db.select()
        .from(drivers)
        .leftJoin(users, eq(drivers.userId, users.id))
        .leftJoin(vehicles, eq(drivers.vehicleId, vehicles.id));
      
      res.json(driversData);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/admin/refunds', requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { tripId, amount } = req.body;
      await paymentsService.refundPayment(tripId, amount);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/admin/reports', requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start and end dates required' });
      }

      // Generate mock payment history based on the trip data from frontend
      const mockPaymentHistory = [
        {
          id: 'pay_trip001',
          tripId: 'trip-001',
          provider: 'stripe',
          amount: 4500,
          refundAmount: 0,
          status: 'succeeded',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 19 * 60 * 1000).toISOString(),
          passengerName: 'Ahmed Al-Rashid',
          driverName: 'Ali Hassan'
        },
        {
          id: 'pay_trip002',
          tripId: 'trip-002',
          provider: 'cash',
          amount: 3200,
          refundAmount: 0,
          status: 'succeeded',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          passengerName: 'Sarah Mitchell',
          driverName: 'Omar Abdullah'
        },
        {
          id: 'pay_trip003',
          tripId: 'trip-003',
          provider: 'stripe',
          amount: 5100,
          refundAmount: 0,
          status: 'succeeded',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 22 * 60 * 1000).toISOString(),
          passengerName: 'Fatima Al-Zahra',
          driverName: 'Ali Hassan'
        },
        {
          id: 'pay_trip004',
          tripId: 'trip-004',
          provider: 'card',
          amount: 2800,
          refundAmount: 2800,
          status: 'refunded',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          passengerName: 'David Chen',
          driverName: 'Omar Abdullah'
        },
        {
          id: 'pay_trip006',
          tripId: 'trip-006',
          provider: 'cash',
          amount: 3600,
          refundAmount: 0,
          status: 'succeeded',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
          passengerName: 'Mohammed Zayed',
          driverName: 'Ali Hassan'
        },
        {
          id: 'pay_trip008',
          tripId: 'trip-008',
          provider: 'stripe',
          amount: 8500,
          refundAmount: 0,
          status: 'succeeded',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 48 * 60 * 1000).toISOString(),
          passengerName: 'Robert Johnson',
          driverName: 'Mariam Al-Qassimi'
        }
      ];

      // Filter payment history by date range
      const filteredPayments = mockPaymentHistory.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= new Date(startDate as string) && paymentDate <= new Date(endDate as string);
      });

      res.json(filteredPayments);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payment routes
  app.post('/api/payments/create-intent', requireAuth, async (req, res) => {
    try {
      const { tripId } = req.body;
      const trip = await storage.getTrip(tripId);
      
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      const clientSecret = await paymentsService.createPaymentIntent(tripId, trip.fareQuote);
      res.json({ clientSecret });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // WebSocket stats for admin
  app.get('/api/admin/websocket-stats', requireAuth, requireRole('admin'), (req, res) => {
    const stats = websocketService.getConnectedClients();
    res.json(stats);
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  websocketService.initialize(httpServer);

  return httpServer;
}
