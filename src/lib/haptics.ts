import * as Haptics from 'expo-haptics';
import { useSettings } from '@/state/settingsStore';

/**
 * The only module in the app that imports expo-haptics.
 *
 * Base spec section 2.5 permits exactly two haptic events in the entire app:
 * light impact on selection, and a success notification on set completion.
 * A single choke point is the only way that survives contact with future work.
 *
 * Every call swallows rejection. Haptics reject on simulator, on web and on
 * devices without a Taptic Engine, and a rejected promise here must never
 * surface to the user.
 */
const enabled = () => useSettings.getState().hapticsEnabled;

export const haptics = {
  /** Selection: tapping a tile, choosing an answer, picking a swatch. Not navigation. */
  select() {
    if (!enabled()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  /** Fires once, when the fifth game of the day completes. Never per game. */
  setComplete() {
    if (!enabled()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
