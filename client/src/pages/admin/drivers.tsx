// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  const filteredDrivers = drivers?.filter((driver: any) => 
    !searchTerm || 
    driver.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.users?.phone?.includes(searchTerm) ||
    driver.vehicles?.plate?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Driver Management</h2>
            <p className="text-sm text-muted-foreground">Monitor and manage driver fleet</p>
          </div>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-drivers"
            />
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
                    filteredDrivers.map((driver: any) => (
                      <TableRow key={driver.drivers?.id} data-testid={`driver-row-${driver.drivers?.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {driver.users?.name?.substring(0, 2).toUpperCase() || 'UN'}
                            </div>
                            <div>
                              <p className="font-medium text-foreground" data-testid={`driver-name-${driver.drivers?.id}`}>
                                {driver.users?.name || 'Unknown Driver'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID: {driver.drivers?.id?.slice(-8) || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-foreground" data-testid={`driver-phone-${driver.drivers?.id}`}>
                              {driver.users?.phone || 'N/A'}
                            </p>
                            <p className="text-muted-foreground" data-testid={`driver-email-${driver.drivers?.id}`}>
                              {driver.users?.email || 'No email'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`driver-vehicle-${driver.drivers?.id}`}>
                          {driver.vehicles ? (
                            <div className="text-sm">
                              <p className="text-foreground">{driver.vehicles.model}</p>
                              <p className="text-muted-foreground">{driver.vehicles.plate}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No vehicle</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={driver.drivers?.status || 'offline'} 
                            type="driver"
                            data-testid={`driver-status-${driver.drivers?.id}`}
                          />
                        </TableCell>
                        <TableCell data-testid={`driver-rating-${driver.drivers?.id}`}>
                          <div className="flex items-center space-x-1">
                            <span className="text-foreground">{driver.drivers?.rating || '5.0'}</span>
                            <i className="fas fa-star text-yellow-500 text-xs"></i>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`driver-trips-${driver.drivers?.id}`}>
                          {driver.drivers?.totalTrips || 0}
                        </TableCell>
                        <TableCell data-testid={`driver-last-seen-${driver.drivers?.id}`}>
                          {getLastSeen(driver)}
                        </TableCell>
                        <TableCell data-testid={`driver-location-${driver.drivers?.id}`}>
                          {driver.drivers?.lastLat && driver.drivers?.lastLng ? (
                            <span className="text-sm text-muted-foreground">
                              {parseFloat(driver.drivers.lastLat).toFixed(4)}, {parseFloat(driver.drivers.lastLng).toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
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
    </>
  );
}
