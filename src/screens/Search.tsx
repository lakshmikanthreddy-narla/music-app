import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, Mic, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Pill } from '../components/common/Pill';
import { GlassCard } from '../components/common/GlassCard';
import { TrackRow } from '../components/lists/TrackRow';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { StatusBarScrim } from '../components/common/StatusBarScrim';
import { BROWSE_CATEGORIES } from '../data/catalog';
import { SearchFilter, Track } from '../core/types';
import { useSearch } from '../hooks/useSearch';
import { usePlayer } from '../hooks/usePlayer';
import { MusicService } from '../services/MusicService';
import { useNavigation } from '@react-navigation/native';
import { startVoiceSearch } from '../../modules/note-native';

const { width } = Dimensions.get('window');

const FILTERS: SearchFilter[] = ['All', 'Songs', 'Artists', 'Albums', 'Playlists'];

// Genre cards gradient definitions matching PDF Page 4
const CATEGORY_GRADIENTS: Record<string, readonly [string, string]> = {
  c1: ['#0A4D68', '#051923'], // Top Charts
  c2: ['#7928CA', '#2B0938'], // New Releases
  c3: ['#1A365D', '#0B192C'], // Mood
  c4: ['#00796B', '#004D40'], // Party
  c5: ['#4A148C', '#1A0033'], // Chill
  c6: ['#1B5E20', '#0A290E'], // Workout
  c7: ['#C2185B', '#4A0E2E'], // Pop
  c8: ['#B45309', '#3D1C02'], // Hip Hop
  c9: ['#880E4F', '#2E0318'], // Rock
  c10: ['#C2410C', '#431407'], // Indie
  c11: ['#00B4D8', '#003554'], // EDM
  c12: ['#4A0E4E', '#190019'], // Classical
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    query,
    setQuery,
    filter,
    setFilter,
    results,
    isSearching,
    error,
    searchNow,
    retry,
    clear,
    hasResults,
  } = useSearch();

  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = useCallback(async () => {
    Keyboard.dismiss();
    setIsListening(true);
    try {
      const text = await startVoiceSearch();
      if (text && text.trim().length > 0) {
        setQuery(text.trim());
        searchNow(text.trim());
      }
    } catch {
      // Ignore
    } finally {
      setIsListening(false);
    }
  }, [setQuery, searchNow]);

  const isBrowsing = query.trim().length === 0;

  const onPlayTrack = useCallback(
    (track: Track) => {
      Keyboard.dismiss();
      playTrack(track, {
        tracks: results.tracks,
        label: `Search • ${results.query}`,
      });
    },
    [playTrack, results.tracks, results.query]
  );

  const onOpenCollection = useCallback(
    async (
      id: string,
      browseId: string,
      name: string,
      kind: 'album' | 'playlist'
    ) => {
      Keyboard.dismiss();
      setExpandingId(id);
      try {
        const page =
          kind === 'album'
            ? await MusicService.getAlbum(browseId)
            : await MusicService.getPlaylist(browseId);

        if (page.tracks.length) {
          playTrack(page.tracks[0], { tracks: page.tracks, label: name });
        }
      } catch {
        // Silent
      } finally {
        setExpandingId(null);
      }
    },
    [playTrack]
  );

  const onOpenArtist = useCallback(
    async (id: string, browseId: string, name: string) => {
      Keyboard.dismiss();
      setExpandingId(id);
      try {
        const page = await MusicService.getArtist(browseId);
        if (page.tracks.length) {
          playTrack(page.tracks[0], { tracks: page.tracks, label: name });
        }
      } catch {
        // Silent
      } finally {
        setExpandingId(null);
      }
    },
    [playTrack]
  );

  const artistRows = useMemo(
    () =>
      results.artists.map((artist) => ({
        id: artist.id,
        title: artist.name,
        artist: { id: artist.id, name: artist.subtitle ?? 'Artist' },
        albumImageUrl: artist.imageUrl,
        duration: 0,
        provider: artist.provider,
        sourceId: artist.browseId,
      })),
    [results.artists]
  );

  const albumRows = useMemo(
    () =>
      results.albums.map((album) => ({
        id: album.id,
        title: album.title,
        artist: {
          id: album.id,
          name: album.year ? `${album.artist} • ${album.year}` : album.artist,
        },
        albumImageUrl: album.coverImageUrl,
        duration: 0,
        provider: album.provider,
        sourceId: album.browseId,
      })),
    [results.albums]
  );

  const playlistRows = useMemo(
    () =>
      results.playlists.map((playlist) => ({
        id: playlist.id,
        title: playlist.name,
        artist: { id: playlist.id, name: playlist.creator },
        albumImageUrl: playlist.coverImageUrl,
        duration: 0,
        provider: playlist.provider,
        sourceId: playlist.browseId,
      })),
    [results.playlists]
  );

  const openArtistRow = useCallback(
    (track: Track) => onOpenArtist(track.id, track.sourceId, track.title),
    [onOpenArtist]
  );
  const openAlbumRow = useCallback(
    (track: Track) => onOpenCollection(track.id, track.sourceId, track.title, 'album'),
    [onOpenCollection]
  );
  const openPlaylistRow = useCallback(
    (track: Track) => onOpenCollection(track.id, track.sourceId, track.title, 'playlist'),
    [onOpenCollection]
  );

  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1326', '#060B18', '#040710']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SIZES.md, paddingBottom: SIZES.bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Search</Text>

        {/* Search Input Bar with Voice Mic */}
        <View style={styles.searchContainer}>
          <SearchIcon color={COLORS.text.secondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Artists, songs, albums, playlists..."
            placeholderTextColor="#8A99AD"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => searchNow(query)}
            returnKeyType="search"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => (query ? clear() : handleVoiceSearch())}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            disabled={isListening}
            style={styles.micButton}
          >
            {query ? (
              <X color={COLORS.text.secondary} size={20} />
            ) : isListening ? (
              <ActivityIndicator size="small" color={COLORS.accent.cyan} />
            ) : (
              <Mic color={COLORS.accent.cyan} size={20} />
            )}
          </TouchableOpacity>
        </View>

        {query.trim().length > 0 && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FILTERS.map((f) => (
                <Pill
                  key={f}
                  label={f}
                  isActive={filter === f}
                  onPress={() => setFilter(f)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {isBrowsing ? (
          <>
            <Text style={styles.sectionTitle}>Browse All</Text>

            <View style={styles.categoriesGrid}>
              {BROWSE_CATEGORIES.map((category) => {
                const gradient = CATEGORY_GRADIENTS[category.id] || ['#0D1B36', '#060B18'];
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCardWrapper}
                    activeOpacity={0.82}
                    onPress={() => {
                      setQuery(category.name);
                      searchNow(category.query);
                    }}
                  >
                    <View style={styles.categoryCard}>
                      <LinearGradient
                        colors={gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.categoryGlowCircle} />
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <>
            {error && (
              <TouchableOpacity activeOpacity={0.8} onPress={retry}>
                <GlassCard intensity={20} style={styles.stateCard}>
                  <Text style={styles.stateText}>{error}</Text>
                  <Text style={styles.stateHint}>Tap to try again</Text>
                </GlassCard>
              </TouchableOpacity>
            )}

            {isSearching && !hasResults && (
              <View style={styles.stateCenter}>
                <ActivityIndicator color={COLORS.accent.cyan} size="large" />
              </View>
            )}

            {!isSearching && !error && !hasResults && (
              <GlassCard intensity={20} style={styles.stateCard}>
                <Text style={styles.stateText}>No results for "{query.trim()}"</Text>
                <Text style={styles.stateHint}>Try a different spelling or genre</Text>
              </GlassCard>
            )}

            {results.tracks.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Songs</Text>
                <View style={styles.resultsList}>
                  {results.tracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onPress={onPlayTrack}
                      onMorePress={setAddingTrack}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                    />
                  ))}
                </View>
              </>
            )}

            {results.artists.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Artists</Text>
                <View style={styles.resultsList}>
                  {artistRows.map((row) => (
                    <TrackRow
                      key={row.id}
                      track={row}
                      onPress={openArtistRow}
                      isLoading={expandingId === row.id}
                    />
                  ))}
                </View>
              </>
            )}

            {results.albums.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Albums</Text>
                <View style={styles.resultsList}>
                  {albumRows.map((row) => (
                    <TrackRow
                      key={row.id}
                      track={row}
                      onPress={openAlbumRow}
                      isLoading={expandingId === row.id}
                    />
                  ))}
                </View>
              </>
            )}

            {results.playlists.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Playlists</Text>
                <View style={styles.resultsList}>
                  {playlistRows.map((row) => (
                    <TrackRow
                      key={row.id}
                      track={row}
                      onPress={openPlaylistRow}
                      isLoading={expandingId === row.id}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <StatusBarScrim />

      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />

      {currentTrack && (
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
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
  scrollContent: {
    paddingHorizontal: SIZES.md,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SIZES.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 42, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 212, 255, 0.28)',
    borderRadius: 28,
    paddingHorizontal: SIZES.md,
    height: 52,
    marginBottom: SIZES.lg,
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: SIZES.sm,
  },
  micButton: {
    padding: 6,
  },
  filtersContainer: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SIZES.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  categoryCard: {
    height: 92,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryGlowCircle: {
    position: 'absolute',
    right: -15,
    bottom: -15,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryName: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultsList: {
    marginBottom: SIZES.lg,
  },
  stateCard: {
    padding: SIZES.md,
    marginBottom: SIZES.lg,
    borderRadius: 14,
  },
  stateText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  stateHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  stateCenter: {
    paddingVertical: SIZES.xxl,
    alignItems: 'center',
  },
});
