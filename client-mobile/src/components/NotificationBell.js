import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import useNotificationStore from '../stores/notificationStore';
import { colors } from '../theme';

export default function NotificationBell({ navigation }) {
  const count = useNotificationStore((s) => s.unreadCount);
  const fetchCount = useNotificationStore((s) => s.fetchCount);
  const increment = useNotificationStore((s) => s.increment);

  useEffect(() => {
    fetchCount();

    // Re-fetch when app comes back to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchCount();
    });

    // Increment badge immediately when a push arrives while app is open
    const pushSub = Notifications.addNotificationReceivedListener(() => {
      increment();
    });

    return () => {
      appStateSub.remove();
      pushSub.remove();
    };
  }, []);

  return (
    <TouchableOpacity
      style={s.wrap}
      onPress={() => navigation.navigate('NotificationsModal')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={s.icon}>🔔</Text>
      {count > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 4 },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.primary, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
