import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
  MoreHorizontal,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  MonitorSpeaker,
  ListMusic,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { PlaybackSourceSheet } from '../components/player/PlaybackSourceSheet';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';
import { LyricsCard } from '../components/player/LyricsCard';
import { QueueSheet } from '../components/player/QueueSheet';
import { Track } from '../core/types';
import { usePlayer, useProgress } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';
import { LyricsService, Lyrics } from '../services/LyricsService';
import { upscaleThumbnail } from '../providers/youtube/parse';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Geometry helpers
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngleDeg);
  const end = polarToCartesian(cx, cy, r, endAngleDeg);
  const largeArcFlag = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
  const sweepFlag = endAngleDeg >= startAngleDeg ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function formatTime(sec: number): string {
  if (!sec || isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// -----------------------------------------------------------------------------
// Isolated Disc Progress & Time Layer
// Only this component subscribes to useProgress() ticks (~4x per sec),
// ensuring the parent NowPlaying screen and bottom pill bar NEVER re-render!
// -----------------------------------------------------------------------------
interface DiscProgressLayerProps {
  cx: number;
  cy: number;
  rProg: number;
  trackDuration: number;
  onSeek: (seconds: number) => void;
}

const DiscProgressLayer: React.FC<DiscProgressLayerProps> = React.memo(
  ({ cx, cy, rProg, trackDuration, onSeek }) => {
    const { position, duration } = useProgress();
    const effectiveDuration = duration || trackDuration || 0;

    const [dragProgress, setDragProgress] = useState<number | null>(null);
    const isDraggingRef = useRef(false);

    const activeProgress =
      dragProgress !== null
        ? dragProgress
        : effectiveDuration > 0
        ? Math.min(1, Math.max(0, position / effectiveDuration))
        : 0;

    // Angle span from -61 to +61 degrees (122 degrees total)
    const currentAngleDeg = -61 + 122 * activeProgress;
    const knob = polarToCartesian(cx, cy, rProg, currentAngleDeg);

    // Active played arc
    const activeArcD =
      activeProgress > 0.002
        ? describeArc(cx, cy, rProg, -61, currentAngleDeg)
        : '';

    // Drag / Touch responder along the progress arc
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          isDraggingRef.current = true;
          const { locationX, locationY } = evt.nativeEvent;
          // Calculate angle relative to (cx, cy)
          const dx = locationX - cx;
          const dy = cy - locationY;
          let deg = Math.atan2(dx, dy) * (180 / Math.PI);
          deg = Math.max(-61, Math.min(61, deg));
          const prog = (deg - -61) / 122;
          setDragProgress(prog);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const dx = locationX - cx;
          const dy = cy - locationY;
          let deg = Math.atan2(dx, dy) * (180 / Math.PI);
          deg = Math.max(-61, Math.min(61, deg));
          const prog = (deg - -61) / 122;
          setDragProgress(prog);
        },
        onPanResponderRelease: () => {
          isDraggingRef.current = false;
          setDragProgress((latest) => {
            if (latest !== null && effectiveDuration > 0) {
              onSeek(latest * effectiveDuration);
            }
            return null;
          });
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          setDragProgress(null);
        },
      })
    ).current;

    const displayPos =
      dragProgress !== null
        ? dragProgress * effectiveDuration
        : position;

    return (
      <>
        {/* Active Played Progress Arc */}
        {Boolean(activeArcD) && (
          <Path
            d={activeArcD}
            stroke="#FFFFFF"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Knob with faint glow */}
        <Circle cx={knob.x} cy={knob.y} r={11} fill="rgba(255, 255, 255, 0.22)" />
        <Circle cx={knob.x} cy={knob.y} r={7} fill="#FFFFFF" />

        {/* Time Text: 0:46 / 3:18 centered horizontally at 0.27 W above C */}
        <Text
          style={[
            styles.timeText,
            { top: cy - SCREEN_WIDTH * 0.27 - 10, left: 0, right: 0 },
          ]}
        >
          {formatTime(displayPos)} / {formatTime(effectiveDuration)}
        </Text>

        {/* Touch & Drag zone over the arc */}
        <View
          style={[
            styles.panHitArea,
            {
              left: cx - rProg - 20,
              top: cy - rProg - 20,
              width: (rProg + 20) * 2,
              height: rProg + 40,
            },
          ]}
          {...panResponder.panHandlers}
        />
      </>
    );
  }
);
DiscProgressLayer.displayName = 'DiscProgressLayer';

