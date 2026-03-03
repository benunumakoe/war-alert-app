/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {configureBackgroundTasks} from './src/services/notifications';

// Configure background tasks for Android
if (Platform.OS === 'android') {
  configureBackgroundTasks();
}

AppRegistry.registerComponent(appName, () => App);
