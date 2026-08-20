import { rngFor } from './prng';
import { generatePattern } from './games/pattern';
import { generateReckon } from './games/reckon';
import { generateSequence } from './games/sequence';
import { GAMES, type GameKey, type PatternPayload, type ReckonPayload, type SequencePayload } from './types';

/**
 * The onboarding warm-up, onboarding spec section 4.
 *
 * Three abbreviated rounds of roughly thirty seconds each: one working memory
 * (Sequence), one speed (Reckon), one reasoning (Pattern). Their only job is to
 * seed the initial ratings so the first real set lands at the right level.
 *
 * Framing rules from the spec, which are not optional: never a test, an
 * assessment, a baseline or a benchmark. No score shown at any point, no result
 * screen, straight on to the next screen when it ends.
 *
 * Generated from a fixed namespace rather than from a date, because the warm-up
 * is not part of any daily set and must be identical for every user regardless
 * of when they install.
 */
const NAMESPACE = 'cobalt/v1/warmup';

/** Everything runs at the middle tier, since there is nothing to adapt from yet. */
const TIER = 't1200' as const;

export type WarmupPuzzles = {
  sequence: SequencePayload;
  reckon: ReckonPayload;
  pattern: PatternPayload;
};

export function generateWarmup(): WarmupPuzzles {
  const sequence = generateSequence(rngFor(`${NAMESPACE}/sequence`), TIER);
  const reckon = generateReckon(rngFor(`${NAMESPACE}/reckon`), TIER);
  const pattern = generatePattern(rngFor(`${NAMESPACE}/pattern`), TIER);

  return {
    // Six trials is enough to find a span without the round outstaying its
    // welcome at the highest drop off moment in the whole product.
    sequence: {
      ...sequence,
      trials: sequence.trials.slice(0, 6),
      directions: sequence.directions.slice(0, 6),
    },
    reckon: { ...reckon, seconds: 30 },
    pattern: { ...pattern, items: pattern.items.slice(0, 2) },
  };
}

/**
 * Maps a warm-up result onto a starting rating.
 *
 * Deliberately narrow. A thirty second sample is weak evidence, so it places
 * the user in the right neighbourhood rather than pretending to precision, and
 * the Elo update does the rest within about five sessions. Skipping the warm-up
 * leaves everything at 1000, which is the same neighbourhood by another route.
 */
export const WARMUP_MIN = 800;
export const WARMUP_MAX = 1400;

export function ratingFromWarmup(rawScore: number, gameKey: GameKey): number {
  const ratio = Math.max(0, Math.min(1, rawScore / GAMES[gameKey].rawCeiling));
  return Math.round(WARMUP_MIN + ratio * (WARMUP_MAX - WARMUP_MIN));
}

/**
 * Which ratings a given warm-up round informs.
 *
 * Three rounds cannot honestly speak for six games. A round seeds its own game
 * and its slot mate, because they train the same domain, and nothing else.
 * Verbal is never sampled, so Five and Clusters stay at the default rather than
 * inheriting a number from an unrelated task.
 */
export const WARMUP_SEEDS: Record<'sequence' | 'reckon' | 'pattern', GameKey[]> = {
  sequence: ['sequence', 'recall'],
  reckon: ['reckon'],
  pattern: ['pattern'],
};
