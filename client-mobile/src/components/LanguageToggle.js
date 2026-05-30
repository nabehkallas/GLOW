import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing } from '../theme';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const switchTo = async (lang) => {
    if (i18n.language === lang) return;
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('lang', lang);
  };

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={[s.btn, !isAr && s.btnActive]}
        onPress={() => switchTo('en')}
        activeOpacity={0.8}
      >
        <Text style={[s.btnText, !isAr && s.btnTextActive]}>EN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.btn, isAr && s.btnActive]}
        onPress={() => switchTo('ar')}
        activeOpacity={0.8}
      >
        <Text style={[s.btnText, isAr && s.btnTextActive]}>ع</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  btnActive: {
    backgroundColor: colors.dark,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  btnTextActive: {
    color: '#fff',
  },
});
