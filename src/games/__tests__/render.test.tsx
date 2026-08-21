import { render } from '@testing-library/react-native';

import { PLAYABLE } from '../registry';
import { INSTRUCTIONS } from '../instructions';
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

describe('instructions', () => {
  it('exist for every game, so the help sheet can never render empty', () => {
    for (const key of GAME_KEYS) {
      const entry = INSTRUCTIONS[key];
      expect(entry).toBeTruthy();
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.steps.length).toBeGreaterThanOrEqual(3);
      expect(entry.trains.length).toBeGreaterThan(0);
    }
  });

  it('never mentions a tier, a rating or a score number', () => {
    // Games spec section 3.3: ratings and tiers are never surfaced, and no rank
    // names. The help text is the easiest place for that to leak.
    const banned = /\btier\b|\brating\b|\bpoints\b|\belo\b|\badvanced\b|\bbeginner\b|\bexpert\b/i;
    for (const key of GAME_KEYS) {
      const entry = INSTRUCTIONS[key];
      const all = [entry.summary, entry.trains, ...entry.steps].join(' ');
      expect(all).not.toMatch(banned);
    }
  });

  it('follows the copy rules: no exclamation marks', () => {
    for (const key of GAME_KEYS) {
      const entry = INSTRUCTIONS[key];
      const all = [entry.summary, entry.trains, ...entry.steps].join(' ');
      expect(all).not.toContain('!');
    }
  });
});
