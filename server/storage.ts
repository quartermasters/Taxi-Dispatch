// © 2025 Quartermasters FZC. All rights reserved.

import { 
  users, drivers, vehicles, trips, tariffs, payments, eventLogs, zones, otpCodes,
  type User, type InsertUser, type UpsertUser, type Driver, type InsertDriver, type Vehicle, type InsertVehicle,
  type Trip, type InsertTrip, type Tariff, type InsertTariff, type Payment, type InsertPayment,
  type EventLog, type InsertEventLog, type Zone, type InsertZone, type OtpCode, type InsertOtpCode
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gt, desc, asc, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Driver methods
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver>;
  getIdleDriversNearLocation(lat: number, lng: number, radiusKm: number): Promise<Driver[]>;
  updateDriverLocation(id: string, lat: number, lng: number): Promise<void>;
  setDriverStatus(id: string, status: 'offline' | 'idle' | 'busy'): Promise<void>;

  // Vehicle methods
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle>;
  getAllVehicles(): Promise<Vehicle[]>;

  // Trip methods
  getTrip(id: string): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip>;
  getTripsByPassenger(passengerId: string, limit?: number): Promise<Trip[]>;
  getTripsByDriver(driverId: string, limit?: number): Promise<Trip[]>;
  getActiveTrips(): Promise<Trip[]>;
  getTripsInDateRange(startDate: Date, endDate: Date): Promise<Trip[]>;

  // Tariff methods
  getTariff(vehicleType: 'standard' | 'xl' | 'executive', zoneId?: string): Promise<Tariff | undefined>;
  createTariff(tariff: InsertTariff): Promise<Tariff>;
  updateTariff(id: string, updates: Partial<InsertTariff>): Promise<Tariff>;
  getAllTariffs(): Promise<Tariff[]>;

  // Payment methods
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByTrip(tripId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment>;
  getPaymentsInDateRange(startDate: Date, endDate: Date): Promise<Payment[]>;

  // Event log methods
  createEventLog(eventLog: InsertEventLog): Promise<EventLog>;
  getEventLogsByTrip(tripId: string): Promise<EventLog[]>;

  // Zone methods
  getZone(id: string): Promise<Zone | undefined>;
  getAllZones(): Promise<Zone[]>;
  createZone(zone: InsertZone): Promise<Zone>;

  // OTP methods
  createOtpCode(otp: InsertOtpCode): Promise<OtpCode>;
  getValidOtpCode(identifier: string, code: string): Promise<OtpCode | undefined>;
  markOtpCodeAsVerified(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    if (!googleId) return undefined;
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      updatedAt: new Date(),
    }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Driver methods
  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver || undefined;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver || undefined;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values({
      ...insertDriver,
      updatedAt: new Date(),
    }).returning();
    return driver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver> {
    const [driver] = await db.update(drivers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async getIdleDriversNearLocation(lat: number, lng: number, radiusKm: number): Promise<Driver[]> {
    // Using Haversine formula for distance calculation
    const driversNearby = await db.select().from(drivers)
      .where(and(
        eq(drivers.status, 'idle'),
        sql`(6371 * acos(cos(radians(${lat})) * cos(radians(${drivers.lastLat})) * cos(radians(${drivers.lastLng}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${drivers.lastLat})))) <= ${radiusKm}`
      ))
      .orderBy(asc(drivers.idleSince));
    
    return driversNearby;
  }

  async updateDriverLocation(id: string, lat: number, lng: number): Promise<void> {
    await db.update(drivers)
      .set({ 
        lastLat: lat.toString(), 
        lastLng: lng.toString(),
        updatedAt: new Date()
      })
      .where(eq(drivers.id, id));
  }

  async setDriverStatus(id: string, status: 'offline' | 'idle' | 'busy'): Promise<void> {
    const updates: any = { 
      status,
      updatedAt: new Date()
    };
    
    if (status === 'idle') {
      updates.idleSince = new Date();
    }
    
    await db.update(drivers)
      .set(updates)
      .where(eq(drivers.id, id));
  }

  // Vehicle methods
  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle> {
    const [vehicle] = await db.update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  // Trip methods
  async getTrip(id: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db.insert(trips).values({
      ...insertTrip,
      updatedAt: new Date(),
    }).returning();
    return trip;
  }

  async updateTrip(id: string, updates: Partial<InsertTrip>): Promise<Trip> {
    const [trip] = await db.update(trips)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return trip;
  }

  async getTripsByPassenger(passengerId: string, limit = 10): Promise<Trip[]> {
    return await db.select().from(trips)
      .where(eq(trips.passengerId, passengerId))
      .orderBy(desc(trips.createdAt))
      .limit(limit);
  }

  async getTripsByDriver(driverId: string, limit = 10): Promise<Trip[]> {
    return await db.select().from(trips)
      .where(eq(trips.driverId, driverId))
      .orderBy(desc(trips.createdAt))
      .limit(limit);
  }

  async getActiveTrips(): Promise<Trip[]> {
    return await db.select().from(trips)
      .where(inArray(trips.status, ['requested', 'assigned', 'enroute', 'arrived', 'ongoing']))
      .orderBy(desc(trips.createdAt));
  }

  async getTripsInDateRange(startDate: Date, endDate: Date): Promise<Trip[]> {
    return await db.select().from(trips)
      .where(and(
        gt(trips.createdAt, startDate),
        lt(trips.createdAt, endDate)
      ))
      .orderBy(desc(trips.createdAt));
  }

  // Tariff methods
  async getTariff(vehicleType: 'standard' | 'xl' | 'executive', zoneId?: string): Promise<Tariff | undefined> {
    const conditions = [eq(tariffs.vehicleType, vehicleType)];
    if (zoneId) {
      conditions.push(eq(tariffs.zoneId, zoneId));
    }

    const [tariff] = await db.select().from(tariffs)
      .where(and(...conditions))
      .orderBy(desc(tariffs.createdAt));
    
    return tariff || undefined;
  }

  async createTariff(insertTariff: InsertTariff): Promise<Tariff> {
    const [tariff] = await db.insert(tariffs).values(insertTariff).returning();
    return tariff;
  }

  async updateTariff(id: string, updates: Partial<InsertTariff>): Promise<Tariff> {
    const [tariff] = await db.update(tariffs)
      .set(updates)
      .where(eq(tariffs.id, id))
      .returning();
    return tariff;
  }

  async getAllTariffs(): Promise<Tariff[]> {
    return await db.select().from(tariffs).orderBy(desc(tariffs.createdAt));
  }

  // Payment methods
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByTrip(tripId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.tripId, tripId));
    return payment || undefined;
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment> {
    const [payment] = await db.update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async getPaymentsInDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(and(
        gt(payments.createdAt, startDate),
        lt(payments.createdAt, endDate)
      ))
      .orderBy(desc(payments.createdAt));
  }

  // Event log methods
  async createEventLog(insertEventLog: InsertEventLog): Promise<EventLog> {
    const [eventLog] = await db.insert(eventLogs).values(insertEventLog).returning();
    return eventLog;
  }

  async getEventLogsByTrip(tripId: string): Promise<EventLog[]> {
    return await db.select().from(eventLogs)
      .where(eq(eventLogs.tripId, tripId))
      .orderBy(desc(eventLogs.createdAt));
  }

  // Zone methods
  async getZone(id: string): Promise<Zone | undefined> {
    const [zone] = await db.select().from(zones).where(eq(zones.id, id));
    return zone || undefined;
  }

  async getAllZones(): Promise<Zone[]> {
    return await db.select().from(zones).where(eq(zones.isActive, true));
  }

  async createZone(insertZone: InsertZone): Promise<Zone> {
    const [zone] = await db.insert(zones).values(insertZone).returning();
    return zone;
  }

  // OTP methods
  async createOtpCode(insertOtp: InsertOtpCode): Promise<OtpCode> {
    const [otp] = await db.insert(otpCodes).values(insertOtp).returning();
    return otp;
  }

  async getValidOtpCode(identifier: string, code: string): Promise<OtpCode | undefined> {
    const [otp] = await db.select().from(otpCodes)
      .where(and(
        eq(otpCodes.identifier, identifier),
        eq(otpCodes.code, code),
        eq(otpCodes.verified, false),
        gt(otpCodes.expiresAt, new Date())
      ));
    return otp || undefined;
  }

  async markOtpCodeAsVerified(id: string): Promise<void> {
    await db.update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, id));
  }
}

export const storage = new DatabaseStorage();
