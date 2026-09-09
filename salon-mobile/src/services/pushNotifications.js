import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api/client';

// Controls how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function sendCurrentExpoPushToken() {
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  try {
    await api.post('/auth/push-token', { token });
  } catch {
    // non-critical — token will be registered on next login
  }
}

// The push service can roll the underlying device token while the app is
// running (rare, but the old token becomes invalid when it happens) — Expo's
// documented fix is this listener, not polling/re-registering on foreground.
Notifications.addPushTokenListener(sendCurrentExpoPushToken);

export async function registerForPushNotifications() {
  if (!Device.isDevice) return;

  // Expo Go does not support remote push notifications from SDK 53+
  // This will work correctly in development builds and production builds
  if (Constants?.appOwnership === 'expo') return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e8481c',
    });
  }

  await sendCurrentExpoPushToken();
}
