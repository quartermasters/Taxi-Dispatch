// © 2025 Quartermasters FZC. All rights reserved.

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['passenger', 'driver', 'admin']);
export const driverStatusEnum = pgEnum('driver_status', ['offline', 'idle', 'busy']);
export const tripStatusEnum = pgEnum('trip_status', ['requested', 'assigned', 'enroute', 'arrived', 'ongoing', 'completed', 'cancelled']);
export const vehicleTypeEnum = pgEnum('vehicle_type', ['standard', 'xl', 'executive']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);
export const eventTypeEnum = pgEnum('event_type', [
  'trip_created', 'trip_assigned', 'driver_enroute', 'driver_arrived', 
  'trip_started', 'trip_completed', 'trip_cancelled', 'payment_captured'
]);

// Core Tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull().unique(),
  role: userRoleEnum("role").notNull().default('passenger'),
  defaultPaymentMethodId: text("default_payment_method_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: driverStatusEnum("status").notNull().default('offline'),
  lastLat: decimal("last_lat", { precision: 10, scale: 8 }),
  lastLng: decimal("last_lng", { precision: 11, scale: 8 }),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  idleSince: timestamp("idle_since"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('5.0'),
  totalTrips: integer("total_trips").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plate: text("plate").notNull().unique(),
  type: vehicleTypeEnum("type").notNull().default('standard'),
  model: text("model").notNull(),
  color: text("color").notNull(),
  capacity: integer("capacity").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  passengerId: varchar("passenger_id").notNull().references(() => users.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  status: tripStatusEnum("status").notNull().default('requested'),
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 8 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 11, scale: 8 }).notNull(),
  pickupAddress: text("pickup_address"),
  dropoffLat: decimal("dropoff_lat", { precision: 10, scale: 8 }).notNull(),
  dropoffLng: decimal("dropoff_lng", { precision: 11, scale: 8 }).notNull(),
  dropoffAddress: text("dropoff_address"),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull().default('standard'),
  scheduledAt: timestamp("scheduled_at"),
  fareQuote: integer("fare_quote").notNull(), // in cents
  surgeMultiplier: decimal("surge_multiplier", { precision: 3, scale: 2 }).default('1.0'),
  distanceKm: decimal("distance_km", { precision: 8, scale: 3 }),
  durationMin: integer("duration_min"),
  paymentMethodId: text("payment_method_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tariffs = pgTable("tariffs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  baseFare: integer("base_fare").notNull(), // in cents
  perKm: integer("per_km").notNull(), // in cents
  perMin: integer("per_min").notNull(), // in cents
  surgeMultiplier: decimal("surge_multiplier", { precision: 3, scale: 2 }).default('1.0'),
  zoneId: varchar("zone_id").references(() => zones.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").notNull().references(() => trips.id),
  provider: text("provider").notNull().default('stripe'),
  intentId: text("intent_id").notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  amount: integer("amount").notNull(), // in cents
  refundAmount: integer("refund_amount").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventLogs = pgTable("event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  type: eventTypeEnum("type").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const zones = pgTable("zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  polygon: jsonb("polygon"), // GeoJSON polygon
  radiusKm: decimal("radius_km", { precision: 5, scale: 2 }),
  surgeMultiplier: decimal("surge_multiplier", { precision: 3, scale: 2 }).default('1.0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // phone or email
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  driver: one(drivers, { fields: [users.id], references: [drivers.userId] }),
  trips: many(trips),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, { fields: [drivers.userId], references: [users.id] }),
  vehicle: one(vehicles, { fields: [drivers.vehicleId], references: [vehicles.id] }),
  trips: many(trips),
  eventLogs: many(eventLogs),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  drivers: many(drivers),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  passenger: one(users, { fields: [trips.passengerId], references: [users.id] }),
  driver: one(drivers, { fields: [trips.driverId], references: [drivers.id] }),
  payments: many(payments),
  eventLogs: many(eventLogs),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  trip: one(trips, { fields: [payments.tripId], references: [trips.id] }),
}));

export const eventLogsRelations = relations(eventLogs, ({ one }) => ({
  trip: one(trips, { fields: [eventLogs.tripId], references: [trips.id] }),
  driver: one(drivers, { fields: [eventLogs.driverId], references: [drivers.id] }),
}));

export const tariffsRelations = relations(tariffs, ({ one }) => ({
  zone: one(zones, { fields: [tariffs.zoneId], references: [zones.id] }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ id: true, createdAt: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTariffSchema = createInsertSchema(tariffs).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertEventLogSchema = createInsertSchema(eventLogs).omit({ id: true, createdAt: true });
export const insertZoneSchema = createInsertSchema(zones).omit({ id: true, createdAt: true });
export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Tariff = typeof tariffs.$inferSelect;
export type InsertTariff = z.infer<typeof insertTariffSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type EventLog = typeof eventLogs.$inferSelect;
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type Zone = typeof zones.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;

// API DTOs
export const quoteRequestSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  vehicleType: z.enum(['standard', 'xl', 'executive']).optional(),
});

export const createTripSchema = insertTripSchema.extend({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
});

export const otpRequestSchema = z.object({
  identifier: z.string(), // phone or email
});

export const otpVerifySchema = z.object({
  identifier: z.string(),
  code: z.string(),
});

export const driverStatusUpdateSchema = z.object({
  online: z.boolean(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const driverEventSchema = z.object({
  tripId: z.string(),
  type: z.enum(['arrived', 'start', 'end']),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type CreateTripRequest = z.infer<typeof createTripSchema>;
export type OtpRequest = z.infer<typeof otpRequestSchema>;
export type OtpVerify = z.infer<typeof otpVerifySchema>;
export type DriverStatusUpdate = z.infer<typeof driverStatusUpdateSchema>;
export type DriverEvent = z.infer<typeof driverEventSchema>;
