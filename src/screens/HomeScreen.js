import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
import NetInfo from '@react-native-community/netinfo';

import AlertCard from '../components/AlertCard';
import FilterButtons from '../components/FilterButtons';
import LoadingSpinner from '../components/LoadingSpinner';
import { colors } from '../constants/colors';
import { fetchAlerts } from '../services/api';
import { calculateDistance, requestLocationPermission } from '../utils/location';

const HomeScreen = ({ navigation, alerts: initialAlerts, isConnected }) => {
  const isFocused = useIsFocused();
  const [alerts, setAlerts] = useState(initialAlerts || []);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    if (isFocused) {
      getUserLocation();
      loadAlerts();
    }
  }, [isFocused]);

  useEffect(() => {
    filterAlerts();
    calculateStats();
  }, [alerts, selectedFilter, showNearbyOnly, userLocation]);

  const getUserLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location error:', error);
          if (error.code === 3) { // Timeout
            // Try again with less accuracy
            Geolocation.getCurrentPosition(
              (pos) => setUserLocation(pos.coords),
              (err) => console.log('Second attempt failed:', err),
              { enableHighAccuracy: false, timeout: 30000 }
            );
          }
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }
  };

  const loadAlerts = async () => {
    if (!isConnected) return;
    
    setLoading(true);
    try {
      const data = await fetchAlerts();
      if (data && data.length > 0) {
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      Alert.alert('Error', 'Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(alert => 
        alert.type?.toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    // Apply location filter
    if (showNearbyOnly && userLocation) {
      filtered = filtered.filter(alert => {
        if (alert.coordinates) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            alert.coordinates.latitude,
            alert.coordinates.longitude
          );
          alert.distance = Math.round(distance * 10) / 10;
          return distance <= 50; // Within 50km
        }
        return false;
      });
      
      // Sort by distance
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else {
      // Sort by time (newest first)
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    setFilteredAlerts(filtered);
  };

  const calculateStats = () => {
    const stats = {
      total: alerts.length,
      high: alerts.filter(a => a.severity?.toLowerCase() === 'high').length,
      medium: alerts.filter(a => a.severity?.toLowerCase() === 'medium').length,
      low: alerts.filter(a => a.severity?.toLowerCase() === 'low').length
    };
    setStats(stats);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statItem, styles.statHigh]}>
          <Text style={styles.statValue}>{stats.high}</Text>
          <Text style={styles.statLabel}>High</Text>
        </View>
        <View style={[styles.statItem, styles.statMedium]}>
          <Text style={styles.statValue}>{stats.medium}</Text>
          <Text style={styles.statLabel}>Medium</Text>
        </View>
        <View style={[styles.statItem, styles.statLow]}>
          <Text style={styles.statValue}>{stats.low}</Text>
          <Text style={styles.statLabel}>Low</Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <FilterButtons 
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, showNearbyOnly && styles.actionButtonActive]}
            onPress={() => setShowNearbyOnly(!showNearbyOnly)}
          >
            <Icon 
              name="near-me" 
              size={20} 
              color={showNearbyOnly ? colors.white : colors.primary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Map', { alerts: filteredAlerts })}
          >
            <Icon name="map" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Icon name="wifi-off" size={16} color={colors.white} />
          <Text style={styles.offlineText}>You are offline</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>🕊️</Text>
      <Text style={styles.emptyStateTitle}>No Active Alerts</Text>
      <Text style={styles.emptyStateText}>
        {showNearbyOnly 
          ? 'No alerts within 50km of your location'
          : 'The area is currently calm. Stay tuned for updates.'}
      </Text>
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Icon name="refresh" size={20} color={colors.white} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {loading && !refreshing ? (
        <LoadingSpinner message="Loading alerts..." />
      ) : (
        <FlatList
          data={filteredAlerts}
          renderItem={({ item }) => (
            <AlertCard 
              alert={item}
              onPress={() => {
                Alert.alert(
                  item.title,
                  `${item.detailedDescription || item.description}\n\nLocation: ${item.location}\nTime: ${new Date(item.timestamp).toLocaleString()}`,
                  [
                    { text: 'Close', style: 'cancel' },
                    { text: 'View on Map', onPress: () => navigation.navigate('Map', { selectedAlert: item }) }
                  ]
                );
              }}
            />
          )}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    zIndex: 1
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: colors.primary,
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 10
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white
  },
  statLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2
  },
  statHigh: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20
  },
  statMedium: {
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingRight: 20
  },
  statLow: {},
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3
  },
  actionButtonActive: {
    backgroundColor: colors.primary
  },
  offlineBanner: {
    backgroundColor: colors.danger,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  offlineText: {
    color: colors.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500'
  },
  listContent: {
    paddingVertical: 10,
    flexGrow: 1
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyStateEmoji: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.7
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center'
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24
  },
  refreshButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  refreshButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
});

export default HomeScreen;
