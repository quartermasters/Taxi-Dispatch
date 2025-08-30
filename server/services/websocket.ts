// © 2025 Quartermasters FZC. All rights reserved.

import { WebSocketServer, WebSocket } from 'ws';
import { type Server } from 'http';
import { authService } from './auth';

interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  role: 'passenger' | 'driver' | 'admin';
}

export class WebSocketService {
  private clients = new Map<string, WebSocketClient>();
  private wss: WebSocketServer | null = null;

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: async (info) => {
        try {
          const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
          const token = url.searchParams.get('token');
          if (!token) return false;
          
          await authService.verifyToken(token);
          return true;
        } catch {
          return false;
        }
      }
    });

    this.wss.on('connection', async (ws, req) => {
      try {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        if (!token) {
          ws.close();
          return;
        }

        const payload = authService.verifyToken(token);
        const client: WebSocketClient = {
          ws,
          userId: payload.userId,
          role: payload.role,
        };

        this.clients.set(payload.userId, client);

        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            await this.handleMessage(client, message);
          } catch (error) {
            console.error('WebSocket message error:', error);
          }
        });

        ws.on('close', () => {
          this.clients.delete(payload.userId);
        });

        ws.send(JSON.stringify({ type: 'connected', userId: payload.userId }));
      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close();
      }
    });
  }

  private async handleMessage(client: WebSocketClient, message: any): Promise<void> {
    switch (message.type) {
      case 'location_update':
        if (client.role === 'driver') {
          await this.handleDriverLocationUpdate(client.userId, message.data);
        }
        break;
      case 'join_trip':
        // Join trip room for updates
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private async handleDriverLocationUpdate(driverId: string, location: { lat: number; lng: number }): Promise<void> {
    const driver = await storage.getDriverByUserId(driverId);
    if (driver) {
      await storage.updateDriverLocation(driver.id, location.lat, location.lng);
      
      // Broadcast location to admin clients
      this.broadcastToRole('admin', {
        type: 'location_update',
        driverId: driver.id,
        lat: location.lat,
        lng: location.lng,
      });
    }
  }

  async sendJobOffer(driverId: string, offer: any): Promise<void> {
    const client = this.clients.get(driverId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'job_offer',
        data: offer,
      }));
    }
  }

  async sendJobAccepted(tripId: string, driverId: string): Promise<void> {
    const trip = await storage.getTrip(tripId);
    if (!trip) return;

    // Notify passenger
    const passengerClient = this.clients.get(trip.passengerId);
    if (passengerClient && passengerClient.ws.readyState === WebSocket.OPEN) {
      passengerClient.ws.send(JSON.stringify({
        type: 'job_accepted',
        data: { tripId, driverId },
      }));
    }

    // Notify admin clients
    this.broadcastToRole('admin', {
      type: 'job_accepted',
      data: { tripId, driverId },
    });
  }

  async sendStatusUpdate(tripId: string, status: string): Promise<void> {
    const trip = await storage.getTrip(tripId);
    if (!trip) return;

    const message = {
      type: 'status_update',
      data: { tripId, status },
    };

    // Notify passenger
    const passengerClient = this.clients.get(trip.passengerId);
    if (passengerClient && passengerClient.ws.readyState === WebSocket.OPEN) {
      passengerClient.ws.send(JSON.stringify(message));
    }

    // Notify driver
    if (trip.driverId) {
      const driverClient = this.clients.get(trip.driverId);
      if (driverClient && driverClient.ws.readyState === WebSocket.OPEN) {
        driverClient.ws.send(JSON.stringify(message));
      }
    }

    // Notify admin clients
    this.broadcastToRole('admin', message);
  }

  private broadcastToRole(role: 'passenger' | 'driver' | 'admin', message: any): void {
    for (const client of this.clients.values()) {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  getConnectedClients(): { total: number; passengers: number; drivers: number; admins: number } {
    const stats = { total: 0, passengers: 0, drivers: 0, admins: 0 };
    
    for (const client of this.clients.values()) {
      stats.total++;
      stats[`${client.role}s` as keyof typeof stats]++;
    }
    
    return stats;
  }
}

export const websocketService = new WebSocketService();
