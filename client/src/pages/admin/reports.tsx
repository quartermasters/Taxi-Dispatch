// © 2025 Quartermasters FZC. All rights reserved.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: trips } = useQuery({
    queryKey: ['/api/admin/trips-for-reports', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/trips?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      return response.json();
    },
  });

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const response = await apiRequest('GET', `/api/admin/reports?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const csvData = await response.text();
      
      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trips-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "The report has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate statistics
  const stats = trips ? {
    totalTrips: trips.length,
    completedTrips: trips.filter((t: any) => t.status === 'completed').length,
    cancelledTrips: trips.filter((t: any) => t.status === 'cancelled').length,
    totalRevenue: trips.reduce((sum: number, trip: any) => sum + (trip.status === 'completed' ? trip.fareQuote : 0), 0),
    avgFare: trips.length > 0 ? trips.reduce((sum: number, trip: any) => sum + trip.fareQuote, 0) / trips.length : 0,
  } : {
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalRevenue: 0,
    avgFare: 0,
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground" data-testid="page-title">Reports & Analytics</h2>
            <p className="text-sm text-muted-foreground">Generate reports and view key metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-40"
                data-testid="input-report-start-date"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-40"
                data-testid="input-report-end-date"
              />
            </div>
            <Button 
              onClick={handleExportCsv}
              disabled={isExporting}
              data-testid="button-export-csv"
            >
              {isExporting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Exporting...
                </>
              ) : (
                <>
                  <i className="fas fa-download mr-2"></i>
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Reports Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-trips">
                  {stats.totalTrips}
                </p>
                <p className="text-sm text-muted-foreground">Total Trips</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600" data-testid="stat-completed-trips">
                  {stats.completedTrips}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600" data-testid="stat-cancelled-trips">
                  {stats.cancelledTrips}
                </p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-revenue">
                  ${(stats.totalRevenue / 100).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground" data-testid="stat-avg-fare">
                  ${(stats.avgFare / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Fare</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trip Analytics</CardTitle>
              <div className="text-sm text-muted-foreground">
                {dateRange.startDate} to {dateRange.endDate}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trip Status Breakdown */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Trip Status Breakdown</h4>
                  <div className="space-y-2">
                    {['completed', 'cancelled', 'ongoing', 'assigned', 'requested'].map((status) => {
                      const count = trips?.filter((t: any) => t.status === status).length || 0;
                      const percentage = stats.totalTrips > 0 ? (count / stats.totalTrips * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={status} className="flex items-center justify-between p-2 bg-muted/30 rounded" data-testid={`status-breakdown-${status}`}>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            <span className="text-sm text-foreground capitalize">{status}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-foreground">{count}</span>
                            <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue Breakdown */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Revenue Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-sm text-foreground">Gross Revenue</span>
                      <span className="text-sm font-medium text-foreground" data-testid="revenue-gross">
                        ${(stats.totalRevenue / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <span className="text-sm text-foreground">Refunds</span>
                      <span className="text-sm font-medium text-red-600" data-testid="revenue-refunds">
                        -${((trips?.reduce((sum: number, t: any) => {
                          const payment = t.payments?.[0];
                          return sum + (payment?.refundAmount || 0);
                        }, 0) || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                      <span className="text-sm font-medium text-foreground">Net Revenue</span>
                      <span className="text-sm font-bold text-foreground" data-testid="revenue-net">
                        ${((stats.totalRevenue - (trips?.reduce((sum: number, t: any) => {
                          const payment = t.payments?.[0];
                          return sum + (payment?.refundAmount || 0);
                        }, 0) || 0)) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Use the Export CSV button above to download detailed trip data for further analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
