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
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const refundFormSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0").optional(),
});

export default function Payments() {
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['/api/admin/payments', dateRange.startDate, dateRange.endDate],
    queryKey: ['/api/admin/reports'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      return response.json();
    },
  });

  const form = useForm<z.infer<typeof refundFormSchema>>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      tripId: '',
      amount: undefined,
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (data: z.infer<typeof refundFormSchema>) => {
      const response = await apiRequest('POST', '/api/admin/refunds', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      setIsRefundOpen(false);
      form.reset();
      toast({
        title: "Refund Processed",
        description: "The refund has been successfully processed.",
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

  const onSubmit = (values: z.infer<typeof refundFormSchema>) => {
    refundMutation.mutate(values);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800">Succeeded</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Payment Management</h2>
            <p className="text-sm text-muted-foreground">Monitor payments, charges, and refunds</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-40"
                data-testid="input-start-date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-40"
                data-testid="input-end-date"
              />
            </div>
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
              data-testid="input-search-payments"
            />
            <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-process-refund">
                  <i className="fas fa-undo mr-2"></i>
                  Process Refund
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="dialog-process-refund">
                <DialogHeader>
                  <DialogTitle>Process Refund</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tripId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trip ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter trip ID" {...field} data-testid="input-refund-trip-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refund Amount (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="Leave empty for full refund"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              data-testid="input-refund-amount"
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
                        onClick={() => setIsRefundOpen(false)}
                        data-testid="button-cancel-refund"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={refundMutation.isPending}
                        data-testid="button-confirm-refund"
                      >
                        {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Payments Overview */}
      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="fas fa-check-circle text-green-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Successful Payments</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-successful-payments">
                    {payments?.filter((p: any) => p.status === 'succeeded').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <i className="fas fa-clock text-yellow-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-pending-payments">
                    {payments?.filter((p: any) => p.status === 'pending').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <i className="fas fa-times-circle text-red-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Failed Payments</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-failed-payments">
                    {payments?.filter((p: any) => p.status === 'failed').length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="fas fa-undo text-blue-600"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Refunds</p>
                  <p className="text-2xl font-semibold text-foreground" data-testid="stat-total-refunds">
                    ${((payments?.reduce((sum: number, p: any) => sum + (p.refundAmount || 0), 0) || 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground mt-2">Loading payments...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Trip ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Refunded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!payments || payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground" data-testid="empty-payments">
                        No payments found for selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment: any) => (
                      <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                        <TableCell className="font-medium" data-testid={`payment-id-${payment.id}`}>
                          {payment.id.slice(-8)}
                        </TableCell>
                        <TableCell data-testid={`payment-trip-${payment.id}`}>
                          #{payment.tripId.slice(-6)}
                        </TableCell>
                        <TableCell data-testid={`payment-provider-${payment.id}`}>
                          <Badge variant="outline">{payment.provider}</Badge>
                        </TableCell>
                        <TableCell data-testid={`payment-amount-${payment.id}`}>
                          ${(payment.amount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell data-testid={`payment-refunded-${payment.id}`}>
                          {payment.refundAmount > 0 ? (
                            <span className="text-red-600">-${(payment.refundAmount / 100).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">$0.00</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell data-testid={`payment-created-${payment.id}`}>
                          {new Date(payment.createdAt).toLocaleDateString()}
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
