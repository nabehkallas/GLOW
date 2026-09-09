import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Modal, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Plus, Play, X, Pencil, Trash2, Check } from 'lucide-react-native';
import api from '../../api/client';
import { colors, radius, spacing } from '../../theme';

export default function MediaScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get('/salon/media')
      .then(({ data }) => setItems(data.data ?? data))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const upload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (result.canceled) return;

    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    setUploading(true);
    const form = new FormData();
    form.append('file', {
      uri: asset.uri,
      name: asset.fileName ?? (isVideo ? 'media.mp4' : 'media.jpg'),
      type: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    });

    try {
      const { data } = await api.post('/salon/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setItems((prev) => [...prev, data.data ?? data]);
    } catch (e) {
      Alert.alert(t('media.uploadFailed'), e.response?.data?.message ?? '');
    } finally {
      setUploading(false);
    }
  };

  const destroy = (item) => {
    Alert.alert(t('media.deleteConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/salon/media/${item.id}`);
          setItems((prev) => prev.filter((m) => m.id !== item.id));
          setViewing(null);
        },
      },
    ]);
  };

  const saveCaption = async (id, caption) => {
    await api.patch(`/salon/media/${id}`, { caption });
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, caption } : m)));
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={upload} disabled={uploading} style={s.headerAddBtn} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Plus size={20} color="#fff" />}
        </TouchableOpacity>
      ),
    });
  }, [navigation, uploading]);

  return (
    <View style={s.wrap}>
      <Text style={s.subtitle}>{t('media.subtitle')}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => String(m.id)}
          numColumns={3}
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm, gap: spacing.sm }}
          ListEmptyComponent={<Text style={s.empty}>{t('media.empty')}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.thumbWrap} onPress={() => setViewing(item)} activeOpacity={0.85}>
              {item.type === 'image' ? (
                <Image source={{ uri: item.url }} style={s.thumb} />
              ) : (
                <View style={[s.thumb, s.videoThumb]}>
                  <Play size={20} color="#fff" fill="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {viewing && <Lightbox item={viewing} onClose={() => setViewing(null)} onDelete={destroy} onSaveCaption={saveCaption} />}
    </View>
  );
}

function Lightbox({ item, onClose, onDelete, onSaveCaption }) {
  const { t } = useTranslation();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={ls.bg}>
        <View style={ls.media}>
          {item.type === 'video' ? <VideoContent url={item.url} /> : <Image source={{ uri: item.url }} style={ls.mediaContent} resizeMode="contain" />}
        </View>

        <CaptionEditor item={item} onSave={onSaveCaption} />

        <View style={ls.actionsRow}>
          <TouchableOpacity onPress={() => onDelete(item)} style={ls.actionBtn} activeOpacity={0.8}>
            <Trash2 size={18} color="#fca5a5" />
            <Text style={ls.actionText}>{t('common.delete')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={ls.actionBtn} activeOpacity={0.8}>
            <X size={18} color="#fff" />
            <Text style={ls.actionText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function VideoContent({ url }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    const timeout = setTimeout(() => player.play(), 300);
    return () => clearTimeout(timeout);
  }, [player]);

  return <VideoView player={player} style={ls.mediaContent} contentFit="contain" nativeControls allowsFullscreen />;
}

function CaptionEditor({ item, onSave }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(item.caption ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(item.id, caption);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={ls.captionBar}>
      {editing ? (
        <View style={ls.captionEditRow}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder={t('media.captionPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={ls.captionInput}
            autoFocus
          />
          <TouchableOpacity onPress={save} disabled={saving} style={ls.captionSaveBtn} activeOpacity={0.8}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)} style={ls.captionRow} activeOpacity={0.8}>
          <Text style={ls.captionText} numberOfLines={2}>
            {caption || t('media.noCaption')}
          </Text>
          <Pencil size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  headerAddBtn: { paddingHorizontal: 16 },
  subtitle: { fontSize: 12, color: colors.textMuted, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 14 },
  thumbWrap: { flex: 1, aspectRatio: 1, borderRadius: radius.sm, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  videoThumb: { backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
});

const ls = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  media: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mediaContent: { width: '100%', height: '100%' },
  captionBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  captionText: { flex: 1, color: '#fff', fontSize: 13 },
  captionEditRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  captionInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  captionSaveBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
