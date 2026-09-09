import React from 'react';
import { useTranslation } from 'react-i18next';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CalendarDays, ShoppingCart, Briefcase, Menu } from 'lucide-react-native';
import { colors } from '../theme';

import DashboardScreen from '../screens/home/DashboardScreen';
import AppointmentListScreen from '../screens/schedule/AppointmentListScreen';
import AppointmentDetailScreen from '../screens/schedule/AppointmentDetailScreen';
import WorkingHoursScreen from '../screens/schedule/WorkingHoursScreen';
import WalkInFormScreen from '../screens/schedule/WalkInFormScreen';
import BlockFormScreen from '../screens/schedule/BlockFormScreen';
import OrdersHomeScreen from '../screens/orders/OrdersHomeScreen';
import ProductDetailScreen from '../screens/orders/ProductDetailScreen';
import CartScreen from '../screens/orders/CartScreen';
import BusinessHomeScreen from '../screens/business/BusinessHomeScreen';
import AnalyticsScreen from '../screens/business/AnalyticsScreen';
import ReviewsScreen from '../screens/business/ReviewsScreen';
import BalanceScreen from '../screens/business/BalanceScreen';
import BalanceTransactionFormScreen from '../screens/business/BalanceTransactionFormScreen';
import MoreHomeScreen from '../screens/more/MoreHomeScreen';
import ServicesListScreen from '../screens/services/ServicesListScreen';
import ServiceFormScreen from '../screens/services/ServiceFormScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ClientsListScreen from '../screens/clients/ClientsListScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';
import MediaScreen from '../screens/media/MediaScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: colors.dark },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
  headerBackButtonDisplayMode: 'minimal',
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ScheduleStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="AppointmentList" component={AppointmentListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: t('appointments.title') }} />
      <Stack.Screen name="WorkingHours" component={WorkingHoursScreen} options={{ title: t('workingHours.title') }} />
      <Stack.Screen
        name="WalkInForm"
        component={WalkInFormScreen}
        options={{ title: t('appointments.addWalkInTitle'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="BlockForm"
        component={BlockFormScreen}
        options={{ title: t('workingHours.blockTitle'), presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="OrdersHome" component={OrdersHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: t('orders.cart'), presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function BusinessStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="BusinessHome" component={BusinessHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: t('nav.analytics') }} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: t('nav.reviews') }} />
      <Stack.Screen name="Balance" component={BalanceScreen} options={{ title: t('nav.balance') }} />
      <Stack.Screen
        name="BalanceTransactionForm"
        component={BalanceTransactionFormScreen}
        options={{ title: t('balance.table.type'), presentation: 'modal' }}
      />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={({ route }) => ({ title: route.params?.title ?? '' })} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="MoreHome" component={MoreHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Services" component={ServicesListScreen} options={{ title: t('services.title') }} />
      <Stack.Screen
        name="ServiceForm"
        component={ServiceFormScreen}
        options={({ route }) => ({ title: route.params?.service ? t('services.editService') : t('services.newService'), presentation: 'modal' })}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('nav.profile') }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('nav.settings') }} />
      <Stack.Screen name="Clients" component={ClientsListScreen} options={{ title: t('nav.clients') }} />
      <Stack.Screen
        name="ClientDetail"
        component={ClientDetailScreen}
        options={({ route }) => ({ title: route.params?.client?.name ?? '' })}
      />
      <Stack.Screen name="Media" component={MediaScreen} options={{ title: t('media.title') }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: t('nav.history') }} />
      <Stack.Screen name="ComingSoon" component={ComingSoonScreen} options={({ route }) => ({ title: route.params?.title ?? '' })} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Home: Home,
  Schedule: CalendarDays,
  Orders: ShoppingCart,
  Business: Briefcase,
  More: Menu,
};

function TabIcon({ name, focused }) {
  const Icon = TAB_ICONS[name];
  const color = focused ? colors.primary : 'rgba(255,255,255,0.6)';
  return <Icon size={22} color={color} strokeWidth={1.75} />;
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
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: t('tabs.home'), tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleStack}
        options={{ tabBarLabel: t('tabs.schedule'), tabBarIcon: ({ focused }) => <TabIcon name="Schedule" focused={focused} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{ tabBarLabel: t('tabs.orders'), tabBarIcon: ({ focused }) => <TabIcon name="Orders" focused={focused} /> }}
      />
      <Tab.Screen
        name="Business"
        component={BusinessStack}
        options={{ tabBarLabel: t('tabs.business'), tabBarIcon: ({ focused }) => <TabIcon name="Business" focused={focused} /> }}
      />
      <Tab.Screen
        name="More"
        component={MoreStack}
        options={{ tabBarLabel: t('tabs.more'), tabBarIcon: ({ focused }) => <TabIcon name="More" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
