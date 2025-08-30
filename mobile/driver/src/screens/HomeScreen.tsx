// © 2025 Quartermasters FZC. All rights reserved.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView from '../components/MapView';
import StatusToggle from '../components/StatusToggle';
import { apiRequest } from '../lib/api';
import { useWebSocket } from '../lib/websocket';

export default function HomeScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [todayEarnings, setTodayEarnings] = useState(127.50);
  const [activeOffer, setActiveOffer] = useState<any>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // WebSocket for job offers
  useWebSocket({
    onMessage: (data) => {
      if (data.type === 'job_offer') {
        setActiveOffer(data.data);
        navigation.navigate('JobOffer', { offer: data.data });
      }
    },
  });

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const { data: recentTrips } = useQuery({
    queryKey: ['/api/driver/trips/recent'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/driver/trips/recent');
      return response.json();
    },
    enabled: isOnline,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (online: boolean) => {
      if (!currentLocation && online) {
        throw new Error('Location required to go online');
      }

      const response = await apiRequest('POST', '/api/drivers/status', {
        online,
        lat: currentLocation?.latitude,
        lng: currentLocation?.longitude,
      });
      return response.json();
    },
    onSuccess: (data, online) => {
      setIsOnline(online);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleStatusToggle = (online: boolean) => {
    updateStatusMutation.mutate(online);
  };

  const stats = {
    tripsToday: recentTrips?.length || 0,
    hoursOnline: 4.2,
    rating: 4.9,
  };

  const renderTripItem = ({ item: trip }: any) => (
    <View style={styles.tripItem}>
      <View style={styles.tripInfo}>
        <View style={styles.tripDot} />
        <View style={styles.tripDetails}>
          <Text style={styles.tripRoute}>
            {trip.pickupAddress || 'Pickup'} → {trip.dropoffAddress || 'Dropoff'}
          </Text>
          <Text style={styles.tripTime}>
            {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {trip.durationMin || 12} min
          </Text>
        </View>
      </View>
      <Text style={styles.tripEarnings}>${(trip.fareQuote / 100).toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hi Driver 👋</Text>
          <Text style={styles.subGreeting}>Ready to earn?</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsAmount}>${todayEarnings.toFixed(2)}</Text>
            <Text style={styles.earningsLabel}>Today's earnings</Text>
          </View>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitials}>JS</Text>
          </View>
        </View>
      </View>

      {/* Status Toggle */}
      <View style={styles.statusSection}>
        <StatusToggle 
          isOnline={isOnline} 
          onToggle={handleStatusToggle}
          isLoading={updateStatusMutation.isPending}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.tripsToday}</Text>
          <Text style={styles.statLabel}>Trips today</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.hoursOnline}h</Text>
          <Text style={styles.statLabel}>Online time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Map View */}
      <MapView 
        style={styles.map} 
        region={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        showDriverLocation={true}
        driverLocation={currentLocation}
        showSurgeZones={true}
      />

      {/* Current Status */}
      <View style={styles.statusContainer}>
        {isOnline ? (
          <View style={styles.waitingStatus}>
            <View style={styles.waitingDot} />
            <Text style={styles.waitingText}>Waiting for trip requests...</Text>
          </View>
        ) : (
          <View style={styles.offlineStatus}>
            <Text style={styles.offlineText}>You're offline. Toggle online to receive trip requests.</Text>
          </View>
        )}
      </View>

      {/* Recent Trips */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent trips</Text>
        {recentTrips && recentTrips.length > 0 ? (
          <FlatList
            data={recentTrips.slice(0, 3)}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.id}
            style={styles.tripsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyTrips}>
            <Text style={styles.emptyText}>No recent trips</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  driverAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#22c55e',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitials: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  map: {
    height: 250,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 16,
  },
  waitingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
  },
  waitingDot: {
    width: 8,
    height: 8,
    backgroundColor: '#22c55e',
    borderRadius: 4,
    marginRight: 8,
  },
  waitingText: {
    fontSize: 14,
    color: '#64748b',
  },
  offlineStatus: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  recentSection: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
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
  tripDot: {
    width: 8,
    height: 8,
    backgroundColor: '#22c55e',
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
  emptyTrips: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});
