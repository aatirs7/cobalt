import type { Rng } from '../prng';
import type { SequencePayload, Tier } from '../types';

/**
 * Section 2.5. Length grows by one on each success, two consecutive failures at
 * a length end the play. Alternating rounds require reverse reproduction, which
 * loads working memory considerably harder and is weighted 1.4x in scoring.
 */
const CONFIG: Record<
  Tier,
  { tiles: number; startLength: number; isiMs: number; reverseEvery: number }
> = {
  t800: { tiles: 4, startLength: 3, isiMs: 900, reverseEvery: 4 },
  t1200: { tiles: 6, startLength: 4, isiMs: 650, reverseEvery: 3 },
  t1600: { tiles: 9, startLength: 5, isiMs: 420, reverseEvery: 2 },
};

/** Enough trials that nobody reaches the end before failing out. */
const MAX_TRIALS = 12;

export function generateSequence(rng: Rng, tier: Tier): SequencePayload {
  const cfg = CONFIG[tier];
  const trials: number[][] = [];
  const directions: ('forward' | 'reverse')[] = [];

  for (let i = 0; i < MAX_TRIALS; i++) {
    const length = cfg.startLength + i;
    const seq: number[] = [];
    let last = -1;
    for (let j = 0; j < length; j++) {
      // Never repeat the immediately preceding tile. A tile lighting twice in a
      // row is ambiguous to reproduce and reads as a rendering glitch rather
      // than as two steps.
      let t = rng.int(cfg.tiles);
      while (t === last) t = rng.int(cfg.tiles);
      seq.push(t);
      last = t;
    }
    trials.push(seq);
    directions.push((i + 1) % cfg.reverseEvery === 0 ? 'reverse' : 'forward');
  }

  return {
    kind: 'sequence',
    tileCount: cfg.tiles,
    startLength: cfg.startLength,
    interStimulusMs: cfg.isiMs,
    directions,
    trials,
  };
}
