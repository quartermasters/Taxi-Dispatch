# Taxi Dispatch MVP System

## Overview

This is a full-stack taxi dispatch system MVP built for Quartermasters FZC. The system enables passengers to book rides, drivers to receive and complete jobs, and operators to monitor trips and handle payments through a comprehensive admin console. It consists of a React admin web interface, Express.js backend with WebSocket support, and React Native mobile applications for both passengers and drivers. The system emphasizes reliability, low latency, and clean UX while avoiding unnecessary complexity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Admin Web Console**: React 18 + TypeScript + Vite for the operator interface
- **UI Framework**: Shadcn/ui components with Radix UI primitives and Tailwind CSS for consistent styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket client for live updates (trip status, driver locations)

### Backend Architecture
- **API Server**: Express.js with TypeScript running on Node.js 20
- **Database ORM**: Drizzle ORM with PostgreSQL as the primary database
- **Real-time Gateway**: WebSocket server for bi-directional communication
- **Authentication**: JWT-based authentication with OTP verification
- **Payment Processing**: Stripe integration for card tokenization and payment capture
- **Background Jobs**: Simple in-memory queue system (designed for BullMQ upgrade in production)

### Mobile Applications
- **Cross-platform**: Expo (React Native) for both passenger and driver apps
- **Navigation**: React Navigation with bottom tabs and stack navigators
- **Maps Integration**: React Native Maps for location services
- **Real-time Updates**: WebSocket clients for job offers and trip status

### Data Storage Solutions
- **Primary Database**: PostgreSQL with comprehensive schema including users, drivers, vehicles, trips, payments, and audit logs
- **ORM**: Drizzle with migrations support and type-safe queries
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Caching Strategy**: Designed for Redis integration (not yet implemented)

### Authentication & Authorization
- **OTP-based Authentication**: Phone/email verification with 6-digit codes
- **JWT Tokens**: Access and refresh token pattern
- **Role-based Access**: Passenger, driver, and admin roles with appropriate permissions
- **Session Management**: Token-based stateless authentication

### Real-time Communication
- **WebSocket Implementation**: Native WebSocket server with connection management
- **Message Types**: Job offers, trip status updates, location updates, notifications
- **Connection Management**: Automatic reconnection and user session tracking
- **Authentication**: Token-based WebSocket authentication

### Service Architecture
- **Auth Service**: User management, OTP generation/verification, JWT handling
- **Trip Service**: Trip lifecycle management, booking creation, status updates
- **Dispatch Service**: Driver assignment, job offers, routing logic
- **Pricing Service**: Fare calculation, surge pricing, distance estimation
- **Payment Service**: Stripe payment intent creation, capture, refund handling
- **Notification Service**: Push notifications and SMS (stub implementation)
- **WebSocket Service**: Real-time communication coordination

### Development & Build System
- **Package Management**: npm with workspaces configuration
- **Build Tool**: Vite for frontend bundling and development server
- **TypeScript**: Full TypeScript support across frontend and backend
- **Database Management**: Drizzle Kit for migrations and schema management
- **Development Setup**: Hot reload for both frontend and backend development

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and migrations

### Payment Processing
- **Stripe**: Payment processing, card tokenization, and webhook handling
- **Stripe React Libraries**: Frontend payment components and client-side integration

### UI & Styling
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe utility for component variants

### Mobile Development
- **Expo**: React Native development platform and build service
- **React Navigation**: Navigation library for mobile apps
- **React Native Maps**: Map integration for location-based features
- **Expo Location**: Device location services
- **Expo Notifications**: Push notification handling

### Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type checking and enhanced developer experience
- **React Hook Form**: Form validation and management
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime type validation for API schemas

### Third-party Integrations (Planned)
- **Google Maps/Mapbox**: Route calculation and geocoding services
- **Twilio**: SMS notifications and OTP delivery
- **Firebase**: Push notification delivery service
- **Redis**: Caching and real-time data storage (not yet implemented)