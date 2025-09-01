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

// Mock data for testing - expanded to 38+ drivers scattered across Dubai
const mockDrivers = [
  { id: '1', name: 'Ahmed Hassan', lat: 25.2048, lng: 55.2708, status: 'idle', phone: '+971501234567' }, // Downtown Dubai
  { id: '2', name: 'Mohammed Ali', lat: 25.0757, lng: 55.1447, status: 'busy', phone: '+971501234568' }, // Dubai Marina
  { id: '3', name: 'Omar Saeed', lat: 25.3548, lng: 55.4210, status: 'idle', phone: '+971501234569' }, // Sharjah Border
  { id: '4', name: 'Khalid Ahmad', lat: 25.1310, lng: 55.1870, status: 'busy', phone: '+971501234570' }, // Jumeirah Beach Residence
  { id: '5', name: 'Rashid Nasser', lat: 25.2285, lng: 55.3573, status: 'offline', phone: '+971501234571' }, // Dubai International Airport
  { id: '6', name: 'Ali Mahmoud', lat: 25.0934, lng: 55.1560, status: 'idle', phone: '+971501234572' }, // Palm Jumeirah
  { id: '7', name: 'Hassan Al-Zahra', lat: 25.2582, lng: 55.3644, status: 'busy', phone: '+971501234573' }, // Deira
  { id: '8', name: 'Saeed Bin Rashid', lat: 25.1151, lng: 55.2067, status: 'idle', phone: '+971501234574' }, // Business Bay
  { id: '9', name: 'Youssef Al-Mansoori', lat: 25.0329, lng: 55.1165, status: 'offline', phone: '+971501234575' }, // Al Garhoud
  { id: '10', name: 'Abdullah Al-Fahim', lat: 25.2285, lng: 55.2923, status: 'busy', phone: '+971501234576' }, // Bur Dubai
  { id: '11', name: 'Tariq Al-Shamsi', lat: 25.0425, lng: 55.2172, status: 'idle', phone: '+971501234577' }, // Al Barsha
  { id: '12', name: 'Nasser Al-Blooshi', lat: 25.2769, lng: 55.3875, status: 'busy', phone: '+971501234578' }, // Naif
  { id: '13', name: 'Majid Al-Ketbi', lat: 25.1336, lng: 55.1860, status: 'idle', phone: '+971501234579' }, // Dubai Sports City
  { id: '14', name: 'Hamdan Al-Muhairi', lat: 25.2048, lng: 55.1484, status: 'offline', phone: '+971501234580' }, // Sheikh Zayed Road
  { id: '15', name: 'Suhail Al-Zaabi', lat: 25.0658, lng: 55.1413, status: 'busy', phone: '+971501234581' }, // Dubai Marina South
  { id: '16', name: 'Faisal Al-Hammadi', lat: 25.3011, lng: 55.3768, status: 'idle', phone: '+971501234582' }, // Al Qusais
  { id: '17', name: 'Khalifa Al-Suwaidi', lat: 25.1972, lng: 55.2388, status: 'busy', phone: '+971501234583' }, // DIFC
  { id: '18', name: 'Sultan Al-Dhaheri', lat: 25.0570, lng: 55.2174, status: 'idle', phone: '+971501234584' }, // Al Sufouh
  { id: '19', name: 'Rashid Al-Qasimi', lat: 25.2582, lng: 55.3342, status: 'offline', phone: '+971501234585' }, // Al Rigga
  { id: '20', name: 'Salem Al-Mansouri', lat: 25.0748, lng: 55.1336, status: 'busy', phone: '+971501234586' }, // Marina Walk
  { id: '21', name: 'Obaid Al-Falasi', lat: 25.1789, lng: 55.2567, status: 'idle', phone: '+971501234587' }, // Trade Centre
  { id: '22', name: 'Juma Al-Ghurair', lat: 25.2344, lng: 55.2972, status: 'busy', phone: '+971501234588' }, // Karama
  { id: '23', name: 'Saif Al-Nuaimi', lat: 25.0435, lng: 55.1919, status: 'idle', phone: '+971501234589' }, // Mall of the Emirates
  { id: '24', name: 'Marwan Al-Otaiba', lat: 25.2665, lng: 55.3132, status: 'offline', phone: '+971501234590' }, // Port Saeed
  { id: '25', name: 'Ahmad Al-Rostamani', lat: 25.1413, lng: 55.1947, status: 'busy', phone: '+971501234591' }, // Jumeirah
  { id: '26', name: 'Mubarak Al-Shamsi', lat: 25.2769, lng: 55.3875, status: 'idle', phone: '+971501234592' }, // Al Murar
  { id: '27', name: 'Zayed Al-Nahyan', lat: 25.0658, lng: 55.1726, status: 'busy', phone: '+971501234593' }, // Knowledge Village
  { id: '28', name: 'Mansour Al-Maktoum', lat: 25.2285, lng: 55.1484, status: 'idle', phone: '+971501234594' }, // Emirates Hills
  { id: '29', name: 'Hamad Al-Thani', lat: 25.0329, lng: 55.2165, status: 'offline', phone: '+971501234595' }, // Motor City
  { id: '30', name: 'Rashed Al-Mulla', lat: 25.2435, lng: 55.3572, status: 'busy', phone: '+971501234596' }, // Al Hamriya
  { id: '31', name: 'Fahad Al-Sabah', lat: 25.1151, lng: 55.1336, status: 'idle', phone: '+971501234597' }, // Bluewaters Island
  { id: '32', name: 'Waleed Al-Rashid', lat: 25.3011, lng: 55.3935, status: 'busy', phone: '+971501234598' }, // Muhaisnah
  { id: '33', name: 'Nawaf Al-Sabah', lat: 25.0570, lng: 55.1413, status: 'idle', phone: '+971501234599' }, // Internet City
  { id: '34', name: 'Bader Al-Humaid', lat: 25.2769, lng: 55.3044, status: 'offline', phone: '+971501234600' }, // Oud Metha
  { id: '35', name: 'Talal Al-Ghanim', lat: 25.1789, lng: 55.2923, status: 'busy', phone: '+971501234601' }, // Satwa
  { id: '36', name: 'Yousef Al-Otaibi', lat: 25.0748, lng: 55.1947, status: 'idle', phone: '+971501234602' }, // Umm Suqeim
  { id: '37', name: 'Khalid Al-Dosari', lat: 25.2435, lng: 55.3132, status: 'busy', phone: '+971501234603' }, // Creek
  { id: '38', name: 'Meshal Al-Thani', lat: 25.1336, lng: 55.1560, status: 'idle', phone: '+971501234604' } // Media City
];

