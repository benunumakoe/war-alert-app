import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
  AppState,
  Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import NetInfo from '@react-native-community/netinfo';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Services
import { initSocket, disconnectSocket } from './src/services/socket';
import { setupNotifications, showNotification } from './src/services/notifications';
import { colors } from './src/constants/colors';

const Stack = createStackNavigator();

const App = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Check internet connection
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (!state.isConnected) {
        Alert.alert('No Internet Connection', 'You are offline. Some features may not work.');
      }
    });

    // Setup push notifications
    setupNotifications();

    // Initialize socket connection for real-time alerts
    const socket = initSocket();

    socket.on('connect', () => {
      console.log('Connected to alert server');
    });

    socket.on('new-alert', (alert) => {
      // Add new alert to state
      setAlerts(prevAlerts => [alert, ...prevAlerts]);
      
      // Show push notification
      showNotification(
        alert.title,
        alert.description,
        { alertId: alert.id }
      );
    });

    socket.on('recent-alerts', (recentAlerts) => {
      setAlerts(recentAlerts);
    });

    // Handle app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // App came to foreground
        console.log('App in foreground');
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
      disconnectSocket();
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <SafeAreaView style={styles.container}>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.white,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            options={{ title: 'War Alert Tracker' }}
          >
            {props => <HomeScreen {...props} alerts={alerts} isConnected={isConnected} />}
          </Stack.Screen>
          <Stack.Screen 
            name="Map" 
            component={MapScreen}
            options={{ title: 'Alert Map' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
