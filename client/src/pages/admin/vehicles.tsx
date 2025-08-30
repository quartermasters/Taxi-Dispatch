// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Mock vehicle data for testing - matching the drivers
const mockVehicles = [
  { 
    id: 'v1', 
    plate: 'DUB-A123', 
    type: 'standard', 
    model: 'Toyota Camry', 
    color: 'White', 
    capacity: 4,
    assignedDriverId: '1',
    assignedDriver: { name: 'Ahmed Hassan', phone: '+971501234567', status: 'idle' }
  },
  { 
    id: 'v2', 
    plate: 'DUB-B456', 
    type: 'executive', 
    model: 'Honda Accord', 
    color: 'Black', 
    capacity: 4,
    assignedDriverId: '2',
    assignedDriver: { name: 'Mohammed Ali', phone: '+971501234568', status: 'busy' }
  },
  { 
    id: 'v3', 
    plate: 'DUB-C789', 
    type: 'standard', 
    model: 'Nissan Altima', 
    color: 'Silver', 
    capacity: 4,
    assignedDriverId: '3',
    assignedDriver: { name: 'Omar Saeed', phone: '+971501234569', status: 'idle' }
  },
  { 
    id: 'v4', 
    plate: 'DUB-D012', 
    type: 'xl', 
    model: 'Hyundai Elantra', 
    color: 'Blue', 
    capacity: 6,
    assignedDriverId: '4',
    assignedDriver: { name: 'Khalid Ahmad', phone: '+971501234570', status: 'busy' }
  },
  { 
    id: 'v5', 
    plate: 'DUB-E345', 
    type: 'standard', 
    model: 'Kia Optima', 
    color: 'Red', 
    capacity: 4,
    assignedDriverId: '5',
    assignedDriver: { name: 'Rashid Nasser', phone: '+971501234571', status: 'offline' }
  },
];

const vehicleFormSchema = z.object({
  plate: z.string().min(1, "License plate is required"),
  type: z.enum(['standard', 'xl', 'executive']),
  model: z.string().min(1, "Vehicle model is required"),
  color: z.string().min(1, "Vehicle color is required"),
  capacity: z.number().min(1).max(8),
});

export default function Vehicles() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['/api/admin/vehicles'],
  });

  const { data: drivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
  });

  // Use mock data for testing - fallback to API data if available
  const displayVehicles = vehicles?.length > 0 ? vehicles : mockVehicles;

  const form = useForm<z.infer<typeof vehicleFormSchema>>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      plate: '',
      type: 'standard',
      model: '',
      color: '',
      capacity: 4,
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof vehicleFormSchema>) => {
      const response = await apiRequest('POST', '/api/admin/vehicles', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vehicles'] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Vehicle Created",
        description: "The vehicle has been successfully added to the fleet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredVehicles = displayVehicles.filter((vehicle: any) => 
    !searchTerm || 
    vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.color?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = (values: z.infer<typeof vehicleFormSchema>) => {
    createVehicleMutation.mutate(values);
  };

  const getVehicleTypeDisplay = (type: string) => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'xl': return 'XL';
      case 'executive': return 'Executive';
      default: return type;
    }
  };

  const getVehicleTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'standard': return 'default';
      case 'xl': return 'secondary';
      case 'executive': return 'outline';
      default: return 'default';
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Vehicle Management</h2>
            <p className="text-sm text-muted-foreground">Manage fleet vehicles and assignments</p>
          </div>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-vehicles"
            />
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-vehicle">
                  <i className="fas fa-plus mr-2"></i>
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-create-vehicle">
                <DialogHeader>
                  <DialogTitle>Add New Vehicle</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="plate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Plate</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC-123" {...field} data-testid="input-vehicle-plate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vehicle-type">
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="xl">XL</SelectItem>
                              <SelectItem value="executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="Honda Civic" {...field} data-testid="input-vehicle-model" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input placeholder="White" {...field} data-testid="input-vehicle-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passenger Capacity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="8" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-vehicle-capacity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateOpen(false)}
                        data-testid="button-cancel-vehicle"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createVehicleMutation.isPending}
                        data-testid="button-save-vehicle"
                      >
                        {createVehicleMutation.isPending ? 'Creating...' : 'Create Vehicle'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Vehicles Table */}
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Fleet Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground" data-testid="empty-vehicles">
                      {searchTerm ? 'No vehicles match your search' : 'No vehicles found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle: any) => {
                    // Check if this is mock data or API data
                    const assignedDriver = vehicle.assignedDriver || 
                      drivers?.find((d: any) => d.drivers?.vehicleId === vehicle.id);
                    
                    return (
                      <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                        <TableCell className="font-medium" data-testid={`vehicle-plate-${vehicle.id}`}>
                          {vehicle.plate}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getVehicleTypeBadgeVariant(vehicle.type)} data-testid={`vehicle-type-${vehicle.id}`}>
                            {getVehicleTypeDisplay(vehicle.type)}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`vehicle-model-${vehicle.id}`}>
                          {vehicle.model}
                        </TableCell>
                        <TableCell data-testid={`vehicle-color-${vehicle.id}`}>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: vehicle.color.toLowerCase() }}
                            ></div>
                            <span>{vehicle.color}</span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`vehicle-capacity-${vehicle.id}`}>
                          {vehicle.capacity} passengers
                        </TableCell>
                        <TableCell data-testid={`vehicle-driver-${vehicle.id}`}>
                          {assignedDriver ? (
                            <div className="text-sm">
                              <p className="text-foreground">
                                {assignedDriver.name || assignedDriver.users?.name}
                              </p>
                              <p className="text-muted-foreground">
                                {assignedDriver.phone || assignedDriver.users?.phone}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={assignedDriver?.status || assignedDriver?.drivers?.status || 'offline'} 
                            type="driver"
                            data-testid={`vehicle-status-${vehicle.id}`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
