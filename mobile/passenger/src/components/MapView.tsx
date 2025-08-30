// © 2025 Quartermasters FZC. All rights reserved.

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface MapViewProps {
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showRoute?: boolean;
  driverLocation?: { lat: number; lng: number };
  pickupLocation?: { latitude: number; longitude: number };
  dropoffLocation?: { latitude: number; longitude: number };
}

export default function MapView({ 
  style, 
  region, 
  showRoute = false,
  driverLocation,
  pickupLocation,
  dropoffLocation 
}: MapViewProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapPlaceholder}>
        {/* Pickup marker */}
        {pickupLocation && (
          <View style={[styles.marker, styles.pickupMarker, {
            top: 60,
            left: 40,
          }]} />
        )}
        
        {/* Dropoff marker */}
        {dropoffLocation && (
          <View style={[styles.marker, styles.dropoffMarker, {
            bottom: 40,
            right: 60,
          }]} />
        )}
        
        {/* Driver marker */}
        {driverLocation && (
          <View style={[styles.marker, styles.driverMarker, {
            top: 80,
            left: 100,
          }]} />
        )}

        {/* Route line simulation */}
        {showRoute && pickupLocation && dropoffLocation && (
          <View style={styles.routeLine} />
        )}

        {/* Map controls */}
        <View style={styles.mapControls}>
          <View style={styles.controlButton}>
            <Text style={styles.controlText}>+</Text>
          </View>
          <View style={styles.controlButton}>
            <Text style={styles.controlText}>-</Text>
          </View>
          <View style={styles.controlButton}>
            <Text style={styles.controlText}>📍</Text>
          </View>
        </View>

        {/* Fallback text */}
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>Interactive Map</Text>
          <Text style={styles.mapInfoSubtext}>
            {region ? `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}` : 'Loading location...'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9ff',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  pickupMarker: {
    backgroundColor: '#22c55e',
  },
  dropoffMarker: {
    backgroundColor: '#ef4444',
    borderRadius: 2,
  },
  driverMarker: {
    backgroundColor: '#2563eb',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  routeLine: {
    position: 'absolute',
    top: 60,
    left: 40,
    right: 60,
    bottom: 40,
    borderWidth: 2,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    borderRadius: 20,
    opacity: 0.6,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  controlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
  },
  mapInfoSubtext: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});
