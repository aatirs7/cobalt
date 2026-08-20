import type { Rng } from '../prng';
import type { ClustersPayload, Tier } from '../types';
import { CLUSTER_SETS } from '../wordlist';

/**
 * Section 2.2. The design work is entirely in the trap words. A puzzle with no
 * traps is trivial, so every authored set carries words that fit a decoy
 * grouping. The trap count is computed rather than asserted, so a future set
 * that fails the "at least three" rule shows up in the determinism snapshot.
 */
export function generateClusters(rng: Rng, tier: Tier): ClustersPayload {
  const groups = rng.pick(CLUSTER_SETS);
  const words = rng.shuffle(groups.flatMap((g) => g.members));

  // A trap is a word that also appears in some other authored group anywhere in
  // the corpus, so it carries a plausible second reading.
  const occurrences = new Map<string, number>();
  for (const g of CLUSTER_SETS.flat()) {
    for (const m of g.members) occurrences.set(m, (occurrences.get(m) ?? 0) + 1);
  }
  const trapCount = words.filter((w) => (occurrences.get(w) ?? 0) > 1).length;

  return {
    kind: 'clusters',
    words,
    groups: groups.map((g) => ({ label: g.label, members: g.members, tier: g.tier })),
    trapCount,
    maxMistakes: tier === 't1600' ? 3 : 4,
  };
}
