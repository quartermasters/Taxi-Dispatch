// © 2025 Quartermasters FZC. All rights reserved.

import { storage } from '../storage';
import { type Trip, type InsertTrip, type CreateTripRequest } from '@shared/schema';
import { pricingService } from './pricing';
import { dispatchService } from './dispatch';

export class TripsService {
  async createTrip(request: CreateTripRequest, passengerId: string): Promise<Trip> {
    // Get fare quote
    const quote = await pricingService.calculateFare({
      pickupLat: request.pickupLat,
      pickupLng: request.pickupLng,
      dropoffLat: request.dropoffLat,
      dropoffLng: request.dropoffLng,
      vehicleType: request.vehicleType || 'standard',
    });

    const trip = await storage.createTrip({
      passengerId,
      pickupLat: request.pickupLat.toString(),
      pickupLng: request.pickupLng.toString(),
      dropoffLat: request.dropoffLat.toString(),
      dropoffLng: request.dropoffLng.toString(),
      pickupAddress: request.pickupAddress,
      dropoffAddress: request.dropoffAddress,
      vehicleType: request.vehicleType || 'standard',
      fareQuote: quote.fareCents,
      surgeMultiplier: quote.surgeMultiplier?.toString() || '1.0',
      distanceKm: quote.distanceKm?.toString(),
      durationMin: quote.durationMin,
      paymentMethodId: request.paymentMethodId,
      scheduledAt: request.scheduledAt,
    });

    await eventLogService.logEvent('trip_created', trip.id, { 
      passengerId,
      fareQuote: quote.fareCents,
      vehicleType: request.vehicleType || 'standard'
    });

    // Queue for dispatch
    await dispatchService.queueTripForDispatch(trip.id);

    return trip;
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    return await storage.getTrip(id);
  }

  async updateTripStatus(
    tripId: string, 
    status: 'requested' | 'assigned' | 'enroute' | 'arrived' | 'ongoing' | 'completed' | 'cancelled',
    driverId?: string
  ): Promise<Trip> {
    const updates: any = { status };
    if (driverId) {
      updates.driverId = driverId;
    }

    const trip = await storage.updateTrip(tripId, updates);
    
    await eventLogService.logEvent(
      status === 'assigned' ? 'trip_assigned' :
      status === 'enroute' ? 'driver_enroute' :
      status === 'arrived' ? 'driver_arrived' :
      status === 'ongoing' ? 'trip_started' :
      status === 'completed' ? 'trip_completed' :
      'trip_cancelled',
      tripId,
      { status, driverId }
    );

    return trip;
  }

  async cancelTrip(tripId: string, reason?: string): Promise<Trip> {
    const trip = await this.updateTripStatus(tripId, 'cancelled');
    
    if (trip.driverId) {
      await storage.setDriverStatus(trip.driverId, 'idle');
    }

    await eventLogService.logEvent('trip_cancelled', tripId, { reason });
    
    return trip;
  }

  async assignDriver(tripId: string, driverId: string): Promise<Trip> {
    await storage.setDriverStatus(driverId, 'busy');
    return await this.updateTripStatus(tripId, 'assigned', driverId);
  }

  async getActiveTrips(): Promise<Trip[]> {
    return await storage.getActiveTrips();
  }

  async getTripHistory(passengerId: string, limit = 10): Promise<Trip[]> {
    return await storage.getTripsByPassenger(passengerId, limit);
  }

  async getDriverTrips(driverId: string, limit = 10): Promise<Trip[]> {
    return await storage.getTripsByDriver(driverId, limit);
  }
}

// Event logging service
class EventLogService {
  async logEvent(
    type: 'trip_created' | 'trip_assigned' | 'driver_enroute' | 'driver_arrived' | 'trip_started' | 'trip_completed' | 'trip_cancelled' | 'payment_captured',
    tripId: string,
    payload?: any,
    driverId?: string
  ): Promise<void> {
    await storage.createEventLog({
      tripId,
      driverId,
      type,
      payload,
    });
  }
}

export const tripsService = new TripsService();
export const eventLogService = new EventLogService();
