import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Mic2, Music } from 'lucide-react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import { Track } from '../../core/types';
import { Lyrics, LyricsService } from '../../services/LyricsService';
import { useProgress } from '../../hooks/usePlayer';

interface LyricsCardProps {
  track: Track;
  onSeek?: (seconds: number) => void;
}

export const LyricsCard: React.FC<LyricsCardProps> = ({ track, onSeek }) => {
  const { position } = useProgress();
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const lastActiveIndex = useRef<number>(-1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLyrics(null);
    lastActiveIndex.current = -1;

    (async () => {
      try {
        const result = await LyricsService.get(track);
        if (!cancelled) {
          setLyrics(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [track.id]);

  const activeIndex = LyricsService.activeLineIndex(lyrics, position);

  // Auto-scroll to keep active line centered
  useEffect(() => {
    if (activeIndex >= 0 && activeIndex !== lastActiveIndex.current) {
      lastActiveIndex.current = activeIndex;
      // Approximate line height is ~44px
      const targetY = Math.max(0, activeIndex * 44 - 60);
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }
  }, [activeIndex]);

  return (
    <BlurView intensity={25} tint="dark" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Mic2 color={COLORS.accent.green} size={16} />
          <Text style={styles.headerTitle}>Lyrics</Text>
        </View>
        {lyrics?.synced && (
          <View style={styles.syncedBadge}>
            <Text style={styles.syncedText}>Synced</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.statusBox}>
          <ActivityIndicator size="small" color={COLORS.accent.green} />
          <Text style={styles.statusText}>Finding lyrics...</Text>
        </View>
      ) : !lyrics || !lyrics.lines.length ? (
        <View style={styles.statusBox}>
          <Music color={COLORS.text.muted} size={20} />
          <Text style={styles.statusText}>No lyrics available for this song</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.lyricsScroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {lyrics.lines.map((line, idx) => {
            const isActive = lyrics.synced && idx === activeIndex;
            return (
              <TouchableOpacity
                key={`${idx}-${line.time ?? 0}`}
                disabled={!lyrics.synced || line.time === undefined || !onSeek}
                onPress={() => line.time !== undefined && onSeek?.(line.time)}
                activeOpacity={0.7}
                style={[
                  styles.lineWrapper,
                  isActive && styles.activeLineWrapper,
                ]}
              >
                <Text
                  style={[
                    styles.lineText,
                    isActive ? styles.activeLineText : styles.inactiveLineText,
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius.md,
    padding: SIZES.md,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.text.primary,
    letterSpacing: 0.5,
  },
  syncedBadge: {
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.3)',
  },
  syncedText: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.accent.green,
    letterSpacing: 0.5,
  },
  statusBox: {
    paddingVertical: SIZES.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.xs,
  },
  statusText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  lyricsScroll: {
    maxHeight: 180,
  },
  lineWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: SIZES.radius.sm,
  },
  activeLineWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  lineText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  activeLineText: {
    color: COLORS.text.primary,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 26,
  },
  inactiveLineText: {
    color: COLORS.text.muted,
    opacity: 0.7,
  },
});
