import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { requestLocationPermission } from '../utils/location';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    vibration: true,
    locationTracking: true,
    autoRefresh: true,
    showNearbyOnly: false,
    darkMode: false,
    language: 'en'
  });

  const [notificationRadius, setNotificationRadius] = useState(50);
  const [refreshInterval, setRefreshInterval] = useState(1);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);

    // Handle special cases
    if (key === 'locationTracking' && value) {
      requestLocationPermission();
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Clear cache logic here
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const renderSettingItem = (icon, title, description, value, onValueChange, type = 'switch') => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.lightGray, true: colors.primary }}
          thumbColor={Platform.OS === 'android' ? colors.primary : colors.white}
        />
      ) : (
        <TouchableOpacity onPress={onValueChange}>
          <Text style={styles.settingValue}>{value}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {renderSettingItem(
          'notifications',
          'Push Notifications',
          'Receive alerts as push notifications',
          settings.notifications,
          (value) => updateSetting('notifications', value)
        )}
        {renderSettingItem(
          'volume-up',
          'Sound',
          'Play sound for notifications',
          settings.sound,
          (value) => updateSetting('sound', value),
          settings.notifications ? 'switch' : 'disabled'
        )}
        {renderSettingItem(
          'vibration',
          'Vibration',
          'Vibrate on notifications',
          settings.vibration,
          (value) => updateSetting('vibration', value),
          settings.notifications ? 'switch' : 'disabled'
        )}
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        {renderSettingItem(
          'location-on',
          'Location Tracking',
          'Use your location for nearby alerts',
          settings.locationTracking,
          (value) => updateSetting('locationTracking', value)
        )}
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="radio-button-checked" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notification Radius</Text>
            <Text style={styles.settingDescription}>
              Get alerts within {notificationRadius}km
            </Text>
          </View>
          <View style={styles.radiusButtons}>
            {[25, 50, 100].map(radius => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusButton,
                  notificationRadius === radius && styles.radiusButtonActive
                ]}
                onPress={() => setNotificationRadius(radius)}
              >
                <Text style={[
                  styles.radiusButtonText,
                  notificationRadius === radius && styles.radiusButtonTextActive
                ]}>
                  {radius}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Display Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        {renderSettingItem(
          'wb-sunny',
          'Dark Mode',
          'Switch to dark theme',
          settings.darkMode,
          (value) => updateSetting('darkMode', value)
        )}
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            // Language selection
            Alert.alert('Select Language', '', [
              { text: 'English', onPress: () => updateSetting('language', 'en') },
              { text: 'עברית', onPress: () => updateSetting('language', 'he') },
              { text: 'العربية', onPress: () => updateSetting('language', 'ar') },
              { text: 'Cancel', style: 'cancel' }
            ]);
          }}
        >
          <View style={styles.settingIcon}>
            <Icon name="language" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Language</Text>
            <Text style={styles.settingDescription}>
              {settings.language === 'en' ? 'English' :
               settings.language === 'he' ? 'עברית' :
               settings.language === 'ar' ? 'العربية' : 'English'}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.gray} />
        </TouchableOpacity>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        {renderSettingItem(
          'refresh',
          'Auto Refresh',
          `Refresh every ${refreshInterval} minute${refreshInterval > 1 ? 's' : ''}`,
          settings.autoRefresh,
          (value) => updateSetting('autoRefresh', value)
        )}
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="delete" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Clear Cache</Text>
            <Text style={styles.settingDescription}>Remove temporary files</Text>
          </View>
          <TouchableOpacity onPress={clearCache}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="info" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Version</Text>
            <Text style={styles.settingDescription}>1.0.0</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="privacy-tip" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Privacy Policy</Text>
            <Text style={styles.settingDescription}>Read our privacy policy</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.gray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Icon name="description" size={24} color={colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Terms of Service</Text>
            <Text style={styles.settingDescription}>Read our terms</Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.gray} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 20,
    paddingHorizontal: 15
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 5
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  settingIcon: {
    width: 40,
    alignItems: 'center'
  },
  settingContent: {
    flex: 1,
    marginLeft: 10
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500'
  },
  settingDescription: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2
  },
  radiusButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: colors.background,
    marginLeft: 5
  },
  radiusButtonActive: {
    backgroundColor: colors.primary
  },
  radiusButtonText: {
    fontSize: 12,
    color: colors.text
  },
  radiusButtonTextActive: {
    color: colors.white
  },
  clearButton: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500'
  }
});

export default SettingsScreen;
