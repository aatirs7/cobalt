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
