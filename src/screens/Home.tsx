import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Play, Bell, ChevronRight, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { Pill } from '../components/common/Pill';
import { GlassCard } from '../components/common/GlassCard';
import { TrackRow } from '../components/lists/TrackRow';
import { AddToPlaylistSheet } from '../components/lists/AddToPlaylistSheet';
import { Track } from '../core/types';
import { FEATURED_QUERY, randomQueryFor } from '../data/catalog';
import { usePlayer } from '../hooks/usePlayer';
import { useLibrary } from '../hooks/useLibrary';
import { MusicService } from '../services/MusicService';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { StatusBarScrim } from '../components/common/StatusBarScrim';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Music', 'Podcasts', 'Chill', 'Workout'];

const greetingFor = (hour: number) =>
  hour < 12 ? 'Good Morning!' : hour < 18 ? 'Good Afternoon!' : 'Good Evening!';

// Curated collections matching PDF Page 3
const RECENT_CARDS = [
  { id: 'recent_1', title: 'Chill Hits', type: 'Playlist', query: 'chill hits relax', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80' },
  { id: 'recent_2', title: 'Arijit Singh', type: 'Artist', query: 'arijit singh best songs', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80' },
  { id: 'recent_3', title: "Today's Mix", type: 'Playlist', query: 'todays top hits', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80' },
  { id: 'recent_4', title: 'Rock', type: 'Playlist', query: 'classic rock hits', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80' },
];

const MADE_FOR_YOU = [
  { id: 'mfy_1', title: 'Discover Weekly', subtitle: 'New music for you', query: 'discover weekly new music', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80' },
  { id: 'mfy_2', title: 'Daily Mix 1', subtitle: 'Based on your listening', query: 'daily mix pop chill', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80' },
];

const TRENDING_NOW = [
  { id: 'trend_1', title: 'Top 50 Global', subtitle: 'Daily Chart', query: 'top 50 global songs', gradient: ['#13274F', '#091326'] as const, image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&q=80' },
  { id: 'trend_2', title: 'Viral Hits India', subtitle: 'Top Trending', query: 'viral hits india', gradient: ['#0A4D3C', '#07241D'] as const, image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=500&q=80' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState('All');
  const { playTrack, currentTrack, isPlaying, togglePlayPause, isLoading } = usePlayer();
  const { recentlyPlayed, liked, profile } = useLibrary();

  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
  const [featured, setFeatured] = useState<Track[]>([]);
  const [starter, setStarter] = useState<Track[]>([]);
  const [starterError, setStarterError] = useState(false);

  const hasRecents = recentlyPlayed.length > 0;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const results = await MusicService.search(FEATURED_QUERY, { limit: 10 });
        if (cancelled) return;

        setFeatured(results.tracks);
        setStarter(results.tracks.slice(0, 3));
        setStarterError(false);
      } catch {
        if (!cancelled) setStarterError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const playCollection = useCallback(
    async (cardId: string, title: string, query: string) => {
      setLoadingCardId(cardId);
      try {
        const results = await MusicService.search(query, { limit: 20 });
        if (results.tracks.length) {
          playTrack(results.tracks[0], { tracks: results.tracks, label: title });
        }
      } catch {
        // Silent
      } finally {
        setLoadingCardId(null);
      }
    },
    [playTrack]
  );

  const listTracks = useMemo(
    () => (hasRecents ? recentlyPlayed.slice(0, 4) : starter),
    [hasRecents, recentlyPlayed, starter]
  );

  const handleTrackPress = useCallback(
    (track: Track) => {
      playTrack(track, {
        tracks: listTracks,
        label: hasRecents ? 'Recently Played' : 'Start Listening',
      });
    },
    [playTrack, listTracks, hasRecents]
  );

  const [addingTrack, setAddingTrack] = useState<Track | null>(null);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0A1326', '#060B18', '#040710']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sticky Header: Profile Avatar, Greeting, Name, Notification Bell */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + SIZES.sm }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.avatarGlowWrapper}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab' as never)}
          >
            <View style={styles.avatarInner}>
              <User color={COLORS.accent.cyan} size={24} />
            </View>
          </TouchableOpacity>

          <View style={styles.greetingWrapper}>
            <Text style={styles.greetingText}>{greetingFor(new Date().getHours())}</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {profile.name || 'Antony Das'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Bell color="#FFFFFF" size={22} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Category Pills Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {CATEGORIES.map(cat => (
            <Pill
              key={cat}
              label={cat}
              isActive={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SIZES.bottomInset }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Recently Played */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <TouchableOpacity 
            style={styles.seeAllRow}
            onPress={() => navigation.navigate('LibraryTab' as never)}
          >
            <Text style={styles.seeAll}>See all</Text>
            <ChevronRight color={COLORS.text.secondary} size={14} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentCardsScroll}
        >
          {RECENT_CARDS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentCard}
              activeOpacity={0.8}
              onPress={() => playCollection(item.id, item.title, item.query)}
            >
              <View style={styles.recentImageContainer}>
                <Image source={{ uri: item.image }} style={styles.recentImage} />
                {loadingCardId === item.id ? (
                  <View style={styles.imageOverlayCenter}>
                    <ActivityIndicator size="small" color={COLORS.accent.cyan} />
                  </View>
                ) : (
                  <View style={styles.playMiniBadge}>
                    <Play color="#060B18" size={12} fill="#060B18" />
                  </View>
                )}
              </View>
              <Text style={styles.recentCardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.recentCardType} numberOfLines={1}>{item.type}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section: Made for You */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Made for You</Text>
        </View>

        <View style={styles.twoColumnGrid}>
          {MADE_FOR_YOU.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridCard}
              activeOpacity={0.85}
              onPress={() => playCollection(item.id, item.title, item.query)}
            >
              <Image source={{ uri: item.image }} style={styles.gridCardImage} />
              <LinearGradient
                colors={['transparent', 'rgba(6, 11, 24, 0.95)']}
                locations={[0.3, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gridCardContent}>
                {loadingCardId === item.id ? (
                  <ActivityIndicator size="small" color={COLORS.accent.cyan} style={styles.gridLoader} />
                ) : (
                  <View style={styles.cyanPlayBadge}>
                    <Play color="#060B18" size={14} fill="#060B18" />
                  </View>
                )}
                <Text style={styles.gridCardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.gridCardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section: Trending Now */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
        </View>

        <View style={styles.twoColumnGrid}>
          {TRENDING_NOW.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridCard}
              activeOpacity={0.85}
              onPress={() => playCollection(item.id, item.title, item.query)}
            >
              <Image source={{ uri: item.image }} style={styles.gridCardImage} />
              <LinearGradient
                colors={['transparent', 'rgba(6, 11, 24, 0.92)']}
                locations={[0.2, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.gridCardContent}>
                {loadingCardId === item.id ? (
                  <ActivityIndicator size="small" color={COLORS.accent.cyan} style={styles.gridLoader} />
                ) : (
                  <View style={styles.cyanPlayBadge}>
                    <Play color="#060B18" size={14} fill="#060B18" />
                  </View>
                )}
                <Text style={styles.gridCardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.gridCardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live track rows */}
        <View style={[styles.sectionHeader, { marginTop: SIZES.md }]}>
          <Text style={styles.sectionTitle}>
            {hasRecents ? 'Your Recents' : 'Quick Picks'}
          </Text>
        </View>

        <View style={styles.listContainer}>
          {listTracks.length > 0 ? (
            listTracks.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                onPress={handleTrackPress}
                onMorePress={setAddingTrack}
                isPlaying={currentTrack?.id === track.id && isPlaying}
              />
            ))
          ) : (
            <GlassCard intensity={20} style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {starterError ? "Couldn't load suggestions." : 'Finding something for you...'}
              </Text>
            </GlassCard>
          )}
        </View>

      </ScrollView>

      <StatusBarScrim />

      <AddToPlaylistSheet track={addingTrack} onClose={() => setAddingTrack(null)} />

      {currentTrack && (
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={togglePlayPause}
          onPress={() => {
            navigation.navigate('NowPlaying' as never);
          }}
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
  headerContainer: {
    paddingHorizontal: SIZES.md,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  avatarGlowWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    padding: 2,
    borderWidth: 1.5,
    borderColor: COLORS.accent.cyan,
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F1E3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  greetingText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#8A99AD',
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(13, 27, 54, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.accent.cyan,
  },
  pillsScroll: {
    paddingVertical: 4,
    paddingRight: SIZES.md,
  },
  scrollContent: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.lg,
    marginBottom: SIZES.md,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  recentCardsScroll: {
    paddingRight: SIZES.md,
    gap: 14,
  },
  recentCard: {
    width: 120,
  },
  recentImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F1E3D',
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  playMiniBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  imageOverlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 11, 24, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentCardTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  recentCardType: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#8A99AD',
    marginTop: 2,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    height: 135,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F1E3D',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
  },
  gridCardContent: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  gridLoader: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  cyanPlayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: COLORS.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  gridCardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridCardSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#8A99AD',
    marginTop: 2,
  },
  listContainer: {
    marginBottom: SIZES.lg,
  },
  emptyCard: {
    padding: SIZES.md,
    borderRadius: 14,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text.primary,
  },
});
