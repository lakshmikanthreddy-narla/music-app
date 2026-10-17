import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Pause, Heart, Download, MoreHorizontal, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { TrackRow } from '../components/lists/TrackRow';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { GlassCard } from '../components/common/GlassCard';
import { Track } from '../core/types';
import { usePlayer } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';

const { width } = Dimensions.get('window');

type PlaylistRouteParams = { playlistId: string };
type PlaylistRoute = RouteProp<{ Playlist: PlaylistRouteParams }, 'Playlist'>;

export default function PlaylistDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<PlaylistRoute>();
  const { playlistId } = route.params;

  const { playlists, likedPlaylist, isLiked, toggleLike } = useLibrary();
  const {
    playTrack,
    addToQueue,
    currentTrack,
    isPlaying,
    isLoading,
    togglePlayPause,
    shuffle,
    toggleShuffle,
  } = usePlayer();

  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  const playlist = useMemo(
    () => (playlistId === 'liked' ? likedPlaylist : playlists.find((p) => p.id === playlistId)),
    [playlistId, playlists, likedPlaylist]
  );

  const tracks = playlist?.tracks ?? [];
  const isPlayingThisPlaylist = currentTrack && tracks.some((t) => t.id === currentTrack.id) && isPlaying;

  const playFromStart = useCallback(() => {
    if (!tracks.length || !playlist) return;
    if (isPlayingThisPlaylist) {
      togglePlayPause();
      return;
    }
    if (shuffle) toggleShuffle();
    playTrack(tracks[0], { tracks, label: playlist.name });
  }, [tracks, playlist, playTrack, shuffle, toggleShuffle, isPlayingThisPlaylist, togglePlayPause]);

  const onTrackPress = useCallback(
    (track: Track) => {
      if (!playlist) return;
      playTrack(track, { tracks, label: playlist.name });
    },
    [playTrack, tracks, playlist]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Track; index: number }) => (
      <View style={styles.numberedTrackRow}>
        <Text style={styles.trackIndex}>{index + 1}</Text>
        <View style={styles.trackRowFlex}>
          <TrackRow
            track={item}
            onPress={onTrackPress}
            onMorePress={setAddingTrack}
            isPlaying={currentTrack?.id === item.id && isPlaying}
          />
        </View>
      </View>
    ),
    [onTrackPress, currentTrack?.id, isPlaying]
  );

  if (!playlist) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SIZES.lg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleNavButton}>
          <ChevronLeft color="#FFFFFF" size={26} />
        </TouchableOpacity>
        <GlassCard intensity={20} style={styles.emptyCard}>
          <Text style={styles.emptyText}>This playlist is no longer available.</Text>
        </GlassCard>
      </View>
    );
  }

  const header = (
    <View style={styles.headerBlock}>
      {/* Top action row */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.circleNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>

      {/* Album cover artwork */}
      <View style={styles.artworkWrap}>
        {playlist.coverImageUrl ? (
          <Image source={{ uri: playlist.coverImageUrl }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artworkFallback]}>
            <Image
              source={require('../../assets/soniq-logo.png')}
              style={styles.fallbackLogo}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {/* Title & info matching PDF Page 5 */}
      <Text style={styles.title} numberOfLines={2}>{playlist.name}</Text>
      <Text style={styles.description}>
        {playlist.description || 'Relax and unwind with the best tracks on SONIQ.'}
      </Text>
      <Text style={styles.meta}>
        SONIQ • {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
      </Text>

      {/* Actions Row: Heart, Download, Share, and large Cyan Play button */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart color={COLORS.accent.cyan} size={22} fill={COLORS.accent.cyan} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Download color="#8A99AD" size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Share2 color="#8A99AD" size={22} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.bigCyanPlayBtn, !tracks.length && styles.actionDisabled]}
          activeOpacity={0.85}
          onPress={playFromStart}
          disabled={!tracks.length}
        >
          {isPlayingThisPlaylist ? (
            <Pause color="#060B18" size={26} fill="#060B18" />
          ) : (
            <Play color="#060B18" size={26} fill="#060B18" style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0E1B38', '#060B18', '#03060C']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <GlassCard intensity={20} style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {playlist.id === 'liked'
                ? 'Tap the heart on any song to save it here.'
                : 'This playlist is empty.'}
            </Text>
          </GlassCard>
        }
        contentContainerStyle={{
          paddingTop: insets.top + SIZES.sm,
          paddingBottom: SIZES.bottomInset,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={9}
        removeClippedSubviews
      />

      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />

      {currentTrack && (
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={togglePlayPause}
          onPress={() => navigation.navigate('NowPlaying' as never)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBlock: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  circleNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(13, 27, 54, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  artworkWrap: {
    alignItems: 'center',
    marginVertical: SIZES.sm,
  },
  artwork: {
    width: width * 0.58,
    height: width * 0.58,
    borderRadius: 18,
    backgroundColor: '#0F1E3D',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  artworkFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLogo: {
    width: '60%',
    height: '60%',
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: SIZES.md,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#8A99AD',
    marginTop: 4,
    lineHeight: 18,
  },
  meta: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.accent.cyan,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.md,
    paddingTop: SIZES.xs,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconBtn: {
    padding: 6,
  },
  bigCyanPlayBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 8,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  numberedTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SIZES.md,
  },
  trackIndex: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '700',
    color: '#8A99AD',
    width: 22,
    textAlign: 'center',
  },
  trackRowFlex: {
    flex: 1,
  },
  emptyCard: {
    marginHorizontal: SIZES.md,
    padding: SIZES.lg,
    borderRadius: 14,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});
