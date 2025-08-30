// © 2025 Quartermasters FZC. All rights reserved.

// Notification service for push notifications and SMS
export class NotificationsService {
  async sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void> {
    // In production, implement FCM/APNs
    console.log(`PUSH [${userId}] ${title}: ${body}`, data);
  }

  async sendSms(phone: string, message: string): Promise<void> {
    // In production, implement Twilio SMS
    console.log(`SMS [${phone}] ${message}`);
  }

  async notifyBookingConfirmed(tripId: string, passengerId: string, eta: number): Promise<void> {
    await this.sendPushNotification(
      passengerId,
      'Booking Confirmed',
      `Your ride is confirmed. ETA: ${eta} minutes`,
      { tripId, type: 'booking_confirmed' }
    );
  }

  async notifyDriverAssigned(tripId: string, passengerId: string, driverName: string, vehicleInfo: string, eta: number): Promise<void> {
    await this.sendPushNotification(
      passengerId,
      'Driver Assigned',
      `${driverName} is coming to pick you up in a ${vehicleInfo}. ETA: ${eta} minutes`,
      { tripId, type: 'driver_assigned' }
    );
  }

  async notifyDriverArriving(tripId: string, passengerId: string, driverName: string): Promise<void> {
    await this.sendPushNotification(
      passengerId,
      'Driver Arriving',
      `${driverName} has arrived at your pickup location`,
      { tripId, type: 'driver_arriving' }
    );
  }

  async notifyTripCompleted(tripId: string, passengerId: string, fareAmount: number): Promise<void> {
    await this.sendPushNotification(
      passengerId,
      'Trip Completed',
      `Your trip is complete. Total: $${(fareAmount / 100).toFixed(2)}`,
      { tripId, type: 'trip_completed' }
    );
  }

  async notifyJobOffer(driverId: string, tripId: string, pickupDistance: number, estimatedFare: number): Promise<void> {
    await this.sendPushNotification(
      driverId,
      'New Trip Request',
      `Trip request ${pickupDistance.toFixed(1)}km away - $${(estimatedFare / 100).toFixed(2)}`,
      { tripId, type: 'job_offer' }
    );
  }
}

export const notificationsService = new NotificationsService();
