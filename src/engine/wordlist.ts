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

/**
 * Guess dictionary for Five.
 *
 * Section 2.1 requires guesses to be valid dictionary words. This list is large
 * enough to make the game playable but is nowhere near a shippable dictionary,
 * which needs several thousand entries. Expanding it is content work, not code
 * work, and it is the last thing gating Five for real users.
 */
export const FIVE_GUESSABLE: ReadonlySet<string> = new Set([
  'abide', 'about', 'acorn', 'adapt', 'admit', 'adopt', 'after', 'again', 'agent', 'alarm',
  'album', 'alert', 'alike', 'alive', 'allow', 'alone', 'along', 'aloud', 'amber', 'amend',
  'ample', 'angle', 'ankle', 'apart', 'apple', 'apply', 'april', 'arena', 'argue', 'arise',
  'armor', 'aroma', 'array', 'arrow', 'aside', 'asset', 'atlas', 'audio', 'audit', 'avoid',
  'await', 'awake', 'award', 'aware', 'axiom', 'badge', 'baker', 'basic', 'basin', 'batch',
  'beach', 'beard', 'beast', 'begin', 'begun', 'being', 'below', 'bench', 'bezel', 'birth',
  'black', 'blade', 'blame', 'blank', 'blast', 'blaze', 'bleak', 'blend', 'bless', 'blind',
  'block', 'blood', 'bloom', 'board', 'boost', 'booth', 'bound', 'brain', 'brand', 'brass',
  'brave', 'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'brisk', 'broad',
  'broke', 'brook', 'brown', 'brush', 'build', 'built', 'bunch', 'burnt', 'burst', 'cabin',
  'cable', 'cameo', 'canal', 'candy', 'canon', 'cargo', 'carve', 'catch', 'cause', 'cease',
  'chain', 'chair', 'chalk', 'charm', 'chart', 'chase', 'cheap', 'check', 'cheek', 'cheer',
  'chess', 'chief', 'child', 'chill', 'china', 'choir', 'chose', 'chunk', 'civic', 'civil',
  'claim', 'clash', 'clasp', 'class', 'clean', 'clear', 'clerk', 'click', 'cliff', 'climb',
  'cling', 'clock', 'clone', 'close', 'cloth', 'cloud', 'coach', 'coast', 'cocoa', 'color',
  'comic', 'coral', 'could', 'count', 'court', 'cover', 'crack', 'craft', 'crane', 'crash',
  'crawl', 'cream', 'creek', 'crest', 'cried', 'crime', 'crisp', 'cross', 'crowd', 'crown',
  'crude', 'cruel', 'crumb', 'crush', 'crypt', 'curve', 'cycle', 'daily', 'dairy', 'dance',
  'dated', 'dealt', 'death', 'debit', 'debut', 'decay', 'decor', 'delay', 'delta', 'dense',
  'depth', 'derby', 'devil', 'diary', 'dirty', 'ditch', 'diver', 'dizzy', 'dodge', 'doing',
  'donor', 'doubt', 'dozen', 'draft', 'drain', 'drama', 'drank', 'drawn', 'dread', 'dream',
  'dress', 'dried', 'drift', 'drill', 'drink', 'drive', 'dross', 'drove', 'drown', 'dryer',
  'dwarf', 'dwell', 'eager', 'eagle', 'early', 'earth', 'easel', 'eaten', 'ebony', 'edged',
  'eight', 'elbow', 'elder', 'elect', 'elite', 'empty', 'enact', 'ended', 'enemy', 'enjoy',
  'enter', 'entry', 'equal', 'equip', 'erase', 'error', 'essay', 'ethic', 'event', 'every',
  'exact', 'exams', 'exert', 'exile', 'exist', 'extra', 'fable', 'faced', 'facet', 'faded',
  'faint', 'fairy', 'faith', 'false', 'fancy', 'fatal', 'fault', 'favor', 'feast', 'fence',
  'ferry', 'fetch', 'fever', 'fewer', 'fiber', 'field', 'fiery', 'fifth', 'fifty', 'fight',
  'filed', 'filth', 'final', 'finch', 'finer', 'fired', 'first', 'fixed', 'fjord', 'flair',
  'flame', 'flash', 'fleet', 'flesh', 'flick', 'flint', 'float', 'flock', 'flood', 'floor',
  'flour', 'fluid', 'flush', 'flute', 'focal', 'focus', 'foggy', 'force', 'forge', 'forth',
  'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'fried', 'front', 'frost',
  'frown', 'fruit', 'fugue', 'fully', 'funny', 'gauge', 'geese', 'genre', 'ghost', 'giant',
  'given', 'glade', 'gland', 'glare', 'glass', 'gleam', 'globe', 'glory', 'glove', 'glued',
  'glyph', 'grace', 'grade', 'grain', 'grand', 'grant', 'grape', 'graph', 'grasp', 'grass',
  'grave', 'graze', 'great', 'green', 'greet', 'grief', 'grill', 'grind', 'gripe', 'groan',
  'groom', 'gross', 'group', 'grove', 'growl', 'guard', 'guess', 'guest', 'guide', 'guild',
  'guilt', 'habit', 'hairy', 'handy', 'happy', 'hardy', 'harsh', 'haste', 'hatch', 'haunt',
  'haven', 'havoc', 'heard', 'heart', 'heath', 'heavy', 'hedge', 'hello', 'hence', 'herbs',
  'hobby', 'hoist', 'hollo', 'honey', 'honor', 'horse', 'hotel', 'hound', 'house', 'hover',
  'human', 'humid', 'humor', 'hurry', 'hymns', 'ideal', 'image', 'imply', 'inbox', 'index',
  'inept', 'infer', 'ingot', 'inner', 'input', 'intro', 'irony', 'issue', 'ivory', 'jelly',
  'jetty', 'jewel', 'joint', 'jolly', 'judge', 'juice', 'jumbo', 'juror', 'karma', 'kayak',
  'kneel', 'knife', 'knock', 'known', 'knurl', 'label', 'labor', 'laden', 'lance', 'lapse',
  'large', 'largo', 'laser', 'latch', 'later', 'laugh', 'layer', 'leach', 'leafy', 'learn',
  'leash', 'leave', 'ledge', 'legal', 'lemon', 'level', 'lever', 'light', 'lilac', 'limit',
  'linen', 'liner', 'lingo', 'liver', 'llama', 'loans', 'lobby', 'local', 'lodge', 'lofty',
  'logic', 'loose', 'lorry', 'loser', 'lousy', 'loved', 'lower', 'loyal', 'lucid', 'lucky',
  'lunar', 'lunch', 'lying', 'lymph', 'lyric', 'macro', 'madam', 'magic', 'magma', 'maize',
  'major', 'maker', 'mango', 'manor', 'maple', 'march', 'marsh', 'match', 'maybe', 'mayor',
  'meant', 'medal', 'media', 'medic', 'melon', 'mercy', 'merge', 'merit', 'merry', 'metal',
  'meter', 'micro', 'midst', 'might', 'minor', 'minus', 'mirth', 'mixed', 'model', 'modem',
  'moist', 'molar', 'money', 'month', 'moral', 'morph', 'motel', 'motif', 'motor', 'motto',
  'mound', 'mount', 'mourn', 'mouse', 'mouth', 'movie', 'mower', 'muddy', 'mulch', 'mural',
  'music', 'never', 'north', 'nudge', 'nymph', 'ochre', 'often', 'order', 'other', 'paper',
  'party', 'peace', 'phone', 'piece', 'pique', 'place', 'plant', 'plumb', 'point', 'power',
  'press', 'price', 'quash', 'quick', 'quiet', 'quilt', 'reach', 'ready', 'realm', 'right',
  'river', 'round', 'rusks', 'scale', 'sense', 'serve', 'seven', 'shard', 'share', 'sharp',
  'sheet', 'shine', 'shirt', 'short', 'since', 'sixty', 'skill', 'sleep', 'slide', 'slope',
  'small', 'smile', 'smoke', 'solid', 'solve', 'sound', 'south', 'space', 'speak', 'speed',
  'spend', 'spent', 'spoke', 'sport', 'spray', 'stack', 'staff', 'stage', 'stand', 'start',
  'steam', 'steel', 'steep', 'stern', 'stick', 'still', 'stone', 'store', 'storm', 'story',
  'straw', 'strip', 'study', 'style', 'sugar', 'sweet', 'swing', 'syrup', 'table', 'taken',
  'taste', 'teach', 'tempo', 'thank', 'their', 'theme', 'there', 'these', 'thick', 'thing',
  'think', 'third', 'those', 'three', 'throw', 'tight', 'timer', 'title', 'today', 'token',
  'tooth', 'total', 'touch', 'tower', 'trace', 'track', 'trade', 'trail', 'train', 'treat',
  'trend', 'trial', 'tribe', 'trick', 'tried', 'truck', 'trust', 'truth', 'twice', 'twist',
  'twixt', 'uncle', 'under', 'union', 'unite', 'until', 'upper', 'urban', 'usage', 'usher',
  'usual', 'valid', 'value', 'vapor', 'vault', 'verse', 'video', 'vigil', 'virus', 'visit',
  'vital', 'vocal', 'voice', 'voter', 'wagon', 'waist', 'waste', 'watch', 'water', 'waver',
  'weigh', 'wharf', 'wheat', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'whose',
  'widen', 'width', 'witty', 'woman', 'world', 'worry', 'worth', 'would', 'wound', 'wrist',
  'write', 'wrong', 'years', 'yield', 'young',
]);
