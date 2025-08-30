# Taxi Dispatch — MVP Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** August 30, 2025  
**Client:** TBD (Fleet Operator)  
**Developer & Copyright Owner:** Quartermasters FZC  

---

## 1) Purpose & Vision
Build a lean, reliable **Taxi Dispatch MVP** that enables passengers to book rides, drivers to receive and complete jobs, and operators to monitor trips and handle payments—without the bloat. The product must be **deployable fast**, **simple to use**, and **ready to scale** into a full ecosystem later.

**Success Criteria (MVP):**
- First pilot city live with ≥10 active drivers and ≥100 passenger sign‑ups in month 1.
- ≥500 completed trips with <2% failed/abandoned dispatches.
- Median passenger app cold‑start to booking confirmation ≤ 8s.
- Driver job offer latency (dispatch → device) ≤ 1s p95.

---

## 2) Mental Map (System at a Glance)
- **Passenger App:** request → quote → confirm → live track → pay → rate.
- **Driver App:** go online → receive offer → accept → navigate → complete → earnings.
- **Dispatch Engine:** takes bookings, allocates to nearest suitable driver, manages job lifecycle.
- **Admin Console:** live ops board, CRUD (drivers/vehicles/tariffs), basic refunds and reports.
- **Payments:** card on file (Stripe) + optional cash for pilot; capture on completion; refunds.
- **Realtime:** WebSockets for job offers, status, locations.
- **Data Layer:** Postgres (system of record), Redis (presence/ETA/queues).

---

## 3) Scope — MVP (In) vs Non‑Goals (Out)

### In Scope (MVP)
- Passenger mobile app (iOS/Android via Expo).
- Driver mobile app (iOS/Android via Expo).
- Real‑time dispatch with nearest‑driver assignment.
- Live maps and ETAs (Google Maps or Mapbox Distance Matrix).
- Payments: Stripe card tokenisation; capture on trip completion; manual refund in Admin.
- Admin web: live map/board, trips list, drivers/vehicles/tariffs CRUD, basic reports.
- Push notifications + SMS fallback for key states (driver assigned, arriving, complete).
- Basic surge multiplier (manual by operator per zone/time window).
- Pre‑booking (scheduled pickups) with simple reminder flow.
- Minimal auditing (trip/event logs).

### Out of Scope (Phase 2+)
- AI route optimisation / dead‑mile reduction.
- Multi‑fleet marketplace and external booking aggregators.
- Corporate account portal (cost centres, SSO, invoicing at scale).
- Loyalty programs, promo codes engine, wallets, tips splitting logic.
- NEMT compliance features and HIPAA workflows.
- In‑app chat and advanced safety telematics.

---

## 4) User Personas & Primary Journeys

**Passenger (P):** wants a fast, predictable ride.  
**Driver (D):** wants steady jobs and clear earnings.  
**Dispatcher/Operator (O):** wants stability, visibility, and simple controls.

**Passenger Journey:** Sign‑in → set pickup/dropoff → see quote/ETA → confirm → watch driver → ride → pay/receipt → rate.  
**Driver Journey:** Login → go online → receive job → accept → navigate → pickup → complete → earnings updated.  
**Operator Journey:** Monitor live board → manage drivers/vehicles/tariffs → handle refunds/disputes → export reports.

---

## 5) Functional Requirements

### 5.1 Passenger App (MVP)
- **Auth:** OTP by SMS/email (optional social sign‑in later). Minimal profile (name, phone, email).
- **Booking:** pickup via map pin or search; dropoff via search; vehicle type selection (Standard/XL/Exec as config).
- **Quote:** fare estimate + ETA; surge factor display when active.
- **Confirmation:** card on file selection (Stripe); ability to cancel before driver arrival (operator‑configurable fee window).
- **Live Tracking:** driver location, ETA updates, plate/vehicle model, call driver (masked).
- **Completion:** receipt screen; rating (1–5) + optional comment.
- **History:** last 10 trips with receipts.

### 5.2 Driver App (MVP)
- **Auth:** credential or OTP; device verification.
- **Status:** Online/Offline; auto‑idle after period of inactivity (config).
- **Job Offers:** push + socket event with pickup distance/ETA; accept/decline within N seconds.
- **Navigation:** deep link to Google/Apple Maps; show passenger pin.
- **Trip Flow:** enroute to pickup → arrived → start trip → end trip; auto‑status suggestions based on GPS proximity.
- **Earnings:** today/7‑day summary (fares, tips if enabled, cash vs card split).

