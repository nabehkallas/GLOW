import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import useAuthStore from '../stores/authStore';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';
import { colors } from '../theme';

const Root = createStackNavigator();

function MainOrAuth() {
  const { user, salon } = useAuthStore();
  if (!user) return <AuthStack />;
  if (salon?.status === 'pending' || salon?.status === 'rejected') return <PendingApprovalScreen />;
  return <MainTabs />;
}

// Where a notification's data payload should take the user. Salon-facing push
// coverage on the backend is minimal today (only appointment/order status
// changes are candidates, and none are wired to Expo yet for the salon role —
// see Item #9's notes) so this only needs a safe, generic landing spot for now;
// it can grow real per-type routes once the backend actually sends salon push.
export function navigateForNotification(navigator, data) {
  if (!navigator?.navigate || !data?.type) return;
  navigator.navigate('Main', { screen: 'Schedule', params: { screen: 'AppointmentList' } });
}

export default function RootNavigator() {
  const { user, isLoading, init } = useAuthStore();
  const navigationRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

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
    </Root.Navigator>
  );
}
