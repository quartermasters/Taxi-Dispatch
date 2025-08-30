// © 2025 Quartermasters FZC. All rights reserved.

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" nest>
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
