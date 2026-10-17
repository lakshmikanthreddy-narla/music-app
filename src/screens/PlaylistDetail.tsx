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
import { ChevronLeft, Play, Pause, Heart, Download, MoreHorizontal, Share2, Shuffle } from 'lucide-react-native';
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

  const isLikedPlaylist = playlistId === 'liked';
  const isChillHits = playlist?.name?.toLowerCase().includes('chill');
  const isTodaysMix = playlist?.name?.toLowerCase().includes('today');

  const header = (
    <View style={styles.headerBlock}>
      {/* Top action row: #1B1B1B round buttons */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.circleNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color="#FFFFFF" size={22} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleNavButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>

      {/* Album cover artwork or Liked Songs Square */}
      {isLikedPlaylist ? (
        <View style={styles.likedHeroWrap}>
          <View style={styles.likedSquare}>
            <Heart color="#FFFFFF" fill="#FFFFFF" size={54} />
          </View>
          <Text style={styles.likedTitle}>Liked Songs</Text>
          <Text style={styles.likedSubtitle}>
            {tracks.length ? `${tracks.length} songs` : '543 songs'}
          </Text>

          {/* Liked Songs Action Row: Shuffle + White Play Button */}
          <View style={styles.likedActionRow}>
            <TouchableOpacity
              style={styles.circleNavButton}
              onPress={toggleShuffle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Shuffle color={shuffle ? '#FFFFFF' : '#B4B6B5'} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigWhitePlayBtn, !tracks.length && styles.actionDisabled]}
              activeOpacity={0.85}
              onPress={playFromStart}
              disabled={!tracks.length}
            >
              {isPlayingThisPlaylist ? (
                <Pause color="#000000" size={26} fill="#000000" />
              ) : (
                <Play color="#000000" size={26} fill="#000000" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Regular Playlist Cover */}
          <View style={styles.artworkWrap}>
            {isChillHits ? (
              <View style={styles.artworkContainer}>
                <Image
                  source={require('../../assets/ui/cover_chill_hits.jpg')}
                  style={styles.artwork}
                  resizeMode="cover"
                />
                <Text style={styles.coverTitleOverlay}>Chill Hits</Text>
              </View>
            ) : isTodaysMix ? (
              <View style={styles.artworkContainer}>
                <Image
                  source={require('../../assets/ui/cover_todays_mix.jpg')}
                  style={styles.artwork}
                  resizeMode="cover"
                />
              </View>
            ) : playlist.coverImageUrl ? (
              <View style={styles.artworkContainer}>
                <Image source={{ uri: playlist.coverImageUrl }} style={styles.artwork} resizeMode="cover" />
              </View>
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

          {/* Title & Info */}
          <Text style={styles.title} numberOfLines={2}>{playlist.name}</Text>
          <Text style={styles.description}>
            {isChillHits
              ? 'Relax and unwind with the best chill tracks.'
              : isTodaysMix
              ? 'Made for Antony • 50 songs'
              : playlist.description || 'Relax and unwind with the best tracks.'}
          </Text>
          <Text style={styles.meta}>
            {isChillHits
              ? 'TuneHive • 3.2M saves • 50 songs'
              : isTodaysMix
              ? '2.1M saves • 3h 12m'
              : `Sonic Cube • ${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}`}
          </Text>

          {/* Actions Row: Heart, Download, More, and 58pt White Play Button */}
          <View style={styles.actionsRow}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                style={styles.actionRoundBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => tracks[0] && toggleLike(tracks[0])}
              >
                <Heart color="#FFFFFF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionRoundBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Download color="#FFFFFF" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionRoundBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MoreHorizontal color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.bigWhitePlayBtn, !tracks.length && styles.actionDisabled]}
              activeOpacity={0.85}
              onPress={playFromStart}
              disabled={!tracks.length}
            >
              {isPlayingThisPlaylist ? (
                <Pause color="#000000" size={26} fill="#000000" />
              ) : (
                <Play color="#000000" size={26} fill="#000000" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>

      <FlatList
        data={tracks}
        keyExtractor={(item: any) => item.id}
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
    paddingHorizontal: 16,
    paddingBottom: SIZES.md,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  circleNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkWrap: {
    alignItems: 'center',
    marginVertical: SIZES.sm,
  },
  artworkContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  artwork: {
    width: width * 0.58,
    height: width * 0.58,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  coverTitleOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    fontFamily: FONTS.bold,
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  artworkFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLogo: {
    width: '60%',
    height: '60%',
  },
  likedHeroWrap: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  likedSquare: {
    width: 110,
    height: 110,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likedTitle: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 14,
    textAlign: 'center',
  },
  likedSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  likedActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    marginTop: 16,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 14,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text.meta,
    marginTop: 4,
    lineHeight: 20,
  },
  meta: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text.meta,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: SIZES.xs,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionRoundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigWhitePlayBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.activeWhite,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  numberedTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  trackIndex: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    width: 24,
    textAlign: 'left',
  },
  trackRowFlex: {
    flex: 1,
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: SIZES.lg,
    borderRadius: 14,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});
