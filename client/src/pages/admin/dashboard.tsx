// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveMap } from "@/components/ui/live-map";
import { StatusBadge } from "@/components/ui/status-badge";
import { useWebSocket } from "@/hooks/use-websocket";
import { getAuthToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { wsManager } from "@/lib/websocket";

// Mock data for testing
const mockDrivers = [
  { id: '1', name: 'Ahmed Hassan', lat: 25.2048, lng: 55.2708, status: 'idle', phone: '+971501234567' },
  { id: '2', name: 'Mohammed Ali', lat: 25.1972, lng: 55.2744, status: 'busy', phone: '+971501234568' },
  { id: '3', name: 'Omar Saeed', lat: 25.2084, lng: 55.2719, status: 'idle', phone: '+971501234569' },
  { id: '4', name: 'Khalid Ahmad', lat: 25.1951, lng: 55.2820, status: 'busy', phone: '+971501234570' },
  { id: '5', name: 'Rashid Nasser', lat: 25.2015, lng: 55.2650, status: 'offline', phone: '+971501234571' },
];

const mockTrips = [
  { id: 'trip-1', passengerId: 'pass-1', pickupLat: 25.2000, pickupLng: 55.2700, status: 'accepted', fareQuote: 2500 },
  { id: 'trip-2', passengerId: 'pass-2', pickupLat: 25.1980, pickupLng: 55.2780, status: 'in_progress', fareQuote: 3200 },
  { id: 'trip-3', passengerId: 'pass-3', pickupLat: 25.2060, pickupLng: 55.2690, status: 'pending', fareQuote: 1800 },
];

const mockZones = [
  { id: 'zone-1', name: 'Downtown Dubai', centerLat: 25.2048, centerLng: 55.2708, multiplier: 1.5 },
  { id: 'zone-2', name: 'Dubai Marina', centerLat: 25.0800, centerLng: 55.1400, multiplier: 1.8 },
  { id: 'zone-3', name: 'Dubai Mall Area', centerLat: 25.1975, centerLng: 55.2744, multiplier: 2.0 },
];

export default function Dashboard() {
  const token = getAuthToken();
  const { isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState<'drivers' | 'trips' | 'zones'>('trips');

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (token || isAuthenticated) {
      wsManager.connect();
    }
    return () => wsManager.disconnect();
  }, [token, isAuthenticated]);

  const { data: activeTrips, refetch: refetchTrips } = useQuery({
    queryKey: ['/api/admin/trips'],
  });

  const { data: drivers, refetch: refetchDrivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  // Use mock data for testing - fallback to API data if available
  const displayDrivers = drivers?.length > 0 ? drivers : mockDrivers;
  const displayTrips = activeTrips?.length > 0 ? activeTrips : mockTrips;
  const displayZones = mockZones;

  const { data: wsStats } = useQuery({
    queryKey: ['/api/admin/websocket-stats'],
    refetchInterval: 5000,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeJobAccepted = wsManager.subscribe('job_accepted', () => {
      refetchTrips();
      refetchDrivers();
    });

    const unsubscribeStatusUpdate = wsManager.subscribe('status_update', () => {
      refetchTrips();
    });

    const unsubscribeLocationUpdate = wsManager.subscribe('location_update', () => {
      refetchDrivers();
    });

    return () => {
      unsubscribeJobAccepted();
      unsubscribeStatusUpdate();
      unsubscribeLocationUpdate();
    };
  }, [refetchTrips, refetchDrivers]);

  const stats = {
    activeTrips: displayTrips.length,
    onlineDrivers: displayDrivers.filter((d: any) => d.status === 'idle' || d.status === 'busy').length,
    revenue: displayTrips.reduce((sum: number, trip: any) => sum + (trip.fareQuote || 0), 0),
    avgEta: 4.2,
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Live Operations Board</h2>
            <p className="text-sm text-muted-foreground">Real-time fleet monitoring and dispatch</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-accent rounded-full pulse-dot" data-testid="live-indicator"></div>
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground" data-testid="text-online-drivers">
                {stats.onlineDrivers} Online Drivers
              </div>
              <div className="text-xs text-muted-foreground" data-testid="text-active-trips">
                {stats.activeTrips} Active Trips
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
                  <i className="fas fa-route text-white text-lg"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <i className="fas fa-chart-line mr-2 text-blue-500"></i>
                    Active Trips
                  </p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-active-trips">
                    {stats.activeTrips}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm">
                  <i className="fas fa-user-check text-white text-lg"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <i className="fas fa-users mr-2 text-green-500"></i>
                    Online Drivers
                  </p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-online-drivers">
                    {stats.onlineDrivers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-sm">
                  <i className="fas fa-coins text-white text-lg"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <i className="fas fa-chart-pie mr-2 text-emerald-500"></i>
                    Today's Revenue
                  </p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-revenue">
                    ${(stats.revenue / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm">
                  <i className="fas fa-stopwatch text-white text-lg"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <i className="fas fa-clock mr-2 text-purple-500"></i>
                    Avg. ETA
                  </p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-avg-eta">
                    {stats.avgEta}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Map */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Fleet Map</CardTitle>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setActiveFilter('drivers')}
                    className={`px-3 py-1 text-xs rounded-md flex items-center space-x-1 ${
                      activeFilter === 'drivers' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`} 
                    data-testid="filter-drivers"
                  >
                    <i className="fas fa-user-tie"></i>
                    <span>Drivers ({displayDrivers.filter(d => d.status !== 'offline').length})</span>
                  </button>
                  <button 
                    onClick={() => setActiveFilter('trips')}
                    className={`px-3 py-1 text-xs rounded-md flex items-center space-x-1 ${
                      activeFilter === 'trips' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`} 
                    data-testid="filter-trips"
                  >
                    <i className="fas fa-route"></i>
                    <span>Trips ({displayTrips.length})</span>
                  </button>
                  <button 
                    onClick={() => setActiveFilter('zones')}
                    className={`px-3 py-1 text-xs rounded-md flex items-center space-x-1 ${
                      activeFilter === 'zones' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`} 
                    data-testid="filter-zones"
                  >
                    <i className="fas fa-map-marked-alt"></i>
                    <span>Zones ({displayZones.length})</span>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LiveMap 
                className="h-96" 
                drivers={activeFilter === 'drivers' || activeFilter === 'zones' ? displayDrivers.map((d: any) => ({
                  id: d.id,
                  lat: d.lat,
                  lng: d.lng,
                  status: d.status,
                  name: d.name
                })) : []}
                trips={activeFilter === 'trips' || activeFilter === 'zones' ? displayTrips.map((trip: any) => ({
                  id: trip.id,
                  pickupLat: trip.pickupLat,
                  pickupLng: trip.pickupLng,
                  status: trip.status
                })) : []}
              />
            </CardContent>
          </Card>

          {/* Active Trips */}
          <Card>
            <CardHeader>
              <CardTitle>Active Trips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {displayTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-trips">
                  No active trips
                </div>
              ) : (
                displayTrips.map((trip: any) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`trip-card-${trip.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`trip-id-${trip.id}`}>
                          #{trip.id}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`trip-passenger-${trip.id}`}>
                          Passenger {trip.passengerId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={trip.status} data-testid={`trip-status-${trip.id}`} />
                      <p className="text-xs text-muted-foreground mt-1">
                        ${(trip.fareQuote / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Driver Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WebSocket Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">WebSocket Connections</span>
                <span className="text-sm font-medium text-foreground" data-testid="ws-total-connections">
                  {wsStats?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Passengers</span>
                <span className="text-sm font-medium text-foreground" data-testid="ws-passenger-connections">
                  {wsStats?.passengers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Drivers</span>
                <span className="text-sm font-medium text-foreground" data-testid="ws-driver-connections">
                  {wsStats?.drivers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admin Sessions</span>
                <span className="text-sm font-medium text-foreground" data-testid="ws-admin-connections">
                  {wsStats?.admins || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Online Drivers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Online Drivers ({displayDrivers.filter(d => d.status !== 'offline').length})</CardTitle>
                <button className="text-sm text-primary hover:text-primary/80" data-testid="view-all-drivers">
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {displayDrivers.filter(d => d.status !== 'offline').length === 0 ? (
                <div className="text-center py-4 text-muted-foreground" data-testid="empty-drivers">
                  No drivers online
                </div>
              ) : (
                displayDrivers.filter(d => d.status !== 'offline').map((driver: any) => (
                  <div key={driver.id} className="flex items-center justify-between" data-testid={`driver-card-${driver.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {driver.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`driver-name-${driver.id}`}>
                          {driver.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`driver-phone-${driver.id}`}>
                          {driver.phone}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge 
                        status={driver.status} 
                        type="driver"
                        data-testid={`driver-status-${driver.id}`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {driver.status === 'idle' ? 'Available' : 'On Trip'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
