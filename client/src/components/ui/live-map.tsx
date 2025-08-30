// © 2025 Quartermasters FZC. All rights reserved.

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { cn } from "@/lib/utils";

// Type declarations for Google Maps
interface GoogleMap {
  setCenter(center: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
}

interface GoogleMarker {
  setMap(map: GoogleMap | null): void;
  addListener(event: string, callback: () => void): void;
}

interface GoogleInfoWindow {
  open(map: GoogleMap, marker: GoogleMarker): void;
}

interface LiveMapProps {
  className?: string;
  drivers?: Array<{ id: string; lat: number; lng: number; status: string; name?: string }>;
  trips?: Array<{ id: string; pickupLat: number; pickupLng: number; status: string }>;
  showLegend?: boolean;
}

export function LiveMap({ className, drivers = [], trips = [], showLegend = true }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Fetch API key from backend
        const configResponse = await fetch('/api/config/maps');
        const config = await configResponse.json();
        
        if (!config.apiKey) {
          throw new Error("Google Maps API key not configured");
        }

        const loader = new Loader({
          apiKey: config.apiKey,
          version: "weekly",
          libraries: ["places"]
        });

        const { Map } = await loader.importLibrary("maps") as any;
        
        if (mapRef.current) {
          // Center on Dubai as default location
          const map = new Map(mapRef.current, {
            center: { lat: 25.2048, lng: 55.2708 },
            zoom: 12,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          }) as GoogleMap;
          
          mapInstanceRef.current = map;
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('ApiNotActivatedMapError')) {
          setError("Google Maps API not activated. Please enable Maps JavaScript API in Google Cloud Console.");
        } else {
          setError("Failed to load map: " + errorMessage);
        }
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Create realistic vehicle icon based on status
  const createVehicleIcon = (status: string) => {
    const colors = {
      idle: { primary: '#10b981', secondary: '#059669', accent: '#ffffff' },
      busy: { primary: '#3b82f6', secondary: '#2563eb', accent: '#ffffff' },
      offline: { primary: '#6b7280', secondary: '#4b5563', accent: '#9ca3af' }
    };
    
    const color = colors[status as keyof typeof colors] || colors.offline;
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <!-- Vehicle shadow -->
          <ellipse cx="20" cy="35" rx="16" ry="4" fill="rgba(0,0,0,0.2)"/>
          
          <!-- Vehicle body -->
          <rect x="6" y="15" width="28" height="12" rx="6" fill="${color.primary}" stroke="${color.accent}" stroke-width="1"/>
          
          <!-- Vehicle cabin -->
          <rect x="10" y="8" width="20" height="12" rx="4" fill="${color.secondary}" stroke="${color.accent}" stroke-width="1"/>
          
          <!-- Windshield -->
          <rect x="12" y="10" width="16" height="6" rx="2" fill="rgba(255,255,255,0.3)"/>
          
          <!-- Wheels -->
          <circle cx="12" cy="27" r="4" fill="#2d3748" stroke="${color.accent}" stroke-width="1"/>
          <circle cx="28" cy="27" r="4" fill="#2d3748" stroke="${color.accent}" stroke-width="1"/>
          <circle cx="12" cy="27" r="2" fill="#4a5568"/>
          <circle cx="28" cy="27" r="2" fill="#4a5568"/>
          
          <!-- Status indicator -->
          <circle cx="32" cy="8" r="4" fill="${color.primary}" stroke="${color.accent}" stroke-width="2"/>
          <text x="32" y="12" text-anchor="middle" fill="${color.accent}" font-size="8" font-weight="bold">
            ${status === 'idle' ? '✓' : status === 'busy' ? '●' : '✕'}
          </text>
          
          <!-- Vehicle details -->
          <rect x="16" y="18" width="8" height="2" fill="${color.accent}" opacity="0.8"/>
          <rect x="14" y="21" width="12" height="1" fill="${color.accent}" opacity="0.6"/>
        </svg>
      `)`,
      scaledSize: new (window as any).google.maps.Size(40, 40),
      anchor: new (window as any).google.maps.Point(20, 35)
    };
  };

