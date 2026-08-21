import { render } from '@testing-library/react-native';

import { PLAYABLE } from '../registry';
import { generateDailySet } from '@/engine/generateDailySet';
import { asDateKey } from '@/engine/dateKey';
import { GAME_KEYS, TIERS, type GameKey, type Tier } from '@/engine/types';

/**
 * Every game must survive its first render with a real generated payload.
 *
 * This is the test that was missing. All six games shipped to TestFlight and
 * every one of them threw the moment it mounted, which no type check, lint rule
 * or payload test could catch, because the payloads were fine and the failure
 * was in the components. Importing a module is not the same as rendering it.
 */
const DATE = asDateKey('2026-08-20');

describe.each(GAME_KEYS)('%s renders', (key: GameKey) => {
  it.each(TIERS)('at tier %s', (tier: Tier) => {
    const Game = PLAYABLE[key];
    if (!Game) throw new Error(`no component registered for ${key}`);

    const puzzle = generateDailySet(DATE).puzzles[key][tier];

    expect(() =>
      render(<Game payload={puzzle.payload as never} reduced={false} onFinish={() => {}} />),
    ).not.toThrow();
  });
});
