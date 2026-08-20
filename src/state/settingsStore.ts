import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME_KEY, type ThemeKey } from '@/theme/tokens';
import { jsonStorage, KEYS, onRehydrate, SCHEMA_VERSION, type Hydratable } from './storage';

/** Settings screen, base spec section 5.6. */
export type SettingsState = Hydratable & {
  themeKey: ThemeKey;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  /** User level reduce motion. Combined with the OS setting, never replaces it. */
  reduceMotion: boolean;
  /** "HH:MM" local, or null when the daily reminder is off. Default is off. */
  reminderTime: string | null;
  /** Appends a link to the share card. Off by default, games spec section 6. */
  shareIncludesLink: boolean;
  updatedAt: number;

  setTheme: (key: ThemeKey) => void;
  setHaptics: (on: boolean) => void;
  setSound: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  setReminderTime: (time: string | null) => void;
  setShareIncludesLink: (on: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      _hydrated: false,
      themeKey: DEFAULT_THEME_KEY,
      hapticsEnabled: true,
      soundEnabled: false,
      reduceMotion: false,
      reminderTime: null,
      shareIncludesLink: false,
      updatedAt: 0,

      setTheme: (themeKey) => set({ themeKey, updatedAt: Date.now() }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled, updatedAt: Date.now() }),
      setSound: (soundEnabled) => set({ soundEnabled, updatedAt: Date.now() }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion, updatedAt: Date.now() }),
      setReminderTime: (reminderTime) => set({ reminderTime, updatedAt: Date.now() }),
      setShareIncludesLink: (shareIncludesLink) => set({ shareIncludesLink, updatedAt: Date.now() }),
    }),
    {
      name: KEYS.settings,
      version: SCHEMA_VERSION,
      storage: jsonStorage,
      partialize: ({ _hydrated, ...rest }) => rest as SettingsState,
      onRehydrateStorage: onRehydrate<SettingsState>(),
    },
  ),
);
