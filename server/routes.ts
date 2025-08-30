// © 2025 Quartermasters FZC. All rights reserved.

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { users, drivers, vehicles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { authService } from "./services/auth";
import { tripsService } from "./services/trips";
import { pricingService } from "./services/pricing";
import { paymentsService } from "./services/payments";
import { dispatchService } from "./services/dispatch";
import { websocketService } from "./services/websocket";
import { 
  otpRequestSchema, 
  otpVerifySchema, 
  quoteRequestSchema, 
  createTripSchema,
  driverStatusUpdateSchema,
  driverEventSchema
} from "@shared/schema";

// Auth middleware
async function requireAuth(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.getUserFromToken(token);
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRole(role: 'passenger' | 'driver' | 'admin') {
  return (req: Request, res: Response, next: any) => {
    if ((req as any).user?.role !== role) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

      const trips = await storage.getTripsInDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      // Convert to CSV format
      const headers = ['Trip ID', 'Passenger', 'Driver', 'Status', 'Fare', 'Created At'];
      const csvData = [
        headers.join(','),
        ...trips.map(trip => [
          trip.id,
          trip.passengerId,
          trip.driverId || 'N/A',
          trip.status,
          (trip.fareQuote / 100).toFixed(2),
          trip.createdAt.toISOString()
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=trips-report.csv');
      res.send(csvData);
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
