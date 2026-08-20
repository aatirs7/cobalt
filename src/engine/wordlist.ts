/**
 * Small curated word data. Plain data only, no logic.
 *
 * Section 8 of the games spec is explicit that Five, Clusters and Ladder draw
 * from a curated list with frequency bands, and that Clusters group definitions
 * are authored rather than generated. This is a starter set sized for the shell.
 * A real launch needs a far larger list and a proper dictionary for guess
 * validation, which is a content budget item rather than a code one.
 */

export const FIVE_LETTER: Record<'common' | 'mid' | 'rare', readonly string[]> = {
  common: [
    'about', 'other', 'which', 'their', 'there', 'would', 'these', 'first', 'water', 'after',
    'where', 'right', 'think', 'three', 'years', 'place', 'sound', 'great', 'again', 'still',
  ],
  mid: [
    'brisk', 'clasp', 'dwell', 'flint', 'grove', 'hoist', 'ledge', 'mirth', 'nudge', 'plumb',
    'quilt', 'realm', 'shard', 'tempo', 'usher', 'vigil', 'wharf', 'yield', 'blend', 'crisp',
  ],
  rare: [
    'axiom', 'bezel', 'crypt', 'dross', 'fjord', 'fugue', 'glyph', 'hymns', 'ingot', 'jetty',
    'knurl', 'lymph', 'mulch', 'nymph', 'ochre', 'pique', 'quash', 'rusks', 'syrup', 'twixt',
  ],
};

/**
 * Authored Clusters groups. Tier 1 is the most concrete, tier 4 the most
 * abstract. Decoy overlap is intentional: BASS reads musical and aquatic,
 * SPADE is a garden tool and a card suit, BOLT is a fastener, a way to run and
 * half of LIGHTNING BOLT.
 */
export type ClusterGroup = { label: string; members: string[]; tier: 1 | 2 | 3 | 4 };

export const CLUSTER_SETS: readonly ClusterGroup[][] = [
  [
    { label: 'Things a fish has', members: ['SCALE', 'FIN', 'GILL', 'BASS'], tier: 1 },
    { label: 'Musical terms', members: ['PITCH', 'KEY', 'TEMPO', 'CLEF'], tier: 2 },
    { label: 'Parts of a map', members: ['LEGEND', 'GRID', 'INSET', 'RELIEF'], tier: 3 },
    { label: 'Precede the word BOX', members: ['SAND', 'MAIL', 'SHADOW', 'CHATTER'], tier: 4 },
  ],
  [
    { label: 'Card games', members: ['BRIDGE', 'HEARTS', 'CANASTA', 'PATIENCE'], tier: 1 },
    { label: 'Garden tools', members: ['SPADE', 'FORK', 'HOE', 'TROWEL'], tier: 2 },
    { label: 'Types of crossing', members: ['ZEBRA', 'LEVEL', 'PELICAN', 'TOUCAN'], tier: 3 },
    { label: 'Qualities of a saint', members: ['GRACE', 'MERCY', 'CHARITY', 'VALOUR'], tier: 4 },
  ],
  [
    { label: 'Weather fronts', members: ['COLD', 'WARM', 'STATIONARY', 'OCCLUDED'], tier: 1 },
    { label: 'Ways to run', members: ['SPRINT', 'JOG', 'DASH', 'CANTER'], tier: 2 },
    { label: 'Fasteners', members: ['RIVET', 'CLASP', 'STUD', 'BOLT'], tier: 3 },
    { label: 'Follow the word LIGHTNING', members: ['ROD', 'BUG', 'STRIKE', 'CONDUCTOR'], tier: 4 },
  ],
];

/** Symbol set for Recall. Geometric, calm, distinguishable at small size. */
export const RECALL_SYMBOLS = [
  'circle', 'square', 'triangle', 'diamond', 'cross', 'chevron', 'ring', 'bar', 'wedge',
] as const;

/** Abstract figure ids for Pattern. The renderer draws these procedurally. */
export const PATTERN_SHAPES = [
  'dot', 'line', 'arc', 'square', 'triangle', 'cross', 'ring', 'wedge', 'bar',
] as const;
