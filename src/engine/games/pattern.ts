import type { Rng } from '../prng';
import type { PatternPayload, Tier } from '../types';
import { PATTERN_SHAPES } from '../wordlist';

/**
 * Section 2.10. A 3x3 matrix with the bottom right cell missing, six options.
 *
 * Rules compose across rows and columns. Distractors are generated to be near
 * misses on exactly one rule dimension, which is what separates a real matrix
 * item from a guessable one, and every option is checked against the answer so
 * no distractor is accidentally also correct.
 *
 * A cell is three independent attributes encoded as "shape:count:fill". The
 * renderer parses that back out, so adding a fourth dimension later does not
 * change the payload shape.
 */
type Cell = { shape: string; count: 1 | 2 | 3; fill: 'outline' | 'solid' };

const encode = (c: Cell) => `${c.shape}:${c.count}:${c.fill}`;

const RULE_COUNT: Record<Tier, 1 | 2 | 3> = { t800: 1, t1200: 2, t1600: 3 };

export function generatePattern(rng: Rng, tier: Tier): PatternPayload {
  const ruleCount = RULE_COUNT[tier];

  // Rule 1 is always on: distribution of three. Each row and column contains
  // each of the three shapes exactly once, which is a Latin square.
  const shapes = rng.sample(PATTERN_SHAPES as readonly string[], 3);
  const shapeOffset = rng.int(3);

  // Rule 2: progression. Count advances across the row.
  const progression = ruleCount >= 2;
  const constantCount = (rng.int(3) + 1) as 1 | 2 | 3;

  // Rule 3: fill is constant within a row and cycles down the columns.
  const fillRule = ruleCount >= 3;
  const fillOrder: ('outline' | 'solid')[] = rng.next() < 0.5
    ? ['outline', 'solid', 'outline']
    : ['solid', 'outline', 'solid'];

  const cellAt = (r: number, c: number): Cell => ({
    shape: shapes[(r + c + shapeOffset) % 3],
    count: progression ? ((c + 1) as 1 | 2 | 3) : constantCount,
    fill: fillRule ? fillOrder[r] : 'outline',
  });

  const matrix: (string | null)[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      matrix.push(r === 2 && c === 2 ? null : encode(cellAt(r, c)));
    }
  }

  const answer = cellAt(2, 2);
  const answerId = encode(answer);

  // Near misses. Each perturbs exactly one dimension away from the answer.
  const candidates: Cell[] = [];
  for (const s of shapes) {
    if (s !== answer.shape) candidates.push({ ...answer, shape: s });
  }
  for (const n of [1, 2, 3] as const) {
    if (n !== answer.count) candidates.push({ ...answer, count: n });
  }
  candidates.push({ ...answer, fill: answer.fill === 'outline' ? 'solid' : 'outline' });
  // Two dimensions off, to stop every distractor being a single step away.
  for (const s of shapes) {
    if (s !== answer.shape) {
      candidates.push({
        shape: s,
        count: answer.count === 3 ? 1 : ((answer.count + 1) as 1 | 2 | 3),
        fill: answer.fill,
      });
    }
  }

  // Validity check: nothing that encodes to the answer may appear as a distractor.
  const seen = new Set<string>([answerId]);
  const distractors: string[] = [];
  for (const c of rng.shuffle(candidates)) {
    const id = encode(c);
    if (seen.has(id)) continue;
    seen.add(id);
    distractors.push(id);
    if (distractors.length === 5) break;
  }

  const options = rng.shuffle([answerId, ...distractors]);

  const rules = ['distribution-of-three'];
  if (progression) rules.push('progression');
  if (fillRule) rules.push('fill-constant-in-row');

  return {
    kind: 'pattern',
    matrix,
    rules,
    options,
    answerIndex: options.indexOf(answerId),
  };
}
