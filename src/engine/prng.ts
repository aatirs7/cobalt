/**
 * Deterministic PRNG. Pure, no platform imports.
 *
 * cyrb128 hashes a string to a 128 bit state, sfc32 generates from it. Both use
 * only |0, >>> and Math.imul, which are exactly specified int32 operations, so
 * Hermes on device and V8 on the server produce bit identical streams. That
 * property is what lets this module move to the Vercel cron without changing a
 * single published puzzle.
 */

export function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

export type Rng = {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Integer in [min, max], inclusive both ends. */
  range(min: number, max: number): number;
  pick<T>(xs: readonly T[]): T;
  /** Fisher Yates. Returns a new array, never mutates the input. */
  shuffle<T>(xs: readonly T[]): T[];
  /** n distinct members, or all of them if n exceeds the pool. */
  sample<T>(xs: readonly T[], n: number): T[];
};

export function sfc32(seed: readonly [number, number, number, number]): Rng {
  let a = seed[0];
  let b = seed[1];
  let c = seed[2];
  let d = seed[3];

  const next = (): number => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };

  const int = (maxExclusive: number) => Math.floor(next() * maxExclusive);

  const shuffle = <T,>(xs: readonly T[]): T[] => {
    const out = xs.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  };

  return {
    next,
    int,
    range: (min, max) => min + int(max - min + 1),
    pick: (xs) => xs[int(xs.length)],
    shuffle,
    sample: (xs, n) => shuffle(xs).slice(0, Math.min(n, xs.length)),
  };
}

/**
 * One independent stream per namespace.
 *
 * Never share a single stream across games. If Recall's generator ever changes
 * how many numbers it draws, a shared stream would silently change every later
 * game for every past date. Independent namespaces keep each generator's
 * evolution isolated, which is the single most important decision in here.
 */
export function rngFor(namespace: string): Rng {
  return sfc32(cyrb128(namespace));
}
