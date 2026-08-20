import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_RATING, updateRating } from '@/engine/difficulty';
import { onSetCompleted, INITIAL_STREAK, type StreakState } from '@/engine/streak';
import { GAME_KEYS, type GameKey, type Tier } from '@/engine/types';
import type { DateKey } from '@/engine/dateKey';
import { jsonStorage, KEYS, onRehydrate, SCHEMA_VERSION, type Hydratable } from './storage';

type Ratings = Record<GameKey, number>;
type PlayCounts = Record<GameKey, number>;

const seedRatingsAt = (value: number): Ratings =>
  Object.fromEntries(GAME_KEYS.map((k) => [k, value])) as Ratings;

const zeroCounts = (): PlayCounts =>
  Object.fromEntries(GAME_KEYS.map((k) => [k, 0])) as PlayCounts;

export type ProfileState = Hydratable & {
  onboardedAt: number | null;
  displayName: string;
  ratings: Ratings;
  playCounts: PlayCounts;
  streak: StreakState;
  updatedAt: number;

  completeOnboarding: () => void;
  /** Warm up initialization, onboarding spec section 4. Skipping leaves everything at 1000. */
  seedRatings: (partial: Partial<Ratings>) => void;
  setDisplayName: (name: string) => void;
  recordPlay: (gameKey: GameKey, tier: Tier, normalizedScore: number) => void;
  recordSetCompleted: (date: DateKey) => void;
  reset: () => void;
};

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      _hydrated: false,
      markHydrated: () => set({ _hydrated: true }),
      onboardedAt: null,
      displayName: 'You',
      ratings: seedRatingsAt(INITIAL_RATING),
      playCounts: zeroCounts(),
      streak: INITIAL_STREAK,
      updatedAt: 0,

      completeOnboarding: () => set({ onboardedAt: Date.now(), updatedAt: Date.now() }),

      seedRatings: (partial) =>
        set((s) => ({ ratings: { ...s.ratings, ...partial }, updatedAt: Date.now() })),

      setDisplayName: (displayName) => set({ displayName, updatedAt: Date.now() }),

      recordPlay: (gameKey, tier, normalizedScore) => {
        const { ratings, playCounts } = get();
        set({
          ratings: {
            ...ratings,
            [gameKey]: updateRating(ratings[gameKey], tier, normalizedScore, playCounts[gameKey]),
          },
          playCounts: { ...playCounts, [gameKey]: playCounts[gameKey] + 1 },
          updatedAt: Date.now(),
        });
      },

      recordSetCompleted: (date) =>
        set((s) => ({ streak: onSetCompleted(s.streak, date), updatedAt: Date.now() })),

      reset: () =>
        set({
          onboardedAt: null,
          ratings: seedRatingsAt(INITIAL_RATING),
          playCounts: zeroCounts(),
          streak: INITIAL_STREAK,
          updatedAt: Date.now(),
        }),
    }),
    {
      name: KEYS.profile,
      version: SCHEMA_VERSION,
      storage: jsonStorage,
      partialize: ({ _hydrated, ...rest }) => rest as ProfileState,
      onRehydrateStorage: onRehydrate<ProfileState>(),
    },
  ),
);
