import { PermissionsAndroid, Platform, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location to show nearby alerts',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Location permission granted');
      return true;
    } else {
      console.log('Location permission denied');
      Alert.alert(
        'Location Permission',
        'Location permission is required to show nearby alerts. You can enable it in settings.'
      );
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 10) / 10;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

export const isUserInDangerZone = (userLat, userLng, alertLat, alertLng, radiusKm) => {
  const distance = calculateDistance(userLat, userLng, alertLat, alertLng);
  return distance <= radiusKm;
};

export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_API_KEY`
    );
    const data = await response.json();
    if (data.results && data.results[0]) {
      return data.results[0].formatted_address;
    }
    return `${lat}, ${lng}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return `${lat}, ${lng}`;
  }
};

export const watchUserPosition = (callback, errorCallback) => {
  return Geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      distanceFilter: 100,
      interval: 5000,
      fastestInterval: 2000
    }
  );
};

export const clearWatch = (watchId) => {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
  }
};
