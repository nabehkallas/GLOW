import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, StyleSheet,
  Linking, ActivityIndicator, Dimensions, Modal, StatusBar, PanResponder,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/client';
import useFavoriteStore from '../../stores/favoriteStore';
import { colors, spacing, radius } from '../../theme';

const { width } = Dimensions.get('window');
const TABS = ['about', 'services', 'hours', 'media'];

function openWhatsApp(phone) {
  if (!phone) return;
  const normalized = phone.startsWith('0') ? '+963' + phone.slice(1) : phone;
  const url = `whatsapp://send?phone=${normalized}`;
  Linking.canOpenURL(url).then((supported) =>
    Linking.openURL(supported ? url : `https://wa.me/${normalized}`)
  );
}

export default function SalonDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { salonId } = route.params;
  const toggle = useFavoriteStore((s) => s.toggle);
  const isFav = useFavoriteStore((s) => s.isFavorite(salonId));

  const [salon, setSalon] = useState(null);
  const [media, setMedia] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/client/salons/${salonId}`),
      api.get(`/client/salons/${salonId}/media`),
    ]).then(([sRes, mRes]) => {
      setSalon(sRes.data.data ?? sRes.data);
      setMedia(mRes.data.data ?? []);
    }).finally(() => setLoading(false));
  }, [salonId]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }
  if (!salon) return null;

  const tabLabels = {
    about: t('salons.about'),
    services: t('salons.services'),
    hours: t('salons.hours'),
    media: t('salons.media'),
  };

  const renderTab = () => {
    if (activeTab === 'about') return (
      <View style={s.tabContent}>
        {salon.description ? (
          <Text style={s.description}>{salon.description}</Text>
        ) : null}
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>📍</Text>
          <Text style={s.infoValue}>{salon.address}, {salon.city}</Text>
        </View>
        {salon.average_rating && (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>⭐</Text>
            <Text style={s.infoValue}>{salon.average_rating} · {salon.reviews_count} {t('salons.reviews')}</Text>
          </View>
        )}
        <TouchableOpacity
          style={s.reviewsLink}
          onPress={() => navigation.navigate('SalonReviews', { salonId })}
        >
          <Text style={s.reviewsLinkText}>عرض جميع التقييمات ›</Text>
        </TouchableOpacity>
      </View>
    );

    if (activeTab === 'services') return (
      <View style={s.tabContent}>
        {(salon.services ?? []).map((svc) => (
          <View key={svc.id} style={s.serviceCard}>
            <View style={s.serviceMeta}>
              <View style={s.pricePill}>
                <Text style={s.priceText}>{svc.price} ل.س</Text>
              </View>
              <Text style={s.duration}>⏱ {svc.duration_minutes} د</Text>
            </View>
            <Text style={s.svcName}>{svc.name}</Text>
          </View>
        ))}
      </View>
    );

    if (activeTab === 'hours') return (
      <View style={s.tabContent}>
        {(salon.working_hours ?? []).map((h) => (
          <View key={h.day_of_week} style={s.hourRow}>
            <Text style={[s.hourStatus, { color: h.is_closed ? '#ef5350' : colors.green }]}>
              {h.is_closed ? t('salons.closed') : `${h.open_time} – ${h.close_time}`}
            </Text>
            <Text style={s.hourDay}>{h.day_name}</Text>
          </View>
        ))}
      </View>
    );

    if (activeTab === 'media') return (
      <View style={[s.tabContent, s.mediaGrid]}>
        {media.length === 0
          ? <Text style={s.emptyText}>{t('common.noData')}</Text>
          : media.map((m) => (
              <MediaTile key={m.id} item={m} tileSize={(width - 40) / 3} onPress={() => setSelectedMedia(m)} />
            ))
        }
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView bounces={false}>

        {/* Hero */}
        <View style={s.heroWrap}>
          {salon.logo_url
            ? <Image source={{ uri: salon.logo_url }} style={s.hero} resizeMode="cover" />
            : <View style={[s.hero, s.heroPlaceholder]}><Text style={{ fontSize: 72 }}>💇</Text></View>
          }

          {/* Dark overlay at bottom */}
          <View style={s.heroGradient} />

          {/* Back button */}
          <SafeAreaView edges={['top']} style={s.heroNav}>
            <TouchableOpacity style={s.navBtn} onPress={() => navigation.goBack()}>
              <Text style={s.navBtnText}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.navBtn} onPress={() => toggle(salonId)}>
              <Text style={{ fontSize: 20 }}>{isFav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Name over image */}
          <View style={s.heroInfo}>
            <Text style={s.heroName}>{salon.name}</Text>
            <Text style={s.heroCity}>📍 {salon.city}</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={s.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tabLabels[tab]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderTab()}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fullscreen media viewer */}
      {selectedMedia && (
        <MediaModal item={selectedMedia} onClose={() => setSelectedMedia(null)} />
      )}

      {/* Sticky footer */}
      <SafeAreaView edges={['bottom']} style={s.footer}>
        {salon.phone && (
          <TouchableOpacity style={s.waBtn} onPress={() => openWhatsApp(salon.phone)} activeOpacity={0.85}>
            <Text style={s.waBtnText}>💬 واتساب</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={s.bookBtn}
          onPress={() => navigation.navigate('AvailableSlots', { salonId, services: salon.services ?? [] })}
          activeOpacity={0.85}
        >
          <Text style={s.bookBtnText}>{t('salons.bookNow')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

// Grid thumbnail
function MediaTile({ item, tileSize, onPress }) {
  const size = { width: tileSize, height: tileSize, borderRadius: 8 };

  if (item.type !== 'video') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Image source={{ uri: item.url }} style={size} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <VideoThumbnailTile url={item.url} size={size} />
    </TouchableOpacity>
  );
}

function VideoThumbnailTile({ url, size }) {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    VideoThumbnails.getThumbnailAsync(url, { time: 0, quality: 0.6 })
      .then((t) => setThumb(t.uri))
      .catch(() => {}); // falls back to dark placeholder on error
  }, [url]);

  return (
    <View style={[size, s.videoThumb]}>
      {thumb
        ? <Image source={{ uri: thumb }} style={[size, { position: 'absolute' }]} resizeMode="cover" />
        : null
      }
      {/* Play button overlay */}
      <View style={s.playOverlay}>
        <Text style={s.playIcon}>▶</Text>
      </View>
    </View>
  );
}

function MediaModal({ item, onClose }) {
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      {item.type === 'video'
        ? <VideoModalContent url={item.url} onClose={onClose} />
        : <ImageModalContent url={item.url} onClose={onClose} />
      }
    </Modal>
  );
}

function useSwipeDownPan(onClose) {
  return useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderRelease: (_, g) => { if (g.dy > 40) onClose(); },
    })
  ).current;
}

function ImageModalContent({ url, onClose }) {
  const pan = useSwipeDownPan(onClose);
  return (
    <View style={s.modalBg} {...pan.panHandlers}>
      <Image source={{ uri: url }} style={s.modalImage} resizeMode="contain" />
      <CloseBtn onClose={onClose} />
      <Text style={s.swipeHint}>↓ اسحب للأسفل للإغلاق</Text>
    </View>
  );
}

function VideoModalContent({ url, onClose }) {
  const pan = useSwipeDownPan(onClose);
  const player = useVideoPlayer(url, (p) => { p.loop = false; });

  useEffect(() => {
    const t = setTimeout(() => { player.play(); }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.modalBg} {...pan.panHandlers}>
      <VideoView
        player={player}
        style={s.modalVideo}
        contentFit="contain"
        nativeControls
        allowsFullscreen
      />
      <CloseBtn onClose={onClose} />
      <Text style={s.swipeHint}>↓ اسحب للأسفل للإغلاق</Text>
    </View>
  );
}

function CloseBtn({ onClose }) {
  return (
    <TouchableOpacity style={s.modalClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={s.modalCloseText}>✕</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  heroWrap: { position: 'relative' },
  hero: { width, height: 300 },
  heroPlaceholder: { backgroundColor: '#e8eceb', justifyContent: 'center', alignItems: 'center' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
    backgroundColor: 'rgba(38,50,56,0.75)',
  },
  heroNav: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  navBtnText: { color: '#fff', fontSize: 26, lineHeight: 30 },
  heroInfo: { position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'right' },
  heroCity: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'right', marginTop: 4 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  tabContent: { padding: spacing.md },
  description: { fontSize: 15, color: colors.dark, textAlign: 'right', lineHeight: 26, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  infoLabel: { fontSize: 16 },
  infoValue: { fontSize: 14, color: colors.dark, flex: 1, textAlign: 'right' },
  reviewsLink: { marginTop: spacing.sm },
  reviewsLinkText: { color: colors.primary, fontSize: 14, fontWeight: '600', textAlign: 'right' },

  serviceCard: {
    backgroundColor: '#fff', borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, flexDirection: 'column',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  svcName: { fontSize: 15, fontWeight: '700', color: colors.dark, textAlign: 'right', marginBottom: 8 },
  serviceMeta: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: spacing.sm },
  pricePill: { backgroundColor: colors.primary + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  priceText: { color: colors.primary, fontWeight: '700', fontSize: 13, writingDirection: 'ltr' },
  duration: { color: colors.textMuted, fontSize: 12 },

  hourRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border,
  },
  hourDay: { fontSize: 14, fontWeight: '700', color: colors.dark },
  hourStatus: { fontSize: 14, writingDirection: 'ltr' },

  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emptyText: { color: colors.textMuted, textAlign: 'center', width: '100%' },

  videoThumb: {
    backgroundColor: '#1a1a2e', overflow: 'hidden',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  playIcon: { fontSize: 28, color: '#fff' },

  modalBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width, height: width * 1.2 },
  modalVideo: { width, height: width * 0.75 },
  modalClose: {
    position: 'absolute', top: 50, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCloseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  swipeHint: {
    position: 'absolute', bottom: 40,
    color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  waBtn: {
    flex: 1, height: 50, borderRadius: radius.md, backgroundColor: '#25D366',
    justifyContent: 'center', alignItems: 'center',
  },
  waBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bookBtn: {
    flex: 2, height: 50, borderRadius: radius.md, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
