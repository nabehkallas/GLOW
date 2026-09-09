import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Share,
  Linking, ActivityIndicator, Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  MapPin, Star, Clock, ChevronLeft, Heart, Share2, Scissors,
  Phone, Navigation2, Award, BadgeCheck, CalendarCheck, Plus,
} from 'lucide-react-native';
import api from '../../api/client';
import useFavoriteStore from '../../stores/favoriteStore';
import StarRating from '../../components/StarRating';
import { MediaTile, MediaModal } from '../../components/MediaGrid';
import { colors, spacing, radius, shadow, fonts } from '../../theme';

const { width } = Dimensions.get('window');

// Trust badges, derived from real per-salon data rather than shown
// unconditionally — identical badges on every profile stop meaning anything,
// so each one only appears when actually true for this salon.
function featureBadges(salon) {
  const badges = [];
  if (salon.average_rating >= 4.5 && salon.reviews_count >= 3) {
    badges.push({ icon: Award, key: 'topRated' });
  }
  if (salon.has_license) {
    badges.push({ icon: BadgeCheck, key: 'licensed' });
  }
  if (salon.member_since_year) {
    badges.push({ icon: CalendarCheck, key: 'memberSince', params: { year: salon.member_since_year } });
  }
  return badges;
}

function isOpenNow(workingHours) {
  const today = workingHours?.find((h) => h.day_of_week === new Date().getDay());
  if (!today || today.is_closed || !today.open_time || !today.close_time) return { open: false, today };
  const now = new Date();
  const [oh, om] = today.open_time.split(':').map(Number);
  const [ch, cm] = today.close_time.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return { open: mins >= oh * 60 + om && mins <= ch * 60 + cm, today };
}

function openWhatsApp(phone) {
  if (!phone) return;
  const normalized = phone.startsWith('0') ? '+963' + phone.slice(1) : phone;
  const url = `whatsapp://send?phone=${normalized}`;
  Linking.canOpenURL(url).then((supported) =>
    Linking.openURL(supported ? url : `https://wa.me/${normalized}`)
  );
}

function openDirections(lat, lng) {
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
}

