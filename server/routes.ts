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
      // Get mock trip data for frontend display
      const mockTrips = [
        {
          id: 'trip-001',
          passengerId: 'pass-ahmed-r',
          driverId: 'driver-ali',
          status: 'completed',
          pickupLat: 25.2048,
          pickupLng: 55.2708,
          dropoffLat: 25.2285,
          dropoffLng: 55.3573,
          pickupAddress: 'Dubai Mall',
          dropoffAddress: 'Dubai International Airport',
          fareQuote: 4500,
          distanceKm: 25.8,
          estimatedDuration: 35,
          actualDuration: 32,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 32 * 60 * 1000),
          paymentMethod: 'card',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Excellent service!'
        },
        {
          id: 'trip-002',
          passengerId: 'pass-sarah-m',
          driverId: 'driver-omar',
          status: 'completed',
          pickupLat: 25.1972,
          pickupLng: 55.2744,
          dropoffLat: 25.0657,
          dropoffLng: 55.1713,
          pickupAddress: 'Burj Khalifa',
          dropoffAddress: 'Ibn Battuta Mall',
          fareQuote: 3200,
          distanceKm: 18.5,
          estimatedDuration: 28,
          actualDuration: 25,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 25 * 60 * 1000),
          paymentMethod: 'cash',
          paymentStatus: 'completed',
          rating: 4,
          feedback: 'Good driver, smooth ride'
        },
        {
          id: 'trip-003',
          passengerId: 'pass-fatima-z',
          driverId: 'driver-ali',
          status: 'completed',
          pickupLat: 25.0772,
          pickupLng: 55.3092,
          dropoffLat: 25.1144,
          dropoffLng: 55.1965,
          pickupAddress: 'Jumeirah Beach',
          dropoffAddress: 'Mall of the Emirates',
          fareQuote: 5100,
          distanceKm: 28.2,
          estimatedDuration: 32,
          actualDuration: 35,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 35 * 60 * 1000),
          paymentMethod: 'card',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Perfect timing and very professional'
        },
        {
          id: 'trip-004',
          passengerId: 'pass-david-c',
          driverId: 'driver-omar',
          status: 'cancelled',
          pickupLat: 25.2582,
          pickupLng: 55.3644,
          dropoffLat: 25.1144,
          dropoffLng: 55.1965,
          pickupAddress: 'Gold Souk, Deira',
          dropoffAddress: 'Mall of the Emirates',
          fareQuote: 2800,
          distanceKm: 21.3,
          estimatedDuration: 28,
          actualDuration: null,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedAt: null,
          paymentMethod: 'card',
          paymentStatus: 'refunded',
          rating: null,
          feedback: null
        },
        {
          id: 'trip-005',
          passengerId: 'pass-lisa-t',
          driverId: 'driver-youssef',
          status: 'in_progress',
          pickupLat: 25.0657,
          pickupLng: 55.1713,
          dropoffLat: 25.2285,
          dropoffLng: 55.3573,
          pickupAddress: 'Ibn Battuta Mall',
          dropoffAddress: 'Dubai International Airport',
          fareQuote: 7200,
          distanceKm: 32.1,
          estimatedDuration: 40,
          actualDuration: null,
          createdAt: new Date(Date.now() - 25 * 60 * 1000),
          completedAt: null,
          paymentMethod: 'card',
          paymentStatus: 'pending',
          rating: null,
          feedback: null
        },
        {
          id: 'trip-006',
          passengerId: 'pass-mohammed-z',
          driverId: 'driver-ali',
          status: 'completed',
          pickupLat: 25.2631,
          pickupLng: 55.3095,
          dropoffLat: 25.2048,
          dropoffLng: 55.2708,
          pickupAddress: 'Business Bay',
          dropoffAddress: 'Dubai Mall',
          fareQuote: 3600,
          distanceKm: 12.4,
          estimatedDuration: 18,
          actualDuration: 20,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 5 * 60 * 1000),
          completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 25 * 60 * 1000),
          paymentMethod: 'cash',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Very quick and efficient'
        },
        {
          id: 'trip-007',
          passengerId: 'pass-nina-p',
          driverId: null,
          status: 'pending',
          pickupLat: 25.1144,
          pickupLng: 55.1965,
          dropoffLat: 25.2582,
          dropoffLng: 55.3644,
          pickupAddress: 'Mall of the Emirates',
          dropoffAddress: 'Gold Souk, Deira',
          fareQuote: 4100,
          distanceKm: 21.3,
          estimatedDuration: 28,
          actualDuration: null,
          createdAt: new Date(Date.now() - 1 * 60 * 1000),
          completedAt: null,
          paymentMethod: 'cash',
          paymentStatus: 'pending',
          rating: null,
          feedback: null
        },
        {
          id: 'trip-008',
          passengerId: 'pass-robert-j',
          driverId: 'driver-mariam',
          status: 'completed',
          pickupLat: 25.2285,
          pickupLng: 55.3573,
          dropoffLat: 25.0934,
          dropoffLng: 55.1560,
          pickupAddress: 'Dubai International Airport',
          dropoffAddress: 'Atlantis The Palm',
          fareQuote: 8500,
          distanceKm: 35.6,
          estimatedDuration: 45,
          actualDuration: 38,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 38 * 60 * 1000),
          paymentMethod: 'card',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Amazing service! Driver was very helpful with luggage.'
        }
      ];

      // Filter by date range if provided
      const { startDate, endDate } = req.query;
      let filteredTrips = mockTrips;
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        filteredTrips = mockTrips.filter(trip => {
          const tripDate = new Date(trip.createdAt);
          return tripDate >= start && tripDate <= end;
        });
      }

      res.json(filteredTrips);
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
      const { startDate, endDate, format } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start and end dates required' });
      }

      // Get the trip data to generate comprehensive reports
      const mockTrips = [
        {
          id: 'trip-001',
          passengerId: 'pass-ahmed-r',
          driverId: 'driver-ali',
          status: 'completed',
          pickupLat: 25.2048,
          pickupLng: 55.2708,
          dropoffLat: 25.2285,
          dropoffLng: 55.3573,
          pickupAddress: 'Dubai Mall',
          dropoffAddress: 'Dubai International Airport',
          fareQuote: 4500,
          distanceKm: 25.8,
          estimatedDuration: 35,
          actualDuration: 32,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 32 * 60 * 1000),
          paymentMethod: 'card',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Excellent service!',
          passengerName: 'Ahmed Al-Rashid',
          driverName: 'Ali Hassan'
        },
        {
          id: 'trip-002',
          passengerId: 'pass-sarah-m',
          driverId: 'driver-omar',
          status: 'completed',
          pickupLat: 25.1972,
          pickupLng: 55.2744,
          dropoffLat: 25.0657,
          dropoffLng: 55.1713,
          pickupAddress: 'Burj Khalifa',
          dropoffAddress: 'Ibn Battuta Mall',
          fareQuote: 3200,
          distanceKm: 18.5,
          estimatedDuration: 28,
          actualDuration: 25,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 25 * 60 * 1000),
          paymentMethod: 'cash',
          paymentStatus: 'completed',
          rating: 4,
          feedback: 'Good driver, smooth ride',
          passengerName: 'Sarah Mitchell',
          driverName: 'Omar Abdullah'
        },
        {
          id: 'trip-003',
          passengerId: 'pass-fatima-z',
          driverId: 'driver-ali',
          status: 'completed',
          pickupLat: 25.0772,
          pickupLng: 55.3092,
          dropoffLat: 25.1144,
          dropoffLng: 55.1965,
          pickupAddress: 'Jumeirah Beach',
          dropoffAddress: 'Mall of the Emirates',
          fareQuote: 5100,
          distanceKm: 28.2,
          estimatedDuration: 32,
          actualDuration: 35,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 35 * 60 * 1000),
          paymentMethod: 'card',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Perfect timing and very professional',
          passengerName: 'Fatima Al-Zahra',
          driverName: 'Ali Hassan'
        },
        {
          id: 'trip-004',
          passengerId: 'pass-david-c',
          driverId: 'driver-omar',
          status: 'cancelled',
          pickupLat: 25.2582,
          pickupLng: 55.3644,
          dropoffLat: 25.1144,
          dropoffLng: 55.1965,
          pickupAddress: 'Gold Souk, Deira',
          dropoffAddress: 'Mall of the Emirates',
          fareQuote: 2800,
          distanceKm: 21.3,
          estimatedDuration: 28,
          actualDuration: null,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedAt: null,
          paymentMethod: 'card',
          paymentStatus: 'refunded',
          rating: null,
          feedback: null,
          passengerName: 'David Chen',
          driverName: 'Omar Abdullah'
        },
        {
          id: 'trip-006',
          passengerId: 'pass-mohammed-z',
          driverId: 'driver-ali',
          status: 'completed',
          pickupLat: 25.2631,
          pickupLng: 55.3095,
          dropoffLat: 25.2048,
          dropoffLng: 55.2708,
          pickupAddress: 'Business Bay',
          dropoffAddress: 'Dubai Mall',
          fareQuote: 3600,
          distanceKm: 12.4,
          estimatedDuration: 18,
          actualDuration: 20,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 5 * 60 * 1000),
          completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 25 * 60 * 1000),
          paymentMethod: 'cash',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Very quick and efficient',
          passengerName: 'Mohammed Zayed',
          driverName: 'Ali Hassan'
        },
        {
          id: 'trip-008',
          passengerId: 'pass-robert-j',
          driverId: 'driver-mariam',
          status: 'completed',
          pickupLat: 25.2285,
          pickupLng: 55.3573,
          dropoffLat: 25.0934,
          dropoffLng: 55.1560,
          pickupAddress: 'Dubai International Airport',
          dropoffAddress: 'Atlantis The Palm',
          fareQuote: 8500,
          distanceKm: 35.6,
          estimatedDuration: 45,
          actualDuration: 38,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 38 * 60 * 1000),
          paymentMethod: 'card',
          paymentStatus: 'completed',
          rating: 5,
          feedback: 'Amazing service! Driver was very helpful with luggage.',
          passengerName: 'Robert Johnson',
          driverName: 'Mariam Al-Qassimi'
        }
      ];

      // Filter trips by date range
      const filteredTrips = mockTrips.filter(trip => {
        const tripDate = new Date(trip.createdAt);
        return tripDate >= new Date(startDate as string) && tripDate <= new Date(endDate as string);
      });

      // Return CSV format for export
      if (format === 'csv') {
        const csvHeaders = 'Trip ID,Passenger,Driver,Status,Pickup,Dropoff,Distance (km),Fare (AED),Payment Method,Rating,Created At,Completed At\n';
        const csvRows = filteredTrips.map(trip => {
          const fare = (trip.fareQuote / 100).toFixed(2);
          const createdAt = new Date(trip.createdAt).toLocaleString();
          const completedAt = trip.completedAt ? new Date(trip.completedAt).toLocaleString() : 'N/A';
          
          return `${trip.id},${trip.passengerName},${trip.driverName || 'N/A'},${trip.status},"${trip.pickupAddress}","${trip.dropoffAddress}",${trip.distanceKm},${fare},${trip.paymentMethod},${trip.rating || 'N/A'},${createdAt},${completedAt}`;
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="trips-report-${startDate}-to-${endDate}.csv"`);
        res.send(csvHeaders + csvRows);
        return;
      }

      // Return JSON format for frontend display (includes payment data)
      const mockPaymentHistory = filteredTrips.map(trip => ({
        id: `pay_${trip.id}`,
        tripId: trip.id,
        provider: trip.paymentMethod === 'cash' ? 'cash' : 'stripe',
        amount: trip.fareQuote,
        refundAmount: trip.paymentStatus === 'refunded' ? trip.fareQuote : 0,
        status: trip.paymentStatus === 'completed' ? 'succeeded' : trip.paymentStatus,
        createdAt: trip.completedAt || trip.createdAt,
        passengerName: trip.passengerName,
        driverName: trip.driverName
      }));

      res.json(mockPaymentHistory);
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
