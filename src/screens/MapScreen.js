import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  Platform
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../constants/colors';
import { requestLocationPermission } from '../utils/location';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ route, navigation }) => {
  const { alerts = [], selectedAlert } = route.params || {};
  const mapRef = useRef(null);
  
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAlertState, setSelectedAlertState] = useState(selectedAlert);
  const [mapType, setMapType] = useState('standard');
  const [showUserLocation, setShowUserLocation] = useState(true);

  useEffect(() => {
    getUserLocation();
    
    if (selectedAlert) {
      focusOnAlert(selectedAlert);
    }
  }, []);

  const getUserLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setUserLocation(location);
          
          if (!selectedAlert) {
            mapRef.current?.animateToRegion(location, 1000);
          }
        },
        (error) => {
          console.log('Location error:', error);
          Alert.alert(
            'Location Error',
            'Unable to get your location. Please enable location services.'
          );
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }
  };

  const focusOnAlert = (alert) => {
    if (alert.coordinates && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: alert.coordinates.latitude,
        longitude: alert.coordinates.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
      setSelectedAlertState(alert);
    }
  };

  const focusOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    } else {
      getUserLocation();
    }
  };

  const toggleMapType = () => {
    setMapType(prev => 
      prev === 'standard' ? 'hybrid' : 
      prev === 'hybrid' ? 'satellite' : 
      'standard'
    );
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.primary;
    }
  };

  const getMarkerIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'rocket':
        return require('../assets/rocket-marker.png');
      case 'drone':
        return require('../assets/drone-marker.png');
      case 'ground':
        return require('../assets/ground-marker.png');
      default:
        return require('../assets/alert-marker.png');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType={mapType}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        initialRegion={{
          latitude: 31.0461,
          longitude: 34.8516,
          latitudeDelta: 2,
          longitudeDelta: 2,
        }}
      >
        {/* Alert Circles */}
        {alerts.map((alert, index) => (
          <Circle
            key={`circle-${index}`}
            center={alert.coordinates}
            radius={alert.radius || 5000}
            strokeColor={getSeverityColor(alert.severity)}
            strokeWidth={2}
            fillColor={`${getSeverityColor(alert.severity)}20`}
          />
        ))}

        {/* Alert Markers */}
        {alerts.map((alert, index) => (
          <Marker
            key={`marker-${index}`}
            coordinate={alert.coordinates}
            title={alert.title}
            description={`${alert.description}\nSeverity: ${alert.severity}`}
            pinColor={getSeverityColor(alert.severity)}
            onPress={() => setSelectedAlertState(alert)}
          />
        ))}

        {/* User Location Marker - Custom */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="#2196F3"
            flat={true}
          />
        )}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
          <Icon name="layers" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={focusOnUser}>
          <Icon name="my-location" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => setShowUserLocation(!showUserLocation)}
        >
          <Icon 
            name={showUserLocation ? "person" : "person-outline"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Selected Alert Info */}
      {selectedAlertState && (
        <View style={styles.alertInfoCard}>
          <View style={styles.alertInfoHeader}>
            <Text style={styles.alertInfoTitle}>{selectedAlertState.title}</Text>
            <TouchableOpacity onPress={() => setSelectedAlertState(null)}>
              <Icon name="close" size={20} color={colors.gray} />
            </TouchableOpacity>
          </View>
          <Text style={styles.alertInfoDescription}>
            {selectedAlertState.description}
          </Text>
          <View style={styles.alertInfoFooter}>
            <Text style={styles.alertInfoLocation}>
              📍 {selectedAlertState.location}
            </Text>
            <View style={[styles.alertInfoSeverity, { 
              backgroundColor: getSeverityColor(selectedAlertState.severity) 
            }]}>
              <Text style={styles.alertInfoSeverityText}>
                {selectedAlertState.severity?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>High Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Medium Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
          <Text style={styles.legendText}>Low Risk</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  map: {
    width: width,
    height: height
  },
  controlsContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2
  },
  alertInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  alertInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  alertInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1
  },
  alertInfoDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
    lineHeight: 20
  },
  alertInfoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  alertInfoLocation: {
    fontSize: 13,
    color: colors.gray,
    flex: 1
  },
  alertInfoSeverity: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16
  },
  alertInfoSeverityText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600'
  },
  legendContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  legendText: {
    fontSize: 12,
    color: colors.text
  }
});

export default MapScreen;
