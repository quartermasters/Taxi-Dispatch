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

// Mock vehicle data for testing - expanded to 38+ vehicles matching drivers
const mockVehicles = [
  { id: 'v1', plate: 'DUB-A123', type: 'standard', model: 'Toyota Camry', color: 'White', capacity: 4, assignedDriverId: '1', assignedDriver: { name: 'Ahmed Hassan', phone: '+971501234567', status: 'idle' } },
  { id: 'v2', plate: 'DUB-B456', type: 'executive', model: 'Honda Accord', color: 'Black', capacity: 4, assignedDriverId: '2', assignedDriver: { name: 'Mohammed Ali', phone: '+971501234568', status: 'busy' } },
  { id: 'v3', plate: 'DUB-C789', type: 'standard', model: 'Nissan Altima', color: 'Silver', capacity: 4, assignedDriverId: '3', assignedDriver: { name: 'Omar Saeed', phone: '+971501234569', status: 'idle' } },
  { id: 'v4', plate: 'DUB-D012', type: 'xl', model: 'Hyundai Elantra', color: 'Blue', capacity: 6, assignedDriverId: '4', assignedDriver: { name: 'Khalid Ahmad', phone: '+971501234570', status: 'busy' } },
  { id: 'v5', plate: 'DUB-E345', type: 'standard', model: 'Kia Optima', color: 'Red', capacity: 4, assignedDriverId: '5', assignedDriver: { name: 'Rashid Nasser', phone: '+971501234571', status: 'offline' } },
  { id: 'v6', plate: 'DUB-F678', type: 'standard', model: 'Toyota Corolla', color: 'White', capacity: 4, assignedDriverId: '6', assignedDriver: { name: 'Ali Mahmoud', phone: '+971501234572', status: 'idle' } },
  { id: 'v7', plate: 'DUB-G901', type: 'executive', model: 'Mazda 6', color: 'Red', capacity: 4, assignedDriverId: '7', assignedDriver: { name: 'Hassan Al-Zahra', phone: '+971501234573', status: 'busy' } },
  { id: 'v8', plate: 'DUB-H234', type: 'standard', model: 'Chevrolet Malibu', color: 'Blue', capacity: 4, assignedDriverId: '8', assignedDriver: { name: 'Saeed Bin Rashid', phone: '+971501234574', status: 'idle' } },
  { id: 'v9', plate: 'DUB-I567', type: 'standard', model: 'Ford Focus', color: 'Silver', capacity: 4, assignedDriverId: '9', assignedDriver: { name: 'Youssef Al-Mansoori', phone: '+971501234575', status: 'offline' } },
  { id: 'v10', plate: 'DUB-J890', type: 'executive', model: 'Volkswagen Passat', color: 'Black', capacity: 4, assignedDriverId: '10', assignedDriver: { name: 'Abdullah Al-Fahim', phone: '+971501234576', status: 'busy' } },
  { id: 'v11', plate: 'DUB-K123', type: 'standard', model: 'Peugeot 508', color: 'Gray', capacity: 4, assignedDriverId: '11', assignedDriver: { name: 'Tariq Al-Shamsi', phone: '+971501234577', status: 'idle' } },
  { id: 'v12', plate: 'DUB-L456', type: 'executive', model: 'Skoda Octavia', color: 'White', capacity: 4, assignedDriverId: '12', assignedDriver: { name: 'Nasser Al-Blooshi', phone: '+971501234578', status: 'busy' } },
  { id: 'v13', plate: 'DUB-M789', type: 'standard', model: 'Renault Megane', color: 'Blue', capacity: 4, assignedDriverId: '13', assignedDriver: { name: 'Majid Al-Ketbi', phone: '+971501234579', status: 'idle' } },
  { id: 'v14', plate: 'DUB-N012', type: 'standard', model: 'Seat Leon', color: 'Red', capacity: 4, assignedDriverId: '14', assignedDriver: { name: 'Hamdan Al-Muhairi', phone: '+971501234580', status: 'offline' } },
  { id: 'v15', plate: 'DUB-O345', type: 'xl', model: 'Mitsubishi Lancer', color: 'Silver', capacity: 6, assignedDriverId: '15', assignedDriver: { name: 'Suhail Al-Zaabi', phone: '+971501234581', status: 'busy' } },
  { id: 'v16', plate: 'DUB-P678', type: 'executive', model: 'Subaru Legacy', color: 'Black', capacity: 4, assignedDriverId: '16', assignedDriver: { name: 'Faisal Al-Hammadi', phone: '+971501234582', status: 'idle' } },
  { id: 'v17', plate: 'DUB-Q901', type: 'standard', model: 'Opel Insignia', color: 'White', capacity: 4, assignedDriverId: '17', assignedDriver: { name: 'Khalifa Al-Suwaidi', phone: '+971501234583', status: 'busy' } },
  { id: 'v18', plate: 'DUB-R234', type: 'executive', model: 'Infiniti Q50', color: 'Gray', capacity: 4, assignedDriverId: '18', assignedDriver: { name: 'Sultan Al-Dhaheri', phone: '+971501234584', status: 'idle' } },
  { id: 'v19', plate: 'DUB-S567', type: 'executive', model: 'Lexus ES', color: 'Blue', capacity: 4, assignedDriverId: '19', assignedDriver: { name: 'Rashid Al-Qasimi', phone: '+971501234585', status: 'offline' } },
  { id: 'v20', plate: 'DUB-T890', type: 'xl', model: 'Acura TLX', color: 'Red', capacity: 6, assignedDriverId: '20', assignedDriver: { name: 'Salem Al-Mansouri', phone: '+971501234586', status: 'busy' } },
  { id: 'v21', plate: 'DUB-U123', type: 'executive', model: 'Cadillac ATS', color: 'Black', capacity: 4, assignedDriverId: '21', assignedDriver: { name: 'Obaid Al-Falasi', phone: '+971501234587', status: 'idle' } },
  { id: 'v22', plate: 'DUB-V456', type: 'executive', model: 'Lincoln MKZ', color: 'Silver', capacity: 4, assignedDriverId: '22', assignedDriver: { name: 'Juma Al-Ghurair', phone: '+971501234588', status: 'busy' } },
  { id: 'v23', plate: 'DUB-W789', type: 'executive', model: 'Genesis G80', color: 'White', capacity: 4, assignedDriverId: '23', assignedDriver: { name: 'Saif Al-Nuaimi', phone: '+971501234589', status: 'idle' } },
  { id: 'v24', plate: 'DUB-X012', type: 'executive', model: 'Volvo S60', color: 'Gray', capacity: 4, assignedDriverId: '24', assignedDriver: { name: 'Marwan Al-Otaiba', phone: '+971501234590', status: 'offline' } },
  { id: 'v25', plate: 'DUB-Y345', type: 'executive', model: 'Jaguar XE', color: 'Blue', capacity: 4, assignedDriverId: '25', assignedDriver: { name: 'Ahmad Al-Rostamani', phone: '+971501234591', status: 'busy' } },
  { id: 'v26', plate: 'DUB-Z678', type: 'executive', model: 'Audi A4', color: 'Red', capacity: 4, assignedDriverId: '26', assignedDriver: { name: 'Mubarak Al-Shamsi', phone: '+971501234592', status: 'idle' } },
  { id: 'v27', plate: 'DUB-AA901', type: 'executive', model: 'BMW 3 Series', color: 'Black', capacity: 4, assignedDriverId: '27', assignedDriver: { name: 'Zayed Al-Nahyan', phone: '+971501234593', status: 'busy' } },
  { id: 'v28', plate: 'DUB-BB234', type: 'executive', model: 'Mercedes C-Class', color: 'Silver', capacity: 4, assignedDriverId: '28', assignedDriver: { name: 'Mansour Al-Maktoum', phone: '+971501234594', status: 'idle' } },
  { id: 'v29', plate: 'DUB-CC567', type: 'xl', model: 'Porsche Macan', color: 'White', capacity: 6, assignedDriverId: '29', assignedDriver: { name: 'Hamad Al-Thani', phone: '+971501234595', status: 'offline' } },
  { id: 'v30', plate: 'DUB-DD890', type: 'executive', model: 'Tesla Model 3', color: 'Gray', capacity: 4, assignedDriverId: '30', assignedDriver: { name: 'Rashed Al-Mulla', phone: '+971501234596', status: 'busy' } },
  { id: 'v31', plate: 'DUB-EE123', type: 'xl', model: 'Range Rover Evoque', color: 'Blue', capacity: 6, assignedDriverId: '31', assignedDriver: { name: 'Fahad Al-Sabah', phone: '+971501234597', status: 'idle' } },
  { id: 'v32', plate: 'DUB-FF456', type: 'executive', model: 'Maserati Ghibli', color: 'Red', capacity: 4, assignedDriverId: '32', assignedDriver: { name: 'Waleed Al-Rashid', phone: '+971501234598', status: 'busy' } },
  { id: 'v33', plate: 'DUB-GG789', type: 'executive', model: 'Bentley Flying Spur', color: 'Black', capacity: 4, assignedDriverId: '33', assignedDriver: { name: 'Nawaf Al-Sabah', phone: '+971501234599', status: 'idle' } },
  { id: 'v34', plate: 'DUB-HH012', type: 'executive', model: 'Ferrari Portofino', color: 'Red', capacity: 2, assignedDriverId: '34', assignedDriver: { name: 'Bader Al-Humaid', phone: '+971501234600', status: 'offline' } },
  { id: 'v35', plate: 'DUB-II345', type: 'executive', model: 'Lamborghini Huracan', color: 'Yellow', capacity: 2, assignedDriverId: '35', assignedDriver: { name: 'Talal Al-Ghanim', phone: '+971501234601', status: 'busy' } },
  { id: 'v36', plate: 'DUB-JJ678', type: 'executive', model: 'McLaren 570S', color: 'Orange', capacity: 2, assignedDriverId: '36', assignedDriver: { name: 'Yousef Al-Otaibi', phone: '+971501234602', status: 'idle' } },
  { id: 'v37', plate: 'DUB-KK901', type: 'executive', model: 'Aston Martin DB11', color: 'Silver', capacity: 2, assignedDriverId: '37', assignedDriver: { name: 'Khalid Al-Dosari', phone: '+971501234603', status: 'busy' } },
  { id: 'v38', plate: 'DUB-LL234', type: 'executive', model: 'Rolls Royce Ghost', color: 'Black', capacity: 4, assignedDriverId: '38', assignedDriver: { name: 'Meshal Al-Thani', phone: '+971501234604', status: 'idle' } }
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
  const displayVehicles = (vehicles && Array.isArray(vehicles) && vehicles.length > 0) ? vehicles : mockVehicles;

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
            <h2 className="text-2xl font-semibold text-foreground flex items-center" data-testid="page-title">
              <i className="fas fa-car-alt mr-3 text-primary"></i>
              Vehicle Management
            </h2>
            <p className="text-sm text-muted-foreground flex items-center">
              <i className="fas fa-tools mr-2"></i>
              Manage fleet vehicles and assignments
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search-vehicles"
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-vehicle" className="flex items-center">
                  <i className="fas fa-plus-circle mr-2"></i>
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
                      (drivers && Array.isArray(drivers) ? drivers.find((d: any) => d.drivers?.vehicleId === vehicle.id) : null);
                    
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
