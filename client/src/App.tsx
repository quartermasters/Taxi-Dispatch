// © 2025 Quartermasters FZC. All rights reserved.

import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/layout/admin-layout";
import Dashboard from "@/pages/admin/dashboard";
import Trips from "@/pages/admin/trips";
import Drivers from "@/pages/admin/drivers";
import Vehicles from "@/pages/admin/vehicles";
import Payments from "@/pages/admin/payments";
import Reports from "@/pages/admin/reports";
import Settings from "@/pages/admin/settings";
import Login from "@/pages/auth/login";
import NotFound from "@/pages/not-found";
import { getAuthToken } from "@/lib/auth";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const token = getAuthToken();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Check both JWT token and Replit Auth
    if (!token && !isAuthenticated && !isLoading && location !== '/login') {
      setLocation('/login');
    }
  }, [token, isAuthenticated, isLoading, location, setLocation]);

  // Show loading while checking Replit Auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If neither auth method is available, redirect to login
  if (!token && !isAuthenticated && location !== '/login') {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" nest>
        <AuthGuard>
          <AdminLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/trips" component={Trips} />
              <Route path="/drivers" component={Drivers} />
              <Route path="/vehicles" component={Vehicles} />
              <Route path="/payments" component={Payments} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </AdminLayout>
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
