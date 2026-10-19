import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '../core/types';

export const STATS_STORAGE_KEY = 'stats:v1';

export type UserListeningStats = {
  songsPlayedCount: number;
  dailyListeningSeconds: Record<string, number>; // { "YYYY-MM-DD": seconds }
  artistsExplored: string[]; // unique artist names
};

const DEFAULT_STATS: UserListeningStats = {
  songsPlayedCount: 0,
  dailyListeningSeconds: {},
  artistsExplored: [],
};

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatListeningTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${hours}h ${String(remainingMinutes).padStart(2, '0')}m`;
}

class StatsServiceImpl {
  private stats: UserListeningStats = { ...DEFAULT_STATS };
  private listeners = new Set<(stats: UserListeningStats) => void>();
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isLoaded = false;

  async init(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.stats = {
          songsPlayedCount: Number(parsed.songsPlayedCount) || 0,
          dailyListeningSeconds: typeof parsed.dailyListeningSeconds === 'object' && parsed.dailyListeningSeconds ? parsed.dailyListeningSeconds : {},
          artistsExplored: Array.isArray(parsed.artistsExplored) ? parsed.artistsExplored : [],
        };
      }
    } catch {
      // Keep defaults on read error
    } finally {
      this.isLoaded = true;
      this.notify();
    }
  }

  getStats(): UserListeningStats {
    return {
      songsPlayedCount: this.stats.songsPlayedCount,
      dailyListeningSeconds: { ...this.stats.dailyListeningSeconds },
      artistsExplored: [...this.stats.artistsExplored],
    };
  }

  getTodayListeningSeconds(): number {
    const today = getLocalDateKey();
    return this.stats.dailyListeningSeconds[today] || 0;
  }

  subscribe(listener: (stats: UserListeningStats) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getStats();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Ignore subscriber error
      }
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      void this.flush();
    }, 3000);
  }

  async flush(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    try {
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Ignore write failure
    }
  }

  addListeningSeconds(seconds: number): void {
    if (seconds <= 0) return;
    const today = getLocalDateKey();
    const current = this.stats.dailyListeningSeconds[today] || 0;
    this.stats.dailyListeningSeconds[today] = current + seconds;
    this.scheduleSave();
    this.notify();
  }

  recordSongPlay(track: Track): void {
    this.stats.songsPlayedCount += 1;

    const artistName = track.artist?.name?.trim();
    if (artistName && !this.stats.artistsExplored.includes(artistName)) {
      this.stats.artistsExplored.push(artistName);
    }

    this.notify();
    void this.flush();
  }
}

export const StatsService = new StatsServiceImpl();
