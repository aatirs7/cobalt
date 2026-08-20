import type { Rng } from '../prng';
import type { RecallPayload, Tier } from '../types';
import { RECALL_SYMBOLS } from '../wordlist';

/**
 * Section 2.4. Three round types cycle within one play: location only, symbol
 * only, then bound location plus symbol. The bound condition is the real
 * working memory load, so it always comes last.
 */
const CONFIG: Record<
  Tier,
  { cols: number; rows: number; items: number; exposureMs: number; retentionMs: number }
> = {
  t800: { cols: 3, rows: 3, items: 3, exposureMs: 2000, retentionMs: 500 },
  t1200: { cols: 4, rows: 4, items: 4, exposureMs: 1200, retentionMs: 1000 },
  t1600: { cols: 5, rows: 5, items: 6, exposureMs: 400, retentionMs: 1500 },
};

const ROUND_TYPES = ['location', 'symbol', 'bound'] as const;

export function generateRecall(rng: Rng, tier: Tier): RecallPayload {
  const cfg = CONFIG[tier];
  const cellCount = cfg.cols * cfg.rows;
  const allCells = Array.from({ length: cellCount }, (_, i) => i);

  const rounds = ROUND_TYPES.map((type) => ({
    type,
    cells: rng.sample(allCells, cfg.items).sort((a, b) => a - b),
    symbols: Array.from({ length: cfg.items }, () => rng.pick(RECALL_SYMBOLS) as string),
  }));

  return {
    kind: 'recall',
    cols: cfg.cols,
    rows: cfg.rows,
    rounds,
    exposureMs: cfg.exposureMs,
    retentionMs: cfg.retentionMs,
  };
}
