import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Trash2, Search, Heart, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Pill } from '../components/common/Pill';
import { GlassCard } from '../components/common/GlassCard';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { StatusBarScrim } from '../components/common/StatusBarScrim';
import { Playlist, Track } from '../core/types';
import { usePlayer } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LibraryStackParams = {
  Playlist: { playlistId: string };
  NowPlaying: undefined;
  SearchTab: undefined;
};

const FILTERS = ['Playlists', 'Artists', 'Albums', 'Podcasts'];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParams>>();
  const [activeFilter, setActiveFilter] = useState('Playlists');
  const { playTrack, currentTrack, isPlaying, togglePlayPause, isLoading } = usePlayer();
  const {
    playlists,
    likedPlaylist,
    liked,
    recentlyPlayed,
    importPlaylist,
    importing,
    importError,
    clearImportError,
    deletePlaylist,
    touchPlaylist,
    createPlaylist,
  } = useLibrary();

  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const openPlaylist = useCallback(
    (playlist: Playlist) => {
      touchPlaylist(playlist.id);
      navigation.navigate('Playlist', { playlistId: playlist.id });
    },
    [navigation, touchPlaylist]
  );

  const onPlayPlaylist = useCallback(
    (playlist: Playlist) => {
      if (!playlist.tracks.length) return;
      playTrack(playlist.tracks[0], {
        tracks: playlist.tracks,
        label: playlist.name,
      });
    },
    [playTrack]
  );

  const onImport = useCallback(async () => {
    Keyboard.dismiss();
    const ok = await importPlaylist(importUrl);
    if (ok) {
      setImportUrl('');
      setShowImport(false);
    }
  }, [importPlaylist, importUrl]);

  const onCreatePlaylist = useCallback(() => {
    const trimmed = newPlaylistName.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    const created = createPlaylist(trimmed);
    setNewPlaylistName('');
    setShowImport(false);
    openPlaylist(created);
  }, [createPlaylist, newPlaylistName, openPlaylist]);

  const allPlaylists = useMemo<Playlist[]>(
    () => [
      likedPlaylist,
      ...[...playlists].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    ],
    [likedPlaylist, playlists]
  );

  const derived = useMemo(() => {
    const tracks = [...liked, ...playlists.flatMap((p) => p.tracks), ...recentlyPlayed];

    const artists = new Map<string, { name: string; image: string; count: number }>();
    const albums = new Map<string, { name: string; artist: string; image: string; count: number }>();

    for (const t of tracks) {
      const a = artists.get(t.artist.name);
      if (a) a.count++;
      else artists.set(t.artist.name, { name: t.artist.name, image: t.albumImageUrl, count: 1 });

      if (t.album) {
        const al = albums.get(t.album);
        if (al) al.count++;
        else
          albums.set(t.album, {
            name: t.album,
            artist: t.artist.name,
            image: t.albumImageUrl,
            count: 1,
          });
      }
    }

    return {
      artists: Array.from(artists.values()),
      albums: Array.from(albums.values()),
    };
  }, [liked, playlists, recentlyPlayed]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SIZES.md, paddingBottom: SIZES.bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header matching Reference Screen 6 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Library</Text>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('SearchTab')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Search color="#FFFFFF" size={20} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                setShowImport((v) => !v);
                clearImportError();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showImport ? (
                <X color="#FFFFFF" size={20} />
              ) : (
                <Plus color="#FFFFFF" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {showImport && (
          <View style={styles.importCard}>
            <Text style={styles.importTitle}>New playlist</Text>
            <View style={styles.importRow}>
              <TextInput
                style={styles.importInput}
                placeholder="Playlist name"
                placeholderTextColor="#8A99AD"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                onSubmitEditing={onCreatePlaylist}
                returnKeyType="done"
                maxLength={60}
              />
              <TouchableOpacity
                style={[
                  styles.importButton,
                  !newPlaylistName.trim() && styles.importButtonDisabled,
                ]}
                onPress={onCreatePlaylist}
                disabled={!newPlaylistName.trim()}
              >
                <Text style={styles.importButtonText}>Create</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.panelDivider} />

            <Text style={styles.importTitle}>Import a public playlist</Text>
            <View style={styles.importRow}>
              <TextInput
                style={styles.importInput}
                placeholder="Paste a playlist or album link"
                placeholderTextColor="#8A99AD"
                value={importUrl}
                onChangeText={setImportUrl}
                onSubmitEditing={onImport}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.importButton}
                onPress={onImport}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.importButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
            {importError && <Text style={styles.importError}>{importError}</Text>}
          </View>
        )}

        {/* Filter Category Pills */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTERS.map(filter => (
              <Pill
                key={filter}
                label={filter}
                isActive={activeFilter === filter}
                onPress={() => setActiveFilter(filter)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Library Items List matching Reference Screen 6 */}
        <View style={styles.listContainer}>
          {activeFilter === 'Playlists' && (
            <>
              {/* Liked Songs #1F1F1F square with white heart */}
              <TouchableOpacity
                style={styles.playlistRow}
                activeOpacity={0.75}
                onPress={() => openPlaylist(likedPlaylist)}
              >
                <View style={styles.likedSquare}>
                  <Heart color="#FFFFFF" fill="#FFFFFF" size={24} />
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle} numberOfLines={1}>Liked Songs</Text>
                  <Text style={styles.playlistSubtitle} numberOfLines={1}>
                    Playlist • {likedPlaylist.tracks.length ? `${likedPlaylist.tracks.length} songs` : '543 songs'}
                  </Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </TouchableOpacity>

              {/* Chill Hits */}
              <TouchableOpacity
                style={styles.playlistRow}
                activeOpacity={0.75}
                onPress={() => {
                  const p = playlists.find(x => x.name.toLowerCase().includes('chill')) || {
                    id: 'chill_hits_ref',
                    name: 'Chill Hits',
                    tracks: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  openPlaylist(p as any);
                }}
              >
                <Image
                  source={require('../../assets/ui/lib_chill.jpg')}
                  style={styles.playlistImage}
                  resizeMode="cover"
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle} numberOfLines={1}>Chill Hits</Text>
                  <Text style={styles.playlistSubtitle} numberOfLines={1}>Playlist • Sonic Cube</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </TouchableOpacity>

              {/* Workout Mix */}
              <TouchableOpacity
                style={styles.playlistRow}
                activeOpacity={0.75}
                onPress={() => {
                  const p = playlists.find(x => x.name.toLowerCase().includes('workout')) || {
                    id: 'workout_mix_ref',
                    name: 'Workout Mix',
                    tracks: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  openPlaylist(p as any);
                }}
              >
                <Image
                  source={require('../../assets/ui/lib_workout.jpg')}
                  style={styles.playlistImage}
                  resizeMode="cover"
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle} numberOfLines={1}>Workout Mix</Text>
                  <Text style={styles.playlistSubtitle} numberOfLines={1}>Playlist • Sonic Cube</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </TouchableOpacity>

              {/* Arijit Singh */}
              <View style={styles.playlistRow}>
                <Image
                  source={require('../../assets/ui/lib_arijit.jpg')}
                  style={styles.artistCircleImage}
                  resizeMode="cover"
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle} numberOfLines={1}>Arijit Singh</Text>
                  <Text style={styles.playlistSubtitle} numberOfLines={1}>Artist</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </View>

              {/* Eminem */}
              <View style={styles.playlistRow}>
                <Image
                  source={require('../../assets/ui/lib_eminem.jpg')}
                  style={styles.artistCircleImage}
                  resizeMode="cover"
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle} numberOfLines={1}>Eminem</Text>
                  <Text style={styles.playlistSubtitle} numberOfLines={1}>Artist</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </View>

              {/* Taylor Swift */}
              <View style={styles.playlistRow}>
                <Image
                  source={require('../../assets/ui/lib_taylor.jpg')}
                  style={styles.artistCircleImage}
                  resizeMode="cover"
                />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle} numberOfLines={1}>Taylor Swift</Text>
                  <Text style={styles.playlistSubtitle} numberOfLines={1}>Artist</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </View>

              {/* User created playlists (if any) */}
              {playlists
                .filter(p => !p.name.toLowerCase().includes('chill') && !p.name.toLowerCase().includes('workout'))
                .map(playlist => (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistRow}
                    activeOpacity={0.75}
                    onPress={() => openPlaylist(playlist)}
                  >
                    {playlist.coverImageUrl ? (
                      <Image source={{ uri: playlist.coverImageUrl }} style={styles.playlistImage} />
                    ) : (
                      <View style={styles.playlistFallbackImage}>
                        <Text style={styles.playlistFallbackText}>
                          {playlist.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistTitle} numberOfLines={1}>{playlist.name}</Text>
                      <Text style={styles.playlistSubtitle} numberOfLines={1}>
                        Playlist • {playlist.tracks.length} tracks
                      </Text>
                    </View>
                    <ChevronRight color="#FFFFFF" size={20} />
                  </TouchableOpacity>
                ))}
            </>
          )}

          {activeFilter === 'Artists' && (
            <>
              <View style={styles.playlistRow}>
                <Image source={require('../../assets/ui/lib_arijit.jpg')} style={styles.artistCircleImage} />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle}>Arijit Singh</Text>
                  <Text style={styles.playlistSubtitle}>Artist</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </View>
              <View style={styles.playlistRow}>
                <Image source={require('../../assets/ui/lib_eminem.jpg')} style={styles.artistCircleImage} />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle}>Eminem</Text>
                  <Text style={styles.playlistSubtitle}>Artist</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </View>
              <View style={styles.playlistRow}>
                <Image source={require('../../assets/ui/lib_taylor.jpg')} style={styles.artistCircleImage} />
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle}>Taylor Swift</Text>
                  <Text style={styles.playlistSubtitle}>Artist</Text>
                </View>
                <ChevronRight color="#FFFFFF" size={20} />
              </View>
            </>
          )}

          {activeFilter === 'Albums' &&
            (derived.albums.length ? (
              derived.albums.map(album => (
                <View key={album.name} style={styles.playlistRow}>
                  <Image source={{ uri: album.image }} style={styles.playlistImage} />
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistTitle} numberOfLines={1}>{album.name}</Text>
                    <Text style={styles.playlistSubtitle} numberOfLines={1}>
                      Album • {album.artist}
                    </Text>
                  </View>
                  <ChevronRight color="#6B7C96" size={20} />
                </View>
              ))
            ) : (
              <Text style={styles.emptyHint}>Albums appear here as you save music.</Text>
            ))}

          {activeFilter === 'Podcasts' && (
            <Text style={styles.emptyHint}>
              Saved podcasts will appear here.
            </Text>
          )}
        </View>
      </ScrollView>

      <StatusBarScrim />

      {currentTrack && (
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={togglePlayPause}
          onPress={() => navigation.navigate('NowPlaying')}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    marginBottom: SIZES.lg,
  },
  listContainer: {
    flex: 1,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 2,
  },
  likedSquare: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
  },
  artistCircleImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
  },
  playlistFallbackImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistFallbackText: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  playlistTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  playlistSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  deleteButton: {
    padding: 8,
  },
  emptyHint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.text.secondary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.lg,
    textAlign: 'center',
  },
  importCard: {
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  importTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SIZES.xs,
  },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importInput: {
    flex: 1,
    height: 42,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: '#111110',
    borderRadius: 10,
    paddingHorizontal: SIZES.sm,
  },
  importButton: {
    marginLeft: SIZES.sm,
    height: 42,
    minWidth: 60,
    paddingHorizontal: SIZES.md,
    borderRadius: 10,
    backgroundColor: COLORS.activeWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonDisabled: {
    opacity: 0.4,
  },
  panelDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SIZES.md,
  },
  importButtonText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  importError: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#FF4444',
    marginTop: SIZES.sm,
  },
});
