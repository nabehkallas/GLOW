import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../theme';

export default function StarRating({ rating, onChange, size = 16, gap = 2 }) {
  const stars = [1, 2, 3, 4, 5];
  const interactive = typeof onChange === 'function';

  return (
    <View style={{ flexDirection: 'row', gap }}>
      {stars.map((n) => {
        const filled = n <= rating;
        const star = (
          <Star
            size={size}
            color={filled ? colors.primary : colors.textMuted}
            fill={filled ? colors.primary : 'transparent'}
            strokeWidth={1.75}
          />
        );
        return interactive ? (
          <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            {star}
          </TouchableOpacity>
        ) : (
          <View key={n}>{star}</View>
        );
      })}
    </View>
  );
}
