import 'react-native-gesture-handler';
import './src/i18n';
import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';

if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export default function App() {
  useEffect(() => {
    AsyncStorage.getItem('lang').then((saved) => {
      if (saved && saved !== i18n.language) {
        i18n.changeLanguage(saved);
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
