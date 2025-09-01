// © 2025 Quartermasters FZC. All rights reserved.

import { Link, useLocation } from "wouter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: 'Overview', href: '/', icon: 'fas fa-tv' },
    { name: 'Trips', href: '/trips', icon: 'fas fa-route' },
    { name: 'Drivers', href: '/drivers', icon: 'fas fa-id-card' },
    { name: 'Vehicles', href: '/vehicles', icon: 'fas fa-car-side' },
    { name: 'Payments', href: '/payments', icon: 'fas fa-credit-card' },
    { name: 'Reports', href: '/reports', icon: 'fas fa-chart-line' },
    { name: 'Settings', href: '/settings', icon: 'fas fa-sliders-h' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
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
        
        {/* Spacer to push logout to bottom */}
        <div className="flex-1"></div>
        
        {/* Bottom logout section */}
        <div className="border-t border-border">
          <button
            onClick={() => window.location.href = '/api/logout'}
            className="flex items-center px-6 py-4 text-sm font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 w-full text-left transition-colors"
            data-testid="nav-logout"
          >
            <i className="fas fa-power-off mr-3"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        
        {/* Dynamic Footer */}
        <footer className="bg-card border-t border-border mt-auto">
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              {/* Left Section - Copyright & Company */}
              <div className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-6">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-taxi text-primary"></i>
                  <span className="text-sm font-semibold text-foreground">Taxi Dispatch System</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} Quartermasters FZC. All rights reserved.
                </div>
              </div>

              {/* Center Section - Links */}
              <div className="flex items-center space-x-6">
                <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1">
                  <i className="fas fa-shield-alt"></i>
                  <span>Privacy Policy</span>
                </button>
                <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1">
                  <i className="fas fa-file-contract"></i>
                  <span>Terms of Service</span>
                </button>
                <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1">
                  <i className="fas fa-question-circle"></i>
                  <span>Support</span>
                </button>
              </div>

              {/* Right Section - Developer & Version */}
              <div className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-4">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <i className="fas fa-code"></i>
                  <span>Developed by</span>
                  <span className="font-medium text-primary">Quartermasters FZC</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <i className="fas fa-tag"></i>
                    <span>v2.1.0</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">System Online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Additional Info */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span className="flex items-center space-x-1">
                    <i className="fas fa-server"></i>
                    <span>Server: Dubai Cloud</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <i className="fas fa-clock"></i>
                    <span>Last Update: {new Date().toLocaleString()}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    <i className="fab fa-github mr-1"></i>
                    Documentation
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    <i className="fas fa-bug mr-1"></i>
                    Report Issue
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    <i className="fas fa-envelope mr-1"></i>
                    Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