### 5.3 Dispatch Engine (MVP)
- **Assignment:** nearest idle driver within radius R using Haversine distance; tie‑breaker by time‑idle.
- **Retry Logic:** if declined/timeout, offer to next best candidate; after K attempts escalate to operator alert.
- **Zones:** optional simple zones for surge and radius tuning.
- **Pre‑book:** queue scheduled jobs; fire assignment N minutes before pickup.
- **State Machine:** REQUESTED → ASSIGNED → ENROUTE → ARRIVED → ONGOING → COMPLETED/CANCELLED.

### 5.4 Admin Console (MVP)
- **Live Board:** map with drivers and active trips; filter by status/zone.
- **CRUD:** drivers, vehicles, tariffs (base, per‑km, per‑min), simple zones, surge windows.
- **Trips:** searchable list; view timeline; manual cancel; reassign.
- **Payments:** view charges/refunds; trigger full/partial refund; add internal notes.
- **Reports:** CSV export: trips/day, revenue/day, cancellations, driver utilisation.
- **Settings:** company profile, contact, legal pages, cancellation fee rules.

### 5.5 Payments (MVP)
- **Tokenisation:** store card via Stripe.
- **Capture:** create payment intent on confirmation; capture on completion; void on cancellation inside grace window.
- **Refunds:** manual from Admin; partial/full.
- **Receipts:** emailed + in‑app (Stripe charge id, tax lines config).

### 5.6 Notifications (MVP)
- **Push:** booking confirmed, driver assigned, driver arriving, trip complete.
- **SMS fallback:** booking confirmed + driver assigned + arrival (toggle per tenant).

### 5.7 Analytics & Logging (MVP)
- **Events:** booking_created, driver_assigned, driver_arrived, trip_started, trip_completed, payment_captured, refund_issued.
- **Dashboards:** daily counts and revenue in Admin; CSV exports.

---

## 6) Non‑Functional Requirements
- **Reliability:** p95 job‑offer delivery <1s; backend availability ≥99.9% in pilot.
- **Performance:** fare estimate response ≤600ms (server) with cached distance matrix when possible.
- **Security:** JWT for API; HTTPS only; PII encryption at rest; Stripe PCI‑scope limited to tokens.
- **Privacy:** data retention defaults—trips 24 months; locations raw samples 30 days (aggregated after).
- **Observability:** structured logs, error tracking, health endpoints, basic metrics (CPU/mem, queue depth, offer latency).

---

## 7) Architecture (MVP)
- **Frontend:**
  - Passenger & Driver: Expo (React Native).
  - Admin: React + Vite.
- **Backend:** NestJS services
  - API Gateway (REST + Auth), Realtime Gateway (socket.io), Services: Trips, Dispatch, Pricing, Fleet, Payments, Notifications, Reports.
- **Data:** Postgres (Prisma), Redis (presence, geodata, queues), S3‑compatible storage (receipts/exports) via LocalStack in dev.
- **Integrations:** Stripe; Maps provider (Google or Mapbox); Twilio for SMS; FCM/APNs for push.

**Key Flows:**
- Quote → Pricing → Distance Matrix → return fare & ETA.
- Confirm → Trips.create → Dispatch.enqueue → offer chain → Driver.accept.
- Complete → Payments.capture → Reports.log → Receipt.

---

## 8) Data Model (Condensed)
- **Passenger:** id, name, email, phone, defaultPaymentMethodId.
- **Driver:** id, name, phone, status, currentLocation, vehicleId.
- **Vehicle:** id, plate, type, capacity.
- **Trip:** id, passengerId, driverId, status, pickup (lat/lng/address), dropoff (lat/lng/address), scheduledAt, fareQuote, surge, distanceKm, durationMin, timestamps.
- **Tariff:** id, vehicleType, base, perKm, perMin, surgeMultiplier, zoneId.
- **Payment:** id, tripId, method, intentId, status, amount, refundAmount.
- **EventLog:** id, tripId, type, payload, createdAt.

---

## 9) APIs (Representative MVP Endpoints)
- `POST /auth/otp/request` → send code.
- `POST /auth/otp/verify` → JWT.
- `POST /trips/quote` → {eta, fare}
- `POST /trips` → create booking.
- `GET /trips/:id` → booking details + status.
- `POST /trips/:id/cancel` → cancel rules.
- `POST /drivers/status` → online/offline + location heartbeat.
- `WS events` → job.offer, job.accepted, status.update, location.update.
- `POST /admin/refunds` → refund by charge/amount.
- `GET /admin/reports?range=...` → CSV.

**Auth:** Bearer JWT; roles: passenger/driver/admin.

