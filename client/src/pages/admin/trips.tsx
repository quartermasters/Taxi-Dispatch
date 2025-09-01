// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LiveMap } from "@/components/ui/live-map";

// Comprehensive mock trip data
const mockTrips = [
  // Current active trips
  {
    id: 'trip-001',
    passengerId: 'pass-sarah-m',
    passengerName: 'Sarah Mitchell',
    passengerPhone: '+971-50-123-4567',
    driverId: 'driver-ahmed',
    driverName: 'Ahmed Al-Mansouri',
    driverPhone: '+971-55-987-6543',
    vehicleId: 'vehicle-001',
    vehiclePlate: 'D-12345',
    status: 'in_progress',
    pickupLat: 25.2048,
    pickupLng: 55.2708,
    dropoffLat: 25.0800,
    dropoffLng: 55.1400,
    pickupAddress: 'Downtown Dubai, Burj Khalifa Area',
    dropoffAddress: 'Dubai Marina Mall',
    fareQuote: 4500,
    distanceKm: 18.5,
    estimatedDuration: 25,
    actualDuration: null,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 mins ago
    acceptedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    completedAt: null,
    paymentMethod: 'card',
    paymentStatus: 'pending',
    rating: null,
    feedback: null,
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), description: 'Trip request created' },
      { id: 'e2', type: 'driver_assigned', createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), description: 'Driver Ahmed assigned' },
      { id: 'e3', type: 'trip_started', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), description: 'Trip started - passenger picked up' }
    ]
  },
  {
    id: 'trip-002',
    passengerId: 'pass-mohammed-k',
    passengerName: 'Mohammed Khalil',
    passengerPhone: '+971-50-234-5678',
    driverId: 'driver-fatima',
    driverName: 'Fatima Al-Zahra',
    driverPhone: '+971-55-876-5432',
    vehicleId: 'vehicle-007',
    vehiclePlate: 'D-78901',
    status: 'accepted',
    pickupLat: 25.2582,
    pickupLng: 55.3644,
    dropoffLat: 25.2048,
    dropoffLng: 55.2708,
    pickupAddress: 'Deira City Centre',
    dropoffAddress: 'Dubai Mall',
    fareQuote: 3200,
    distanceKm: 12.3,
    estimatedDuration: 18,
    actualDuration: null,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    acceptedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    startedAt: null,
    completedAt: null,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    rating: null,
    feedback: null,
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), description: 'Trip request created' },
      { id: 'e2', type: 'driver_assigned', createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), description: 'Driver Fatima assigned' }
    ]
  },
  // Recent completed trips
  {
    id: 'trip-003',
    passengerId: 'pass-john-s',
    passengerName: 'John Smith',
    passengerPhone: '+971-50-345-6789',
    driverId: 'driver-omar',
    driverName: 'Omar Hassan',
    driverPhone: '+971-55-765-4321',
    vehicleId: 'vehicle-015',
    vehiclePlate: 'D-56789',
    status: 'completed',
    pickupLat: 25.0934,
    pickupLng: 55.1560,
    dropoffLat: 25.2285,
    dropoffLng: 55.3573,
    pickupAddress: 'Palm Jumeirah, Atlantis Area',
    dropoffAddress: 'Dubai International Airport',
    fareQuote: 6800,
    distanceKm: 28.7,
    estimatedDuration: 35,
    actualDuration: 42,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 - 18 * 60 * 1000).toISOString(),
    paymentMethod: 'card',
    paymentStatus: 'completed',
    rating: 5,
    feedback: 'Excellent service, very professional driver!',
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), description: 'Trip request created' },
      { id: 'e2', type: 'driver_assigned', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(), description: 'Driver Omar assigned' },
      { id: 'e3', type: 'trip_started', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), description: 'Trip started - passenger picked up' },
      { id: 'e4', type: 'trip_completed', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000 - 18 * 60 * 1000).toISOString(), description: 'Trip completed successfully' },
      { id: 'e5', type: 'payment_processed', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000 - 16 * 60 * 1000).toISOString(), description: 'Payment processed via card' },
      { id: 'e6', type: 'rating_received', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString(), description: '5-star rating received' }
    ]
  },
  {
    id: 'trip-004',
    passengerId: 'pass-aisha-r',
    passengerName: 'Aisha Rahman',
    passengerPhone: '+971-50-456-7890',
    driverId: 'driver-khalid',
    driverName: 'Khalid Al-Maktoum',
    driverPhone: '+971-55-654-3210',
    vehicleId: 'vehicle-023',
    vehiclePlate: 'D-89012',
    status: 'completed',
    pickupLat: 25.1413,
    pickupLng: 55.1947,
    dropoffLat: 25.2048,
    dropoffLng: 55.2708,
    pickupAddress: 'Jumeirah Beach Road',
    dropoffAddress: 'DIFC Business District',
    fareQuote: 2800,
    distanceKm: 14.2,
    estimatedDuration: 20,
    actualDuration: 18,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    acceptedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 23 * 60 * 1000).toISOString(),
    paymentMethod: 'card',
    paymentStatus: 'completed',
    rating: 4,
    feedback: 'Good service, clean vehicle',
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), description: 'Trip request created' },
      { id: 'e2', type: 'driver_assigned', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString(), description: 'Driver Khalid assigned' },
      { id: 'e3', type: 'trip_started', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), description: 'Trip started - passenger picked up' },
      { id: 'e4', type: 'trip_completed', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 23 * 60 * 1000).toISOString(), description: 'Trip completed successfully' },
      { id: 'e5', type: 'payment_processed', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(), description: 'Payment processed via card' },
      { id: 'e6', type: 'rating_received', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), description: '4-star rating received' }
    ]
  },
  {
    id: 'trip-005',
    passengerId: 'pass-david-l',
    passengerName: 'David Lee',
    passengerPhone: '+971-50-567-8901',
    driverId: 'driver-hassan',
    driverName: 'Hassan Al-Rashid',
    driverPhone: '+971-55-543-2109',
    vehicleId: 'vehicle-031',
    vehiclePlate: 'D-34567',
    status: 'cancelled',
    pickupLat: 25.2192,
    pickupLng: 55.2397,
    dropoffLat: 25.0800,
    dropoffLng: 55.1400,
    pickupAddress: 'Business Bay Metro Station',
    dropoffAddress: 'Dubai Marina',
    fareQuote: 3500,
    distanceKm: 16.8,
    estimatedDuration: 22,
    actualDuration: null,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    acceptedAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
    startedAt: null,
    completedAt: null,
    paymentMethod: 'card',
    paymentStatus: 'refunded',
    rating: null,
    feedback: null,
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), description: 'Trip request created' },
      { id: 'e2', type: 'driver_assigned', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(), description: 'Driver Hassan assigned' },
      { id: 'e3', type: 'trip_cancelled', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), description: 'Trip cancelled by passenger' },
      { id: 'e4', type: 'payment_refunded', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(), description: 'Payment refunded to card' }
    ]
  },
  // More completed trips from today
  {
    id: 'trip-006',
    passengerId: 'pass-emily-w',
    passengerName: 'Emily Wilson',
    passengerPhone: '+971-50-678-9012',
    driverId: 'driver-ali',
    driverName: 'Ali Al-Fahad',
    driverPhone: '+971-55-432-1098',
    vehicleId: 'vehicle-008',
    vehiclePlate: 'D-45678',
    status: 'completed',
    pickupLat: 25.2048,
    pickupLng: 55.2708,
    dropoffLat: 25.2192,
    dropoffLng: 55.2397,
    pickupAddress: 'Dubai Mall',
    dropoffAddress: 'Business Bay, Executive Towers',
    fareQuote: 2200,
    distanceKm: 8.4,
    estimatedDuration: 12,
    actualDuration: 15,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 19 * 60 * 1000).toISOString(),
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    rating: 5,
    feedback: 'Perfect ride, very smooth!',
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), description: 'Trip request created' },
      { id: 'e2', type: 'driver_assigned', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString(), description: 'Driver Ali assigned' },
      { id: 'e3', type: 'trip_started', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(), description: 'Trip started - passenger picked up' },
      { id: 'e4', type: 'trip_completed', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 19 * 60 * 1000).toISOString(), description: 'Trip completed successfully' },
      { id: 'e5', type: 'payment_cash', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(), description: 'Cash payment received' },
      { id: 'e6', type: 'rating_received', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(), description: '5-star rating received' }
    ]
  },
  // Additional trips for variety
  {
    id: 'trip-007',
    passengerId: 'pass-lisa-t',
    passengerName: 'Lisa Thompson',
    passengerPhone: '+971-50-789-0123',
    driverId: 'driver-youssef',
    driverName: 'Youssef Al-Nouri',
    driverPhone: '+971-55-321-0987',
    vehicleId: 'vehicle-012',
    vehiclePlate: 'D-67890',
    status: 'pending',
    pickupLat: 25.0657,
    pickupLng: 55.1713,
    dropoffLat: 25.2285,
    dropoffLng: 55.3573,
    pickupAddress: 'Ibn Battuta Mall',
    dropoffAddress: 'Dubai International Airport',
    fareQuote: 7200,
    distanceKm: 32.1,
    estimatedDuration: 40,
    actualDuration: null,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    paymentMethod: 'card',
    paymentStatus: 'pending',
    rating: null,
    feedback: null,
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), description: 'Trip request created' }
    ]
  },
  {
    id: 'trip-008',
    passengerId: 'pass-robert-j',
    passengerName: 'Robert Johnson',
    passengerPhone: '+971-50-890-1234',
    driverId: 'driver-mariam',
    driverName: 'Mariam Al-Qassimi',
    driverPhone: '+971-55-210-9876',
    vehicleId: 'vehicle-019',
    vehiclePlate: 'D-78123',
    status: 'completed',
    pickupLat: 25.2285,
    pickupLng: 55.3573,
    dropoffLat: 25.0934,
    dropoffLng: 55.1560,
    pickupAddress: 'Dubai International Airport',
    dropoffAddress: 'Atlantis The Palm',
    fareQuote: 8500,
    distanceKm: 35.6,
    estimatedDuration: 45,
    actualDuration: 38,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    acceptedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 46 * 60 * 1000).toISOString(),
    paymentMethod: 'card',
    paymentStatus: 'completed',
    rating: 5,
    feedback: 'Amazing service! Driver was very helpful with luggage.',
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), description: 'Trip request created' },
      { id: 'e2', type: 'driver_assigned', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(), description: 'Driver Mariam assigned' },
      { id: 'e3', type: 'trip_started', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), description: 'Trip started - passenger picked up' },
      { id: 'e4', type: 'trip_completed', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 46 * 60 * 1000).toISOString(), description: 'Trip completed successfully' },
      { id: 'e5', type: 'payment_processed', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 48 * 60 * 1000).toISOString(), description: 'Payment processed via card' },
      { id: 'e6', type: 'rating_received', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 55 * 60 * 1000).toISOString(), description: '5-star rating received' }
    ]
  },
  {
    id: 'trip-009',
    passengerId: 'pass-nina-p',
    passengerName: 'Nina Patel',
    passengerPhone: '+971-50-901-2345',
    driverId: null,
    driverName: null,
    driverPhone: null,
    vehicleId: null,
    vehiclePlate: null,
    status: 'pending',
    pickupLat: 25.1144,
    pickupLng: 55.1965,
    dropoffLat: 25.2582,
    dropoffLng: 55.3644,
    pickupAddress: 'Mall of the Emirates',
    dropoffAddress: 'Gold Souk, Deira',
    fareQuote: 4100,
    distanceKm: 21.3,
    estimatedDuration: 28,
    actualDuration: null,
    createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    rating: null,
    feedback: null,
    eventLogs: [
      { id: 'e1', type: 'trip_created', createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), description: 'Trip request created - waiting for driver assignment' }
    ]
  }
];

