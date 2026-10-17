import { metadataCache } from '../core/cache';
import { Track } from '../core/types';

export type LyricLine = {
  /** Seconds into the track. Undefined for unsynced lyrics. */
  time?: number;
  text: string;
};

export type Lyrics = {
  trackId: string;
  lines: LyricLine[];
  synced: boolean;
  source: string;
};

/**
 * A lyrics provider. Nothing is wired up by default -- the app ships without a
 * lyrics source so it never fetches lyrics from somewhere unlicensed.
 *
 * Connecting an authorized provider later means writing one object with a
 * `fetch` method and calling `LyricsService.use(provider)` at startup. No UI
 * or player code changes.
 */
export interface LyricsProvider {
  readonly id: string;
  fetch(track: Track, signal?: AbortSignal): Promise<Lyrics | null>;
}

const TTL = 24 * 60 * 60 * 1000;

function cleanQuery(text: string): string {
  return text
    .replace(/\s*[\(\[](?:official|music\s*video|lyric\s*video|audio|video|from\s+"[^"]+"|full\s*song|hd|4k)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*-\s*official.*$/i, '')
    .trim();
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  for (const raw of lrc.split('\n')) {
    const trimmed = raw.trim();
    const match = regex.exec(trimmed);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
      const time = minutes * 60 + seconds + millis / 1000;
      const text = match[4].trim();
      if (text) {
        lines.push({ time, text });
      }
    }
  }
  return lines;
}

function parsePlain(plain: string): LyricLine[] {
  return plain
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

export class LrclibLyricsProvider implements LyricsProvider {
  readonly id = 'lrclib';

  async fetch(track: Track, signal?: AbortSignal): Promise<Lyrics | null> {
    const title = cleanQuery(track.title);
    const artist = cleanQuery(track.artist.name);

    // 1. Try exact match first
    try {
      const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
      const res = await fetch(url, { signal: signal ?? AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          const lines = parseLrc(data.syncedLyrics);
          if (lines.length) return { trackId: track.id, lines, synced: true, source: 'LRCLIB' };
        }
        if (data.plainLyrics) {
          const lines = parsePlain(data.plainLyrics);
          if (lines.length) return { trackId: track.id, lines, synced: false, source: 'LRCLIB' };
        }
      }
    } catch {
      // Fall through to search
    }

    // 2. Try search match
    try {
      const query = `${title} ${artist}`.trim();
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, { signal: signal ?? AbortSignal.timeout(6000) });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const match =
            list.find((item: any) => item.syncedLyrics) ||
            list.find((item: any) => item.plainLyrics) ||
            list[0];
          if (match?.syncedLyrics) {
            const lines = parseLrc(match.syncedLyrics);
            if (lines.length) return { trackId: track.id, lines, synced: true, source: 'LRCLIB' };
          }
          if (match?.plainLyrics) {
            const lines = parsePlain(match.plainLyrics);
            if (lines.length) return { trackId: track.id, lines, synced: false, source: 'LRCLIB' };
          }
        }
      }
    } catch {
      // Ignore
    }

    return null;
  }
}

class LyricsServiceImpl {
  private provider: LyricsProvider | null = new LrclibLyricsProvider();

  use(provider: LyricsProvider | null): void {
    this.provider = provider;
  }

  get isConfigured(): boolean {
    return this.provider !== null;
  }

  get providerName(): string | null {
    return this.provider?.id ?? null;
  }

  /** Returns null when no provider is configured or none has lyrics. */
  async get(track: Track, signal?: AbortSignal): Promise<Lyrics | null> {
    if (!this.provider) return null;

    const key = `lyrics:${this.provider.id}:${track.id}`;
    const cached = metadataCache.get<Lyrics | null>(key);
    if (cached !== undefined) return cached;

    try {
      const lyrics = await this.provider.fetch(track, signal);
      metadataCache.set(key, lyrics, TTL);
      return lyrics;
    } catch {
      // Lyrics are supplementary; a failure must never disturb playback.
      return null;
    }
  }

  /** The line that should be highlighted at `position` seconds. */
  activeLineIndex(lyrics: Lyrics | null, position: number): number {
    if (!lyrics?.synced || !lyrics.lines.length) return -1;

    let index = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      const t = lyrics.lines[i].time;
      if (t === undefined || t > position) break;
      index = i;
    }
    return index;
  }
}

export const LyricsService = new LyricsServiceImpl();
