import React from 'react';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Explore screens
import SalonListScreen from '../screens/explore/SalonListScreen';
import SalonDetailScreen from '../screens/explore/SalonDetailScreen';
import SalonReviewsScreen from '../screens/explore/SalonReviewsScreen';
import AvailableSlotsScreen from '../screens/explore/AvailableSlotsScreen';
import BookingConfirmScreen from '../screens/explore/BookingConfirmScreen';

// Appointments screens
import AppointmentListScreen from '../screens/appointments/AppointmentListScreen';
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';
import WriteReviewScreen from '../screens/appointments/WriteReviewScreen';

// Favorites screens
import FavoritesScreen from '../screens/favorites/FavoritesScreen';

// Profile screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MyReviewsScreen from '../screens/profile/MyReviewsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: colors.dark },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
  headerBackButtonDisplayMode: 'minimal',
};

function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="SalonList" component={SalonListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="SalonReviews" component={SalonReviewsScreen} />
      <Stack.Screen name="AvailableSlots" component={AvailableSlotsScreen} />
      <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="FavoritesList" component={FavoritesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="SalonReviews" component={SalonReviewsScreen} />
      <Stack.Screen name="AvailableSlots" component={AvailableSlotsScreen} />
      <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Explore:      { active: '🔍', inactive: '🔎' },
  Appointments: { active: '📅', inactive: '📆' },
  Favorites:    { active: '❤️', inactive: '🤍' },
  Profile:      { active: '👤', inactive: '👥' },
};

function TabIcon({ name, focused }) {
  const icons = TAB_ICONS[name];
  return (
    <Text style={{ fontSize: 22 }}>{focused ? icons.active : icons.inactive}</Text>
  );
}

export default function MainTabs() {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark,
          borderTopWidth: 0,
          height: 65 + bottom,
          paddingBottom: 8 + bottom,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreStack}
        options={{ tabBarLabel: t('tabs.explore'), tabBarIcon: ({ focused }) => <TabIcon name="Explore" focused={focused} /> }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsStack}
        options={{ tabBarLabel: t('tabs.appointments'), tabBarIcon: ({ focused }) => <TabIcon name="Appointments" focused={focused} /> }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesStack}
        options={{ tabBarLabel: t('tabs.favorites'), tabBarIcon: ({ focused }) => <TabIcon name="Favorites" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: t('tabs.profile'), tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