const mockTrips = [
  { id: 'trip-1', passengerId: 'pass-1', pickupLat: 25.0757, pickupLng: 55.1447, status: 'accepted', fareQuote: 2500 }, // Dubai Marina
  { id: 'trip-2', passengerId: 'pass-2', pickupLat: 25.2582, pickupLng: 55.3644, status: 'in_progress', fareQuote: 3200 }, // Deira
  { id: 'trip-3', passengerId: 'pass-3', pickupLat: 25.1413, pickupLng: 55.1947, status: 'pending', fareQuote: 1800 }, // Jumeirah
  { id: 'trip-4', passengerId: 'pass-4', pickupLat: 25.0934, pickupLng: 55.1560, status: 'accepted', fareQuote: 4200 }, // Palm Jumeirah
  { id: 'trip-5', passengerId: 'pass-5', pickupLat: 25.2285, pickupLng: 55.3573, status: 'in_progress', fareQuote: 2800 }, // Dubai International Airport
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
  const displayDrivers = (drivers && Array.isArray(drivers) && drivers.length > 0) ? drivers : mockDrivers;
  const displayTrips = (activeTrips && Array.isArray(activeTrips) && activeTrips.length > 0) ? activeTrips : mockTrips;
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
                    <span>Drivers ({displayDrivers.filter((d: any) => d.status !== 'offline').length})</span>
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
                drivers={displayDrivers.map((d: any) => ({
                  id: d.id,
                  lat: d.lat,
                  lng: d.lng,
                  status: d.status,
                  name: d.name
                }))}
                trips={displayTrips.map((trip: any) => ({
                  id: trip.id,
                  pickupLat: trip.pickupLat,
                  pickupLng: trip.pickupLng,
                  status: trip.status
                }))}
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
                  {(wsStats as any)?.total || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Passengers</span>
                <span className="text-sm font-medium text-foreground" data-testid="ws-passenger-connections">
                  {(wsStats as any)?.passengers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Drivers</span>
                <span className="text-sm font-medium text-foreground" data-testid="ws-driver-connections">
                  {(wsStats as any)?.drivers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admin Sessions</span>
                <span className="text-sm font-medium text-foreground" data-testid="ws-admin-connections">
                  {(wsStats as any)?.admins || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Online Drivers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Online Drivers ({displayDrivers.filter((d: any) => d.status !== 'offline').length})</CardTitle>
                <button className="text-sm text-primary hover:text-primary/80" data-testid="view-all-drivers">
                  View All
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {displayDrivers.filter((d: any) => d.status !== 'offline').length === 0 ? (
                <div className="text-center py-4 text-muted-foreground" data-testid="empty-drivers">
                  No drivers online
                </div>
              ) : (
                displayDrivers.filter((d: any) => d.status !== 'offline').map((driver: any) => (
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
