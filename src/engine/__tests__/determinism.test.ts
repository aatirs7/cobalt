import { asDateKey, addDays, daysBetween, monthOf } from '../dateKey';
import { generateDailySet, generateRange } from '../generateDailySet';
import { rngFor } from '../prng';
import { GAME_KEYS, TIERS } from '../types';
import { effectiveStreak, onSetCompleted, INITIAL_STREAK } from '../streak';
import { tierForRating, normalize, updateRating } from '../difficulty';

/**
 * The engine's contract.
 *
 * When generation moves to the Vercel cron, this identical suite runs in Node
 * against the identical snapshot. If it passes there, the migration is provably
 * content preserving and no user's historical set changes underneath them.
 */
const D = (s: string) => asDateKey(s);

describe('prng', () => {
  it('is reproducible from a namespace', () => {
    const a = rngFor('cobalt/v1/2026-01-01/recall/t1200');
    const b = rngFor('cobalt/v1/2026-01-01/recall/t1200');
    const draw = (r: ReturnType<typeof rngFor>) => Array.from({ length: 20 }, () => r.next());
    expect(draw(a)).toEqual(draw(b));
  });

  it('gives different streams to different namespaces', () => {
    const a = rngFor('cobalt/v1/2026-01-01/recall/t1200');
    const b = rngFor('cobalt/v1/2026-01-01/recall/t1600');
    expect(a.next()).not.toEqual(b.next());
  });

  it('shuffle does not mutate its input', () => {
    const rng = rngFor('shuffle-check');
    const input = Object.freeze([1, 2, 3, 4, 5]);
    expect(() => rng.shuffle(input)).not.toThrow();
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('dateKey', () => {
  it('survives a spring daylight saving transition', () => {
    // US DST begins 8 March 2026. UTC midnight arithmetic lands a day short here.
    expect(daysBetween(D('2026-03-07'), D('2026-03-09'))).toBe(2);
    expect(addDays(D('2026-03-07'), 2)).toBe('2026-03-09');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays(D('2026-01-31'), 1)).toBe('2026-02-01');
    expect(addDays(D('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(D('2028-02-28'), 1)).toBe('2028-02-29');
    expect(monthOf(D('2026-08-20'))).toBe('2026-08');
  });
});

describe('generateDailySet', () => {
  it('is idempotent', () => {
    expect(generateDailySet(D('2026-08-20'))).toEqual(generateDailySet(D('2026-08-20')));
  });

  it('produces every game at every tier', () => {
    const set = generateDailySet(D('2026-08-20'));
    for (const g of GAME_KEYS) {
      for (const t of TIERS) {
        expect(set.puzzles[g][t].payload).toBeTruthy();
        expect(set.puzzles[g][t].tier).toBe(t);
      }
    }
  });

  it('fills all five slots without repeating a game', () => {
    for (let i = 0; i < 60; i++) {
      const set = generateDailySet(addDays(D('2026-01-01'), i));
      const keys = set.slots.map((s) => s.gameKey);
      expect(set.slots).toHaveLength(5);
      expect(new Set(keys).size).toBe(5);
      // The slot structure guarantees a working memory game and a speed game
      // every single day, which is where the training value sits.
      expect(set.slots[1].gameKey).toMatch(/recall|sequence/);
      expect(set.slots[2].gameKey).toBe('reckon');
    }
  });

  it('never generates a Pattern item whose distractors include the answer', () => {
    for (let i = 0; i < 40; i++) {
      const set = generateDailySet(addDays(D('2026-01-01'), i));
      for (const t of TIERS) {
        const p = set.puzzles.pattern[t].payload;
        if (p.kind !== 'pattern') throw new Error('wrong payload');
        // Five items per play is what the 700 raw ceiling implies, given the
        // spec scores correct * 120 plus a time bonus capped at 100.
        expect(p.items).toHaveLength(5);
        for (const item of p.items) {
          expect(new Set(item.options).size).toBe(item.options.length);
          expect(item.answerIndex).toBeGreaterThanOrEqual(0);
          expect(item.options).toHaveLength(6);
        }
      }
    }
  });

  it('never generates Reckon problems with negative or fractional answers', () => {
    for (const t of TIERS) {
      const p = generateDailySet(D('2026-08-20')).puzzles.reckon[t].payload;
      if (p.kind !== 'reckon') throw new Error('wrong payload');
      for (const q of p.problems) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(q.answer)).toBe(true);
      }
    }
  });

  it('is stable across 30 days', () => {
    // The committed snapshot is the contract that survives the move to server
    // side generation.
    expect(generateRange(D('2026-01-01'), 30)).toMatchSnapshot();
  });
});

describe('streak', () => {
  it('increments on consecutive days', () => {
    let s = onSetCompleted(INITIAL_STREAK, D('2026-08-18'));
    s = onSetCompleted(s, D('2026-08-19'));
    expect(s.current).toBe(2);
    expect(s.longest).toBe(2);
  });

  it('spends the free skip to cover exactly one missed day', () => {
    let s = onSetCompleted(INITIAL_STREAK, D('2026-08-18'));
    s = onSetCompleted(s, D('2026-08-20')); // 19th missed
    expect(s.current).toBe(2);
    expect(s.skipMonth).toBe('2026-08');
  });

  it('does not spend the skip twice in one month', () => {
    let s = onSetCompleted(INITIAL_STREAK, D('2026-08-18'));
    s = onSetCompleted(s, D('2026-08-20'));
    s = onSetCompleted(s, D('2026-08-22')); // 21st missed, skip already spent
    expect(s.current).toBe(1);
  });

  it('refreshes the skip in a new month', () => {
    let s = onSetCompleted(INITIAL_STREAK, D('2026-08-29'));
    s = onSetCompleted(s, D('2026-08-31')); // spends August
    expect(s.current).toBe(2);
    s = onSetCompleted(s, D('2026-09-02')); // 1 Sept missed, September is free
    expect(s.current).toBe(3);
    expect(s.skipMonth).toBe('2026-09');
  });

  it('cannot cover two missed days', () => {
    let s = onSetCompleted(INITIAL_STREAK, D('2026-08-18'));
    s = onSetCompleted(s, D('2026-08-21'));
    expect(s.current).toBe(1);
  });

  it('reads as zero once the gap is unrecoverable, and never mutates', () => {
    const s = onSetCompleted(INITIAL_STREAK, D('2026-08-18'));
    expect(effectiveStreak(s, D('2026-08-19'))).toBe(1);
    expect(effectiveStreak(s, D('2026-08-25'))).toBe(0);
    expect(s.current).toBe(1);
  });
});

describe('difficulty', () => {
  it('serves the tier closest to the rating', () => {
    expect(tierForRating(800)).toBe('t800');
    expect(tierForRating(1000)).toBe('t1200');
    expect(tierForRating(1700)).toBe('t1600');
  });

  it('rewards holding accuracy at a higher tier', () => {
    // Section 4.1: without the multiplier users sandbag to farm position.
    const easy = normalize(500, 'pattern', 't800');
    const hard = normalize(500, 'pattern', 't1600');
    expect(hard).toBeGreaterThan(easy);
  });

  it('clamps the normalized score to 0 through 1000', () => {
    expect(normalize(999999, 'recall', 't1600')).toBe(1000);
    expect(normalize(-50, 'recall', 't800')).toBe(0);
  });

  it('moves the rating toward the tier that was beaten', () => {
    expect(updateRating(1000, 't1600', 900, 0)).toBeGreaterThan(1000);
    expect(updateRating(1000, 't800', 100, 0)).toBeLessThan(1000);
  });

  it('halves K after the first ten plays', () => {
    const early = updateRating(1000, 't1200', 1000, 0) - 1000;
    const later = updateRating(1000, 't1200', 1000, 10) - 1000;
    expect(early).toBeGreaterThan(later);
  });
});

/**
 * The difficulty preference, which nudges the adaptive choice by at most one
 * variant. Games spec section 3.3 keeps tiers out of sight, so this is a
 * direction rather than a picker, and it must never let someone park on the
 * easiest puzzles permanently.
 */
describe('difficulty preference', () => {
  it('shifts by exactly one variant, never more', () => {
    expect(tierForRating(1200, 'adaptive')).toBe('t1200');
    expect(tierForRating(1200, 'easier')).toBe('t800');
    expect(tierForRating(1200, 'harder')).toBe('t1600');
  });

  it('clamps at both ends rather than falling off', () => {
    // Already on the easiest, asking for easier is a no-op, not undefined.
    expect(tierForRating(800, 'easier')).toBe('t800');
    expect(tierForRating(1600, 'harder')).toBe('t1600');
  });

  it('defaults to adaptive when no preference is given', () => {
    expect(tierForRating(1600)).toBe(tierForRating(1600, 'adaptive'));
  });

  it('still cannot beat playing up, because the multiplier survives', () => {
    // Sandbagging check. Section 4.1 exists so that dropping a tier costs more
    // than it gains, and the preference must not become a way around it.
    const sameRawEasier = normalize(600, 'pattern', tierForRating(1200, 'easier'));
    const sameRawHarder = normalize(600, 'pattern', tierForRating(1200, 'harder'));
    expect(sameRawHarder).toBeGreaterThan(sameRawEasier);
  });
});
