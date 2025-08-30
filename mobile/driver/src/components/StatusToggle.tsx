// © 2025 Quartermasters FZC. All rights reserved.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

interface StatusToggleProps {
  isOnline: boolean;
  onToggle: (online: boolean) => void;
  isLoading?: boolean;
}

export default function StatusToggle({ isOnline, onToggle, isLoading = false }: StatusToggleProps) {
  return (
    <View style={[styles.container, isOnline ? styles.onlineContainer : styles.offlineContainer]}>
      <View style={styles.statusInfo}>
        <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
        <View style={styles.statusText}>
          <Text style={[styles.statusTitle, isOnline ? styles.onlineText : styles.offlineText]}>
            {isOnline ? "You're online" : "You're offline"}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isOnline ? 'Looking for trip requests' : 'Toggle online to receive trips'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.toggleContainer}
        onPress={() => onToggle(!isOnline)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isOnline ? '#22c55e' : '#64748b'} />
        ) : (
          <View style={[styles.toggle, isOnline ? styles.toggleOnline : styles.toggleOffline]}>
            <View style={[styles.toggleButton, isOnline ? styles.toggleButtonOnline : styles.toggleButtonOffline]} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
  },
  onlineContainer: {
    backgroundColor: '#dcfce7',
  },
  offlineContainer: {
    backgroundColor: '#f1f5f9',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  onlineDot: {
    backgroundColor: '#22c55e',
  },
  offlineDot: {
    backgroundColor: '#64748b',
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  onlineText: {
    color: '#15803d',
  },
  offlineText: {
    color: '#1e293b',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  toggleContainer: {
    marginLeft: 16,
  },
  toggle: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOnline: {
    backgroundColor: '#22c55e',
  },
  toggleOffline: {
    backgroundColor: '#cbd5e1',
  },
  toggleButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  toggleButtonOnline: {
    alignSelf: 'flex-end',
  },
  toggleButtonOffline: {
    alignSelf: 'flex-start',
  },
});