// Extract current trips for map display
const getCurrentTrips = () => mockTrips.filter(trip => ['pending', 'accepted', 'in_progress'].includes(trip.status));

export default function Trips() {
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showMap, setShowMap] = useState(true);
  const { toast } = useToast();

  // Use mock data for comprehensive trip display
  const trips = mockTrips;
  const isLoading = false;

  const cancelTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const response = await apiRequest('POST', `/api/trips/${tripId}/cancel`, { reason: 'Admin cancellation' });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/trips'] });
      toast({
        title: "Trip Cancelled",
        description: "The trip has been successfully cancelled.",
      });
      setSelectedTrip(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredTrips = trips?.filter((trip: any) => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.dropoffAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleViewTrip = (tripId: string) => {
    const tripDetails = mockTrips.find(trip => trip.id === tripId);
    setSelectedTrip(tripDetails);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Trip Management</h2>
            <p className="text-sm text-muted-foreground">Monitor active trips and view trip history</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
              data-testid="select-status-filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-trips"
            />
            <Button
              variant={showMap ? "default" : "outline"}
              onClick={() => setShowMap(!showMap)}
              data-testid="button-toggle-map"
            >
              <i className="fas fa-map mr-2"></i>
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex">
        {/* Left Panel - Trip List */}
        <div className={`${showMap ? 'w-1/2' : 'w-full'} p-6 border-r border-border`}>
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Trips</p>
                    <p className="text-2xl font-bold text-foreground">{getCurrentTrips().length}</p>
                  </div>
                  <i className="fas fa-route text-2xl text-blue-500"></i>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                    <p className="text-2xl font-bold text-foreground">{mockTrips.filter(t => t.status === 'completed').length}</p>
                  </div>
                  <i className="fas fa-check-circle text-2xl text-green-500"></i>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">AED {(mockTrips.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.fareQuote, 0) / 100).toFixed(0)}</p>
                  </div>
                  <i className="fas fa-money-bill text-2xl text-yellow-500"></i>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                    <p className="text-2xl font-bold text-foreground">{(mockTrips.filter(t => t.rating).reduce((sum, t) => sum + t.rating, 0) / mockTrips.filter(t => t.rating).length || 0).toFixed(1)}</p>
                  </div>
                  <i className="fas fa-star text-2xl text-yellow-400"></i>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Trips ({filteredTrips.length})</CardTitle>
            </CardHeader>
            <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground mt-2">Loading trips...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Driver & Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground" data-testid="empty-trips">
                        {searchTerm || statusFilter !== 'all' ? 'No trips match your filters' : 'No trips found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrips.map((trip: any) => (
                      <TableRow key={trip.id} data-testid={`trip-row-${trip.id}`} className="hover:bg-muted/50">
                        <TableCell className="font-medium" data-testid={`trip-id-${trip.id}`}>
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">#{trip.id.slice(-3)}</span>
                            <span className="text-xs text-muted-foreground">{new Date(trip.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`trip-passenger-${trip.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">{trip.passengerName}</span>
                            <span className="text-xs text-muted-foreground">{trip.passengerPhone}</span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`trip-driver-${trip.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">{trip.driverName || 'Unassigned'}</span>
                            <span className="text-xs text-muted-foreground">{trip.vehiclePlate || 'No Vehicle'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={trip.status} data-testid={`trip-status-${trip.id}`} />
                        </TableCell>
                        <TableCell className="max-w-xs" data-testid={`trip-route-${trip.id}`}>
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center text-xs">
                              <i className="fas fa-circle text-green-500 mr-1"></i>
                              <span className="truncate">{trip.pickupAddress}</span>
                            </div>
                            <div className="flex items-center text-xs">
                              <i className="fas fa-circle text-red-500 mr-1"></i>
                              <span className="truncate">{trip.dropoffAddress}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{trip.distanceKm} km</span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`trip-fare-${trip.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">AED {(trip.fareQuote / 100).toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">{trip.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`trip-duration-${trip.id}`}>
                          <div className="flex flex-col">
                            <span className="text-sm">{trip.actualDuration ? `${trip.actualDuration}m` : `~${trip.estimatedDuration}m`}</span>
                            {trip.rating && (
                              <div className="flex items-center text-xs">
                                <i className="fas fa-star text-yellow-400 mr-1"></i>
                                <span>{trip.rating}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTrip(trip.id)}
                            data-testid={`button-view-trip-${trip.id}`}
                          >
                            <i className="fas fa-eye mr-1"></i>
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>

        {/* Right Panel - Live Map */}
        {showMap && (
          <div className="w-1/2 p-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Trip Tracking</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {getCurrentTrips().length} active trips
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full pb-6">
                <div className="h-full relative">
                  <LiveMap 
                    className="w-full h-full rounded-lg"
                    trips={getCurrentTrips()}
                    selectedTrip={selectedTrip}
                    onTripSelect={setSelectedTrip}
                  />
                  
                  {/* Map Legend */}
                  <div className="absolute bottom-4 left-4 bg-card/95 border border-border rounded-lg p-3 shadow-lg">
                    <h4 className="text-sm font-semibold mb-2">Active Trips</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center">
                        <i className="fas fa-circle text-green-500 mr-2"></i>
                        <span>Pickup Location</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-circle text-red-500 mr-2"></i>
                        <span>Dropoff Location</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-car text-blue-500 mr-2"></i>
                        <span>Vehicle Location</span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-route text-gray-500 mr-2"></i>
                        <span>Trip Route</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced Trip Details Modal */}
      <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-trip-details">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Trip Details</span>
              {selectedTrip && <StatusBadge status={selectedTrip.status} />}
            </DialogTitle>
            <DialogDescription>
              Trip #{selectedTrip?.id?.slice(-3)} • {selectedTrip?.passengerName} • {new Date(selectedTrip?.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-6">
              {/* Main Trip Info Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Passenger Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <i className="fas fa-user mr-2 text-blue-500"></i>
                    Passenger Details
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="text-foreground font-medium">{selectedTrip.passengerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="text-foreground">{selectedTrip.passengerPhone}</span>
                    </div>
                    {selectedTrip.rating && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rating:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <i key={i} className={`fas fa-star text-xs ${i < selectedTrip.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                          <span className="ml-1 text-foreground">({selectedTrip.rating})</span>
                        </div>
                      </div>
                    )}
                    {selectedTrip.feedback && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-muted-foreground text-xs">Feedback:</span>
                        <p className="text-foreground text-xs italic mt-1">"{selectedTrip.feedback}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver & Vehicle Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <i className="fas fa-id-card mr-2 text-green-500"></i>
                    Driver & Vehicle
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver:</span>
                      <span className="text-foreground font-medium">{selectedTrip.driverName || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="text-foreground">{selectedTrip.driverPhone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="text-foreground font-mono">{selectedTrip.vehiclePlate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle ID:</span>
                      <span className="text-foreground text-xs">{selectedTrip.vehicleId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Trip Metrics */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <i className="fas fa-chart-line mr-2 text-purple-500"></i>
                    Trip Metrics
                  </h4>
                  <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fare:</span>
                      <span className="text-foreground font-medium">AED {(selectedTrip.fareQuote / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="text-foreground">{selectedTrip.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-foreground">
                        {selectedTrip.actualDuration ? `${selectedTrip.actualDuration} min` : `~${selectedTrip.estimatedDuration} min (est.)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="text-foreground capitalize">{selectedTrip.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <span className={`text-foreground capitalize font-medium ${
                        selectedTrip.paymentStatus === 'completed' ? 'text-green-600' :
                        selectedTrip.paymentStatus === 'pending' ? 'text-yellow-600' :
                        selectedTrip.paymentStatus === 'refunded' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {selectedTrip.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center">
                  <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
                  Route Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-circle text-green-500 mr-2"></i>
                      <span className="font-medium text-foreground">Pickup Location</span>
                    </div>
                    <p className="text-sm text-foreground">{selectedTrip.pickupAddress}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTrip.pickupLat}, {selectedTrip.pickupLng}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <i className="fas fa-circle text-red-500 mr-2"></i>
                      <span className="font-medium text-foreground">Dropoff Location</span>
                    </div>
                    <p className="text-sm text-foreground">{selectedTrip.dropoffAddress}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedTrip.dropoffLat}, {selectedTrip.dropoffLng}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground flex items-center">
                  <i className="fas fa-clock mr-2 text-blue-500"></i>
                  Trip Timeline
                </h4>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedTrip.eventLogs?.map((event: any, index: number) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          event.type.includes('completed') ? 'bg-green-500' :
                          event.type.includes('cancelled') ? 'bg-red-500' :
                          event.type.includes('started') ? 'bg-blue-500' :
                          event.type.includes('assigned') ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground capitalize">
                              {event.description || event.type.replace(/_/g, ' ')}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-muted-foreground text-center py-4">No timeline events available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                {selectedTrip.status !== 'completed' && selectedTrip.status !== 'cancelled' && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelTripMutation.mutate(selectedTrip.id)}
                    disabled={cancelTripMutation.isPending}
                    data-testid="button-cancel-trip"
                  >
                    <i className="fas fa-times mr-2"></i>
                    {cancelTripMutation.isPending ? 'Cancelling...' : 'Cancel Trip'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedTrip(null)} data-testid="button-close-trip-details">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
