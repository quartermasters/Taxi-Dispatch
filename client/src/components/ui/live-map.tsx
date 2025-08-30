// © 2025 Quartermasters FZC. All rights reserved.

import { cn } from "@/lib/utils";

interface LiveMapProps {
  className?: string;
  drivers?: Array<{ id: string; lat: number; lng: number; status: string }>;
  trips?: Array<{ id: string; pickupLat: number; pickupLng: number; status: string }>;
  showLegend?: boolean;
}

export function LiveMap({ className, drivers = [], trips = [], showLegend = true }: LiveMapProps) {
  return (
    <div className={cn("map-placeholder relative", className)} data-testid="live-map">
      {/* Driver markers */}
      {drivers.map((driver, index) => (
        <div
          key={driver.id}
          className={cn(
            "absolute w-3 h-3 rounded-full border-2 border-white shadow-lg",
            driver.status === 'idle' ? 'bg-accent' : 
            driver.status === 'busy' ? 'bg-primary pulse-dot' : 'bg-muted-foreground'
          )}
          style={{
            top: `${20 + (index % 5) * 60}px`,
            left: `${40 + (index % 4) * 80}px`
          }}
          data-testid={`driver-marker-${driver.id}`}
        />
      ))}

      {/* Trip markers */}
      {trips.map((trip, index) => (
        <div
          key={trip.id}
          className="absolute w-3 h-3 bg-secondary rounded-full border-2 border-white shadow-lg"
          style={{
            top: `${40 + (index % 3) * 100}px`,
            right: `${20 + (index % 3) * 60}px`
          }}
          data-testid={`trip-marker-${trip.id}`}
        />
      ))}

      {/* Map legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg" data-testid="map-legend">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>On Trip</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span>Surge Zone</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
