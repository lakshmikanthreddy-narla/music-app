import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronDown,
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
  ListPlus,
  X,
  FileText,
  MoreHorizontal,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { PlaybackSourceSheet } from '../components/player/PlaybackSourceSheet';
import { SeekBar } from '../components/player/SeekBar';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';
import { LyricsCard } from '../components/player/LyricsCard';
import { CdTurntable } from '../components/player/CdTurntable';
import { Track } from '../core/types';
import { usePlayer } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

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
    queueContext,
    jumpTo,
    removeFromQueue,
  } = usePlayer();

  const { isLiked, toggleLike } = useLibrary();
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  if (!currentTrack) return null;

  const liked = isLiked(currentTrack.id);
  const busy = isLoading || isBuffering;

  const toggleLyricsView = () => {
    setShowLyrics(!showLyrics);
    if (!showLyrics) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Hero Photo (full-bleed top 42% of screen) */}
      <View style={styles.heroBackgroundContainer}>
        <Image
          source={require('../../assets/ui/hero_now_playing.jpg')}
          style={styles.heroBackgroundImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(13, 13, 13, 0.6)', '#0D0D0D']}
          locations={[0.2, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top + SIZES.xs, paddingBottom: insets.bottom + SIZES.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: White Circles with Black Icons */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.whiteHeaderIconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronDown color="#000000" size={22} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerSub}>PLAYING FROM</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {queueContext || 'SONIC CUBE'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.whiteHeaderIconBtn}
            onPress={() => setAddingTrack(currentTrack)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MoreHorizontal color="#000000" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* CD-Style Turntable Centerpiece */}
        <CdTurntable
          albumImageUrl={currentTrack.albumImageUrl}
          isPlaying={isPlaying}
          isLiked={liked}
          onToggleLike={() => toggleLike(currentTrack)}
        />

        {/* Track Title & Artist */}
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.artist.name}
          </Text>
        </View>

        {/* Linear Scrubber SeekBar */}
        <View style={styles.seekContainer}>
          <SeekBar onSeek={seekTo} />
        </View>

        {/* Playback Controls Row */}
        <View style={styles.controlsRow}>
          {/* Shuffle */}
          <TouchableOpacity
            onPress={toggleShuffle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Shuffle
              color={shuffle ? '#FFFFFF' : '#777777'}
              size={22}
              strokeWidth={shuffle ? 2.5 : 2}
            />
          </TouchableOpacity>

          {/* Previous Track */}
          <TouchableOpacity
            onPress={previous}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <SkipBack color="#FFFFFF" size={28} />
          </TouchableOpacity>

          {/* Large White Play/Pause Button inside Dark Ring */}
          <View style={styles.playButtonRing}>
            <TouchableOpacity
              style={styles.whitePlayButton}
              onPress={togglePlayPause}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : isPlaying ? (
                <Pause color="#000000" size={30} fill="#000000" />
              ) : (
                <Play color="#000000" size={30} fill="#000000" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Next Track */}
          <TouchableOpacity
            onPress={next}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <SkipForward color="#FFFFFF" size={28} />
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            onPress={cycleRepeat}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {repeat === 'one' ? (
              <Repeat1 color="#FFFFFF" size={22} strokeWidth={2.5} />
            ) : (
              <Repeat
                color={repeat === 'all' ? '#FFFFFF' : '#777777'}
                size={22}
                strokeWidth={repeat === 'all' ? 2.5 : 2}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Dark Pill Bar: #111110, radius 24 */}
        <View style={styles.bottomPillBar}>
          <TouchableOpacity
            onPress={() => setShowSource(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MonitorSpeaker color="#FFFFFF" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleLyricsView}
            activeOpacity={0.8}
            style={styles.lyricsTouchCenter}
          >
            <Text style={styles.lyricsPillText}>Lyrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowQueue(!showQueue)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ListMusic color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Synchronized Scrolling Lyrics Card */}
        {showLyrics && (
          <View style={styles.lyricsCardContainer}>
            <LyricsCard
              track={currentTrack}
              onSeek={seekTo}
            />
          </View>
        )}

        {/* Up Next Queue */}
        {showQueue && (
          <View style={styles.queueContainer}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>Up Next ({upcoming.length})</Text>
              <TouchableOpacity onPress={() => setShowQueue(false)}>
                <X color="#8A99AD" size={18} />
              </TouchableOpacity>
            </View>
            {upcoming.length > 0 ? (
              upcoming.slice(0, 10).map((t, idx) => (
                <TouchableOpacity
                  key={`${t.id}-${idx}`}
                  style={styles.queueItem}
                  onPress={() => jumpTo(t.id)}
                >
                  <Image source={{ uri: t.albumImageUrl }} style={styles.queueThumb} />
                  <View style={styles.queueInfo}>
                    <Text style={styles.queueTrackTitle} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.queueTrackArtist} numberOfLines={1}>{t.artist.name}</Text>
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
              <Text style={styles.queueEmpty}>Queue is empty</Text>
            )}
          </View>
        )}

        {/* Error notification if any */}
        {error && (
          <TouchableOpacity style={styles.errorBanner} onPress={retry}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>Tap to retry</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />
      <PlaybackSourceSheet visible={showSource} onClose={() => setShowSource(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.45,
    overflow: 'hidden',
  },
  heroBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.xs,
  },
  whiteHeaderIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.activeWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerSub: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.text.secondary,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  trackInfo: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: SIZES.xs,
    paddingHorizontal: SIZES.md,
  },
  trackTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  trackArtist: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  seekContainer: {
    marginVertical: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    marginVertical: SIZES.sm,
  },
  playButtonRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.tabBar,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whitePlayButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: COLORS.activeWhite,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPillBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.tabBar,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    marginTop: SIZES.xs,
    marginBottom: SIZES.md,
  },
  lyricsTouchCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lyricsPillText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lyricsCardContainer: {
    marginTop: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  queueContainer: {
    marginTop: SIZES.md,
    padding: SIZES.md,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  queueTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  queueThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 10,
  },
  queueInfo: {
    flex: 1,
  },
  queueTrackTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  queueTrackArtist: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#8A99AD',
  },
  queueEmpty: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#8A99AD',
    textAlign: 'center',
    paddingVertical: SIZES.md,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 51, 102, 0.15)',
    borderWidth: 1,
    borderColor: '#FF3366',
    borderRadius: 12,
    padding: 12,
    marginTop: SIZES.md,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  errorHint: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#8A99AD',
    marginTop: 2,
  },
});
