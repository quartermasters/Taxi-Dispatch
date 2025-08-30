// © 2025 Quartermasters FZC. All rights reserved.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../lib/api';

export default function JobOfferScreen({ route, navigation }: any) {
  const { offer } = route.params;
  const [timeRemaining, setTimeRemaining] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-decline when time runs out
          declineOfferMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const acceptOfferMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/drivers/accept', {
        tripId: offer.tripId,
      });
      return response.json();
    },
    onSuccess: () => {
      navigation.replace('Trip', { tripId: offer.tripId });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message);
      navigation.goBack();
    },
  });

  const declineOfferMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/drivers/decline', {
        tripId: offer.tripId,
      });
      return response.json();
    },
    onSuccess: () => {
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message);
      navigation.goBack();
    },
  });

  const handleAccept = () => {
    acceptOfferMutation.mutate();
  };

  const handleDecline = () => {
    declineOfferMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background overlay */}
      <View style={styles.overlay} />
      
      {/* Job Offer Modal */}
      <View style={styles.modal}>
        {/* Timer Header */}
        <View style={styles.timerHeader}>
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{timeRemaining}</Text>
            </View>
            <View style={styles.timerInfo}>
              <Text style={styles.offerTitle}>New trip request</Text>
              <Text style={styles.offerSubtitle}>{timeRemaining} seconds to respond</Text>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          {/* Distance & Time & Fare */}
          <View style={styles.tripStats}>
            <View style={styles.statContainer}>
              <Text style={styles.statValue}>{offer.distanceKm.toFixed(1)}</Text>
              <Text style={styles.statLabel}>km away</Text>
            </View>
            <View style={styles.statContainer}>
              <Text style={styles.statValue}>{offer.estMins}</Text>
              <Text style={styles.statLabel}>min trip</Text>
            </View>
            <View style={styles.statContainer}>
              <Text style={styles.statValue}>${(offer.fareEstimate / 100).toFixed(2)}</Text>
              <Text style={styles.statLabel}>estimated</Text>
            </View>
          </View>

          {/* Route */}
          <View style={styles.routeSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#22c55e' }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>{offer.pickup.address || 'Pickup Location'}</Text>
                <Text style={styles.locationType}>Pickup location</Text>
              </View>
            </View>
            
            <View style={styles.routeLine} />
            
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#ef4444', borderRadius: 2 }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>{offer.dropoff.address || 'Dropoff Location'}</Text>
                <Text style={styles.locationType}>Destination</Text>
              </View>
            </View>
          </View>

          {/* Passenger Info */}
          <View style={styles.passengerInfo}>
            <View style={styles.passengerAvatar}>
              <Text style={styles.passengerInitials}>SJ</Text>
            </View>
            <View style={styles.passengerDetails}>
              <Text style={styles.passengerName}>Sarah J.</Text>
              <Text style={styles.passengerRating}>4.8 ★ • Regular passenger</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.declineButton} 
              onPress={handleDecline}
              disabled={declineOfferMutation.isPending}
            >
              <Text style={styles.declineButtonText}>
                {declineOfferMutation.isPending ? 'Declining...' : 'Decline'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.acceptButton} 
              onPress={handleAccept}
              disabled={acceptOfferMutation.isPending}
            >
              <Text style={styles.acceptButtonText}>
                {acceptOfferMutation.isPending ? 'Accepting...' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  timerHeader: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timerCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  timerInfo: {
    alignItems: 'flex-start',
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  offerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  tripDetails: {
    paddingTop: 16,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  routeSection: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  routeLine: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginLeft: 6,
    marginVertical: 8,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  passengerAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#a855f7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerInitials: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  passengerDetails: {
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  passengerRating: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
