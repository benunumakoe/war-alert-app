import { Platform } from 'react-native';

// API Configuration
export const API_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-server.com/api';

export const SOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://your-production-server.com';

// Map Configuration
export const MAP_CONFIG = {
  initialRegion: {
    latitude: 31.0461,
    longitude: 34.8516,
    latitudeDelta: 2,
    longitudeDelta: 2,
  },
  maxRadius: 100, // km
  minRadius: 5, // km
  defaultRadius: 50, // km
};

// Alert Configuration
export const ALERT_CONFIG = {
  refreshInterval: 60000, // 1 minute
  maxAlertsToStore: 100,
  alertExpiryHours: 24,
  proximityAlertDistance: 50, // km
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  channelId: 'war-alert-channel',
  channelName: 'War Alerts',
  channelDescription: 'Real-time war alert notifications',
  importance: 4,
  soundName: 'alert.wav',
  vibrationPattern: [300, 500, 300],
};

// App Configuration
export const APP_CONFIG = {
  version: '1.0.0',
  buildNumber: 1,
  minimumOS: Platform.OS === 'ios' ? '13.0' : '6.0',
  supportedLanguages: ['en', 'he', 'ar'],
  defaultLanguage: 'en',
};

// Feature Flags
export const FEATURES = {
  enablePushNotifications: true,
  enableLocationTracking: true,
  enableBackgroundUpdates: true,
  enableOfflineMode: true,
  enableUserReports: false, // Disabled until verification system is ready
};

// Emergency Numbers
export const EMERGENCY_NUMBERS = {
  police: '100',
  ambulance: '101',
  fire: '102',
  homeFrontCommand: '104',
};
