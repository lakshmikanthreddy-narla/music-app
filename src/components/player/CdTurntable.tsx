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
import { COLORS, FONTS } from '../../constants/theme';
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
      {/* Background Glowing Ambient Aura */}
      <View style={styles.ambientAura} />

      {/* SVG Concentric Groove Rings & Circular Progress Arc */}
      <View style={styles.svgWrapper}>
        <Svg width={DISC_SIZE} height={DISC_SIZE}>
          <Defs>
            <LinearGradient id="cyanArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#00F0FF" />
              <Stop offset="100%" stopColor="#00A3FF" />
            </LinearGradient>
          </Defs>

          {/* Outer chassis ring */}
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS + 6}
            stroke="rgba(0, 212, 255, 0.12)"
            strokeWidth="1.5"
            fill="none"
          />

          {/* Concentric CD Grooves */}
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="4"
            fill="none"
          />
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS - 16}
            stroke="rgba(0, 212, 255, 0.09)"
            strokeWidth="1"
            strokeDasharray="4 6"
            fill="none"
          />
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS - 28}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
            fill="none"
          />

          {/* Active Glowing Circular Progress Arc */}
          <Circle
            cx={DISC_SIZE / 2}
            cy={DISC_SIZE / 2}
            r={RADIUS}
            stroke="url(#cyanArcGrad)"
            strokeWidth="4.5"
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

      {/* Heart Icon at top */}
      <TouchableOpacity
        style={styles.heartWrapper}
        onPress={onToggleLike}
        activeOpacity={0.8}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Heart
          color={isLiked ? COLORS.accent.cyan : '#8A99AD'}
          fill={isLiked ? COLORS.accent.cyan : 'transparent'}
          size={20}
        />
      </TouchableOpacity>

      {/* Digital Time Readout: 0:45 / 3:18 */}
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
  ambientAura: {
    position: 'absolute',
    width: DISC_SIZE * 0.9,
    height: DISC_SIZE * 0.9,
    borderRadius: (DISC_SIZE * 0.9) / 2,
    backgroundColor: 'rgba(0, 212, 255, 0.14)',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 36,
    elevation: 8,
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
    backgroundColor: '#0A1224',
    borderWidth: 3,
    borderColor: 'rgba(0, 212, 255, 0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 6,
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
    backgroundColor: 'rgba(10, 18, 36, 0.85)',
    borderWidth: 1.5,
    borderColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spindleHole: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#060B18',
  },
  heartWrapper: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    padding: 6,
    zIndex: 10,
  },
  timeBadge: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 20, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timeDivider: {
    color: COLORS.accent.cyan,
    fontWeight: '400',
  },
});
