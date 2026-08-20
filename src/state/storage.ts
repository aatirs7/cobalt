import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Local persistence. AsyncStorage rather than MMKV, because MMKV is not present
 * in Expo Go and would force a development build for every future contributor.
 * Rather than expo-sqlite, because there is no query load yet.
 *
 * Three separate keys rather than one blob, so a corrupt value loses a single
 * concern instead of everything.
 */
export const SCHEMA_VERSION = 1;

export const KEYS = {
  settings: 'cobalt:settings',
  profile: 'cobalt:profile',
  days: 'cobalt:days',
} as const;

export const jsonStorage = createJSONStorage(() => AsyncStorage);

/**
 * Marker every persisted store carries so the boot gate can wait for hydration
 * before deciding which route to show. Without it the app flashes onboarding at
 * users who finished it months ago.
 */
export type Hydratable = { _hydrated: boolean };

export const onRehydrate =
  <T extends Hydratable>() =>
  () =>
  (state?: T) => {
    if (state) state._hydrated = true;
  };
