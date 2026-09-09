import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X, Camera } from 'lucide-react-native';
import { colors, spacing } from '../theme';

// Tap the small avatar/logo elsewhere in the app to open this: a big circular
// preview with its own upload button, rather than jumping straight to the
// image picker on the first tap.
export default function AvatarViewer({ visible, imageUrl, initial, uploading, onClose, onUpload }) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.bg}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={12} activeOpacity={0.8}>
          <X size={22} color="#fff" />
        </TouchableOpacity>

        <View style={s.circleWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={s.circleImage} />
          ) : (
            <View style={[s.circleImage, s.circleFallback]}>
              <Text style={s.circleInitial}>{initial}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.uploadBtn} onPress={onUpload} disabled={uploading} activeOpacity={0.85}>
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Camera size={16} color="#fff" />
              <Text style={s.uploadBtnText}>{t('profile.changeLogo')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 56, right: 20 },
  circleWrap: { width: 260, height: 260, borderRadius: 130, overflow: 'hidden', backgroundColor: colors.dark },
  circleImage: { width: '100%', height: '100%' },
  circleFallback: { alignItems: 'center', justifyContent: 'center' },
  circleInitial: { color: '#fff', fontSize: 96, fontWeight: '900' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  uploadBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
