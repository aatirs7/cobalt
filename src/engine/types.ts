import type { DateKey } from './dateKey';

/**
 * Launch lineup from cobalt-games-spec.md section 9. Echo, Ink, Match, Ladder,
 * Turn and Fold ship in later updates and are deliberately absent.
 */
export const GAME_KEYS = ['five', 'clusters', 'recall', 'sequence', 'reckon', 'pattern'] as const;
export type GameKey = (typeof GAME_KEYS)[number];

/** Crossword sits outside the set entirely, section 1.2. It has no slot and no streak effect. */
export const STANDALONE_KEY = 'crossword' as const;
export type StandaloneKey = typeof STANDALONE_KEY;

/** Fixed slot structure, section 1.1. A row is a slot, the game filling it rotates. */
export const SLOTS = ['verbal', 'working', 'speed', 'reasoning', 'wildcard'] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABEL: Record<Slot, string> = {
  verbal: 'Verbal',
  working: 'Working memory',
  speed: 'Processing speed',
  reasoning: 'Reasoning',
  wildcard: 'Wildcard',
};

/** Which games may fill each slot. Wildcard draws from the whole pool. */
export const SLOT_POOL: Record<Slot, readonly GameKey[]> = {
  verbal: ['five', 'clusters'],
  working: ['recall', 'sequence'],
  speed: ['reckon'],
  reasoning: ['pattern'],
  wildcard: GAME_KEYS,
};

export type GameMeta = {
  key: GameKey;
  name: string;
  slot: Slot;
  domain: string;
  minutes: number;
  /** Per game constant from section 4.1, recalibrated quarterly against real plays. */
  rawCeiling: number;
};

export const GAMES: Readonly<Record<GameKey, GameMeta>> = {
  five: { key: 'five', name: 'Five', slot: 'verbal', domain: 'Vocabulary retrieval', minutes: 3, rawCeiling: 700 },
  clusters: { key: 'clusters', name: 'Clusters', slot: 'verbal', domain: 'Semantic categorization', minutes: 4, rawCeiling: 900 },
  recall: { key: 'recall', name: 'Recall', slot: 'working', domain: 'Visual working memory', minutes: 2, rawCeiling: 1000 },
  sequence: { key: 'sequence', name: 'Sequence', slot: 'working', domain: 'Sequential memory', minutes: 3, rawCeiling: 900 },
  reckon: { key: 'reckon', name: 'Reckon', slot: 'speed', domain: 'Arithmetic fluency', minutes: 2, rawCeiling: 1000 },
  pattern: { key: 'pattern', name: 'Pattern', slot: 'reasoning', domain: 'Inductive reasoning', minutes: 3, rawCeiling: 700 },
};

/** Three variants per puzzle per day, at difficulty 800, 1200 and 1600. Section 3.2. */
export const TIERS = ['t800', 't1200', 't1600'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_DIFFICULTY: Record<Tier, number> = { t800: 800, t1200: 1200, t1600: 1600 };

/** Section 4.1. Playing above your level is strictly better if you hold accuracy. */
export const TIER_MULTIPLIER: Record<Tier, number> = { t800: 0.85, t1200: 1.0, t1600: 1.15 };

export type FivePayload = {
  kind: 'five';
  target: string;
  /** common, mid or rare frequency band. */
  band: 'common' | 'mid' | 'rare';
  hasRepeatedLetter: boolean;
  maxAttempts: number;
};

export type ClustersPayload = {
  kind: 'clusters';
  words: string[];
  groups: { label: string; members: string[]; tier: 1 | 2 | 3 | 4 }[];
  /** Words that plausibly belong to two groups. At least three per section 2.2. */
  trapCount: number;
  maxMistakes: number;
};

export type RecallPayload = {
  kind: 'recall';
  cols: number;
  rows: number;
  /** One entry per round. Round types cycle: location, symbol, then bound. */
  rounds: { type: 'location' | 'symbol' | 'bound'; cells: number[]; symbols: string[] }[];
  exposureMs: number;
  retentionMs: number;
};

export type SequencePayload = {
  kind: 'sequence';
  tileCount: number;
  startLength: number;
  interStimulusMs: number;
  /** Direction per trial. Reverse loads working memory considerably harder. */
  directions: ('forward' | 'reverse')[];
  trials: number[][];
};

export type ReckonPayload = {
  kind: 'reckon';
  seconds: number;
  problems: { a: number; op: '+' | '-' | '*' | '/'; b: number; answer: number }[];
};

export type PatternPayload = {
  kind: 'pattern';
  /** 3x3 matrix, bottom right cell missing. Cells are shape ids. */
  matrix: (string | null)[];
  rules: string[];
  options: string[];
  answerIndex: number;
};

export type PuzzlePayload =
  | FivePayload
  | ClustersPayload
  | RecallPayload
  | SequencePayload
  | ReckonPayload
  | PatternPayload;

/** Maps one to one onto puzzles(id, set_date, game_key, tier, difficulty, payload jsonb). */
export type Puzzle = {
  gameKey: GameKey;
  tier: Tier;
  difficulty: number;
  payload: PuzzlePayload;
};

export type SlotAssignment = { slot: Slot; gameKey: GameKey };

/** Maps onto daily_sets(date, seed, published_at) plus its puzzles. */
export type DailySet = {
  date: DateKey;
  seed: string;
  version: 1;
  /** Five entries, in slot order. */
  slots: SlotAssignment[];
  /** Every game in the lineup at every tier, so tier selection is a lookup. */
  puzzles: Record<GameKey, Record<Tier, Puzzle>>;
};
