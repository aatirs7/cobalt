import type { Rng } from '../prng';
import type { FivePayload, Tier } from '../types';
import { FIVE_LETTER } from '../wordlist';

/** Section 2.1. Difficulty varies word frequency band and repeated letters. */
const BAND_BY_TIER: Record<Tier, 'common' | 'mid' | 'rare'> = {
  t800: 'common',
  t1200: 'mid',
  t1600: 'rare',
};

const hasRepeat = (w: string) => new Set(w).size < w.length;

export function generateFive(rng: Rng, tier: Tier): FivePayload {
  const band = BAND_BY_TIER[tier];
  const pool = FIVE_LETTER[band];
  // At the top tier prefer a target with a repeated letter, which is the single
  // biggest source of difficulty in this format. Fall back to the whole pool if
  // the filter leaves too little to choose from, so the draw stays varied.
  const wantRepeat = tier === 't1600';
  const filtered = pool.filter((w) => hasRepeat(w) === wantRepeat);
  const target = rng.pick(filtered.length >= 3 ? filtered : pool);

  return {
    kind: 'five',
    target,
    band,
    hasRepeatedLetter: hasRepeat(target),
    maxAttempts: 6,
  };
}