export default function SalonDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { salonId } = route.params;
  const toggle = useFavoriteStore((s) => s.toggle);
  const isFav = useFavoriteStore((s) => s.isFavorite(salonId));

  const [salon, setSalon] = useState(null);
  const [media, setMedia] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/client/salons/${salonId}`),
      api.get(`/client/salons/${salonId}/media`),
      api.get(`/client/salons/${salonId}/reviews`, { params: { page: 1 } }),
    ]).then(([sRes, mRes, rRes]) => {
      setSalon(sRes.data.data ?? sRes.data);
      setMedia(mRes.data.data ?? []);
      setReviews(rRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, [salonId]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (!salon) return null;

  const { open, today } = isOpenNow(salon.working_hours);
  const services = salon.services ?? [];
  const hasLocation = salon.latitude != null && salon.longitude != null;
  const badges = featureBadges(salon);

  const share = () => {
    Share.share({ message: `${salon.name} — Prima\n${salon.address ?? ''}, ${salon.city ?? ''}` }).catch(() => {});
  };

  const bookAll = () => navigation.navigate('AvailableSlots', { salonId, services });

  // AvailableSlotsScreen defaults its service selector to services[0], so
  // booking a specific service means putting that one first in the list —
  // no separate "preselected" param needed.
  const bookService = (svc) => navigation.navigate('AvailableSlots', {
    salonId,
    services: [svc, ...services.filter((s) => s.id !== svc.id)],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.heroWrap}>
          {salon.logo_url
            ? <Image source={{ uri: salon.logo_url }} style={s.hero} resizeMode="cover" />
            : <View style={[s.hero, s.heroPlaceholder]}><Scissors size={64} color={colors.textMuted} strokeWidth={1.5} /></View>
          }
          <SafeAreaView edges={['top']} style={s.heroNav}>
            <TouchableOpacity style={s.navBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SalonList')}>
              <ChevronLeft size={24} color={colors.dark} strokeWidth={2} />
            </TouchableOpacity>
            <View style={s.heroNavRight}>
              <TouchableOpacity style={s.navBtn} onPress={share}>
                <Share2 size={18} color={colors.dark} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn} onPress={() => toggle(salonId)}>
                <Heart size={18} color={colors.primary} fill={isFav ? colors.primary : 'transparent'} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Info card, overlapping the hero */}
        <View style={s.infoCard}>
          <Text style={s.name}>{salon.name}</Text>

          <View style={s.metaRow}>
            {salon.average_rating != null && (
              <View style={s.metaItem}>
                <Star size={14} color={colors.primary} fill={colors.primary} strokeWidth={1.75} />
                <Text style={s.metaText}>
                  {salon.average_rating} <Text style={s.metaMuted}>({salon.reviews_count} {t('salons.reviews')})</Text>
                </Text>
              </View>
            )}
          </View>
          <View style={s.metaRow}>
            <MapPin size={14} color={colors.textMuted} strokeWidth={1.75} />
            <Text style={[s.metaText, s.metaMuted]}>{salon.address}{salon.city ? `, ${salon.city}` : ''}</Text>
          </View>

          {today && (
            <View style={s.metaRow}>
              <View style={[s.openBadge, { backgroundColor: open ? colors.green + '22' : colors.red + '22' }]}>
                <Text style={[s.openBadgeText, { color: open ? colors.green : colors.red }]}>
                  {open ? t('salons.openNow') : t('salons.closedNow')}
                </Text>
              </View>
              {!today.is_closed && (
                <View style={s.hoursRow}>
                  <Clock size={13} color={colors.textMuted} strokeWidth={1.75} />
                  <Text style={s.hoursText}>{today.open_time} – {today.close_time}</Text>
                </View>
              )}
            </View>
          )}

          {/* Feature badges — only the ones actually true for this salon */}
          {badges.length > 0 && (
            <View style={s.badgeRow}>
              {badges.map(({ icon: Icon, key, params }) => (
                <View key={key} style={s.badgeItem}>
                  <View style={s.badgeIconWrap}>
                    <Icon size={20} color={colors.primaryDark} strokeWidth={1.5} />
                  </View>
                  <Text style={s.badgeLabel} numberOfLines={2}>{t(`salons.badges.${key}`, params)}</Text>
                </View>
              ))}
            </View>
          )}

          {salon.description ? <Text style={s.description}>{salon.description}</Text> : null}

          <TouchableOpacity style={s.bookBtn} onPress={bookAll} activeOpacity={0.85}>
            <Text style={s.bookBtnText}>{t('salons.bookNow')}</Text>
          </TouchableOpacity>
          {hasLocation && (
            <TouchableOpacity
              style={s.locationBtn}
              onPress={() => openDirections(salon.latitude, salon.longitude)}
              activeOpacity={0.85}
            >
              <MapPin size={16} color={colors.dark} strokeWidth={1.75} />
              <Text style={s.locationBtnText}>{t('salons.salonLocation')}</Text>
            </TouchableOpacity>
          )}

          {hasLocation && (
            <TouchableOpacity
              style={s.mapPreview}
              activeOpacity={0.9}
              onPress={() => openDirections(salon.latitude, salon.longitude)}
            >
              <MapView
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_DEFAULT}
                pointerEvents="none"
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                region={{
                  latitude: Number(salon.latitude),
                  longitude: Number(salon.longitude),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker coordinate={{ latitude: Number(salon.latitude), longitude: Number(salon.longitude) }} />
              </MapView>
              <View style={s.mapAddressBar}>
                <Text style={s.mapAddressText} numberOfLines={1}>{salon.address}{salon.city ? `, ${salon.city}` : ''}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Most requested services */}
        {services.length > 0 && (
          <Section title={t('salons.mostRequestedServices')} onViewAll={() => navigation.navigate('SalonServices', { salonId, services })}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScrollContent}>
              {services.slice(0, 8).map((svc) => (
                <TouchableOpacity key={svc.id} style={s.serviceCard} activeOpacity={0.85} onPress={() => bookService(svc)}>
                  {svc.image_url
                    ? <Image source={{ uri: svc.image_url }} style={s.serviceImg} resizeMode="cover" />
                    : <View style={[s.serviceImg, s.serviceImgPlaceholder]}><Scissors size={22} color={colors.textMuted} strokeWidth={1.5} /></View>
                  }
                  <TouchableOpacity style={s.serviceAddBtn} onPress={() => bookService(svc)} hitSlop={8}>
                    <Plus size={14} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text style={s.serviceName} numberOfLines={1}>{svc.name}</Text>
                  <Text style={s.servicePrice}>{t('salons.price', { amount: svc.price })}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Section>
        )}

        {/* Gallery */}
        <Section title={t('salons.media')} onViewAll={() => navigation.navigate('SalonGallery', { media })}>
          {media.length === 0 ? (
            <Text style={s.emptyText}>{t('common.noData')}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScrollContent}>
              {media.slice(0, 8).map((m) => (
                <MediaTile key={m.id} item={m} tileSize={100} onPress={() => setSelectedMedia(m)} />
              ))}
            </ScrollView>
          )}
        </Section>

        {/* Reviews */}
        <Section title={t('salons.customerReviews')} onViewAll={() => navigation.navigate('SalonReviews', { salonId })}>
          {reviews.length === 0 ? (
            <Text style={s.emptyText}>{t('salons.noReviews')}</Text>
          ) : (
            reviews.slice(0, 3).map((r) => <ReviewPreviewCard key={r.id} review={r} />)
          )}
        </Section>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Fullscreen media viewer */}
      {selectedMedia && (
        <MediaModal item={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}

      {/* Sticky footer */}
      <SafeAreaView edges={['bottom']} style={s.footer}>
        <TouchableOpacity style={s.footerBookBtn} onPress={bookAll} activeOpacity={0.85}>
          <Text style={s.footerBookBtnText}>{t('salons.bookNow')}</Text>
        </TouchableOpacity>
        <View style={s.footerRow}>
          {salon.phone && (
            <TouchableOpacity style={s.footerSecondaryBtn} onPress={() => Linking.openURL(`tel:${salon.phone}`)} activeOpacity={0.85}>
              <Phone size={16} color={colors.dark} strokeWidth={1.75} />
              <Text style={s.footerSecondaryBtnText}>{t('salons.call')}</Text>
            </TouchableOpacity>
          )}
          {salon.phone && (
            <TouchableOpacity style={s.footerSecondaryBtn} onPress={() => openWhatsApp(salon.phone)} activeOpacity={0.85}>
              <Text style={[s.footerSecondaryBtnText, { color: '#25D366' }]}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          {hasLocation && (
            <TouchableOpacity
              style={s.footerSecondaryBtn}
              onPress={() => openDirections(salon.latitude, salon.longitude)}
              activeOpacity={0.85}
            >
              <Navigation2 size={16} color={colors.dark} strokeWidth={1.75} />
              <Text style={s.footerSecondaryBtnText}>{t('salons.directions')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, onViewAll, children }) {
  const { t } = useTranslation();
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} style={s.viewAllBtn} hitSlop={6}>
            <Text style={s.viewAllText}>{t('salons.viewAll')}</Text>
            <ChevronLeft size={14} color={colors.primaryDark} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

function ReviewPreviewCard({ review }) {
  const { t } = useTranslation();
  const name = review.user?.name ?? t('salons.anonymous');
  return (
    <View style={s.reviewCard}>
      <View style={s.reviewHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.reviewName}>{name}</Text>
          <Text style={s.reviewDate}>{new Date(review.created_at).toLocaleDateString('ar-SY')}</Text>
        </View>
        <View style={s.reviewAvatar}>
          <Text style={s.reviewAvatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
      <View style={s.reviewStars}><StarRating rating={review.rating} size={13} /></View>
      {review.comment ? <Text style={s.reviewComment}>{review.comment}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  heroWrap: { position: 'relative' },
  hero: { width, height: 280 },
  heroPlaceholder: { backgroundColor: colors.secondary + '33', justifyContent: 'center', alignItems: 'center' },
  heroNav: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  heroNavRight: { flexDirection: 'row', gap: spacing.sm },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(251,246,244,0.9)', justifyContent: 'center', alignItems: 'center',
  },

  infoCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    marginTop: -24,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  name: { fontFamily: fonts.heading, fontSize: 24, color: colors.dark, textAlign: 'right', marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 },
  metaItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.dark },
  metaMuted: { fontFamily: fonts.body, color: colors.textMuted },
  openBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  openBadgeText: { fontFamily: fonts.bodySemibold, fontSize: 12 },
  hoursRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginStart: 8 },
  hoursText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, writingDirection: 'ltr' },

  badgeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.sm },
  badgeItem: { alignItems: 'center', width: 76 },
  badgeIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  badgeLabel: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textMuted, textAlign: 'center' },

  description: { fontFamily: fonts.body, fontSize: 14, color: colors.dark, textAlign: 'right', lineHeight: 24, marginTop: spacing.sm, marginBottom: spacing.md },

  bookBtn: {
    height: 52, borderRadius: radius.md, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm,
    shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  bookBtnText: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: 15 },
  locationBtn: {
    flexDirection: 'row', gap: 8, height: 50, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm,
  },
  locationBtnText: { fontFamily: fonts.bodySemibold, color: colors.dark, fontSize: 14 },

  mapPreview: {
    height: 130, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  mapAddressBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(251,246,244,0.92)', paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  mapAddressText: { fontFamily: fonts.body, fontSize: 11, color: colors.dark, textAlign: 'right' },

  section: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fonts.headingSemibold, fontSize: 17, color: colors.dark },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.primaryDark },

  hScrollContent: { gap: spacing.sm, paddingBottom: 4 },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.md },

  serviceCard: {
    width: 128, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.sm,
    ...shadow,
  },
  serviceImg: { width: '100%', height: 88, borderRadius: radius.sm, marginBottom: 6 },
  serviceImgPlaceholder: { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  serviceAddBtn: {
    position: 'absolute', top: 6, insetInlineEnd: 6,
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  serviceName: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.dark, textAlign: 'right' },
  servicePrice: { fontFamily: fonts.bodySemibold, fontSize: 12.5, color: colors.primaryDark, textAlign: 'right', marginTop: 2, writingDirection: 'ltr' },

  reviewCard: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, ...shadow,
  },
  reviewHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center',
  },
  reviewAvatarText: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: 14 },
  reviewName: { fontFamily: fonts.bodySemibold, fontSize: 13.5, color: colors.dark, textAlign: 'right' },
  reviewDate: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, textAlign: 'right', marginTop: 1, writingDirection: 'ltr' },
  reviewStars: { alignItems: 'flex-end', marginTop: 6, marginBottom: 4 },
  reviewComment: { fontFamily: fonts.body, fontSize: 13.5, color: colors.dark, textAlign: 'right', lineHeight: 21 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.card, gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: 1, borderColor: colors.border,
    shadowColor: colors.dark, shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  footerBookBtn: {
    height: 50, borderRadius: radius.md, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  footerBookBtnText: { fontFamily: fonts.bodySemibold, color: '#fff', fontSize: 15 },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerSecondaryBtn: {
    flex: 1, flexDirection: 'row', gap: 6, height: 44, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  footerSecondaryBtnText: { fontFamily: fonts.bodyMedium, color: colors.dark, fontSize: 13 },
});
