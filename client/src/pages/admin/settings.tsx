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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const tariffFormSchema = z.object({
  vehicleType: z.enum(['standard', 'xl', 'executive']),
  baseFare: z.number().min(0, "Base fare must be positive"),
  perKm: z.number().min(0, "Per km rate must be positive"),
  perMin: z.number().min(0, "Per minute rate must be positive"),
  surgeMultiplier: z.number().min(1, "Surge multiplier must be at least 1").optional(),
});

const zoneFormSchema = z.object({
  name: z.string().min(1, "Zone name is required"),
  radiusKm: z.number().min(0.1, "Radius must be at least 0.1 km"),
  surgeMultiplier: z.number().min(1, "Surge multiplier must be at least 1").optional(),
});

export default function Settings() {
  const [isTariffOpen, setIsTariffOpen] = useState(false);
  const [isZoneOpen, setIsZoneOpen] = useState(false);
  const { toast } = useToast();

  const { data: tariffs } = useQuery({
    queryKey: ['/api/admin/tariffs'],
  });

  const { data: zones } = useQuery({
    queryKey: ['/api/admin/zones'],
  });

  const tariffForm = useForm<z.infer<typeof tariffFormSchema>>({
    resolver: zodResolver(tariffFormSchema),
    defaultValues: {
      vehicleType: 'standard',
      baseFare: 0,
      perKm: 0,
      perMin: 0,
      surgeMultiplier: 1,
    },
  });

  const zoneForm = useForm<z.infer<typeof zoneFormSchema>>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      name: '',
      radiusKm: 5,
      surgeMultiplier: 1,
    },
  });

  const createTariffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tariffFormSchema>) => {
      const response = await apiRequest('POST', '/api/admin/tariffs', {
        ...data,
        baseFare: Math.round(data.baseFare * 100), // Convert to cents
        perKm: Math.round(data.perKm * 100),
        perMin: Math.round(data.perMin * 100),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tariffs'] });
      setIsTariffOpen(false);
      tariffForm.reset();
      toast({
        title: "Tariff Created",
        description: "The pricing tariff has been successfully created.",
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

  const createZoneMutation = useMutation({
    mutationFn: async (data: z.infer<typeof zoneFormSchema>) => {
      const response = await apiRequest('POST', '/api/admin/zones', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/zones'] });
      setIsZoneOpen(false);
      zoneForm.reset();
      toast({
        title: "Zone Created",
        description: "The zone has been successfully created.",
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

  const onSubmitTariff = (values: z.infer<typeof tariffFormSchema>) => {
    createTariffMutation.mutate(values);
  };

  const onSubmitZone = (values: z.infer<typeof zoneFormSchema>) => {
    createZoneMutation.mutate(values);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Settings</h2>
            <p className="text-sm text-muted-foreground">Configure pricing, zones, and system settings</p>
          </div>
        </div>
      </header>

      {/* Settings Content */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="tariffs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tariffs" data-testid="tab-tariffs">Pricing Tariffs</TabsTrigger>
            <TabsTrigger value="zones" data-testid="tab-zones">Zones</TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
          </TabsList>

          {/* Tariffs Tab */}
          <TabsContent value="tariffs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pricing Tariffs</CardTitle>
                  <Dialog open={isTariffOpen} onOpenChange={setIsTariffOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-tariff">
                        <i className="fas fa-plus mr-2"></i>
                        Add Tariff
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-create-tariff">
                      <DialogHeader>
                        <DialogTitle>Create New Tariff</DialogTitle>
                      </DialogHeader>
                      <Form {...tariffForm}>
                        <form onSubmit={tariffForm.handleSubmit(onSubmitTariff)} className="space-y-4">
                          <FormField
                            control={tariffForm.control}
                            name="vehicleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Vehicle Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-tariff-vehicle-type">
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={tariffForm.control}
                              name="baseFare"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Base Fare ($)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      placeholder="2.50"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-base-fare"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={tariffForm.control}
                              name="perKm"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Per Kilometer ($)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      placeholder="1.20"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-per-km"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={tariffForm.control}
                              name="perMin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Per Minute ($)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      placeholder="0.25"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-per-min"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={tariffForm.control}
                              name="surgeMultiplier"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Surge Multiplier (optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.1" 
                                      placeholder="1.0"
                                      {...field}
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                      data-testid="input-surge-multiplier"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsTariffOpen(false)}
                              data-testid="button-cancel-tariff"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createTariffMutation.isPending}
                              data-testid="button-save-tariff"
                            >
                              {createTariffMutation.isPending ? 'Creating...' : 'Create Tariff'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Base Fare</TableHead>
                      <TableHead>Per Kilometer</TableHead>
                      <TableHead>Per Minute</TableHead>
                      <TableHead>Surge Multiplier</TableHead>
                      <TableHead>Zone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!tariffs || tariffs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground" data-testid="empty-tariffs">
                          No tariffs configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      tariffs.map((tariff: any) => (
                        <TableRow key={tariff.id} data-testid={`tariff-row-${tariff.id}`}>
                          <TableCell>
                            <Badge data-testid={`tariff-type-${tariff.id}`}>
                              {tariff.vehicleType}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`tariff-base-${tariff.id}`}>
                            ${(tariff.baseFare / 100).toFixed(2)}
                          </TableCell>
                          <TableCell data-testid={`tariff-per-km-${tariff.id}`}>
                            ${(tariff.perKm / 100).toFixed(2)}
                          </TableCell>
                          <TableCell data-testid={`tariff-per-min-${tariff.id}`}>
                            ${(tariff.perMin / 100).toFixed(2)}
                          </TableCell>
                          <TableCell data-testid={`tariff-surge-${tariff.id}`}>
                            {tariff.surgeMultiplier > 1 ? `${tariff.surgeMultiplier}x` : 'None'}
                          </TableCell>
                          <TableCell data-testid={`tariff-zone-${tariff.id}`}>
                            {tariff.zoneId ? 'Zone Specific' : 'Global'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Operational Zones</CardTitle>
                  <Dialog open={isZoneOpen} onOpenChange={setIsZoneOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-zone">
                        <i className="fas fa-plus mr-2"></i>
                        Add Zone
                      </Button>
                    </DialogTrigger>
                    <DialogContent data-testid="dialog-create-zone">
                      <DialogHeader>
                        <DialogTitle>Create New Zone</DialogTitle>
                      </DialogHeader>
                      <Form {...zoneForm}>
                        <form onSubmit={zoneForm.handleSubmit(onSubmitZone)} className="space-y-4">
                          <FormField
                            control={zoneForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Zone Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Downtown" {...field} data-testid="input-zone-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={zoneForm.control}
                            name="radiusKm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Radius (km)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    placeholder="5.0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    data-testid="input-zone-radius"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={zoneForm.control}
                            name="surgeMultiplier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Surge Multiplier (optional)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    placeholder="1.0"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                    data-testid="input-zone-surge"
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
                              onClick={() => setIsZoneOpen(false)}
                              data-testid="button-cancel-zone"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={createZoneMutation.isPending}
                              data-testid="button-save-zone"
                            >
                              {createZoneMutation.isPending ? 'Creating...' : 'Create Zone'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone Name</TableHead>
                      <TableHead>Radius (km)</TableHead>
                      <TableHead>Surge Multiplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!zones || zones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground" data-testid="empty-zones">
                          No zones configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      zones.map((zone: any) => (
                        <TableRow key={zone.id} data-testid={`zone-row-${zone.id}`}>
                          <TableCell className="font-medium" data-testid={`zone-name-${zone.id}`}>
                            {zone.name}
                          </TableCell>
                          <TableCell data-testid={`zone-radius-${zone.id}`}>
                            {zone.radiusKm} km
                          </TableCell>
                          <TableCell data-testid={`zone-surge-${zone.id}`}>
                            {zone.surgeMultiplier > 1 ? `${zone.surgeMultiplier}x` : 'None'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={zone.isActive ? "default" : "secondary"} data-testid={`zone-status-${zone.id}`}>
                              {zone.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`zone-created-${zone.id}`}>
                            {new Date(zone.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dispatch Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Driver Search Radius</p>
                      <p className="text-sm text-muted-foreground">Maximum distance to search for drivers</p>
                    </div>
                    <span className="text-sm font-medium text-foreground" data-testid="setting-search-radius">5 km</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Job Offer Window</p>
                      <p className="text-sm text-muted-foreground">Time driver has to accept offer</p>
                    </div>
                    <span className="text-sm font-medium text-foreground" data-testid="setting-offer-window">12 seconds</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Max Dispatch Attempts</p>
                      <p className="text-sm text-muted-foreground">Maximum retries before operator alert</p>
                    </div>
                    <span className="text-sm font-medium text-foreground" data-testid="setting-max-attempts">5 attempts</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Cancellation Grace Period</p>
                      <p className="text-sm text-muted-foreground">Free cancellation window</p>
                    </div>
                    <span className="text-sm font-medium text-foreground" data-testid="setting-grace-period">5 minutes</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Cancellation Fee</p>
                      <p className="text-sm text-muted-foreground">Fee after grace period</p>
                    </div>
                    <span className="text-sm font-medium text-foreground" data-testid="setting-cancellation-fee">$5.00</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Payment Capture Timeout</p>
                      <p className="text-sm text-muted-foreground">Auto-capture after trip completion</p>
                    </div>
                    <span className="text-sm font-medium text-foreground" data-testid="setting-capture-timeout">30 seconds</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
