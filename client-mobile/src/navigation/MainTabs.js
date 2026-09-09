import React from 'react';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, CalendarDays, Heart, ShoppingBag, User } from 'lucide-react-native';
import { colors } from '../theme';

// Explore screens
import SalonListScreen from '../screens/explore/SalonListScreen';
import SalonDetailScreen from '../screens/explore/SalonDetailScreen';
import SalonReviewsScreen from '../screens/explore/SalonReviewsScreen';
import SalonServicesScreen from '../screens/explore/SalonServicesScreen';
import SalonGalleryScreen from '../screens/explore/SalonGalleryScreen';
import AvailableSlotsScreen from '../screens/explore/AvailableSlotsScreen';
import BookingConfirmScreen from '../screens/explore/BookingConfirmScreen';

// Appointments screens
import AppointmentListScreen from '../screens/appointments/AppointmentListScreen';
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';
import WriteReviewScreen from '../screens/appointments/WriteReviewScreen';

// Favorites screens
import FavoritesScreen from '../screens/favorites/FavoritesScreen';

// Store screens
import StoreListScreen from '../screens/store/StoreListScreen';
import CartScreen from '../screens/store/CartScreen';
import StoreOrdersListScreen from '../screens/store/StoreOrdersListScreen';
import StoreOrderDetailScreen from '../screens/store/StoreOrderDetailScreen';

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
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="SalonList" component={SalonListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalonReviews" component={SalonReviewsScreen} options={{ title: t('salons.customerReviews') }} />
      <Stack.Screen name="SalonServices" component={SalonServicesScreen} options={{ title: t('salons.mostRequestedServices') }} />
      <Stack.Screen name="SalonGallery" component={SalonGalleryScreen} options={{ title: t('salons.media') }} />
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

function StoreStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="StoreList" component={StoreListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: t('store.cart') }} />
      <Stack.Screen name="StoreOrders" component={StoreOrdersListScreen} options={{ title: t('store.myOrders') }} />
      <Stack.Screen name="StoreOrderDetail" component={StoreOrderDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="FavoritesList" component={FavoritesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SalonReviews" component={SalonReviewsScreen} options={{ title: t('salons.customerReviews') }} />
      <Stack.Screen name="SalonServices" component={SalonServicesScreen} options={{ title: t('salons.mostRequestedServices') }} />
      <Stack.Screen name="SalonGallery" component={SalonGalleryScreen} options={{ title: t('salons.media') }} />
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
  Explore:      Search,
  Appointments: CalendarDays,
  Favorites:    Heart,
  Store:        ShoppingBag,
  Profile:      User,
};

function TabIcon({ name, focused }) {
  const Icon = TAB_ICONS[name];
  const color = focused ? colors.primary : 'rgba(255,255,255,0.6)';
  return (
    <Icon
      size={22}
      color={color}
      fill={name === 'Favorites' && focused ? color : 'transparent'}
      strokeWidth={1.75}
    />
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
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
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
        name="Store"
        component={StoreStack}
        options={{ tabBarLabel: t('tabs.store'), tabBarIcon: ({ focused }) => <TabIcon name="Store" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: t('tabs.profile'), tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
