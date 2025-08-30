// © 2025 Quartermasters FZC. All rights reserved.

import { storage } from '../storage';
import { type QuoteRequest } from '@shared/schema';

interface FareQuote {
  fareCents: number;
  etaMin: number;
  distanceKm?: number;
  durationMin?: number;
  surgeMultiplier?: number;
}

export class PricingService {
  async calculateFare(request: QuoteRequest): Promise<FareQuote> {
    const vehicleType = request.vehicleType || 'standard';
    
    // Get applicable tariff
    const tariff = await storage.getTariff(vehicleType);
    if (!tariff) {
      throw new Error(`No tariff found for vehicle type: ${vehicleType}`);
    }

    // Calculate distance and estimated duration
    const distance = this.calculateDistance(
      request.pickupLat,
      request.pickupLng,
      request.dropoffLat,
      request.dropoffLng
    );

    // Simple duration estimate (actual implementation would use Maps API)
    const estimatedDuration = Math.round(distance * 2.5); // 2.5 minutes per km average
    
    // Calculate base fare
    let fare = tariff.baseFare + (distance * tariff.perKm) + (estimatedDuration * tariff.perMin);
    
    // Apply surge multiplier
    const surgeMultiplier = parseFloat(tariff.surgeMultiplier || '1.0');
    if (surgeMultiplier > 1) {
      fare = Math.round(fare * surgeMultiplier);
    }

    // Simple ETA calculation (in production, use Maps API)
    const etaMin = Math.round(distance * 1.5); // 1.5 minutes per km to pickup

    return {
      fareCents: Math.round(fare),
      etaMin,
      distanceKm: Math.round(distance * 100) / 100,
      durationMin: estimatedDuration,
      surgeMultiplier: surgeMultiplier > 1 ? surgeMultiplier : undefined,
    };
  }

  async getEtaToPickup(driverLat: number, driverLng: number, pickupLat: number, pickupLng: number): Promise<number> {
    const distance = this.calculateDistance(driverLat, driverLng, pickupLat, pickupLng);
    return Math.round(distance * 1.5); // 1.5 minutes per km
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

export const pricingService = new PricingService();
