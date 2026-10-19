import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  PanResponder,
  Modal,
  ScrollView,
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
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { PlaybackSourceSheet } from '../components/player/PlaybackSourceSheet';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';
import { LyricsCard } from '../components/player/LyricsCard';
import { Track } from '../core/types';
import { usePlayer, useProgress } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';
import { LyricsService, Lyrics } from '../services/LyricsService';
import { upscaleThumbnail } from '../providers/youtube/parse';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Geometry constants for the Target CD-Style Now Playing
const DISC_RADIUS = SCREEN_WIDTH * 0.72; // ~280 on 390pt width
const Y_APEX = Math.round(SCREEN_HEIGHT * 0.43); // Apex of the curved disc
const CX = SCREEN_WIDTH / 2;
const CY = Y_APEX + DISC_RADIUS;

// Progress arc parameters
const R_PROGRESS = DISC_RADIUS - 26;
const ARC_HALF_SPAN = 0.82; // ~47 degrees in radians
const START_ANGLE = -Math.PI / 2 - ARC_HALF_SPAN;
const END_ANGLE = -Math.PI / 2 + ARC_HALF_SPAN;

// Radius for lyrics along the arc (just above disc top edge)
const R_LYRICS = DISC_RADIUS + 16;

function formatTime(sec: number): string {
  if (!sec || isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    isLoading,
    isBuffering,
    error,
    retry,
    seekTo,
    next,
    previous,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    upcoming,
    jumpTo,
    removeFromQueue,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();
  const { position, duration } = useProgress();

  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  // Background artwork crossfade management (Fix 5b)
  const [currentArtwork, setCurrentArtwork] = useState<string>(
    currentTrack ? upscaleThumbnail(currentTrack.albumImageUrl, 800) : ''
  );
  const [prevArtwork, setPrevArtwork] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Synced lyrics for arc display
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);

  useEffect(() => {
    if (!currentTrack) return;
    const newArt = upscaleThumbnail(currentTrack.albumImageUrl, 800);
    if (newArt && newArt !== currentArtwork) {
      setPrevArtwork(currentArtwork);
      setCurrentArtwork(newArt);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else if (!currentArtwork && newArt) {
      setCurrentArtwork(newArt);
    }

    // Prefetch upcoming track artwork if in queue
    if (upcoming[0]?.albumImageUrl) {
      const nextArt = upscaleThumbnail(upcoming[0].albumImageUrl, 800);
      if (nextArt) Image.prefetch(nextArt);
    }
  }, [currentTrack?.id, currentTrack?.albumImageUrl]);

  // Fetch lyrics for the arc
  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await LyricsService.get(currentTrack);
        if (!cancelled) setLyrics(res);
      } catch {
        // Fallback handled gracefully
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const busy = isLoading || isBuffering;
  const trackDuration = duration || currentTrack.duration || 0;
  const rawProgress = trackDuration > 0 ? Math.min(1, Math.max(0, position / trackDuration)) : 0;

  // Calculate coordinates along progress arc
  const currentProgressAngle = START_ANGLE + rawProgress * (END_ANGLE - START_ANGLE);
  const knobX = CX + R_PROGRESS * Math.cos(currentProgressAngle);
  const knobY = CY + R_PROGRESS * Math.sin(currentProgressAngle);

  // SVG Arc helper function
  const createArcD = (r: number, startA: number, endA: number) => {
    const x1 = CX + r * Math.cos(startA);
    const y1 = CY + r * Math.sin(startA);
    const x2 = CX + r * Math.cos(endA);
    const y2 = CY + r * Math.sin(endA);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  const bgTrackD = createArcD(R_PROGRESS, START_ANGLE, END_ANGLE);
  const activeProgD = rawProgress > 0.005 ? createArcD(R_PROGRESS, START_ANGLE, currentProgressAngle) : '';
  const outerDiscRingD = createArcD(DISC_RADIUS, START_ANGLE - 0.25, END_ANGLE + 0.25);
  const innerDiscRingD = createArcD(DISC_RADIUS - 12, START_ANGLE - 0.22, END_ANGLE + 0.22);

  // Drag and Tap seeker on the arc
  const handleArcSeek = (touchX: number, touchY: number) => {
    const dx = touchX - CX;
    const dy = touchY - CY;
    const angle = Math.atan2(dy, dx);
    const ratio = (angle - START_ANGLE) / (END_ANGLE - START_ANGLE);
    const clamped = Math.max(0, Math.min(1, ratio));
    if (trackDuration > 0) {
      seekTo(clamped * trackDuration);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      handleArcSeek(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
    },
    onPanResponderMove: (evt) => {
      handleArcSeek(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
    },
    onPanResponderRelease: (evt) => {
      handleArcSeek(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
    },
  });

  // Lyrics calculation along the curve of the arc
  const activeLineIdx = LyricsService.activeLineIndex(lyrics, position);
  const arcLyricItems = useMemo(() => {
    if (lyrics && lyrics.lines && lyrics.lines.length > 0) {
      const idx = activeLineIdx >= 0 ? activeLineIdx : 0;
      const offsets = [
        { offsetDeg: -44, opacity: 0.2, text: lyrics.lines[idx - 3]?.text },
        { offsetDeg: -30, opacity: 0.35, text: lyrics.lines[idx - 2]?.text },
        { offsetDeg: -16, opacity: 0.6, text: lyrics.lines[idx - 1]?.text },
        { offsetDeg: 0, opacity: 1.0, text: lyrics.lines[idx]?.text },
        { offsetDeg: 16, opacity: 0.6, text: lyrics.lines[idx + 1]?.text },
        { offsetDeg: 30, opacity: 0.35, text: lyrics.lines[idx + 2]?.text },
        { offsetDeg: 44, opacity: 0.2, text: lyrics.lines[idx + 3]?.text },
      ];
      return offsets.filter((item) => Boolean(item.text));
    }
    // Graceful fallback: song title & artist curved along the arc
    return [
      { offsetDeg: -22, opacity: 0.5, text: currentTrack.artist.name },
      { offsetDeg: 0, opacity: 1.0, text: currentTrack.title },
      { offsetDeg: 22, opacity: 0.5, text: currentTrack.album || 'Sonic Cube' },
    ];
  }, [lyrics, activeLineIdx, currentTrack]);

  return (
    <View style={styles.container}>
      {/* 1. Full-bleed background photo taking top ~45% of screen with crossfade */}
      <View style={[styles.photoContainer, { height: Y_APEX + 40 }]}>
        {Boolean(prevArtwork) && (
          <Image
            source={{ uri: prevArtwork }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          {currentArtwork ? (
            <Image
              source={{ uri: currentArtwork }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#1c1c1c', '#0d0d0d']}
              style={StyleSheet.absoluteFill}
            />
          )}
        </Animated.View>

        {/* Soft dark gradient at top for button readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topGradient}
        />

        {/* Soft dark gradient fading into #000000 at bottom of photo */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
          locations={[0.3, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Item 10: Song title (white bold 18) & artist (#B4B6B5 13) caption at bottom-left over photo */}
        <View style={styles.captionOverlay}>
          <Text style={styles.captionTitle} numberOfLines={1} ellipsizeMode="tail">
            {currentTrack.title}
          </Text>
          <Text style={styles.captionArtist} numberOfLines={1}>
            {currentTrack.artist.name}
          </Text>
        </View>
      </View>

      {/* 2. Top buttons: white circles (#FCFCFC, 40pt) with black icons */}
      <View style={[styles.topHeader, { top: insets.top + SIZES.xs }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.whiteTopButton}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronDown color="#000000" size={24} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whiteTopButton}
          onPress={() => setAddingTrack(currentTrack)}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MoreHorizontal color="#000000" size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* 3 & 4 & 5. Big Black Disc, Rings, Lyrics on the Arc, and Progress Arc */}
      <View style={[styles.discContainer, { top: Y_APEX - 30 }]}>
        <Svg width={SCREEN_WIDTH} height={DISC_RADIUS + 40} style={styles.svgOverlay}>
          <Defs>
            <SvgGradient id="fadeEdge" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </SvgGradient>
          </Defs>

          {/* Disc Background Shape */}
          <Path
            d={`M 0 ${DISC_RADIUS + 40} L 0 ${CY - DISC_RADIUS} ${createArcD(DISC_RADIUS, START_ANGLE - 0.25, END_ANGLE + 0.25)} L ${SCREEN_WIDTH} ${DISC_RADIUS + 40} Z`}
            fill="#000000"
          />

          {/* 4. Lyrics following the curve of the arc */}
          {arcLyricItems.map((item, i) => {
            const angleRad = -Math.PI / 2 + (item.offsetDeg * Math.PI) / 180;
            const px = CX + R_LYRICS * Math.cos(angleRad);
            const py = CY + R_LYRICS * Math.sin(angleRad);
            // Truncate to keep lyric readable along arc
            const truncated =
              item.text.length > 22 ? `${item.text.slice(0, 20)}..` : item.text;
            return (
              <SvgText
                key={`lyric-${i}`}
                x={px}
                y={py}
                fill="#FFFFFF"
                fillOpacity={item.opacity}
                fontSize={item.opacity === 1 ? 14 : 12}
                fontWeight={item.opacity === 1 ? '700' : '500'}
                textAnchor="middle"
                transform={`rotate(${item.offsetDeg}, ${px}, ${py})`}
              >
                {truncated}
              </SvgText>
            );
          })}

          {/* Outer Ring of Disc: rgba(255,255,255,0.25) */}
          <Path
            d={outerDiscRingD}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth={1.5}
            fill="none"
          />

          {/* Second Thinner Inner Ring: rgba(255,255,255,0.12) */}
          <Path
            d={innerDiscRingD}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth={1}
            fill="none"
          />

          {/* 5. Progress Arc: faint track rgba(255,255,255,0.18) */}
          <Path
            d={bgTrackD}
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />

          {/* Active white progress arc (3pt, #FFFFFF) */}
          {Boolean(activeProgD) && (
            <Path
              d={activeProgD}
              stroke="#FFFFFF"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* White Knob at current position (14pt circle) */}
          <Circle cx={knobX} cy={knobY} r={7} fill="#FFFFFF" />
        </Svg>

        {/* Invisible touch & drag responder over the progress arc */}
        <View style={styles.arcPanZone} {...panResponder.panHandlers} />

        {/* 6. Centre of the disc: Heart, Time text, Decorative curved bar */}
        <View style={styles.discCenterContent}>
          <TouchableOpacity
            onPress={() => toggleLike(currentTrack)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              color="#FFFFFF"
              fill={liked ? '#FFFFFF' : 'transparent'}
              size={28}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Time text: 0:46 / 3:18 in #B4B6B5 14pt */}
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(trackDuration)}
          </Text>

          {/* Small white curved decorative bar (60 x 4, rounded) */}
          <View style={styles.decorativeCurvedBar} />
        </View>

        {/* 7. Controls row */}
        <View style={styles.controlsSection}>
          {/* Sub-row: Shuffle and Repeat */}
          <View style={styles.shuffleRepeatRow}>
            <TouchableOpacity
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

            <TouchableOpacity
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
          </View>

          {/* Main Controls Row: Previous, Big White Play/Pause Circle, Next */}
          <View style={styles.mainControlsRow}>
            <TouchableOpacity
              onPress={previous}
              activeOpacity={0.75}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <SkipBack color="#FFFFFF" size={34} fill="#FFFFFF" />
            </TouchableOpacity>

            {/* Big white play/pause circle (92pt) inside dark ring (120pt) */}
            <View style={styles.darkPlayRing}>
              <TouchableOpacity
                style={styles.whitePlayCircle}
                onPress={togglePlayPause}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : isPlaying ? (
                  <Pause color="#000000" size={38} fill="#000000" />
                ) : (
                  <Play color="#000000" size={38} fill="#000000" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={next}
              activeOpacity={0.75}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <SkipForward color="#FFFFFF" size={34} fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 8. Bottom pill bar: height 56, radius 28, background #111110 */}
        <View style={[styles.bottomPillBar, { marginBottom: Math.max(16, insets.bottom + 10) }]}>
          <TouchableOpacity
            onPress={() => setShowSource(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MonitorSpeaker color="#FFFFFF" size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLyrics(true)}
            activeOpacity={0.8}
            style={styles.lyricsPillCenter}
          >
            <Text style={styles.lyricsPillText}>Lyrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowQueue(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ListMusic color="#FFFFFF" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Error banner if stream failure occurs */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={retry}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Tap to retry</Text>
        </TouchableOpacity>
      )}

      {/* Full Lyrics Sheet Modal */}
      <Modal
        visible={showLyrics}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLyrics(false)}
      >
        <View style={styles.lyricsModalContainer}>
          <View style={styles.lyricsModalHeader}>
            <Text style={styles.lyricsModalTitle}>Lyrics</Text>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowLyrics(false)}
            >
              <X color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
          <View style={styles.lyricsCardWrap}>
            <LyricsCard track={currentTrack} onSeek={seekTo} />
          </View>
        </View>
      </Modal>

      {/* Queue Sheet Modal */}
      <Modal
        visible={showQueue}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQueue(false)}
      >
        <View style={styles.queueModalContainer}>
          <View style={styles.queueModalHeader}>
            <Text style={styles.queueModalTitle}>Up Next ({upcoming.length})</Text>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowQueue(false)}
            >
              <X color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.queueList}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {upcoming.length > 0 ? (
              upcoming.slice(0, 15).map((t, idx) => (
                <TouchableOpacity
                  key={`${t.id}-${idx}`}
                  style={styles.queueRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    jumpTo(t.id);
                    setShowQueue(false);
                  }}
                >
                  <Image source={{ uri: t.albumImageUrl }} style={styles.queueThumb} />
                  <View style={styles.queueRowInfo}>
                    <Text style={styles.queueRowTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={styles.queueRowArtist} numberOfLines={1}>
                      {t.artist.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromQueue(t.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X color="#6B7C96" size={16} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.queueEmptyText}>Queue is empty</Text>
            )}
          </ScrollView>
        </View>
      </Modal>

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
    overflow: 'hidden',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  topHeader: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  whiteTopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  captionOverlay: {
    position: 'absolute',
    left: 20,
    bottom: 38,
    right: 20,
    zIndex: 6,
  },
  captionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  captionArtist: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#B4B6B5',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  discContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  arcPanZone: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    height: 70,
    zIndex: 8,
  },
  discCenterContent: {
    alignItems: 'center',
    marginTop: 48,
    zIndex: 5,
  },
  timeText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#B4B6B5',
    marginTop: 6,
  },
  decorativeCurvedBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  controlsSection: {
    marginTop: 12,
    paddingHorizontal: 28,
  },
  shuffleRepeatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  mainControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkPlayRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0A0A0A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whitePlayCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPillBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginTop: 16,
  },
  lyricsPillCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lyricsPillText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBanner: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
    borderWidth: 1,
    borderColor: '#FF3366',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    zIndex: 20,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  errorHint: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#B4B6B5',
    marginTop: 2,
  },
  lyricsModalContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    marginTop: 80,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  lyricsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lyricsModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lyricsCardWrap: {
    flex: 1,
  },
  queueModalContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    marginTop: 100,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  queueModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  queueModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  queueList: {
    flex: 1,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  queueThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  queueRowInfo: {
    flex: 1,
  },
  queueRowTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#FFFFFF',
  },
  queueRowArtist: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#8A99AD',
    marginTop: 2,
  },
  queueEmptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#8A99AD',
    textAlign: 'center',
    marginTop: 40,
  },
});
