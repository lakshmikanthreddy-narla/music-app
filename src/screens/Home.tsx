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

// Curated collections matching reference screen 2
const RECENT_CARDS = [
  { id: 'recent_1', title: 'Chill Hits', type: 'Playlist', query: 'chill hits relax', image: require('../../assets/ui/recent_chill.jpg') },
  { id: 'recent_2', title: 'Arijit Singh', type: 'Artist', query: 'arijit singh best songs', image: require('../../assets/ui/recent_arijit.jpg') },
  { id: 'recent_3', title: "Today's Mix", type: 'Playlist', query: 'todays top hits', image: require('../../assets/ui/recent_today.jpg') },
  { id: 'recent_4', title: 'Rock', type: 'Playlist', query: 'classic rock hits', image: require('../../assets/ui/recent_rock.jpg') },
];

const MADE_FOR_YOU = [
  { id: 'mfy_1', title: 'Discover Weekly', subtitle: 'Made for Antony', query: 'discover weekly new music', image: require('../../assets/ui/mfy_discover.jpg') },
  { id: 'mfy_2', title: 'Daily Mix 1', subtitle: 'Arijit Singh, Pritam', query: 'daily mix pop chill', image: require('../../assets/ui/mfy_daily.jpg') },
];

const TRENDING_ROW_1 = [
  { id: 'trend_1', title: 'Top 50 Global', subtitle: 'One Lista', query: 'top 50 global songs', image: require('../../assets/ui/trend_top50.jpg') },
  { id: 'trend_2', title: 'Viral Hits India', subtitle: 'One Rurno', query: 'viral hits india', image: require('../../assets/ui/trend_viral.jpg') },
];

const TRENDING_ROW_2 = [
  { id: 'trend_3', title: 'Pop Rising', subtitle: 'Global Hits', query: 'pop rising hits', image: require('../../assets/ui/trend_c.jpg') },
  { id: 'trend_4', title: 'Mega Hit Mix', subtitle: 'Trending Now', query: 'mega hit mix', image: require('../../assets/ui/trend_d.jpg') },
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
      {/* Sticky Header: Profile Avatar, Greeting, Name, Notification Bell */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + SIZES.sm }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.avatarGlowWrapper}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab' as never)}
          >
            <Image
              source={
                profile.avatarUri
                  ? { uri: profile.avatarUri }
                  : require('../../assets/ui/home_avatar.jpg')
              }
              style={styles.avatarInner}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <View style={styles.greetingWrapper}>
            <Text style={styles.greetingText}>Good Morning!</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {profile.name || 'Antony Das'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Bell color="#FFFFFF" size={20} />
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
          { paddingBottom: SIZES.bottomInset + insets.bottom }
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
            <ChevronRight color={COLORS.text.meta} size={14} />
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
                <Image source={item.image} style={styles.recentImage} resizeMode="cover" />
                {loadingCardId === item.id ? (
                  <View style={styles.imageOverlayCenter}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                ) : null}
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
              style={styles.mfyCard}
              activeOpacity={0.85}
              onPress={() => playCollection(item.id, item.title, item.query)}
            >
              <Image source={item.image} style={styles.mfyImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(13, 13, 13, 0.92)']}
                locations={[0.2, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.mfyContent}>
                {loadingCardId === item.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginBottom: 4 }} />
                ) : null}
                <Text style={styles.mfyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.mfySubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section: Trending Now */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
        </View>

        <View style={styles.twoColumnGrid}>
          {TRENDING_ROW_1.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.trendCard}
              activeOpacity={0.85}
              onPress={() => playCollection(item.id, item.title, item.query)}
            >
              <Image source={item.image} style={styles.trendImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(13, 13, 13, 0.88)']}
                locations={[0.1, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.trendSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Row 2 */}
        <View style={[styles.twoColumnGrid, { marginTop: 10 }]}>
          {TRENDING_ROW_2.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.trendCard}
              activeOpacity={0.85}
              onPress={() => playCollection(item.id, item.title, item.query)}
            >
              <Image source={item.image} style={styles.trendImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(13, 13, 13, 0.88)']}
                locations={[0.1, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.trendContent}>
                <Text style={styles.trendTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.trendSubtitle} numberOfLines={1}>{item.subtitle}</Text>
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
    paddingHorizontal: 16,
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
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  greetingWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  greetingText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 1,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillsScroll: {
    paddingVertical: 4,
    paddingRight: SIZES.md,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: SIZES.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAll: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text.meta,
  },
  recentCardsScroll: {
    paddingRight: SIZES.md,
    gap: 12,
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
    backgroundColor: COLORS.surface,
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentCardTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: 8,
  },
  recentCardType: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  mfyCard: {
    flex: 1,
    height: 125,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surface,
  },
  mfyImage: {
    width: '100%',
    height: '100%',
  },
  mfyContent: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  mfyTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  mfySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  trendCard: {
    flex: 1,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surface,
  },
  trendImage: {
    width: '100%',
    height: '100%',
  },
  trendContent: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
  },
  trendTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  trendSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 1,
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
