import { addDays, type DateKey } from './dateKey';
import { rngFor } from './prng';
import {
  GAMES,
  GAME_KEYS,
  SLOTS,
  SLOT_POOL,
  TIERS,
  TIER_DIFFICULTY,
  type DailySet,
  type GameKey,
  type Puzzle,
  type PuzzlePayload,
  type SlotAssignment,
  type Tier,
} from './types';
import { generateClusters } from './games/clusters';
import { generateFive } from './games/five';
import { generatePattern } from './games/pattern';
import { generateRecall } from './games/recall';
import { generateReckon } from './games/reckon';
import { generateSequence } from './games/sequence';

/**
 * Seed namespace. Versioned from day one so a future change to the generation
 * algorithm can bump v1 to v2 without colliding with sets already published to
 * real users.
 */
const NAMESPACE = 'cobalt/v1';

export const seedFor = (date: DateKey) => `${NAMESPACE}/${date}`;

function generatePayload(gameKey: GameKey, date: DateKey, tier: Tier): PuzzlePayload {
  // One independent stream per game and tier. Never a shared stream: if one
  // generator changes how many numbers it draws, a shared stream would silently
  // change every later game for every past date.
  const rng = rngFor(`${NAMESPACE}/${date}/${gameKey}/${tier}`);
  switch (gameKey) {
    case 'five':
      return generateFive(rng, tier);
    case 'clusters':
      return generateClusters(rng, tier);
    case 'recall':
      return generateRecall(rng, tier);
    case 'sequence':
      return generateSequence(rng, tier);
    case 'reckon':
      return generateReckon(rng, tier);
    case 'pattern':
      return generatePattern(rng, tier);
  }
}

/**
 * Slot assignment, games spec section 1.1. The slot structure guarantees a
 * working memory game and a speed game every single day, which is where the
 * actual training value sits.
 *
 * The wildcard is specified as weighted toward the user's weakest domain over
 * the last 14 days. That weighting is per user, so it cannot live in the shared
 * daily set. Here the wildcard is drawn deterministically from the whole pool,
 * and applying the personal weighting is a later, purely additive change.
 */
function assignSlots(date: DateKey): SlotAssignment[] {
  const rng = rngFor(`${NAMESPACE}/${date}/slots`);
  const used = new Set<GameKey>();
  const out: SlotAssignment[] = [];

  for (const slot of SLOTS) {
    if (slot === 'wildcard') continue;
    const pool = SLOT_POOL[slot].filter((g) => !used.has(g));
    const gameKey = rng.pick(pool.length > 0 ? pool : SLOT_POOL[slot]);
    used.add(gameKey);
    out.push({ slot, gameKey });
  }

  // Wildcard may repeat a domain but never the same game twice in one set.
  const wildPool = GAME_KEYS.filter((g) => !used.has(g));
  out.push({
    slot: 'wildcard',
    gameKey: rng.pick(wildPool.length > 0 ? wildPool : GAME_KEYS),
  });

  return out;
}

/**
 * The whole day, every game at every tier. Fifteen payloads.
 *
 * This mirrors the server design exactly: the set is shared and identical for
 * everyone on a given local date, and the tier is a per user selection over
 * pre generated variants rather than per user generation.
 */
export function generateDailySet(date: DateKey): DailySet {
  const puzzles = {} as Record<GameKey, Record<Tier, Puzzle>>;

  for (const gameKey of GAME_KEYS) {
    const byTier = {} as Record<Tier, Puzzle>;
    for (const tier of TIERS) {
      byTier[tier] = {
        gameKey,
        tier,
        difficulty: TIER_DIFFICULTY[tier],
        payload: generatePayload(gameKey, date, tier),
      };
    }
    puzzles[gameKey] = byTier;
  }

  return {
    date,
    seed: seedFor(date),
    version: 1,
    slots: assignSlots(date),
    puzzles,
  };
}

/** The cron entry point. Section 8 asks for seven days ahead, self gating. */
export function generateRange(start: DateKey, days: number): DailySet[] {
  return Array.from({ length: days }, (_, i) => generateDailySet(addDays(start, i)));
}

/** Total advertised minutes for a set, used by the Today header. */
export function setMinutes(set: DailySet): number {
  return set.slots.reduce((sum, s) => sum + GAMES[s.gameKey].minutes, 0);
}
