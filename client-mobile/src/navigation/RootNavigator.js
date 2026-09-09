import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import useAuthStore from '../stores/authStore';
import useFavoriteStore from '../stores/favoriteStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import { colors } from '../theme';

const Root = createStackNavigator();

function MainOrAuth() {
  const { user } = useAuthStore();
  return user ? <MainTabs /> : <AuthStack />;
}

// Where a notification's data payload should take the user, expressed as a
// nested navigate() call into MainTabs (Main -> tab -> screen -> params).
// `navigator` is anything with a .navigate() method — a navigation prop or a navigationRef.current.
export function navigateForNotification(navigator, data) {
  if (!navigator?.navigate || !data?.type) return;
  switch (data.type) {
    case 'appointment_booked':
    case 'appointment_status_changed':
      // Seed the list screen first so the detail screen has somewhere to go back
      // to within its own tab, instead of leaving a 1-deep stack that falls back
      // to the tab navigator's own back-history (jumping to whatever tab was
      // previously active) when the user presses back.
      navigator.navigate('Main', { screen: 'Appointments', params: { screen: 'AppointmentList' } });
      navigator.navigate('Main', {
        screen: 'Appointments',
        params: { screen: 'AppointmentDetail', params: { appointmentId: data.appointment_id } },
      });
      break;
    case 'client_order_status_changed':
      navigator.navigate('Main', { screen: 'Store', params: { screen: 'StoreOrders' } });
      navigator.navigate('Main', {
        screen: 'Store',
        params: { screen: 'StoreOrderDetail', params: { orderId: data.order_id } },
      });
      break;
  }
}

export default function RootNavigator() {
  const { user, isLoading, init } = useAuthStore();
  const loadIds = useFavoriteStore((s) => s.loadIds);
  const navigationRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (user) loadIds(); }, [user]);

  // Navigate to the relevant screen when a push notification is tapped
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateForNotification(navigationRef.current, response.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Root.Navigator ref={navigationRef} screenOptions={{ headerShown: false }}>
      <Root.Screen name="Main" component={MainOrAuth} />
      <Root.Screen
        name="NotificationsModal"
        component={NotificationsScreen}
        options={{ presentation: 'transparentModal', cardOverlayEnabled: false }}
      />
    </Root.Navigator>
  );
}
