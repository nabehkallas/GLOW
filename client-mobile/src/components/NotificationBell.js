import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Bell } from 'lucide-react-native';
import useNotificationStore from '../stores/notificationStore';
import { colors } from '../theme';

export default function NotificationBell({ navigation }) {
  const count = useNotificationStore((s) => s.unreadCount);
  const fetchCount = useNotificationStore((s) => s.fetchCount);
  const increment = useNotificationStore((s) => s.increment);

  useEffect(() => {
    fetchCount();

    // Poll periodically so the badge updates without needing to background/
    // foreground the app or manually reopen the notifications screen — most
    // notification types (e.g. order status changes) have no push channel.
    const interval = setInterval(fetchCount, 15000);

    // Re-fetch when app comes back to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') fetchCount();
    });

    // Increment badge immediately when a push arrives while app is open
    const pushSub = Notifications.addNotificationReceivedListener(() => {
      increment();
    });

    return () => {
      clearInterval(interval);
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
      <Bell size={22} color="#fff" strokeWidth={1.75} />
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
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.primary, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
