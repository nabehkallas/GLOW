import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MediaTile, MediaModal } from '../../components/MediaGrid';
import { colors, spacing } from '../../theme';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - spacing.md * 2 - 8) / 3;

export default function SalonGalleryScreen({ route }) {
  const { t } = useTranslation();
  const { media } = route.params;
  const [selected, setSelected] = useState(null);

  return (
    <View style={s.root}>
      {media.length === 0 ? (
        <Text style={s.emptyText}>{t('common.noData')}</Text>
      ) : (
        <View style={s.grid}>
          {media.map((m) => (
            <MediaTile key={m.id} item={m} tileSize={TILE_SIZE} onPress={() => setSelected(m)} />
          ))}
        </View>
      )}
      {selected && <MediaModal item={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: spacing.md },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
