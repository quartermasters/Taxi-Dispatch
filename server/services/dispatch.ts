// © 2025 Quartermasters FZC. All rights reserved.

import { storage } from '../storage';
import { tripsService, eventLogService } from './trips';
import { websocketService } from './websocket';

const DISPATCH_RADIUS_KM = 5;
const OFFER_WINDOW_SECONDS = 12;
const MAX_ATTEMPTS = 5;

interface JobOffer {
  tripId: string;
  driverId: string;
  pickupDistance: number;
  estimatedFare: number;
  expiresAt: Date;
}

export class DispatchService {
  private activeOffers = new Map<string, JobOffer>();
  private offerTimeouts = new Map<string, NodeJS.Timeout>();

  async queueTripForDispatch(tripId: string): Promise<void> {
    // In production, this would use BullMQ
    setTimeout(() => this.dispatchTrip(tripId), 100);
  }

  async dispatchTrip(tripId: string, attemptNumber = 1): Promise<void> {
    if (attemptNumber > MAX_ATTEMPTS) {
      console.log(`Max dispatch attempts reached for trip ${tripId}`);
      // Alert operator - in production this would be a notification
      return;
    }

    const trip = await storage.getTrip(tripId);
    if (!trip || trip.status !== 'requested') {
      return;
    }

    const pickupLat = parseFloat(trip.pickupLat);
    const pickupLng = parseFloat(trip.pickupLng);

    // Find idle drivers near pickup location
    const candidateDrivers = await storage.getIdleDriversNearLocation(
      pickupLat,
      pickupLng,
      DISPATCH_RADIUS_KM
    );

    if (candidateDrivers.length === 0) {
      console.log(`No available drivers for trip ${tripId}, attempt ${attemptNumber}`);
      // Retry in 30 seconds
      setTimeout(() => this.dispatchTrip(tripId, attemptNumber + 1), 30000);
      return;
    }

    // Try next available driver
    const driver = candidateDrivers[0];
    await this.offerJobToDriver(tripId, driver.id, attemptNumber);
  }

  async offerJobToDriver(tripId: string, driverId: string, attemptNumber: number): Promise<void> {
    const trip = await storage.getTrip(tripId);
    if (!trip) return;

    const driver = await storage.getDriver(driverId);
    if (!driver || driver.status !== 'idle') {
      // Driver no longer available, try next
      await this.dispatchTrip(tripId, attemptNumber);
      return;
    }

    // Calculate distance to pickup
    const pickupLat = parseFloat(trip.pickupLat);
    const pickupLng = parseFloat(trip.pickupLng);
    const driverLat = parseFloat(driver.lastLat || '0');
    const driverLng = parseFloat(driver.lastLng || '0');
    
    const pickupDistance = this.calculateDistance(driverLat, driverLng, pickupLat, pickupLng);

    const offer: JobOffer = {
      tripId,
      driverId,
      pickupDistance,
      estimatedFare: trip.fareQuote,
      expiresAt: new Date(Date.now() + OFFER_WINDOW_SECONDS * 1000),
    };

    this.activeOffers.set(`${tripId}-${driverId}`, offer);

    // Send job offer via WebSocket
    await websocketService.sendJobOffer(driverId, {
      tripId,
      pickup: { lat: pickupLat, lng: pickupLng, address: trip.pickupAddress },
      dropoff: { lat: parseFloat(trip.dropoffLat), lng: parseFloat(trip.dropoffLng), address: trip.dropoffAddress },
      distanceKm: pickupDistance,
      estMins: Math.round(pickupDistance * 2), // Rough estimate
      fareEstimate: trip.fareQuote,
      expiresAt: offer.expiresAt.toISOString(),
    });

    // Set timeout for offer expiration
    const timeout = setTimeout(async () => {
      await this.handleOfferTimeout(tripId, driverId, attemptNumber);
    }, OFFER_WINDOW_SECONDS * 1000);

    this.offerTimeouts.set(`${tripId}-${driverId}`, timeout);
  }

  async acceptJobOffer(tripId: string, driverId: string): Promise<boolean> {
    const offerKey = `${tripId}-${driverId}`;
    const offer = this.activeOffers.get(offerKey);

    if (!offer || offer.expiresAt < new Date()) {
      return false;
    }

    // Clear offer and timeout
    this.activeOffers.delete(offerKey);
    const timeout = this.offerTimeouts.get(offerKey);
    if (timeout) {
      clearTimeout(timeout);
      this.offerTimeouts.delete(offerKey);
    }

    // Assign trip to driver
    await tripsService.assignDriver(tripId, driverId);

    // Notify passenger and admin
    await websocketService.sendJobAccepted(tripId, driverId);

    return true;
  }

  async declineJobOffer(tripId: string, driverId: string): Promise<void> {
    const offerKey = `${tripId}-${driverId}`;
    this.activeOffers.delete(offerKey);
    
    const timeout = this.offerTimeouts.get(offerKey);
    if (timeout) {
      clearTimeout(timeout);
      this.offerTimeouts.delete(offerKey);
    }

    // Try next driver
    const trip = await storage.getTrip(tripId);
    if (trip && trip.status === 'requested') {
      setTimeout(() => this.dispatchTrip(tripId), 1000);
    }
  }

  private async handleOfferTimeout(tripId: string, driverId: string, attemptNumber: number): Promise<void> {
    const offerKey = `${tripId}-${driverId}`;
    this.activeOffers.delete(offerKey);
    this.offerTimeouts.delete(offerKey);

    console.log(`Job offer timeout for trip ${tripId}, driver ${driverId}`);
    
    // Try next driver
    await this.dispatchTrip(tripId, attemptNumber + 1);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export const dispatchService = new DispatchService();
