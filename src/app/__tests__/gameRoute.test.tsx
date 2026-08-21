import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GAME_KEYS, type GameKey } from '@/engine/types';
import { asDateKey } from '@/engine/dateKey';
import { useToday } from '@/state/todayStore';

/**
 * The game route, not just the game component.
 *
 * Every game rendered fine in isolation while every one of them failed on
 * device, which means the fault was in the wrapper: the params, the store reads
 * and the derived values around the game, not the game itself. Rendering the
 * component alone was exactly the gap that let this ship.
 */
const DATE = asDateKey('2026-08-20');

let mockKey = 'recall';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ key: mockKey }),
}));

jest.mock('@/lib/time', () => {
  const actual = jest.requireActual('@/lib/time');
  return { ...actual, useDateKey: () => '2026-08-20' };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GameScreen = require('../game/[key]').default as React.ComponentType;

function renderRoute() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <GameScreen />
    </SafeAreaProvider>,
  );
}

describe('game route', () => {
  beforeEach(() => {
    useToday.setState({ days: {} });
    useToday.getState().ensureDay(DATE);
  });

  it.each(GAME_KEYS)('mounts for %s without throwing', (key: GameKey) => {
    mockKey = key;
    expect(() => renderRoute()).not.toThrow();
  });

  it('mounts for crossword, which is not part of the set', () => {
    mockKey = 'crossword';
    expect(() => renderRoute()).not.toThrow();
  });

  /**
   * The day is created lazily by Today. Opening a game before that has happened
   * must not read plays off an object that does not exist yet.
   */
  it('survives the day not existing yet', () => {
    useToday.setState({ days: {} });
    mockKey = 'recall';
    expect(() => renderRoute()).not.toThrow();
  });
});
