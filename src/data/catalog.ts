import { Category } from '../core/types';

/**
 * Browse categories shown on the Search screen.
 *
 * These are not mock content: each one runs a real search against the
 * provider when tapped. The colours match the existing visual design.
 */
export const BROWSE_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Top Charts', color: '#0083B0', query: 'top hits global charts' },
  { id: 'c2', name: 'New Releases', color: '#8E2DE2', query: 'new music releases' },
  { id: 'c3', name: 'Mood', color: '#1A365D', query: 'chill mood playlist' },
  { id: 'c4', name: 'Party', color: '#009688', query: 'party dance hits' },
  { id: 'c5', name: 'Chill', color: '#4A148C', query: 'chill acoustic lofi' },
  { id: 'c6', name: 'Workout', color: '#1B5E20', query: 'workout motivation gym' },
  { id: 'c7', name: 'Pop', color: '#C2185B', query: 'top pop hits' },
  { id: 'c8', name: 'Hip Hop', color: '#B45309', query: 'hip hop rap hits' },
  { id: 'c9', name: 'Rock', color: '#880E4F', query: 'rock classics' },
  { id: 'c10', name: 'Indie', color: '#C2410C', query: 'indie alternative' },
  { id: 'c11', name: 'EDM', color: '#00B4D8', query: 'edm dance mix' },
  { id: 'c12', name: 'Classical', color: '#4A0E4E', query: 'classical piano violin' },
];

/**
 * Query pools for the Home quick actions.
 *
 * Each tap picks one at random so the tile does not return the same list
 * every time. Liked is absent because it plays from the local library.
 */
export const ACTION_QUERIES: Record<string, string[]> = {
  discover: [
    'trending songs this week',
    'viral hits right now',
    'top global chart songs',
    'new music this month',
    'breakout artists 2026',
    'most played songs today',
  ],
  chill: [
    'chill relaxing songs',
    'lofi chill beats',
    'acoustic chill playlist',
    'calm indie chill',
    'soft rnb chill',
    'sunset chill mix',
  ],
  focus: [
    'focus instrumental concentration',
    'deep focus study music',
    'ambient focus no lyrics',
    'piano focus instrumental',
    'minimal techno focus',
    'nature focus soundscape',
  ],
};

/** A random query for a quick action, or null when it has no pool. */
export function randomQueryFor(actionId: string): string | null {
  const pool = ACTION_QUERIES[actionId];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** The quick-action tiles on Home, each backed by a real query. */
export const QUICK_ACTIONS = [
  { id: 'liked', label: 'Liked', query: null },
  { id: 'discover', label: 'Discover', query: 'discover new music' },
  { id: 'chill', label: 'Chill', query: 'chill relaxing songs' },
  { id: 'focus', label: 'Focus', query: 'focus instrumental concentration' },
] as const;

/** Seeds the Home featured card. */
export const FEATURED_QUERY = 'calm ambient evening';