  // Create realistic driver avatar icon
  const createDriverIcon = (status: string, name?: string) => {
    const colors = {
      idle: { bg: '#dcfce7', border: '#10b981', text: '#065f46' },
      busy: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
      offline: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
    };
    
    const color = colors[status as keyof typeof colors] || colors.offline;
    const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'D';
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <circle cx="18" cy="32" r="14" fill="rgba(0,0,0,0.1)"/>
          
          <!-- Avatar background -->
          <circle cx="18" cy="18" r="16" fill="${color.bg}" stroke="${color.border}" stroke-width="3"/>
          
          <!-- Driver silhouette -->
          <circle cx="18" cy="12" r="6" fill="${color.border}"/>
          <path d="M8 28 Q8 20 18 20 Q28 20 28 28 L8 28" fill="${color.border}"/>
          
          <!-- Status indicator -->
          <circle cx="28" cy="8" r="6" fill="${color.border}" stroke="white" stroke-width="2"/>
          <circle cx="28" cy="8" r="3" fill="white"/>
          
          <!-- Initials -->
          <text x="18" y="22" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="Arial">
            ${initials}
          </text>
        </svg>
      `)`,
      scaledSize: new (window as any).google.maps.Size(36, 36),
      anchor: new (window as any).google.maps.Point(18, 32)
    };
  };

  // Create pickup location icon
  const createPickupIcon = () => {
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="16" cy="28" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/>
          
          <!-- Pin body -->
          <path d="M16 4 C10 4 6 8 6 14 C6 20 16 28 16 28 S26 20 26 14 C26 8 22 4 16 4 Z" 
                fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
          
          <!-- Pin center -->
          <circle cx="16" cy="14" r="5" fill="#ffffff"/>
          <circle cx="16" cy="14" r="3" fill="#f59e0b"/>
          
          <!-- Person icon -->
          <g transform="translate(16,14) scale(0.7)">
            <circle cx="0" cy="-2" r="2" fill="#ffffff"/>
            <path d="M-3 4 Q-3 0 0 0 Q3 0 3 4 L-3 4" fill="#ffffff"/>
          </g>
        </svg>
      `)`,
      scaledSize: new (window as any).google.maps.Size(32, 32),
      anchor: new (window as any).google.maps.Point(16, 28)
    };
  };

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add vehicle/driver markers with realistic icons
    drivers.forEach(driver => {
      if (driver.lat && driver.lng && (window as any).google) {
        const marker = new (window as any).google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map: mapInstanceRef.current,
          title: driver.name || `Driver ${driver.id}`,
          icon: createVehicleIcon(driver.status),
          zIndex: driver.status === 'busy' ? 1000 : 500
        }) as GoogleMarker;

        const statusText = driver.status === 'idle' ? 'Available' : 
                          driver.status === 'busy' ? 'On Trip' : 'Offline';
        
        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[200px]">
              <div class="flex items-center space-x-3 mb-2">
                <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  ${(driver.name || 'D').charAt(0)}
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">${driver.name || `Driver ${driver.id}`}</h3>
                  <p class="text-sm text-gray-600">Vehicle ID: ${driver.id}</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Status:</span>
                <span class="px-2 py-1 rounded-full text-xs font-medium ${
                  driver.status === 'idle' ? 'bg-green-100 text-green-800' :
                  driver.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }">${statusText}</span>
              </div>
              <div class="mt-2 pt-2 border-t border-gray-200">
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>Last Update:</span>
                  <span>Just now</span>
                </div>
              </div>
            </div>
          `
        }) as GoogleInfoWindow;

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current as GoogleMap, marker);
        });

        markersRef.current.push(marker);
      }
    });

    // Add trip markers with pickup icons
    trips.forEach(trip => {
      if (trip.pickupLat && trip.pickupLng && (window as any).google) {
        const marker = new (window as any).google.maps.Marker({
          position: { lat: trip.pickupLat, lng: trip.pickupLng },
          map: mapInstanceRef.current,
          title: `Trip ${trip.id}`,
          icon: createPickupIcon(),
          zIndex: 800
        }) as GoogleMarker;

        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[180px]">
              <div class="flex items-center space-x-2 mb-2">
                <i class="fas fa-map-marker-alt text-amber-500"></i>
                <h3 class="font-semibold text-gray-800">Pickup Location</h3>
              </div>
              <div class="space-y-1 text-sm text-gray-600">
                <p><strong>Trip ID:</strong> ${trip.id}</p>
                <p><strong>Status:</strong> ${trip.status}</p>
                <p><strong>Coordinates:</strong> ${trip.pickupLat.toFixed(4)}, ${trip.pickupLng.toFixed(4)}</p>
              </div>
            </div>
          `
        }) as GoogleInfoWindow;

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current as GoogleMap, marker);
        });

        markersRef.current.push(marker);
      }
    });
  }, [drivers, trips]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-96 bg-muted rounded-lg", className)} data-testid="live-map">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load map</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-96", className)} data-testid="live-map">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Enhanced Map Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-gray-200" data-testid="map-legend">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <i className="fas fa-map-marked-alt mr-2 text-primary"></i>
            Live Fleet Status
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 relative">
                <svg width="24" height="24" viewBox="0 0 24 24" className="transform scale-75">
                  <rect x="2" y="8" width="20" height="8" rx="4" fill="#10b981" stroke="#ffffff" strokeWidth="1"/>
                  <circle cx="6" cy="16" r="2" fill="#2d3748"/>
                  <circle cx="18" cy="16" r="2" fill="#2d3748"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Available Vehicles</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 relative">
                <svg width="24" height="24" viewBox="0 0 24 24" className="transform scale-75">
                  <rect x="2" y="8" width="20" height="8" rx="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1"/>
                  <circle cx="6" cy="16" r="2" fill="#2d3748"/>
                  <circle cx="18" cy="16" r="2" fill="#2d3748"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">On Trip</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 relative">
                <svg width="24" height="24" viewBox="0 0 24 24" className="transform scale-75">
                  <rect x="2" y="8" width="20" height="8" rx="4" fill="#6b7280" stroke="#ffffff" strokeWidth="1"/>
                  <circle cx="6" cy="16" r="2" fill="#2d3748"/>
                  <circle cx="18" cy="16" r="2" fill="#2d3748"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Offline</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 relative">
                <svg width="24" height="24" viewBox="0 0 24 24" className="transform scale-75">
                  <path d="M12 2 C8 2 5 5 5 9 C5 13 12 22 12 22 S19 13 19 9 C19 5 16 2 12 2 Z" 
                        fill="#f59e0b" stroke="#ffffff" strokeWidth="1"/>
                  <circle cx="12" cy="9" r="3" fill="#ffffff"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700">Pickup Points</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last Updated:</span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                Live
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
