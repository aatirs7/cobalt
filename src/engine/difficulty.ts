import { GAMES, TIERS, TIER_DIFFICULTY, TIER_MULTIPLIER, type GameKey, type Tier } from './types';

/**
 * Rating and scoring, games spec sections 3 and 4.
 *
 * Ratings and tiers are never displayed as numbers anywhere in the UI. No rank
 * names, no badges, no tier up animation. The user experiences the puzzles
 * simply getting harder as they improve.
 */

export const INITIAL_RATING = 1000;

/** K is 32 for the first ten plays of a game, then 16. Section 3.1. */
export function kFor(playsCount: number): number {
  return playsCount < 10 ? 32 : 16;
}

/** Target success rate is 70 to 75 percent. Below 60 people quit, above 85 there is no load. */
export const TARGET_SUCCESS = 0.725;

/**
 * How the user wants the adaptive choice nudged.
 *
 * Section 3.3 keeps ratings and tiers out of sight, so this is expressed as a
 * direction rather than a tier. Adaptive is the honest default; the other two
 * shift the choice by one variant and no further, which keeps the rating doing
 * the real work and stops the preference becoming a way to sit permanently on
 * the easiest puzzles.
 */
export const DIFFICULTY_PREFERENCES = ['easier', 'adaptive', 'harder'] as const;
export type DifficultyPreference = (typeof DIFFICULTY_PREFERENCES)[number];

export const DEFAULT_DIFFICULTY: DifficultyPreference = 'adaptive';

const NUDGE: Record<DifficultyPreference, number> = { easier: -1, adaptive: 0, harder: 1 };

/** The user is served the variant closest to their rating. Section 3.2. */
export function tierForRating(
  rating: number,
  preference: DifficultyPreference = DEFAULT_DIFFICULTY,
): Tier {
  let best: Tier = TIERS[0];
  let bestGap = Infinity;
  for (const t of TIERS) {
    const gap = Math.abs(TIER_DIFFICULTY[t] - rating);
    // Ties break upward. This is not a detail: INITIAL_RATING is 1000, exactly
    // halfway between the 800 and 1200 variants, so the tie break decides what
    // every brand new user is served. Breaking downward would cold start
    // everyone on the easy tier at a 0.85 score multiplier, well below the 70
    // to 75 percent target, and they would have to climb out of it.
    if (gap <= bestGap) {
      bestGap = gap;
      best = t;
    }
  }

  // Shift by at most one variant, clamped, so "easier" on the lowest tier and
  // "harder" on the highest are simply no-ops rather than errors.
  const shifted = TIERS.indexOf(best) + NUDGE[preference];
  return TIERS[Math.max(0, Math.min(TIERS.length - 1, shifted))];
}

/**
 * Normalized score on 0 to 1000. Section 4.1.
 *
 * The tier multiplier is essential. Without it users sandbag to an easy tier to
 * farm leaderboard position. With it, playing above your level is strictly
 * better if you can hold your accuracy, which is the behavior to reward.
 */
export function normalize(rawScore: number, gameKey: GameKey, tier: Tier): number {
  const ceiling = GAMES[gameKey].rawCeiling;
  const value = (rawScore / ceiling) * 1000 * TIER_MULTIPLIER[tier];
  return Math.round(Math.min(1000, Math.max(0, value)));
}

/** Elo style update. Section 3.1. */
export function updateRating(
  rating: number,
  tier: Tier,
  normalizedScore: number,
  playsCount: number,
): number {
  const expected = 1 / (1 + 10 ** ((TIER_DIFFICULTY[tier] - rating) / 400));
  const actual = normalizedScore / 1000;
  return Math.round(rating + kFor(playsCount) * (actual - expected));
}

/** Sum of the five normalized scores. An abandoned game scores 0. Section 4.2. */
export function setTotal(scores: readonly (number | null)[]): number {
  return scores.reduce<number>((sum, s) => sum + (s ?? 0), 0);
}
