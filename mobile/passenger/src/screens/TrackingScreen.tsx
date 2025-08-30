// © 2025 Quartermasters FZC. All rights reserved.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import MapView from '../components/MapView';
import { apiRequest } from '../lib/api';
import { useWebSocket } from '../lib/websocket';

export default function TrackingScreen({ route, navigation }: any) {
  const { tripId } = route.params;
  const [driverLocation, setDriverLocation] = useState<any>(null);

  const { data: trip, refetch } = useQuery({
    queryKey: [`/api/trips/${tripId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/trips/${tripId}`);
      return response.json();
    },
    refetchInterval: 5000,
  });

  // WebSocket for real-time updates
  useWebSocket({
    onMessage: (data) => {
      if (data.type === 'status_update' && data.tripId === tripId) {
        refetch();
      } else if (data.type === 'location_update' && data.driverId === trip?.driverId) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
      }
    },
  });

  const handleCancelTrip = async () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? Cancellation fees may apply.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest('POST', `/api/trips/${tripId}/cancel`, {
                reason: 'Passenger cancellation',
              });
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleCallDriver = () => {
    // In production, this would use masked calling
    Alert.alert('Call Driver', 'Calling functionality would be implemented here');
  };

  const handleShareTrip = () => {
    Alert.alert('Share Trip', 'Trip sharing functionality would be implemented here');
  };

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusText = () => {
    switch (trip.status) {
      case 'assigned':
        return 'Driver assigned';
      case 'enroute':
        return 'Driver en route';
      case 'arrived':
        return 'Driver arrived';
      case 'ongoing':
        return 'Trip in progress';
      case 'completed':
        return 'Trip completed';
      default:
        return 'Processing request';
    }
  };

  const getEtaText = () => {
    if (trip.status === 'assigned' || trip.status === 'enroute') {
      return 'ETA 3 minutes';
    } else if (trip.status === 'arrived') {
      return 'Driver has arrived';
    } else if (trip.status === 'ongoing') {
      return 'Trip in progress';
    }
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <Text style={styles.etaText}>{getEtaText()}</Text>
        </View>
        <TouchableOpacity onPress={handleShareTrip} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Live Map */}
      <MapView 
        style={styles.map} 
        region={{
          latitude: parseFloat(trip.pickupLat),
          longitude: parseFloat(trip.pickupLng),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showRoute={true}
        driverLocation={driverLocation}
        pickupLocation={{
          latitude: parseFloat(trip.pickupLat),
          longitude: parseFloat(trip.pickupLng),
        }}
        dropoffLocation={{
          latitude: parseFloat(trip.dropoffLat),
          longitude: parseFloat(trip.dropoffLng),
        }}
      />

      {/* Driver Info Card */}
      <View style={styles.content}>
        {trip.driverId && (
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitials}>JS</Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>John Smith</Text>
                <Text style={styles.driverRating}>4.9 ★ • 1,247 trips</Text>
                <Text style={styles.vehicleInfo}>Honda Civic • ABC-123</Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCallDriver}>
                <Ionicons name="call" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.messageButton]}>
                <Ionicons name="chatbubble" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#22c55e' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationAddress}>{trip.pickupAddress || 'Pickup Location'}</Text>
              <Text style={styles.locationType}>Pickup location</Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#ef4444', borderRadius: 2 }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationAddress}>{trip.dropoffAddress || 'Dropoff Location'}</Text>
              <Text style={styles.locationType}>Destination</Text>
            </View>
          </View>
        </View>

        {/* Trip Actions */}
        {trip.status !== 'completed' && trip.status !== 'cancelled' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelTrip}>
              <Text style={styles.cancelButtonText}>Cancel Trip</Text>
            </TouchableOpacity>
            <Text style={styles.cancelNote}>
              Cancellation fee may apply after driver arrives
            </Text>
          </View>
        )}

        {trip.status === 'completed' && (
          <View style={styles.completedActions}>
            <TouchableOpacity style={styles.rateButton}>
              <Text style={styles.rateButtonText}>Rate Your Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  etaText: {
    fontSize: 14,
    color: '#64748b',
  },
  shareButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    height: 320,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitials: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  driverDetails: {
    marginLeft: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  driverRating: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  driverActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#f1f5f9',
  },
  tripDetails: {
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  locationType: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actions: {
    marginTop: 'auto',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  completedActions: {
    marginTop: 'auto',
  },
  rateButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