---

## 10) Dispatch Logic (MVP)
- **Candidate Set:** drivers `status=IDLE` within radius R of pickup; sort by `distance asc, idleSince asc`.
- **Offer Window:** default 12s; if timeout/decline, move to next candidate.
- **Max Attempts:** default 5; else page operator.
- **Geofencing:** simple polygon zones (optional) for surge and radius overrides.
- **Pre‑book:** release job N minutes before pickup; prefer drivers within zone.

---

## 11) Payments Flow (MVP)
- **On confirm:** create PaymentIntent with amount=fareQuote; status=requires_capture.
- **On complete:** capture PaymentIntent; write Payment record; email receipt.
- **On cancel:** if within grace window, cancel/void PaymentIntent; else apply fee (config) and capture that amount.
- **Refund:** admin‑initiated; partial/full; stored to Payment.refundAmount.

---

## 12) Notifications (Templates MVP)
- **Passenger:**
  - Booking confirmed (trip id, ETA).
  - Driver assigned (name, vehicle, ETA).
  - Driver arriving.
  - Trip completed (total, receipt link).
- **Driver:**
  - New job offer (pickup distance/ETA).
  - Reminder when near pickup.

---

## 13) Admin — Reports (MVP)
- **Daily Trips:** count, completed, cancelled.
- **Revenue:** gross card revenue, refunds, net.
- **Driver Utilisation:** hours online, trips per hour (basic).
- **Exports:** CSV by date range.

---

## 14) Configuration (MVP)
- Vehicle types, base/per‑km/per‑min prices.
- Radius R and offer window seconds.
- Surge windows and multipliers.
- Cancellation grace window and fee.
- SMS fallback toggles.

---

## 15) Security & Compliance
- JWT with short‑lived access tokens + refresh tokens.
- Encrypted secrets; role‑based access guards.
- PII encryption at rest (emails/phones); geo‑data retention policy.
- Stripe handles card data; we never store PANs.

---

## 16) Observability & Ops
- Health endpoints per service (`/healthz`).
- Structured logging (request id, trip id).
- Metrics: job offer latency, queue depth, socket connections, error rates.
- Alerts: failed assignment streaks, payment capture failures.

---

## 17) Environments & Deployment
- **Dev:** Docker Compose (Postgres, Redis, LocalStack). Hot‑reload everywhere.
- **Staging:** Single‑node VM or ECS task set; seeded test data.
- **Prod (Pilot):** small autoscaling group; managed Postgres; off‑the‑shelf Redis; S3 for exports.

---

## 18) QA — Acceptance Criteria (MVP)
- Create booking → driver auto‑assigned within 10s for a driver within 3km.
- Status transitions visible to passenger and driver in <1s p95.
- Completion captures payment and issues receipt within 30s p95.
- Admin can refund a charge and see it reflected in reports.
- 100 concurrent bookings handled without dispatch backlog.

---

## 19) Edge Cases
- Pickup/Drop in no‑service area → block booking with clear reason.
- Driver app offline mid‑trip → retry sockets; failover to SMS/voice call.
- Passenger cancels after driver arrival → apply fee.
- Payment capture fails → retry; if persistent, mark trip for manual review.

---

## 20) Risks & Mitigations
- **Driver supply too low** → manual scheduling + incentives; pre‑book bias.
- **Maps quota overrun** → cache distance matrix; switch to Mapbox if needed.
- **Push delivery delays** → socket first, push as backup; SMS for critical.
- **Payment disputes** → clear receipts, trip telemetry, photos (Phase 2).

---

## 21) Timeline (Indicative)
- **Wk 1–2:** Backend scaffolding, DB, Auth, Trips, basic Admin.
- **Wk 3:** Dispatch + Realtime; Driver app job flow.
- **Wk 4:** Passenger booking, quotes, live tracking.
- **Wk 5:** Payments (Stripe), receipts, refunds.
- **Wk 6:** Reports/exports, config, polish, pilot readiness.

---

## 22) Future Roadmap (Post‑MVP)
- Corporate portal, promotions/loyalty, webhooks/marketplace, in‑app chat, AI optimisation.

---

## 23) Open Questions
- Cash payments in pilot? If yes, reconciliation rules.
- Driver KYC requirements and document types per market?
- Masked calling provider preference (Twilio Verify/Proxy)?
- Cancellation fee policy thresholds?

---

### Legal
**© 2025 Quartermasters FZC. All rights reserved. Quartermasters FZC is the developer and copyright owner of Taxi Dispatch (MVP) as specified in this PRD.**

