import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MapPin, Pencil, ShoppingBag } from 'lucide-react-native';
import api from '../../api/client';
import AvatarViewer from '../../components/AvatarViewer';
import Card from '../../components/Card';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import useAuthStore from '../../stores/authStore';
import { colors, radius, spacing } from '../../theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { salon, setUser, updateSalon } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [productsOrdered, setProductsOrdered] = useState(null);

  const [salonName, setSalonName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    api.get('/salon/profile').then(({ data }) => {
      const u = data.data ?? data;
      setSalonName(u.salon?.name ?? '');
      setDescription(u.salon?.description ?? '');
      setAddress(u.salon?.address ?? '');
      setCity(u.salon?.city ?? '');
      setPhone(u.phone ?? '');
      setCapacity(String(u.salon?.capacity ?? 1));
      setLatitude(u.salon?.latitude ?? null);
      setLongitude(u.salon?.longitude ?? null);
      setLoading(false);
    });
    api.get('/salon/products-ordered').then(({ data }) => setProductsOrdered(data.products ?? []));
  }, []);

  const changeLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingLogo(true);
    const form = new FormData();
    form.append('image', {
      uri: asset.uri,
      name: asset.fileName ?? 'logo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    });

    try {
      const res = await api.post('/salon/profile/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateSalon({ logo_url: res.data.logo_url ?? null });
    } catch {
      // non-critical, user can retry
    } finally {
      setUploadingLogo(false);
    }
  };

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

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/salon/profile', {
        salon_name: salonName,
        description: description || null,
        address,
        city,
        phone: phone || null,
        capacity: Number(capacity) || 1,
        latitude,
        longitude,
      });
      setUser(res.data.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message ?? t('common.somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initial = salonName?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <>
    <DismissKeyboardView>
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <View style={s.logoRow}>
        <TouchableOpacity onPress={() => setAvatarOpen(true)} activeOpacity={0.8} style={s.logoWrap}>
          {salon?.logo_url ? (
            <Image source={{ uri: salon.logo_url }} style={s.logo} />
          ) : (
            <View style={[s.logo, s.logoFallback]}>
              <Text style={s.logoInitial}>{initial}</Text>
            </View>
          )}
          <View style={s.logoEditBadge}>
            {uploadingLogo ? <ActivityIndicator size="small" color="#fff" /> : <Pencil size={12} color="#fff" />}
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.logoLabel}>{t('profile.salonLogo')}</Text>
          <Text style={s.logoHint}>{t('profile.logoHint')}</Text>
        </View>
      </View>

      <Card style={{ marginTop: spacing.md }}>
        <Field label={t('profile.salonName')}>
          <TextInput value={salonName} onChangeText={setSalonName} style={s.input} />
        </Field>
        <Field label={t('common.description')}>
          <TextInput value={description} onChangeText={setDescription} style={[s.input, { height: 70 }]} multiline textAlignVertical="top" />
        </Field>
        <Field label={t('profile.address')}>
          <TextInput value={address} onChangeText={setAddress} style={s.input} />
        </Field>
        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <Field label={t('profile.city')}>
              <TextInput value={city} onChangeText={setCity} style={s.input} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t('profile.phone')}>
              <TextInput value={phone} onChangeText={setPhone} style={s.input} keyboardType="phone-pad" />
            </Field>
          </View>
        </View>

        <Field label={t('profile.location')}>
          <TouchableOpacity onPress={trackLocation} disabled={tracking} style={s.locationBtn} activeOpacity={0.8}>
            <MapPin size={14} color={colors.dark} />
            <Text style={s.locationBtnText}>{tracking ? t('profile.tracking') : t('profile.trackLocation')}</Text>
          </TouchableOpacity>
          <Text style={s.locationValue}>
            {latitude && longitude ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : t('profile.locationNotSet')}
          </Text>
          {locationError ? <Text style={s.error}>{locationError}</Text> : null}
        </Field>

        <Field label={t('profile.capacity')}>
          <TextInput value={capacity} onChangeText={setCapacity} keyboardType="number-pad" style={s.input} />
          <Text style={s.hint}>{t('profile.capacityHint')}</Text>
        </Field>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.saveBtn} onPress={submit} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>{t('profile.saveChanges')}</Text>}
        </TouchableOpacity>
      </Card>

      <Card style={{ marginTop: spacing.md, marginBottom: spacing.xl, padding: 0 }}>
        <View style={s.sectionHeader}>
          <ShoppingBag size={14} color={colors.textMuted} />
          <Text style={s.sectionTitle}>{t('profile.productsOrdered')}</Text>
        </View>
        {!productsOrdered ? (
          <ActivityIndicator color={colors.primary} style={{ padding: spacing.md }} />
        ) : productsOrdered.length === 0 ? (
          <Text style={s.empty}>{t('profile.noProductsOrdered')}</Text>
        ) : (
          productsOrdered.map((p) => (
            <View key={p.product_id} style={s.productRow}>
              {p.image_url ? (
                <Image source={{ uri: p.image_url }} style={s.productThumb} />
              ) : (
                <View style={[s.productThumb, s.productThumbFallback]}>
                  <ShoppingBag size={14} color={colors.border} />
                </View>
              )}
              <Text style={s.productName} numberOfLines={1}>{p.name}</Text>
              <Text style={s.productQty}>×{p.quantity}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
    </DismissKeyboardView>
    <AvatarViewer
      visible={avatarOpen}
      imageUrl={salon?.logo_url}
      initial={initial}
      uploading={uploadingLogo}
      onClose={() => setAvatarOpen(false)}
      onUpload={changeLogo}
    />
    </>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoWrap: { width: 64, height: 64 },
  logo: { width: 64, height: 64, borderRadius: radius.md },
  logoFallback: { backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { color: '#fff', fontSize: 24, fontWeight: '900' },
  logoEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  logoLabel: { fontSize: 14, fontWeight: '700', color: colors.dark },
  logoHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 12, fontWeight: '600', color: colors.dark, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.dark,
    backgroundColor: '#fff',
  },
  row2: { flexDirection: 'row', gap: spacing.sm },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  locationBtnText: { fontSize: 13, fontWeight: '600', color: colors.dark },
  locationValue: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  error: { color: '#dc2626', fontSize: 12, marginTop: spacing.xs },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.dark },
  empty: { fontSize: 13, color: colors.textMuted, padding: spacing.md },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  productThumb: { width: 36, height: 36, borderRadius: radius.sm },
  productThumbFallback: { backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  productName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.dark },
  productQty: { fontSize: 13, fontWeight: '700', color: colors.dark },
});
