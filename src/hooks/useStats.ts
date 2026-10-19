import { useEffect, useState } from 'react';
import {
  StatsService,
  UserListeningStats,
  formatListeningTime,
} from '../services/StatsService';

export function useStats() {
  const [stats, setStats] = useState<UserListeningStats>(() => StatsService.getStats());

  useEffect(() => {
    void StatsService.init();
    const unsubscribe = StatsService.subscribe(setStats);
    return unsubscribe;
  }, []);

  const todaySeconds = StatsService.getTodayListeningSeconds();
  const todayFormatted = formatListeningTime(todaySeconds);

  return {
    songsPlayed: stats.songsPlayedCount,
    todayListeningSeconds: todaySeconds,
    todayHoursListenedFormatted: todayFormatted,
    artistsExploredCount: stats.artistsExplored.length,
    rawStats: stats,
  };
}
