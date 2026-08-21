import { useSettings } from '../settingsStore';
import { useProfile } from '../profileStore';
import { useToday } from '../todayStore';

/**
 * Regression guard for the splash screen deadlock.
 *
 * The first TestFlight build hung forever on the native splash. The boot gate
 * waited on a _hydrated flag that zustand's onRehydrateStorage callback set by
 * assigning to the rehydrated state object. That assignment mutates the object
 * but never calls set(), so no subscriber is notified, the gate never opens and
 * SplashScreen.hideAsync is never reached.
 *
 * These tests assert the two properties that make the gate openable at all:
 * marking hydration notifies subscribers, and the persist API reports it.
 */
describe.each([
  ['settings', useSettings],
  ['profile', useProfile],
  ['today', useToday],
] as const)('%s store hydration', (_name, store) => {
  it('notifies subscribers when hydration is marked', () => {
    const seen: boolean[] = [];
    const unsubscribe = store.subscribe((s) => seen.push(s._hydrated));

    store.getState().markHydrated();
    unsubscribe();

    // The mutation bug produced zero notifications here.
    expect(seen.length).toBeGreaterThan(0);
    expect(store.getState()._hydrated).toBe(true);
  });

  it('exposes hydration through the persist API the boot gate reads', async () => {
    await store.persist.rehydrate();
    expect(store.persist.hasHydrated()).toBe(true);
  });
});

/**
 * startPlay must be idempotent.
 *
 * The game route calls it from an effect, and the effect can observe the store
 * it writes to. A non-idempotent write mints a new day object every call, the
 * effect re-fires, and the screen dies with "Maximum update depth exceeded".
 * That shipped, and it took out all six games.
 */
describe('startPlay idempotency', () => {
  const DATE = '2026-08-20' as never;

  beforeEach(() => {
    useToday.setState({ days: {} });
    useToday.getState().ensureDay(DATE);
  });

  it('returns the identical day object when called again', () => {
    const { startPlay } = useToday.getState();

    startPlay(DATE, 'recall');
    const first = useToday.getState().days[DATE];

    startPlay(DATE, 'recall');
    const second = useToday.getState().days[DATE];

    // Object identity, not deep equality. Identity is what the effect compares.
    expect(second).toBe(first);
  });

  it('still freezes the tier exactly once', () => {
    const { startPlay } = useToday.getState();

    startPlay(DATE, 'sequence');
    const tier = useToday.getState().days[DATE].plays.sequence.tier;
    expect(tier).not.toBeNull();

    startPlay(DATE, 'sequence');
    expect(useToday.getState().days[DATE].plays.sequence.tier).toBe(tier);
  });

  it('does not restart a completed play', () => {
    const { startPlay, completePlay } = useToday.getState();

    startPlay(DATE, 'reckon');
    completePlay(DATE, 'reckon', { rawScore: 400, normalizedScore: 400, elapsedMs: 1000 });

    const before = useToday.getState().days[DATE];
    startPlay(DATE, 'reckon');
    expect(useToday.getState().days[DATE]).toBe(before);
    expect(useToday.getState().days[DATE].plays.reckon.status).toBe('completed');
  });
});
