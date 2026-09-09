import React, { useState, useEffect, useRef } from 'react';
import {
  View, Image, TouchableOpacity, StyleSheet, Text, Animated,
  Dimensions, Modal, StatusBar, PanResponder,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Play, X } from 'lucide-react-native';
import { colors, radius } from '../theme';

const { width, height } = Dimensions.get('window');
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 1.2;

// Shared photo/video grid tile + fullscreen lightbox, used by both
// SalonDetailScreen's gallery preview strip and SalonGalleryScreen's full grid.
export function MediaTile({ item, tileSize, onPress }) {
  const size = { width: tileSize, height: tileSize, borderRadius: radius.sm };

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
      <View style={s.playOverlay}>
        <Play size={20} color="#fff" fill="#fff" strokeWidth={1.75} />
      </View>
    </View>
  );
}

export function MediaModal({ item, onClose }) {
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

// Drag-to-dismiss: the media itself tracks the finger 1:1 while dragging down
// (translateY.setValue, not Animated.event, so the same value can later be
// driven natively for both outcomes below) and fades out as it moves away.
// On release, past the distance/velocity threshold the drag *continues* —
// animating on to fully off-screen + transparent before calling onClose —
// rather than cutting the media away the instant the finger lifts; short of
// the threshold it springs back to center.
function useSwipeDownAnimation(onClose) {
  const translateY = useRef(new Animated.Value(0)).current;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => translateY.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
          Animated.timing(translateY, {
            toValue: height,
            duration: 220,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  const opacity = translateY.interpolate({
    inputRange: [0, height],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return { pan, translateY, opacity };
}

function ImageModalContent({ url, onClose }) {
  const { pan, translateY, opacity } = useSwipeDownAnimation(onClose);
  return (
    <View style={s.modalBg} {...pan.panHandlers}>
      <Animated.Image
        source={{ uri: url }}
        style={[s.modalImage, { opacity, transform: [{ translateY }] }]}
        resizeMode="contain"
      />
      <CloseBtn onClose={onClose} />
      <Text style={s.swipeHint}>↓ اسحب للأسفل للإغلاق</Text>
    </View>
  );
}

function VideoModalContent({ url, onClose }) {
  const { pan, translateY, opacity } = useSwipeDownAnimation(onClose);
  const player = useVideoPlayer(url, (p) => { p.loop = false; });

  useEffect(() => {
    const t = setTimeout(() => { player.play(); }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={s.modalBg} {...pan.panHandlers}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <VideoView
          player={player}
          style={s.modalVideo}
          contentFit="contain"
          nativeControls
          allowsFullscreen
        />
      </Animated.View>
      <CloseBtn onClose={onClose} />
      <Text style={s.swipeHint}>↓ اسحب للأسفل للإغلاق</Text>
    </View>
  );
}

function CloseBtn({ onClose }) {
  return (
    <TouchableOpacity style={s.modalClose} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <X size={18} color="#fff" strokeWidth={1.75} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  videoThumb: { backgroundColor: colors.dark, overflow: 'hidden' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalBg: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width, height: width * 1.2 },
  modalVideo: { width, height: width * 0.75 },
  modalClose: {
    position: 'absolute', top: 50, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  swipeHint: {
    position: 'absolute', bottom: 40,
    color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center',
  },
});
