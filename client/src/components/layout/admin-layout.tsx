// © 2025 Quartermasters FZC. All rights reserved.

import { Link, useLocation } from "wouter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: 'Live Board', href: '/', icon: 'fas fa-map-marked-alt' },
    { name: 'Trips', href: '/trips', icon: 'fas fa-route' },
    { name: 'Drivers', href: '/drivers', icon: 'fas fa-users' },
    { name: 'Vehicles', href: '/vehicles', icon: 'fas fa-car' },
    { name: 'Payments', href: '/payments', icon: 'fas fa-credit-card' },
    { name: 'Reports', href: '/reports', icon: 'fas fa-chart-bar' },
    { name: 'Settings', href: '/settings', icon: 'fas fa-cog' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Taxi Dispatch</h1>
          <p className="text-sm text-muted-foreground">Admin Console</p>
        </div>
        <nav className="mt-6">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-6 py-3 text-sm font-medium ${
                  isActive
                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <i className={`${item.icon} mr-3`}></i>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
