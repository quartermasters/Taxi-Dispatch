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

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add driver markers
    drivers.forEach(driver => {
      if (driver.lat && driver.lng && (window as any).google) {
        const marker = new (window as any).google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map: mapInstanceRef.current,
          title: driver.name || `Driver ${driver.id}`,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: driver.status === 'idle' ? '#10b981' : 
                      driver.status === 'busy' ? '#3b82f6' : '#6b7280',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        }) as GoogleMarker;

        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">${driver.name || `Driver ${driver.id}`}</h3>
              <p class="text-sm text-gray-600">Status: ${driver.status}</p>
            </div>
          `
        }) as GoogleInfoWindow;

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current as GoogleMap, marker);
        });

        markersRef.current.push(marker);
      }
    });

    // Add trip markers
    trips.forEach(trip => {
      if (trip.pickupLat && trip.pickupLng && (window as any).google) {
        const marker = new (window as any).google.maps.Marker({
          position: { lat: trip.pickupLat, lng: trip.pickupLng },
          map: mapInstanceRef.current,
          title: `Trip ${trip.id}`,
          icon: {
            path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#f59e0b',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        }) as GoogleMarker;

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
      
      {/* Map legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg" data-testid="map-legend">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>On Trip</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Trip Pickup</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
