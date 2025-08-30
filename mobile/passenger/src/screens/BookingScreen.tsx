// © 2025 Quartermasters FZC. All rights reserved.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView from '../components/MapView';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BookingScreen({ navigation }: any) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<'standard' | 'xl' | 'executive'>('standard');
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for booking rides.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);
      
      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync(location.coords);
      if (address) {
        setPickup(`${address.street || ''} ${address.name || ''}, ${address.city || ''}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const { data: quote, refetch: getQuote } = useQuery({
    queryKey: ['/trips/quote', pickup, dropoff, selectedVehicle],
    queryFn: async () => {
      if (!currentLocation || !dropoff) return null;
      
      const response = await fetch(`${API_BASE}/trips/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: currentLocation.latitude,
          pickupLng: currentLocation.longitude,
          dropoffLat: currentLocation.latitude + 0.01, // Mock dropoff coordinates
          dropoffLng: currentLocation.longitude + 0.01,
          vehicleType: selectedVehicle,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get quote');
      return response.json();
    },
    enabled: false,
  });

  const bookTripMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) throw new Error('Location not available');
      
      const response = await fetch(`${API_BASE}/trips`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          pickupLat: currentLocation.latitude,
          pickupLng: currentLocation.longitude,
          dropoffLat: currentLocation.latitude + 0.01,
          dropoffLng: currentLocation.longitude + 0.01,
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          vehicleType: selectedVehicle,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to book trip');
      return response.json();
    },
    onSuccess: (trip) => {
      navigation.navigate('Tracking', { tripId: trip.id });
    },
    onError: (error: any) => {
      Alert.alert('Booking Failed', error.message);
    },
  });

  const handleGetQuote = () => {
    if (!pickup || !dropoff) {
      Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations.');
      return;
    }
    getQuote();
  };

  const handleBookTrip = () => {
    if (!quote) {
      Alert.alert('No Quote', 'Please get a quote first.');
      return;
    }
    bookTripMutation.mutate();
  };

  const vehicleOptions = [
    { type: 'standard' as const, name: 'Standard', icon: 'car', eta: '3-5 min' },
    { type: 'xl' as const, name: 'XL', icon: 'car-sport', eta: '4-7 min' },
    { type: 'executive' as const, name: 'Executive', icon: 'car-outline', eta: '6-10 min' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Where to?</Text>
        <Text style={styles.headerSubtitle}>Current location detected</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInput}>
            <View style={styles.locationDot} />
            <TextInput
              style={styles.input}
              placeholder="Pickup location"
              value={pickup}
              onChangeText={setPickup}
            />
          </View>
          
          <View style={styles.searchInput}>
            <View style={[styles.locationDot, { backgroundColor: '#ef4444' }]} />
            <TextInput
              style={styles.input}
              placeholder="Where to?"
              value={dropoff}
              onChangeText={setDropoff}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="home" size={16} color="#666" />
              <Text style={styles.quickActionText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="briefcase" size={16} color="#666" />
              <Text style={styles.quickActionText}>Work</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.quickActionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map View */}
        <MapView style={styles.map} region={currentLocation} />

        {/* Get Quote Button */}
        {!quote && (
          <TouchableOpacity style={styles.quoteButton} onPress={handleGetQuote}>
            <Text style={styles.quoteButtonText}>Get Quote</Text>
          </TouchableOpacity>
        )}

        {/* Vehicle Selection & Quote */}
        {quote && (
          <View style={styles.quoteSection}>
            <Text style={styles.sectionTitle}>Choose a ride</Text>
            {vehicleOptions.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleOption,
                  selectedVehicle === vehicle.type && styles.vehicleOptionSelected
                ]}
                onPress={() => setSelectedVehicle(vehicle.type)}
              >
                <View style={styles.vehicleInfo}>
                  <Ionicons 
                    name={vehicle.icon as any} 
                    size={24} 
                    color={selectedVehicle === vehicle.type ? '#2563eb' : '#666'} 
                  />
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleEta}>{vehicle.eta} away</Text>
                  </View>
                </View>
                <View style={styles.vehiclePricing}>
                  <Text style={styles.vehiclePrice}>
                    ${((quote.fareCents || 0) / 100).toFixed(2)}
                  </Text>
                  <Text style={styles.vehicleSurge}>
                    {quote.surgeMultiplier ? `${quote.surgeMultiplier}x surge` : 'No surge'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Payment Method */}
            <View style={styles.paymentMethod}>
              <Ionicons name="card" size={20} color="#666" />
              <Text style={styles.paymentText}>••••1234</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>

            {/* Book Ride Button */}
            <TouchableOpacity 
              style={styles.bookButton} 
              onPress={handleBookTrip}
              disabled={bookTripMutation.isPending}
            >
              <Text style={styles.bookButtonText}>
                {bookTripMutation.isPending 
                  ? 'Booking...' 
                  : `Book ${vehicleOptions.find(v => v.type === selectedVehicle)?.name} - $${((quote.fareCents || 0) / 100).toFixed(2)}`
                }
              </Text>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              By booking, you agree to our terms and cancellation policy
            </Text>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: 'white',
    padding: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  quickActionText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  map: {
    height: 250,
  },
  quoteButton: {
    backgroundColor: '#2563eb',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteSection: {
    backgroundColor: 'white',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  vehicleOptionSelected: {
    borderColor: '#2563eb',
    borderWidth: 2,
    backgroundColor: '#eff6ff',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleDetails: {
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  vehicleEta: {
    fontSize: 14,
    color: '#64748b',
  },
  vehiclePricing: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  vehicleSurge: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    marginLeft: 12,
  },
  bookButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
});
