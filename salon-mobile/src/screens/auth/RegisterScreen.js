import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import useAuthStore from '../../stores/authStore';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import { colors, radius, spacing } from '../../theme';

const PHONE_REGEX = /^(\+963|0)9[1-9]\d{7}$/;

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const registerSalon = useAuthStore((s) => s.registerSalon);

  const [name, setName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const trackLocation = async () => {
    setTracking(true);
    setLocationError('');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setLocationError(t('profile.locationError'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
    } catch {
      setLocationError(t('profile.locationError'));
    } finally {
      setTracking(false);
    }
  };

  const validate = () => {
    if (!name.trim() || !salonName.trim() || !email.trim() || !password || !address.trim() || !city.trim()) {
      return t('auth.error');
    }
    if (password.length < 8) return t('auth.error');
    if (!PHONE_REGEX.test(phone.trim())) return t('auth.phoneError');
    if (latitude == null || longitude == null) return t('auth.locationRequired');
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await registerSalon({
        name: name.trim(),
        salon_name: salonName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude,
        longitude,
      });
    } catch (e) {
      setError(e.response?.data?.message ?? t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <DismissKeyboardView>
      <SafeAreaView edges={['top', 'bottom']} style={s.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Text style={s.title}>{t('auth.registerSalon')}</Text>
        <Text style={s.subtitle}>{t('auth.salonPortal')}</Text>

        <Field label={t('auth.fullName')}>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label={t('auth.salonName')}>
          <TextInput style={s.input} value={salonName} onChangeText={setSalonName} placeholderTextColor={colors.textMuted} />
        </Field>
        <Field label={t('auth.address')}>
          <TextInput style={s.input} value={address} onChangeText={setAddress} placeholderTextColor={colors.textMuted} />
        </Field>
        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <Field label={t('auth.city')}>
              <TextInput style={s.input} value={city} onChangeText={setCity} placeholderTextColor={colors.textMuted} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t('auth.phone')} hint={t('auth.syrianNumber')}>
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="0991234567"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </Field>
          </View>
        </View>

        <Field label={t('profile.location')}>
          <TouchableOpacity onPress={trackLocation} disabled={tracking} style={s.locationBtn} activeOpacity={0.8}>
            <MapPin size={14} color={colors.dark} />
            <Text style={s.locationBtnText}>{tracking ? t('profile.tracking') : t('profile.trackLocation')}</Text>
          </TouchableOpacity>
          <Text style={s.locationValue}>
            {latitude != null && longitude != null ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : t('profile.locationNotSet')}
          </Text>
          {locationError ? <Text style={s.error}>{locationError}</Text> : null}
        </Field>

        <Field label={t('auth.email')}>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={colors.textMuted}
          />
        </Field>
        <Field label={t('auth.password')}>
          <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.textMuted} />
        </Field>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={submit} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>{t('auth.registerAwaitApproval')}</Text>}
        </TouchableOpacity>

        <Text style={s.pendingNote}>{t('auth.pendingNote')}</Text>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.footerLink} activeOpacity={0.7}>
          <Text style={s.footerLinkText}>
            {t('auth.haveAccount')} <Text style={s.footerLinkAccent}>{t('auth.signInLink')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
      </DismissKeyboardView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, hint, children }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={s.label}>
        {label}
        {hint && <Text style={s.hint}> ({hint})</Text>}
      </Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontWeight: '800', color: colors.dark, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  hint: { fontSize: 11, fontWeight: '400', color: colors.textMuted },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.dark,
  },
  row2: { flexDirection: 'row', gap: spacing.sm },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  locationBtnText: { fontSize: 13, fontWeight: '600', color: colors.dark },
  locationValue: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  error: { color: '#dc2626', fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.sm },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pendingNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  footerLink: { alignItems: 'center', marginTop: spacing.lg },
  footerLinkText: { fontSize: 13, color: colors.textMuted },
  footerLinkAccent: { color: colors.primary, fontWeight: '700' },
});
