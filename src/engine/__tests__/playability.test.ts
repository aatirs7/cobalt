import { addDays, asDateKey } from '../dateKey';
import { generateDailySet } from '../generateDailySet';
import { TIERS } from '../types';
import { FIVE_GUESSABLE, PATTERN_SHAPES, RECALL_SYMBOLS } from '../wordlist';

/**
 * The contract between the generators and the game renderers.
 *
 * These assert the properties Recall and Sequence rely on to render at all. A
 * generator change that broke any of them would not fail a type check, it would
 * fail on a user's phone mid puzzle, so they are checked across sixty days and
 * all three tiers rather than on one sample.
 */
const D = (s: string) => asDateKey(s);
const DAYS = 60;

describe('Recall payloads are renderable', () => {
  it('keeps every cell inside the grid and pairs one symbol per cell', () => {
    for (let i = 0; i < DAYS; i++) {
      const set = generateDailySet(addDays(D('2026-01-01'), i));
      for (const tier of TIERS) {
        const p = set.puzzles.recall[tier].payload;
        if (p.kind !== 'recall') throw new Error('wrong payload');

        const cellCount = p.cols * p.rows;
        expect(p.rounds).toHaveLength(3);

        for (const round of p.rounds) {
          // The renderer indexes symbols by the position of the cell, so the
          // two arrays must stay the same length.
          expect(round.symbols).toHaveLength(round.cells.length);
          expect(round.cells.length).toBeGreaterThan(0);
          // Never more items than there are cells to put them in.
          expect(round.cells.length).toBeLessThanOrEqual(cellCount);

          for (const cell of round.cells) {
            expect(cell).toBeGreaterThanOrEqual(0);
            expect(cell).toBeLessThan(cellCount);
          }
          // A repeated cell would render two symbols in one tile.
          expect(new Set(round.cells).size).toBe(round.cells.length);
          // Every symbol must exist in the glyph set or it draws as nothing.
          for (const sym of round.symbols) {
            expect(RECALL_SYMBOLS).toContain(sym);
          }
        }

        // Round types cycle, and the bound condition is the real memory load so
        // it must come last.
        expect(p.rounds.map((r) => r.type)).toEqual(['location', 'symbol', 'bound']);
      }
    }
  });
});

describe('Sequence payloads are renderable', () => {
  it('keeps every step within the tile count and never repeats a tile back to back', () => {
    for (let i = 0; i < DAYS; i++) {
      const set = generateDailySet(addDays(D('2026-01-01'), i));
      for (const tier of TIERS) {
        const p = set.puzzles.sequence[tier].payload;
        if (p.kind !== 'sequence') throw new Error('wrong payload');

        expect(p.directions).toHaveLength(p.trials.length);

        p.trials.forEach((trial, t) => {
          // Length grows by exactly one per trial, which is what the span
          // measure depends on.
          expect(trial).toHaveLength(p.startLength + t);

          for (let j = 0; j < trial.length; j++) {
            expect(trial[j]).toBeGreaterThanOrEqual(0);
            expect(trial[j]).toBeLessThan(p.tileCount);
            // A tile lighting twice in a row reads as one flash, making the
            // sequence impossible to reproduce correctly.
            if (j > 0) expect(trial[j]).not.toBe(trial[j - 1]);
          }
        });

        // Reverse trials must actually occur, or the harder and more
        // informative measure never gets sampled.
        expect(p.directions).toContain('reverse');
        expect(p.directions).toContain('forward');
      }
    }
  });
});

describe('Pattern payloads are renderable', () => {
  it('gives every item a solvable matrix and six distinct options', () => {
    for (let i = 0; i < DAYS; i++) {
      const set = generateDailySet(addDays(D('2026-01-01'), i));
      for (const tier of TIERS) {
        const p = set.puzzles.pattern[tier].payload;
        if (p.kind !== 'pattern') throw new Error('wrong payload');

        expect(p.items).toHaveLength(5);
        for (const item of p.items) {
          // Nine cells, only the bottom right missing.
          expect(item.matrix).toHaveLength(9);
          expect(item.matrix[8]).toBeNull();
          expect(item.matrix.slice(0, 8).every((x) => typeof x === 'string')).toBe(true);

          // The renderer splits on ":" and expects exactly three attributes.
          for (const cell of [...item.matrix.slice(0, 8), ...item.options]) {
            const parts = String(cell).split(':');
            expect(parts).toHaveLength(3);
            expect(PATTERN_SHAPES).toContain(parts[0]);
            expect([1, 2, 3]).toContain(Number(parts[1]));
            expect(['outline', 'solid']).toContain(parts[2]);
          }

          expect(item.options).toHaveLength(6);
          expect(new Set(item.options).size).toBe(6);
          expect(item.options[item.answerIndex]).toBeTruthy();
        }
      }
    }
  });
});

describe('Five payloads are playable', () => {
  it('always targets a word the guess dictionary accepts', () => {
    for (let i = 0; i < DAYS; i++) {
      const set = generateDailySet(addDays(D('2026-01-01'), i));
      for (const tier of TIERS) {
        const p = set.puzzles.five[tier].payload;
        if (p.kind !== 'five') throw new Error('wrong payload');

        expect(p.target).toHaveLength(5);
        // A target the dictionary rejects would be unwinnable: the user could
        // never submit it as a guess.
        expect(FIVE_GUESSABLE.has(p.target.toLowerCase())).toBe(true);
      }
    }
  });
});

describe('Clusters payloads are playable', () => {
  it('gives sixteen distinct words in four groups of four', () => {
    for (let i = 0; i < DAYS; i++) {
      const set = generateDailySet(addDays(D('2026-01-01'), i));
      for (const tier of TIERS) {
        const p = set.puzzles.clusters[tier].payload;
        if (p.kind !== 'clusters') throw new Error('wrong payload');

        expect(p.words).toHaveLength(16);
        // A duplicated word would render one tile that belongs to two groups,
        // making the puzzle unsolvable.
        expect(new Set(p.words).size).toBe(16);
        expect(p.groups).toHaveLength(4);

        for (const g of p.groups) {
          expect(g.members).toHaveLength(4);
          // Every member must actually be on the board.
          for (const m of g.members) expect(p.words).toContain(m);
        }

        // Tiers are what the reveal colours key off, so all four must be present.
        expect(new Set(p.groups.map((g) => g.tier)).size).toBe(4);
      }
    }
  });
});
