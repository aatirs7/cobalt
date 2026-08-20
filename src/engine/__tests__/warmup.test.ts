import { generateWarmup, ratingFromWarmup, WARMUP_SEEDS, WARMUP_MIN, WARMUP_MAX } from '../warmup';
import { GAMES, GAME_KEYS } from '../types';

/**
 * The warm-up, onboarding spec section 4.
 *
 * It runs at the highest drop off moment in the product, so its properties are
 * worth pinning: identical for everyone, short enough to finish, and honest
 * about what three rounds can actually tell you.
 */
describe('generateWarmup', () => {
  it('is identical for every user regardless of when they install', () => {
    // Derived from a fixed namespace rather than a date, so two people opening
    // the app a month apart get the same warm-up.
    expect(generateWarmup()).toEqual(generateWarmup());
  });

  it('is abbreviated relative to a real play', () => {
    const w = generateWarmup();
    expect(w.sequence.trials).toHaveLength(6);
    expect(w.sequence.directions).toHaveLength(6);
    expect(w.reckon.seconds).toBe(30);
    // Two matrices rather than the five a real Pattern play uses.
    expect(w.pattern.items).toHaveLength(2);
  });

  it('keeps sequence trials and directions aligned after trimming', () => {
    const w = generateWarmup();
    expect(w.sequence.directions).toHaveLength(w.sequence.trials.length);
  });
});

describe('ratingFromWarmup', () => {
  it('stays inside a deliberately narrow band', () => {
    // Thirty seconds is weak evidence. It should place the user in the right
    // neighbourhood, not pretend to precision.
    for (const key of GAME_KEYS) {
      expect(ratingFromWarmup(0, key)).toBe(WARMUP_MIN);
      expect(ratingFromWarmup(GAMES[key].rawCeiling, key)).toBe(WARMUP_MAX);
      expect(ratingFromWarmup(GAMES[key].rawCeiling * 10, key)).toBe(WARMUP_MAX);
      expect(ratingFromWarmup(-100, key)).toBe(WARMUP_MIN);
    }
  });

  it('increases with performance', () => {
    const low = ratingFromWarmup(100, 'sequence');
    const high = ratingFromWarmup(700, 'sequence');
    expect(high).toBeGreaterThan(low);
  });
});

describe('WARMUP_SEEDS', () => {
  it('never seeds a game the warm-up did not sample', () => {
    const seeded = new Set(Object.values(WARMUP_SEEDS).flat());
    // Verbal is never measured, so Five and Clusters must keep the default
    // rather than inheriting a number from an unrelated task.
    expect(seeded.has('five')).toBe(false);
    expect(seeded.has('clusters')).toBe(false);
    // Everything it does seed must be a real game key.
    for (const key of seeded) expect(GAME_KEYS).toContain(key);
  });

  it('seeds a round onto its own game and its slot mate', () => {
    expect(WARMUP_SEEDS.sequence).toEqual(expect.arrayContaining(['sequence', 'recall']));
    expect(WARMUP_SEEDS.reckon).toEqual(['reckon']);
    expect(WARMUP_SEEDS.pattern).toEqual(['pattern']);
  });
});
