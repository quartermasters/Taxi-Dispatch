// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

// Mock data for testing - same as dashboard
const mockDrivers = [
  { 
    id: '1', 
    name: 'Ahmed Hassan', 
    lat: 25.2048, 
    lng: 55.2708, 
    status: 'idle', 
    phone: '+971501234567',
    email: 'ahmed@quartermasters.me',
    rating: 4.9,
    totalTrips: 234,
    vehicle: { model: 'Toyota Camry', plate: 'DUB-A123', color: 'White' }
  },
  { 
    id: '2', 
    name: 'Mohammed Ali', 
    lat: 25.1972, 
    lng: 55.2744, 
    status: 'busy', 
    phone: '+971501234568',
    email: 'mohammed@quartermasters.me',
    rating: 4.8,
    totalTrips: 189,
    vehicle: { model: 'Honda Accord', plate: 'DUB-B456', color: 'Black' }
  },
  { 
    id: '3', 
    name: 'Omar Saeed', 
    lat: 25.2084, 
    lng: 55.2719, 
    status: 'idle', 
    phone: '+971501234569',
    email: 'omar@quartermasters.me',
    rating: 4.7,
    totalTrips: 156,
    vehicle: { model: 'Nissan Altima', plate: 'DUB-C789', color: 'Silver' }
  },
  { 
    id: '4', 
    name: 'Khalid Ahmad', 
    lat: 25.1951, 
    lng: 55.2820, 
    status: 'busy', 
    phone: '+971501234570',
    email: 'khalid@quartermasters.me',
    rating: 4.9,
    totalTrips: 298,
    vehicle: { model: 'Hyundai Elantra', plate: 'DUB-D012', color: 'Blue' }
  },
  { 
    id: '5', 
    name: 'Rashid Nasser', 
    lat: 25.2015, 
    lng: 55.2650, 
    status: 'offline', 
    phone: '+971501234571',
    email: 'rashid@quartermasters.me',
    rating: 4.6,
    totalTrips: 87,
    vehicle: { model: 'Kia Optima', plate: 'DUB-E345', color: 'Red' }
  },
];

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  // Use mock data for testing - fallback to API data if available
  const displayDrivers = drivers?.length > 0 ? drivers : mockDrivers;

  const filteredDrivers = displayDrivers.filter((driver: any) => 
    !searchTerm || 
    (driver.name || driver.users?.name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone || driver.users?.phone)?.includes(searchTerm) ||
    (driver.vehicle?.plate || driver.vehicles?.plate)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastSeen = (driver: any) => {
    if (!driver.drivers?.updatedAt) return 'Never';
    const lastSeen = new Date(driver.drivers.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastSeen.toLocaleDateString();
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center" data-testid="page-title">
              <i className="fas fa-users-cog mr-3 text-primary"></i>
              Driver Management
            </h2>
            <p className="text-sm text-muted-foreground flex items-center">
              <i className="fas fa-chart-network mr-2"></i>
              Monitor and manage driver fleet
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
              <Input
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search-drivers"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Drivers Table */}
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground mt-2">Loading drivers...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Total Trips</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground" data-testid="empty-drivers">
                        {searchTerm ? 'No drivers match your search' : 'No drivers found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver: any) => {
                      const driverId = driver.id || driver.drivers?.id;
                      const driverName = driver.name || driver.users?.name;
                      const driverPhone = driver.phone || driver.users?.phone;
                      const driverEmail = driver.email || driver.users?.email;
                      const driverStatus = driver.status || driver.drivers?.status;
                      const vehicle = driver.vehicle || driver.vehicles;
                      
                      return (
                        <TableRow key={driverId} data-testid={`driver-row-${driverId}`}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {driverName?.substring(0, 2).toUpperCase() || 'UN'}
                              </div>
                              <div>
                                <p className="font-medium text-foreground" data-testid={`driver-name-${driverId}`}>
                                  {driverName || 'Unknown Driver'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {driverId?.slice(-8) || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-foreground" data-testid={`driver-phone-${driverId}`}>
                                {driverPhone || 'N/A'}
                              </p>
                              <p className="text-muted-foreground" data-testid={`driver-email-${driverId}`}>
                                {driverEmail || 'No email'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`driver-vehicle-${driverId}`}>
                            {vehicle ? (
                              <div className="text-sm">
                                <p className="text-foreground">{vehicle.model}</p>
                                <p className="text-muted-foreground">{vehicle.plate}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No vehicle</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge 
                              status={driverStatus || 'offline'} 
                              type="driver"
                              data-testid={`driver-status-${driverId}`}
                            />
                          </TableCell>
                          <TableCell data-testid={`driver-rating-${driverId}`}>
                            <div className="flex items-center space-x-1">
                              <span className="text-foreground">{driver.rating || driver.drivers?.rating || '5.0'}</span>
                              <i className="fas fa-star text-yellow-500 text-xs"></i>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`driver-trips-${driverId}`}>
                            {driver.totalTrips || driver.drivers?.totalTrips || 0}
                          </TableCell>
                          <TableCell data-testid={`driver-last-seen-${driverId}`}>
                            {driver.drivers ? getLastSeen(driver) : '2 minutes ago'}
                          </TableCell>
                          <TableCell data-testid={`driver-location-${driverId}`}>
                            {driver.lat && driver.lng ? (
                              <span className="text-sm text-muted-foreground">
                                {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                              </span>
                            ) : driver.drivers?.lastLat && driver.drivers?.lastLng ? (
                              <span className="text-sm text-muted-foreground">
                                {parseFloat(driver.drivers.lastLat).toFixed(4)}, {parseFloat(driver.drivers.lastLng).toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
