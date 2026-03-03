import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

export const setupNotifications = () => {
  PushNotification.configure({
    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function (token) {
      console.log('TOKEN:', token);
    },

    // (required) Called when a remote or local notification is opened or received
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);

      // process the notification
      if (notification.userInteraction) {
        // Notification was clicked by user
        console.log('Notification clicked');
      }

      // (required) Called when a remote is received or opened, or local notification is opened
      notification.finish(PushNotification.FetchResult.NoData);
    },

    // (optional) Called when Registered Action is pressed and invokeApp is false, only if open app is true
    onAction: function (notification) {
      console.log('ACTION:', notification.action);
      console.log('NOTIFICATION:', notification);
    },

    // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
    onRegistrationError: function (err) {
      console.error(err.message, err);
    },

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: true,

    /**
     * (optional) default: true
     * - Specified if permissions (ios) and token (android and ios) will be requested or not,
     * - if not, you must call PushNotificationsHandler.requestPermissions() later
     * - if you are not using remote notification or do not have Firebase installed, use this:
     *     requestPermissions: Platform.OS === 'ios'
     */
    requestPermissions: Platform.OS === 'ios',
  });

  // Create default channel for Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'default-channel-id',
        channelName: 'Default Channel',
        channelDescription: 'A default channel for notifications',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }
};

export const showNotification = (title, message, data = {}) => {
  PushNotification.localNotification({
    channelId: 'default-channel-id',
    title: title,
    message: message,
    data: data,
    soundName: 'default',
    playSound: true,
    vibrate: true,
    vibration: 300,
    priority: 'high',
    visibility: 'public',
    importance: 'high',
    showWhen: true,
    when: Date.now(),
    largeIcon: 'ic_launcher',
    smallIcon: 'ic_notification',
  });
};

export const scheduleNotification = (title, message, date, data = {}) => {
  PushNotification.localNotificationSchedule({
    channelId: 'default-channel-id',
    title: title,
    message: message,
    date: date,
    data: data,
    allowWhileIdle: true,
  });
};

export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
};

export const getScheduledNotifications = () => {
  PushNotification.getScheduledLocalNotifications((notifications) => {
    console.log('Scheduled notifications:', notifications);
  });
};

export const configureBackgroundTasks = () => {
  // Configure background tasks for Android
  if (Platform.OS === 'android') {
    // You can add background task configuration here
    // This would require additional libraries like react-native-background-fetch
  }
};
