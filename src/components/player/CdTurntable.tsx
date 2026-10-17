import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Heart } from 'lucide-react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useProgress } from '../../hooks/usePlayer';

const { width } = Dimensions.get('window');
const DISC_SIZE = Math.min(width * 0.76, 290);
const RADIUS = DISC_SIZE / 2 - 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CdTurntableProps {
  albumImageUrl: string;
  isPlaying: boolean;
  isLiked: boolean;
  onToggleLike: () => void;
}

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const CdTurntable: React.FC<CdTurntableProps> = ({
  albumImageUrl,
  isPlaying,
  isLiked,
  onToggleLike,
}) => {
  const { position, duration } = useProgress();
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Continuous rotation while playing
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      animation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 18000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      spinAnim.stopAnimation();
    }

    return () => {
      animation?.stop();
    };
  }, [isPlaying, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressPercent =
    duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressPercent);

  return (
    <View style={styles.turntableContainer}>
      {/* SVG Concentric Groove Rings & Circular Progress Arc */}
      <View style={styles.svgWrapper}>
        <Svg width={DISC_SIZE} height={DISC_SIZE}>
          {/* Outer chassis ring */}
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS + 6}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
            fill="none"
          />

          {/* Concentric CD Grooves */}
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="3"
            fill="none"
          />
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS - 16}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
            strokeDasharray="4 6"
            fill="none"
          />
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS - 28}
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="1"
            fill="none"
          />

          {/* Active Pure White Circular Progress Arc */}
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS}
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${DISC_SIZE / 2} ${DISC_SIZE / 2})`}
          />
        </Svg>
      </View>

      {/* Center Vinyl Disc with Album Art */}
      <Animated.View
        style={[
          styles.vinylCenter,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Image source={{ uri: albumImageUrl }} style={styles.centerArt} />
        {/* Center Spindle Hole */}
        <View style={styles.spindleRing}>
          <View style={styles.spindleHole} />
        </View>
      </Animated.View>

      {/* Heart Icon at top inside arc */}
      <TouchableOpacity
        style={styles.heartWrapper}
        onPress={onToggleLike}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Heart
          color="#FFFFFF"
          fill={isLiked ? '#FFFFFF' : 'transparent'}
          size={22}
        />
      </TouchableOpacity>

      {/* Digital Time Readout: 0:46 / 3:18 */}
      <View style={styles.timeBadge}>
        <Text style={styles.timeText}>
          {formatTime(position)} <Text style={styles.timeDivider}>/</Text> {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  turntableContainer: {
    width: DISC_SIZE,
    height: DISC_SIZE + 36,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.sm,
  },
  svgWrapper: {
    position: 'absolute',
    width: DISC_SIZE,
    height: DISC_SIZE,
    top: 0,
    left: 0,
  },
  vinylCenter: {
    width: DISC_SIZE * 0.54,
    height: DISC_SIZE * 0.54,
    borderRadius: (DISC_SIZE * 0.54) / 2,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerArt: {
    width: '100%',
    height: '100%',
    borderRadius: (DISC_SIZE * 0.54) / 2,
  },
  spindleRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spindleHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1B1B1B',
  },
  heartWrapper: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    padding: 6,
    zIndex: 10,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '600',
    color: '#B4B6B5',
    letterSpacing: 0.5,
  },
  timeDivider: {
    color: '#666666',
    fontWeight: '400',
  },
});