// -----------------------------------------------------------------------------
// MAIN NOW PLAYING SCREEN COMPONENT
// -----------------------------------------------------------------------------
export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    isLoading,
    error,
    retry,
    seekTo,
    next,
    previous,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    userQueue,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();

  const [showSource, setShowSource] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  // Artwork crossfade animation
  const [currentArtwork, setCurrentArtwork] = useState<string>(
    currentTrack ? upscaleThumbnail(currentTrack.albumImageUrl) : ''
  );
  const [previousArtwork, setPreviousArtwork] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!currentTrack) return;
    const nextArt = upscaleThumbnail(currentTrack.albumImageUrl);
    if (nextArt !== currentArtwork) {
      setPreviousArtwork(currentArtwork);
      setCurrentArtwork(nextArt);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [currentTrack, currentArtwork, fadeAnim]);

  // Timed Lyrics fetching
  const [lyricsData, setLyricsData] = useState<Lyrics | null>(null);
  useEffect(() => {
    if (!currentTrack) {
      setLyricsData(null);
      return;
    }
    let cancelled = false;
    LyricsService.get(currentTrack).then((res: Lyrics | null) => {
      if (!cancelled) setLyricsData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  // Track progress position for lyric rotation
  const { position: currentPosition } = useProgress();

  // Active lyric index from timed lines
  const activeLyricIndex = useMemo(() => {
    const idx = LyricsService.activeLineIndex(lyricsData, currentPosition);
    return idx >= 0 ? idx : 0;
  }, [lyricsData, currentPosition]);

  // ---------------------------------------------------------------------------
  // Geometry Definitions based on common centre C = (CX, CY)
  // Common centre C = horizontal centre of screen, 150 pt above bottom safe edge
  // ---------------------------------------------------------------------------
  const W = SCREEN_WIDTH;
  const H = SCREEN_HEIGHT;
  const CX = W / 2;
  const CY = H - Math.max(12, insets.bottom) - 150;

  // Disc Radii
  const R_DISC = 0.58 * W;
  const R_INNER_RING = R_DISC - 6;
  const R_PROG = 0.49 * W;
  const R_CURVED_BAR = 0.2 * W;
  const R_PLAY_RING = 0.2 * W;
  const R_PLAY_BUTTON_RING = 0.155 * W;
  const R_PLAY_BUTTON_WHITE = 0.12 * W; // ~47 pt

  // Control positions relative to C
  const Y_HEART = CY - 0.37 * W;
  const X_PREV = CX - 0.37 * W;
  const X_NEXT = CX + 0.37 * W;
  const X_SHUFFLE = CX - 0.34 * W;
  const Y_SHUFFLE = CY - 0.1 * W;
  const X_REPEAT = CX + 0.34 * W;
  const Y_REPEAT = CY - 0.1 * W;

  // Disc continuous boundary
  // Angle at screen edge X = 0 and X = W
  const edgeThetaRad = Math.asin(Math.min(0.999, (W / 2) / R_DISC));
  const edgeThetaDeg = (edgeThetaRad * 180) / Math.PI;
  const edgeY = CY - R_DISC * Math.cos(edgeThetaRad);

  const discShapeD = `M 0 ${H} L 0 ${edgeY} ${describeArc(
    CX,
    CY,
    R_DISC,
    -edgeThetaDeg,
    edgeThetaDeg
  )} L ${W} ${H} Z`;

  // Ticks along the outer ring every 7.5 degrees from -75 to +75
  const ticks = useMemo(() => {
    const list: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let deg = -75; deg <= 75; deg += 7.5) {
      const p1 = polarToCartesian(CX, CY, R_INNER_RING, deg);
      const p2 = polarToCartesian(CX, CY, R_DISC, deg);
      list.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    }
    return list;
  }, [CX, CY, R_INNER_RING, R_DISC]);

  // Spokes for radial lyrics
  // Standing outside the ring at R_DISC + 8, reading outward (rotate theta - 90)
  const lyricSpokes = useMemo(() => {
    const spokeOffsets = [
      { deg: 0, opacity: 1, size: 15, weight: '700' as const },
      { deg: -16, opacity: 0.6, size: 13, weight: '500' as const },
      { deg: 16, opacity: 0.6, size: 13, weight: '500' as const },
      { deg: -32, opacity: 0.35, size: 12.5, weight: '400' as const },
      { deg: 32, opacity: 0.35, size: 12.5, weight: '400' as const },
      { deg: -48, opacity: 0.18, size: 12, weight: '400' as const },
      { deg: 48, opacity: 0.18, size: 12, weight: '400' as const },
    ];

    if (!lyricsData || !lyricsData.lines || !lyricsData.lines.length) {
      // Fallback: Show song title as center spoke, artist on flank
      return [
        {
          text: currentTrack?.title ?? '',
          deg: 0,
          opacity: 1,
          size: 15,
          weight: '700' as const,
          anchor: polarToCartesian(CX, CY, R_DISC + 8, 0),
        },
        {
          text: currentTrack?.artist.name ?? '',
          deg: 16,
          opacity: 0.6,
          size: 13,
          weight: '500' as const,
          anchor: polarToCartesian(CX, CY, R_DISC + 8, 16),
        },
      ];
    }

    const lines = lyricsData.lines;
    return spokeOffsets.map((spoke) => {
      const lineIdx = activeLyricIndex + Math.round(spoke.deg / 16);
      const text =
        lineIdx >= 0 && lineIdx < lines.length ? lines[lineIdx].text : '';
      const anchor = polarToCartesian(CX, CY, R_DISC + 8, spoke.deg);
      return {
        text,
        deg: spoke.deg,
        opacity: spoke.opacity,
        size: spoke.size,
        weight: spoke.weight,
        anchor,
      };
    });
  }, [lyricsData, activeLyricIndex, currentTrack, CX, CY, R_DISC]);

  const liked = currentTrack ? isLiked(currentTrack.id) : false;

  return (
    <View style={styles.container}>
      {/* 1. Full-bleed background photo (under the status bar down to 62% of H) */}
      <View style={styles.photoContainer}>
        {Boolean(previousArtwork) && (
          <Image
            source={{ uri: previousArtwork }}
            style={styles.artworkImage}
            resizeMode="cover"
          />
        )}
        {Boolean(currentArtwork) && (
          <Animated.Image
            source={{ uri: currentArtwork }}
            style={[styles.artworkImage, { opacity: fadeAnim }]}
            resizeMode="cover"
          />
        )}

        {/* Top Gradient: 0 to 18% rgba(0,0,0,0.45) to transparent for top buttons */}
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', 'transparent']}
          style={styles.topGradient}
        />

        {/* Bottom Gradient: 35% fades transparent to #000000 behind disc */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', '#000000']}
          style={styles.bottomGradient}
        />

        {/* Caption: Title & Artist at bottom-left over photo gradient, above disc */}
        {currentTrack && (
          <View style={[styles.captionContainer, { top: CY - R_DISC - 58 }]}>
            <Text style={styles.captionTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.captionArtist} numberOfLines={1}>
              {currentTrack.artist.name}
            </Text>
          </View>
        )}
      </View>

      {/* 2. Top Action Buttons: Back (left) & More (right) - 40pt white circles */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.topCircleButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronDown color="#000000" size={24} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topCircleButton}
          activeOpacity={0.8}
          onPress={() => setAddingTrack(currentTrack)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MoreHorizontal color="#000000" size={22} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* 3. One Full-Screen SVG Layer Concentric on C = (CX, CY) */}
      <Svg style={StyleSheet.absoluteFill} width={W} height={H} pointerEvents="box-none">
        {/* Continuous Curved Disc Shape fill #000000 */}
        <Path d={discShapeD} fill="#000000" />

        {/* Outer Edge Ring: radius 0.58 W, stroke rgba(255,255,255,0.28) 1.5 pt */}
        <Path
          d={describeArc(CX, CY, R_DISC, -78, 78)}
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth={1.5}
          fill="none"
        />

        {/* Second Inner Ring: 6 pt inside, stroke rgba(255,255,255,0.10) 1 pt */}
        <Path
          d={describeArc(CX, CY, R_INNER_RING, -78, 78)}
          stroke="rgba(255, 255, 255, 0.10)"
          strokeWidth={1}
          fill="none"
        />

        {/* Radial Ticks along outer ring every 7.5 deg from -75 to +75 */}
        {ticks.map((t, idx) => (
          <Line
            key={`tick-${idx}`}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth={1}
          />
        ))}

        {/* Lyrics Spokes: Standing outside ring, reading outward */}
        {lyricSpokes.map((spoke, idx) => {
          if (!spoke.text) return null;
          const truncated =
            spoke.text.length > 24 ? `${spoke.text.slice(0, 22)}..` : spoke.text;
          return (
            <G key={`spoke-${idx}`}>
              <SvgText
                x={spoke.anchor.x}
                y={spoke.anchor.y}
                fill="#FFFFFF"
                fillOpacity={spoke.opacity}
                fontSize={spoke.size}
                fontWeight={spoke.weight}
                textAnchor="start"
                transform={`rotate(${spoke.deg - 90}, ${spoke.anchor.x}, ${spoke.anchor.y})`}
              >
                {truncated}
              </SvgText>
            </G>
          );
        })}

        {/* Background Track for Progress Arc: radius 0.49 W from -61 to +61 deg */}
        <Path
          d={describeArc(CX, CY, R_PROG, -61, 61)}
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {/* Decorative Curved Bar: radius 0.2 W from -28 to +28 deg, stroke 5 pt white */}
        <Path
          d={describeArc(CX, CY, R_CURVED_BAR, -28, 28)}
          stroke="#FCFCFC"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />

        {/* Play Ring: dark circle radius 0.2 W, fill #050505 */}
        <Circle
          cx={CX}
          cy={CY}
          r={R_PLAY_RING}
          fill="#050505"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={1}
        />

        {/* Play Button Outer Ring: radius 0.155 W */}
        <Circle
          cx={CX}
          cy={CY}
          r={R_PLAY_BUTTON_RING}
          fill="#0D0D0D"
          stroke="rgba(255, 255, 255, 0.40)"
          strokeWidth={2}
        />

        {/* Play Button White Circle: radius 0.12 W (~47 pt), fill #FCFCFC */}
        <Circle cx={CX} cy={CY} r={R_PLAY_BUTTON_WHITE} fill="#FCFCFC" />

        {/* Isolated Active Progress Arc, Knob, and Time Text */}
        <DiscProgressLayer
          cx={CX}
          cy={CY}
          rProg={R_PROG}
          trackDuration={currentTrack?.duration ?? 0}
          onSeek={seekTo}
        />
      </Svg>

      {/* 4. Interactive Controls Overlay */}
      {/* Heart button: centered horizontally at 0.37 W above C */}
      <View style={[styles.heartWrap, { top: Y_HEART - 18, left: CX - 22 }]}>
        <TouchableOpacity
          onPress={() => currentTrack && toggleLike(currentTrack)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Heart
            color="#FFFFFF"
            fill={liked ? '#FFFFFF' : 'transparent'}
            size={28}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Shuffle Button (up-left of play ring) */}
      <TouchableOpacity
        style={[styles.smallControlBtn, { left: X_SHUFFLE - 16, top: Y_SHUFFLE - 16 }]}
        onPress={toggleShuffle}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Shuffle
          color={shuffle ? '#FFFFFF' : '#6B6B6B'}
          size={24}
          strokeWidth={shuffle ? 2.5 : 2}
        />
      </TouchableOpacity>

      {/* Repeat Button (up-right of play ring) */}
      <TouchableOpacity
        style={[styles.smallControlBtn, { left: X_REPEAT - 16, top: Y_REPEAT - 16 }]}
        onPress={cycleRepeat}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {repeat === 'one' ? (
          <Repeat1 color="#FFFFFF" size={24} strokeWidth={2.5} />
        ) : (
          <Repeat
            color={repeat === 'all' ? '#FFFFFF' : '#6B6B6B'}
            size={24}
            strokeWidth={repeat === 'all' ? 2.5 : 2}
          />
        )}
      </TouchableOpacity>

      {/* Previous Button (left of play ring at Y = CY) */}
      <TouchableOpacity
        style={[styles.navControlBtn, { left: X_PREV - 22, top: CY - 22 }]}
        onPress={previous}
        activeOpacity={0.75}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <SkipBack color="#FFFFFF" size={34} fill="#FFFFFF" />
      </TouchableOpacity>

      {/* Play / Pause Toggle Center Button */}
      <TouchableOpacity
        style={[
          styles.playTouchTarget,
          {
            left: CX - R_PLAY_BUTTON_WHITE,
            top: CY - R_PLAY_BUTTON_WHITE,
            width: R_PLAY_BUTTON_WHITE * 2,
            height: R_PLAY_BUTTON_WHITE * 2,
            borderRadius: R_PLAY_BUTTON_WHITE,
          },
        ]}
        activeOpacity={0.85}
        onPress={togglePlayPause}
      >
        {isPlaying ? (
          <Pause color="#000000" size={28} fill="#000000" />
        ) : (
          <Play color="#000000" size={28} fill="#000000" style={{ marginLeft: 3 }} />
        )}
      </TouchableOpacity>

      {/* Next Button (right of play ring at Y = CY) */}
      <TouchableOpacity
        style={[styles.navControlBtn, { left: X_NEXT - 22, top: CY - 22 }]}
        onPress={next}
        activeOpacity={0.75}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <SkipForward color="#FFFFFF" size={34} fill="#FFFFFF" />
      </TouchableOpacity>

      {/* 5. Bottom Pill Bar: Height 52, Radius 26, #111110 */}
      <View
        style={[
          styles.bottomPillBar,
          { bottom: Math.max(16, insets.bottom + 12) },
        ]}
      >
        {/* Left: Playback source icon */}
        <TouchableOpacity
          onPress={() => setShowSource(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.pillIconBtn}
        >
          <MonitorSpeaker color="#FFFFFF" size={22} />
        </TouchableOpacity>

        {/* Center: "Lyrics" button */}
        <TouchableOpacity
          onPress={() => setShowLyricsModal(true)}
          activeOpacity={0.8}
          style={styles.lyricsPillCenter}
        >
          <Text style={styles.lyricsPillText}>Lyrics</Text>
        </TouchableOpacity>

        {/* Right: Queue icon with live count badge */}
        <TouchableOpacity
          onPress={() => setShowQueue(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.pillIconBtn}
        >
          <ListMusic color="#FFFFFF" size={22} />
          {userQueue.length > 0 && (
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>
                {userQueue.length > 99 ? '99+' : userQueue.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Error banner if stream failure occurs */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={retry}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Tap to retry</Text>
        </TouchableOpacity>
      )}

      {/* Full Lyrics Modal */}
      <Modal
        visible={showLyricsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLyricsModal(false)}
      >
        <View style={styles.lyricsModalContainer}>
          <View style={styles.lyricsModalHeader}>
            <Text style={styles.lyricsModalTitle}>Lyrics</Text>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowLyricsModal(false)}
            >
              <X color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
          <View style={styles.lyricsCardWrap}>
            {currentTrack && <LyricsCard track={currentTrack} onSeek={seekTo} />}
          </View>
        </View>
      </Modal>

      {/* Queue Sheet (Part 2) */}
      <QueueSheet visible={showQueue} onClose={() => setShowQueue(false)} />

      {/* Add To Playlist / Options Sheet */}
      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />
      <PlaybackSourceSheet visible={showSource} onClose={() => setShowSource(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  photoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Math.round(SCREEN_HEIGHT * 0.62),
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  artworkImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.05 }],
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Math.round(SCREEN_HEIGHT * 0.18),
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Math.round(SCREEN_HEIGHT * 0.28),
  },
  captionContainer: {
    position: 'absolute',
    left: 24,
    right: 70,
  },
  captionTitle: {
    color: '#FCFCFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  captionArtist: {
    color: '#B4B6B5',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  topCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  timeText: {
    position: 'absolute',
    textAlign: 'center',
    color: '#B4B6B5',
    fontSize: 14,
    fontWeight: '600',
  },
  panHitArea: {
    position: 'absolute',
  },
  heartWrap: {
    position: 'absolute',
    width: 44,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  smallControlBtn: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  navControlBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  playTouchTarget: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 60,
  },
  bottomPillBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  pillIconBtn: {
    padding: 6,
    position: 'relative',
  },
  lyricsPillCenter: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  lyricsPillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  queueBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#111110',
  },
  queueBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    zIndex: 150,
  },
  errorText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  errorHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  lyricsModalContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    paddingTop: 50,
  },
  lyricsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  lyricsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeModalBtn: {
    padding: 8,
  },
  lyricsCardWrap: {
    flex: 1,
  },
});
