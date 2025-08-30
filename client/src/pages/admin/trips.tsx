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

export default function Trips() {
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: trips, isLoading } = useQuery({
    queryKey: ['/api/admin/trips'],
  });

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

  const filteredTrips = trips?.filter((trip: any) => 
    !searchTerm || 
    trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.passengerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.dropoffAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleViewTrip = async (tripId: string) => {
    try {
      const response = await apiRequest('GET', `/api/trips/${tripId}`);
      const tripDetails = await response.json();
      setSelectedTrip(tripDetails);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Trip Management</h2>
            <p className="text-sm text-muted-foreground">View and manage all trips</p>
          </div>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-trips"
            />
          </div>
        </div>
      </header>

      {/* Trips Table */}
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
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
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground" data-testid="empty-trips">
                        {searchTerm ? 'No trips match your search' : 'No trips found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrips.map((trip: any) => (
                      <TableRow key={trip.id} data-testid={`trip-row-${trip.id}`}>
                        <TableCell className="font-medium" data-testid={`trip-id-${trip.id}`}>
                          #{trip.id.slice(-6)}
                        </TableCell>
                        <TableCell data-testid={`trip-passenger-${trip.id}`}>
                          {trip.passengerId.slice(-8)}
                        </TableCell>
                        <TableCell data-testid={`trip-driver-${trip.id}`}>
                          {trip.driverId ? trip.driverId.slice(-8) : 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={trip.status} data-testid={`trip-status-${trip.id}`} />
                        </TableCell>
                        <TableCell className="max-w-xs truncate" data-testid={`trip-route-${trip.id}`}>
                          {trip.pickupAddress || 'Pickup'} → {trip.dropoffAddress || 'Dropoff'}
                        </TableCell>
                        <TableCell data-testid={`trip-fare-${trip.id}`}>
                          ${(trip.fareQuote / 100).toFixed(2)}
                        </TableCell>
                        <TableCell data-testid={`trip-created-${trip.id}`}>
                          {new Date(trip.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTrip(trip.id)}
                            data-testid={`button-view-trip-${trip.id}`}
                          >
                            View
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

      {/* Trip Details Modal */}
      <Dialog open={!!selectedTrip} onOpenChange={() => setSelectedTrip(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-trip-details">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>
              Trip #{selectedTrip?.id?.slice(-6)} - {selectedTrip?.status}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Trip Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={selectedTrip.status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fare:</span>
                      <span className="text-foreground">${(selectedTrip.fareQuote / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="text-foreground">{selectedTrip.distanceKm || 'N/A'} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-foreground">{new Date(selectedTrip.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-2">Route</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Pickup:</span>
                      <p className="text-foreground">{selectedTrip.pickupAddress || `${selectedTrip.pickupLat}, ${selectedTrip.pickupLng}`}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dropoff:</span>
                      <p className="text-foreground">{selectedTrip.dropoffAddress || `${selectedTrip.dropoffLat}, ${selectedTrip.dropoffLng}`}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Event Timeline</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedTrip.eventLogs?.map((event: any) => (
                    <div key={event.id} className="flex items-start space-x-3 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="text-foreground">{event.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No events logged</p>
                  )}
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
