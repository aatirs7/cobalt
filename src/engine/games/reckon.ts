import type { Rng } from '../prng';
import type { ReckonPayload, Tier } from '../types';

/**
 * Section 2.7. Sixty seconds of arithmetic that escalates as the user answers
 * correctly. Addition and subtraction at the base tier, multiplication and
 * division higher up, mixed multi step at the top.
 *
 * Input is a custom numeric pad rather than the system keyboard, which adds
 * around 300ms of latency and ruins the feel of a speed game.
 */
type Op = '+' | '-' | '*' | '/';

const OPS_BY_TIER: Record<Tier, readonly Op[]> = {
  t800: ['+', '-'],
  t1200: ['+', '-', '*'],
  t1600: ['+', '-', '*', '/'],
};

const MAGNITUDE: Record<Tier, { add: number; mul: number }> = {
  t800: { add: 20, mul: 5 },
  t1200: { add: 60, mul: 9 },
  t1600: { add: 120, mul: 12 },
};

/** Generous, since nobody finishes the list inside sixty seconds. */
const PROBLEM_COUNT = 90;

export function generateReckon(rng: Rng, tier: Tier): ReckonPayload {
  const ops = OPS_BY_TIER[tier];
  const mag = MAGNITUDE[tier];
  const problems: ReckonPayload['problems'] = [];

  for (let i = 0; i < PROBLEM_COUNT; i++) {
    const op = rng.pick(ops);
    let a: number;
    let b: number;
    let answer: number;

    if (op === '+') {
      a = rng.range(2, mag.add);
      b = rng.range(2, mag.add);
      answer = a + b;
    } else if (op === '-') {
      // Order the operands so the answer is never negative.
      const x = rng.range(2, mag.add);
      const y = rng.range(2, mag.add);
      a = Math.max(x, y);
      b = Math.min(x, y);
      answer = a - b;
    } else if (op === '*') {
      a = rng.range(2, mag.mul);
      b = rng.range(2, mag.mul);
      answer = a * b;
    } else {
      // Build division from a known product so it always divides evenly.
      b = rng.range(2, mag.mul);
      answer = rng.range(2, mag.mul);
      a = b * answer;
    }

    problems.push({ a, op, b, answer });
  }

  return { kind: 'reckon', seconds: 60, problems };
}
