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

export default function RootNavigator() {
  const { user, isLoading, init } = useAuthStore();
  const loadIds = useFavoriteStore((s) => s.loadIds);
  const navigationRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (user) loadIds(); }, [user]);

  // Navigate to Appointments when user taps a status-change notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const type = response.notification.request.content.data?.type;
      if (type === 'appointment_status_changed' || type === 'appointment_booked') {
        navigationRef.current?.navigate('Appointments');
      }
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
