// © 2025 Quartermasters FZC. All rights reserved.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../lib/api';

export default function HistoryScreen({ navigation }: any) {
  const { data: trips, isLoading } = useQuery({
    queryKey: ['/api/trips/history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/trips/history');
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'time';
    }
  };

  const renderTripItem = ({ item: trip }: any) => (
    <TouchableOpacity 
      style={styles.tripItem}
      onPress={() => navigation.navigate('Tracking', { tripId: trip.id })}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripRoute}>
            {trip.pickupAddress || 'Pickup'} → {trip.dropoffAddress || 'Dropoff'}
          </Text>
          <Text style={styles.tripDate}>
            {new Date(trip.createdAt).toLocaleDateString()} • {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.tripStatus}>
          <Ionicons 
            name={getStatusIcon(trip.status) as any} 
            size={20} 
            color={getStatusColor(trip.status)} 
          />
        </View>
      </View>
      
      <View style={styles.tripDetails}>
        <View style={styles.tripMeta}>
          <Text style={styles.tripPrice}>${(trip.fareQuote / 100).toFixed(2)}</Text>
          {trip.distanceKm && (
            <Text style={styles.tripDistance}>{trip.distanceKm} km</Text>
          )}
          {trip.durationMin && (
            <Text style={styles.tripDuration}>{trip.durationMin} min</Text>
          )}
        </View>
        
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
        <Text style={styles.headerSubtitle}>Your recent rides</Text>
      </View>

      {/* Trip List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading trip history...</Text>
        </View>
      ) : !trips || trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtitle}>Your completed trips will appear here</Text>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={styles.bookButtonText}>Book Your First Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  tripItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  tripDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  tripStatus: {
    marginLeft: 12,
  },
  tripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tripPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  tripDistance: {
    fontSize: 14,
    color: '#64748b',
  },
  tripDuration: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
