// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveMap } from "@/components/ui/live-map";
import { StatusBadge } from "@/components/ui/status-badge";
import { useWebSocket } from "@/hooks/use-websocket";
import { getAuthToken } from "@/lib/auth";
import { wsManager } from "@/lib/websocket";

export default function Dashboard() {
  const token = getAuthToken();

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (token) {
      wsManager.connect();
    }
    return () => wsManager.disconnect();
  }, [token]);

  const { data: activeTrips, refetch: refetchTrips } = useQuery({
    queryKey: ['/api/admin/trips'],
  });

  const { data: drivers, refetch: refetchDrivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

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
    activeTrips: activeTrips?.length || 0,
    onlineDrivers: drivers?.filter((d: any) => d.drivers?.status === 'idle' || d.drivers?.status === 'busy')?.length || 0,
    revenue: activeTrips?.reduce((sum: number, trip: any) => sum + (trip.fareQuote || 0), 0) || 0,
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
                <div className="p-2 bg-primary/10 rounded-lg">
                  <i className="fas fa-route text-primary"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Trips</p>
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
                <div className="p-2 bg-accent/10 rounded-lg">
                  <i className="fas fa-users text-accent"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Online Drivers</p>
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
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <i className="fas fa-dollar-sign text-secondary"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <i className="fas fa-clock text-purple-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Avg. ETA</p>
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
                  <button className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md" data-testid="filter-drivers">
                    Drivers
                  </button>
                  <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md" data-testid="filter-trips">
                    Trips
                  </button>
                  <button className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded-md" data-testid="filter-zones">
                    Zones
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <LiveMap 
                className="h-96" 
                drivers={drivers?.map((d: any) => ({
                  id: d.drivers?.id || '',
                  lat: parseFloat(d.drivers?.lastLat || '0'),
                  lng: parseFloat(d.drivers?.lastLng || '0'),
                  status: d.drivers?.status || 'offline'
                })) || []}
                trips={activeTrips?.map((trip: any) => ({
                  id: trip.id,
                  pickupLat: parseFloat(trip.pickupLat),
                  pickupLng: parseFloat(trip.pickupLng),
                  status: trip.status
                })) || []}
              />
            </CardContent>
          </Card>

          {/* Active Trips */}
          <Card>
            <CardHeader>
              <CardTitle>Active Trips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {activeTrips?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="empty-trips">
                  No active trips
                </div>
              ) : (
                activeTrips?.map((trip: any) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`trip-card-${trip.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`trip-id-${trip.id}`}>
                          #{trip.id.slice(-6)}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`trip-passenger-${trip.id}`}>
                          Passenger {trip.passengerId.slice(-4)}
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

          {/* Driver Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Driver Status</CardTitle>
                <button className="text-sm text-primary hover:text-primary/80" data-testid="view-all-drivers">
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {drivers?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground" data-testid="empty-drivers">
                  No drivers available
                </div>
              ) : (
                drivers?.slice(0, 5).map((driver: any, index: number) => (
                  <div key={driver.drivers?.id || index} className="flex items-center justify-between" data-testid={`driver-card-${driver.drivers?.id}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {driver.users?.name?.substring(0, 2).toUpperCase() || 'UN'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`driver-name-${driver.drivers?.id}`}>
                          {driver.users?.name || 'Unknown Driver'}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`driver-vehicle-${driver.drivers?.id}`}>
                          {driver.vehicles?.model || 'No Vehicle'} • {driver.vehicles?.plate || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge 
                      status={driver.drivers?.status || 'offline'} 
                      type="driver"
                      data-testid={`driver-status-${driver.drivers?.id}`}
                    />
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
