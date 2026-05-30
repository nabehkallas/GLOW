import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import useNotificationStore from '../../stores/notificationStore';
import { colors, spacing, radius, shadow } from '../../theme';

function NotifCard({ notif }) {
  const title = notif.data?.title ?? notif.data?.message ?? '—';
  const body  = notif.data?.body ?? null;
  return (
    <View style={[s.card, !notif.read_at && s.cardUnread]}>
      {!notif.read_at && <View style={s.dot} />}
      <View style={{ flex: 1 }}>
        <Text style={s.notifTitle}>{title}</Text>
        {body ? <Text style={s.notifBody}>{body}</Text> : null}
        <Text style={s.notifDate}>
          {new Date(notif.created_at).toLocaleDateString('ar-SY')}
        </Text>
      </View>
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const resetCount = useNotificationStore((s) => s.reset);
  const fetchCount = useNotificationStore((s) => s.fetchCount);

  useEffect(() => {
    api.get('/notifications')
      .then((res) => {
        const list = res.data.data ?? [];
        setNotifs(list.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        if (list.some((n) => !n.read_at)) {
          api.post('/notifications/mark-all-read').catch(() => {});
        }
      })
      .finally(() => setLoading(false));
    resetCount();
  }, []);

  const markAll = async () => {
    await api.post('/notifications/mark-all-read').catch(() => {});
    setNotifs((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    resetCount();
  };

  const unreadCount = notifs.filter((n) => !n.read_at).length;
  const close = () => navigation.goBack();

  return (
    <View style={s.overlay}>
      {/* Backdrop */}
      <TouchableOpacity style={s.backdrop} onPress={close} activeOpacity={1} />

      {/* Sheet */}
      <View style={s.sheet}>
        {/* Handle bar */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={close} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t('notifications.title')}</Text>
          {unreadCount > 0
            ? <TouchableOpacity onPress={markAll}>
                <Text style={s.markAll}>{t('notifications.markAllRead')}</Text>
              </TouchableOpacity>
            : <View style={{ width: 60 }} />
          }
        </View>

        {/* Content */}
        {loading
          ? <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
          : <FlatList
              data={notifs}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => <NotifCard notif={item} />}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={{ fontSize: 40, marginBottom: spacing.md }}>🔔</Text>
                  <Text style={s.emptyText}>{t('notifications.empty')}</Text>
                </View>
              }
            />
        }

        <SafeAreaView edges={['bottom']} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%',
    overflow: 'hidden',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14, color: colors.textMuted, fontWeight: '700',
  },
  markAll: {
    color: colors.primary, fontWeight: '600', fontSize: 12,
  },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, gap: 10 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, ...shadow,
  },
  cardUnread: { borderRightWidth: 3, borderRightColor: colors.primary },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.primary, marginTop: 6,
  },
  notifTitle: { fontSize: 14, fontWeight: '700', color: colors.dark, textAlign: 'right' },
  notifBody: { fontSize: 13, color: colors.dark, textAlign: 'right', marginTop: 2, lineHeight: 20 },
  notifDate: { fontSize: 12, color: colors.textMuted, textAlign: 'left', marginTop: 6, writingDirection: 'ltr' },

  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 15 },
});
