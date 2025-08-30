// © 2025 Quartermasters FZC. All rights reserved.

import Stripe from 'stripe';
import { storage } from '../storage';
import { eventLogService } from './trips';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

export class PaymentsService {
  async createPaymentIntent(tripId: string, amount: number): Promise<string> {
    if (!stripe) {
      throw new Error('Payment processing not configured');
    }

    const trip = await storage.getTrip(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        tripId,
        passengerId: trip.passengerId,
      },
    });

    await storage.createPayment({
      tripId,
      provider: 'stripe',
      intentId: paymentIntent.id,
      status: 'pending',
      amount: Math.round(amount),
      refundAmount: 0,
    });

    return paymentIntent.client_secret!;
  }

  async capturePayment(tripId: string): Promise<void> {
    if (!stripe) {
      throw new Error('Payment processing not configured');
    }

    const payment = await storage.getPaymentByTrip(tripId);
    if (!payment || payment.status !== 'pending') {
      throw new Error('Payment not found or already processed');
    }

    try {
      await stripe.paymentIntents.capture(payment.intentId);
      
      await storage.updatePayment(payment.id, {
        status: 'succeeded',
      });

      await eventLogService.logEvent('payment_captured', tripId, {
        paymentId: payment.id,
        amount: payment.amount,
      });
    } catch (error) {
      await storage.updatePayment(payment.id, {
        status: 'failed',
      });
      throw error;
    }
  }

  async refundPayment(tripId: string, amount?: number): Promise<void> {
    if (!stripe) {
      throw new Error('Payment processing not configured');
    }

    const payment = await storage.getPaymentByTrip(tripId);
    if (!payment || payment.status !== 'succeeded') {
      throw new Error('Payment not found or cannot be refunded');
    }

    const refundAmount = amount || payment.amount;
    
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.intentId,
        amount: refundAmount,
      });

      await storage.updatePayment(payment.id, {
        refundAmount: (payment.refundAmount || 0) + refundAmount,
        status: refundAmount >= payment.amount ? 'refunded' : 'succeeded',
      });

      await eventLogService.logEvent('payment_captured', tripId, {
        paymentId: payment.id,
        refundAmount,
        refundId: refund.id,
      });
    } catch (error) {
      throw new Error(`Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async voidPayment(tripId: string): Promise<void> {
    if (!stripe) {
      return;
    }

    const payment = await storage.getPaymentByTrip(tripId);
    if (!payment || payment.status !== 'pending') {
      return;
    }

    try {
      await stripe.paymentIntents.cancel(payment.intentId);
      
      await storage.updatePayment(payment.id, {
        status: 'failed',
      });
    } catch (error) {
      console.error(`Failed to void payment for trip ${tripId}:`, error);
    }
  }
}

export const paymentsService = new PaymentsService();
