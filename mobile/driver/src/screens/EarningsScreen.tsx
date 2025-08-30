// © 2025 Quartermasters FZC. All rights reserved.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../lib/api';

export default function EarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week'>('today');

  const { data: trips } = useQuery({
    queryKey: ['/api/driver/trips/recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/driver/trips/recent');
      return response.json();
    },
  });

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
  ];

  const getFilteredTrips = () => {
    if (!trips) return [];
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay.getTime() - (startOfDay.getDay() * 24 * 60 * 60 * 1000));

    return trips.filter((trip: any) => {
      const tripDate = new Date(trip.createdAt);
      return selectedPeriod === 'today' 
        ? tripDate >= startOfDay
        : tripDate >= startOfWeek;
    });
  };

  const filteredTrips = getFilteredTrips();
  const completedTrips = filteredTrips.filter((trip: any) => trip.status === 'completed');
  
  const earnings = {
    total: completedTrips.reduce((sum: number, trip: any) => sum + trip.fareQuote, 0),
    tripCount: completedTrips.length,
    avgFare: completedTrips.length > 0 
      ? completedTrips.reduce((sum: number, trip: any) => sum + trip.fareQuote, 0) / completedTrips.length 
      : 0,
  };

  const renderTripItem = ({ item: trip }: any) => (
    <View style={styles.tripItem}>
      <View style={styles.tripInfo}>
        <View style={[styles.statusDot, { 
          backgroundColor: trip.status === 'completed' ? '#22c55e' : '#64748b' 
        }]} />
        <View style={styles.tripDetails}>
          <Text style={styles.tripRoute}>
            {trip.pickupAddress || 'Pickup'} → {trip.dropoffAddress || 'Dropoff'}
          </Text>
          <Text style={styles.tripTime}>
            {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {trip.durationMin || 0} min
          </Text>
        </View>
      </View>
      <Text style={styles.tripEarnings}>
        {trip.status === 'completed' ? `$${(trip.fareQuote / 100).toFixed(2)}` : 'Cancelled'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <Text style={styles.headerSubtitle}>Track your income and trips</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.key as 'today' | 'week')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>
              {selectedPeriod === 'today' ? "Today's Earnings" : "This Week's Earnings"}
            </Text>
            <Ionicons name="trending-up" size={20} color="#22c55e" />
          </View>
          
          <Text style={styles.totalEarnings}>${(earnings.total / 100).toFixed(2)}</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{earnings.tripCount}</Text>
              <Text style={styles.summaryStatLabel}>Trips</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>${(earnings.avgFare / 100).toFixed(2)}</Text>
              <Text style={styles.summaryStatLabel}>Avg. Fare</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {selectedPeriod === 'today' ? '4.2h' : '28.5h'}
              </Text>
              <Text style={styles.summaryStatLabel}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Trip List */}
      <View style={styles.tripsSection}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No trips for this period</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTrips}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.id}
            style={styles.tripsList}
            showsVerticalScrollIndicator={false}
          />
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  summarySection: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalEarnings: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  tripsSection: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  tripsList: {
    flex: 1,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  tripDetails: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  tripTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  tripEarnings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
});
