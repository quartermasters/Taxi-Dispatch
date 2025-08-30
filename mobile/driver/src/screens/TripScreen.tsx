// © 2025 Quartermasters FZC. All rights reserved.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import MapView from '../components/MapView';
import { apiRequest } from '../lib/api';
import { useWebSocket } from '../lib/websocket';

export default function TripScreen({ route, navigation }: any) {
  const { tripId } = route.params;

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
      }
    },
  });

  const updateTripMutation = useMutation({
    mutationFn: async (eventType: 'arrived' | 'start' | 'end') => {
      const response = await apiRequest('POST', '/api/drivers/event', {
        tripId,
        type: eventType,
      });
      return response.json();
    },
    onSuccess: (data, eventType) => {
      refetch();
      if (eventType === 'end') {
        Alert.alert(
          'Trip Completed',
          'Trip has been completed successfully. Payment will be processed automatically.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Main'),
            },
          ]
        );
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleNavigation = () => {
    if (!trip) return;
    
    const destination = trip.status === 'assigned' || trip.status === 'enroute' 
      ? `${trip.pickupLat},${trip.pickupLng}`
      : `${trip.dropoffLat},${trip.dropoffLng}`;
    
    const url = `https://maps.google.com/maps?daddr=${destination}`;
    Linking.openURL(url);
  };

  const getActionButton = () => {
    if (!trip) return null;

    switch (trip.status) {
      case 'assigned':
      case 'enroute':
        return (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => updateTripMutation.mutate('arrived')}
            disabled={updateTripMutation.isPending}
          >
            <Text style={styles.actionButtonText}>
              {updateTripMutation.isPending ? 'Updating...' : 'I Have Arrived'}
            </Text>
          </TouchableOpacity>
        );
      case 'arrived':
        return (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => updateTripMutation.mutate('start')}
            disabled={updateTripMutation.isPending}
          >
            <Text style={styles.actionButtonText}>
              {updateTripMutation.isPending ? 'Starting...' : 'Start Trip'}
            </Text>
          </TouchableOpacity>
        );
      case 'ongoing':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.endTripButton]}
            onPress={() => updateTripMutation.mutate('end')}
            disabled={updateTripMutation.isPending}
          >
            <Text style={styles.actionButtonText}>
              {updateTripMutation.isPending ? 'Completing...' : 'Complete Trip'}
            </Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!trip) return 'Loading...';
    
    switch (trip.status) {
      case 'assigned':
        return 'Navigate to pickup location';
      case 'enroute':
        return 'En route to passenger';
      case 'arrived':
        return 'Waiting for passenger';
      case 'ongoing':
        return 'Trip in progress';
      case 'completed':
        return 'Trip completed';
      default:
        return trip.status;
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <Text style={styles.tripId}>Trip #{trip.id.slice(-6)}</Text>
        </View>
        <TouchableOpacity onPress={handleNavigation} style={styles.navButton}>
          <Ionicons name="navigate" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView 
        style={styles.map}
        region={{
          latitude: parseFloat(trip.pickupLat),
          longitude: parseFloat(trip.pickupLng),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showRoute={true}
        pickupLocation={{
          latitude: parseFloat(trip.pickupLat),
          longitude: parseFloat(trip.pickupLng),
        }}
        dropoffLocation={{
          latitude: parseFloat(trip.dropoffLat),
          longitude: parseFloat(trip.dropoffLng),
        }}
      />

      {/* Trip Info */}
      <View style={styles.content}>
        {/* Trip Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, trip.status !== 'assigned' && styles.progressStepComplete]}>
              <Text style={styles.progressStepText}>1</Text>
            </View>
            <View style={[styles.progressLine, trip.status === 'ongoing' || trip.status === 'completed' ? styles.progressLineComplete : {}]} />
            <View style={[styles.progressStep, (trip.status === 'ongoing' || trip.status === 'completed') && styles.progressStepComplete]}>
              <Text style={styles.progressStepText}>2</Text>
            </View>
            <View style={[styles.progressLine, trip.status === 'completed' ? styles.progressLineComplete : {}]} />
            <View style={[styles.progressStep, trip.status === 'completed' && styles.progressStepComplete]}>
              <Text style={styles.progressStepText}>3</Text>
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Pickup</Text>
            <Text style={styles.progressLabel}>In Transit</Text>
            <Text style={styles.progressLabel}>Complete</Text>
          </View>
        </View>

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

        {/* Fare Information */}
        <View style={styles.fareContainer}>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Trip Fare</Text>
            <Text style={styles.fareAmount}>${(trip.fareQuote / 100).toFixed(2)}</Text>
          </View>
          {trip.surgeMultiplier && parseFloat(trip.surgeMultiplier) > 1 && (
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Surge Multiplier</Text>
              <Text style={styles.surgeText}>{trip.surgeMultiplier}x</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {getActionButton()}

        {/* Navigation Button */}
        <TouchableOpacity style={styles.navigationButton} onPress={handleNavigation}>
          <Ionicons name="navigate" size={20} color="#2563eb" />
          <Text style={styles.navigationText}>Open in Maps</Text>
        </TouchableOpacity>
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
  tripId: {
    fontSize: 14,
    color: '#64748b',
  },
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    height: 300,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  progressStepComplete: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  progressLineComplete: {
    backgroundColor: '#2563eb',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    width: 60,
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
  fareContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  surgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  actionButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  endTripButton: {
    backgroundColor: '#22c55e',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navigationText: {
    fontSize: 14,
    color: '#2563eb',
    marginLeft: 8,
    fontWeight: '500',
  },
});
