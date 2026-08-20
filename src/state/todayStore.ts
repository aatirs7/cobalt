import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tierForRating } from '@/engine/difficulty';
import { generateDailySet, seedFor } from '@/engine/generateDailySet';
import type { DateKey } from '@/engine/dateKey';
import { GAME_KEYS, type GameKey, type Tier } from '@/engine/types';
import { makePlayId } from '@/lib/time';
import { jsonStorage, KEYS, onRehydrate, SCHEMA_VERSION, type Hydratable } from './storage';
import { useProfile } from './profileStore';

export type PlayStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export type PlayState = {
  status: PlayStatus;
  /**
   * Frozen when the play first starts and never re rolled. Difficulty comes
   * from the rating, and the rating moves after every play, so without freezing
   * this an abandon and resume could hand back a different puzzle mid day.
   */
  tier: Tier | null;
  startedAt: number | null;
  completedAt: number | null;
  /** Accumulated across abandon and resume, not wall clock since start. */
  elapsedMs: number;
  rawScore: number | null;
  normalizedScore: number | null;
  /** One hint per game per day, base spec section 5.3. */
  hintUsed: boolean;
  /** Client generated so a later upload to the plays table is idempotent. */
  playId: string;
};

export type DayState = {
  date: DateKey;
  seed: string;
  plays: Record<GameKey, PlayState>;
  setCompletedAt: number | null;
};

const blankPlay = (date: DateKey, gameKey: GameKey, salt: number): PlayState => ({
  status: 'not_started',
  tier: null,
  startedAt: null,
  completedAt: null,
  elapsedMs: 0,
  rawScore: null,
  normalizedScore: null,
  hintUsed: false,
  playId: makePlayId(date, gameKey, salt),
});

function blankDay(date: DateKey): DayState {
  return {
    date,
    seed: seedFor(date),
    plays: Object.fromEntries(
      GAME_KEYS.map((k, i) => [k, blankPlay(date, k, i)]),
    ) as Record<GameKey, PlayState>,
    setCompletedAt: null,
  };
}

/** Base spec section 4 keeps seven days of archive. One spare for the rollover. */
const KEEP_DAYS = 8;

export type TodayState = Hydratable & {
  days: Record<string, DayState>;
  ensureDay: (date: DateKey) => void;
  startPlay: (date: DateKey, gameKey: GameKey) => void;
  abandonPlay: (date: DateKey, gameKey: GameKey, elapsedMs: number) => void;
  useHint: (date: DateKey, gameKey: GameKey) => void;
  completePlay: (
    date: DateKey,
    gameKey: GameKey,
    result: { rawScore: number; normalizedScore: number; elapsedMs: number },
  ) => void;
  markSetComplete: (date: DateKey) => void;
  resetDay: (date: DateKey) => void;
};

export const useToday = create<TodayState>()(
  persist(
    (set, get) => ({
      _hydrated: false,
      markHydrated: () => set({ _hydrated: true }),
      days: {},

      ensureDay: (date) => {
        if (get().days[date]) return;
        const days = { ...get().days, [date]: blankDay(date) };
        // Prune on write rather than on a schedule, so storage cannot grow
        // unbounded even if the app is open across a month.
        const keys = Object.keys(days).sort().slice(-KEEP_DAYS);
        set({ days: Object.fromEntries(keys.map((k) => [k, days[k]])) });
      },

      startPlay: (date, gameKey) => {
        const day = get().days[date];
        if (!day) return;
        const play = day.plays[gameKey];
        if (play.status === 'completed') return;

        // Freeze the tier on first start only.
        const tier = play.tier ?? tierForRating(useProfile.getState().ratings[gameKey]);

        set({
          days: {
            ...get().days,
            [date]: {
              ...day,
              plays: {
                ...day.plays,
                [gameKey]: {
                  ...play,
                  status: 'in_progress',
                  tier,
                  startedAt: play.startedAt ?? Date.now(),
                },
              },
            },
          },
        });
      },

      abandonPlay: (date, gameKey, elapsedMs) => {
        const day = get().days[date];
        if (!day) return;
        const play = day.plays[gameKey];
        if (play.status !== 'in_progress') return;
        set({
          days: {
            ...get().days,
            [date]: {
              ...day,
              plays: {
                ...day.plays,
                [gameKey]: {
                  ...play,
                  status: 'abandoned',
                  elapsedMs: play.elapsedMs + elapsedMs,
                },
              },
            },
          },
        });
      },

      useHint: (date, gameKey) => {
        const day = get().days[date];
        if (!day) return;
        set({
          days: {
            ...get().days,
            [date]: {
              ...day,
              plays: { ...day.plays, [gameKey]: { ...day.plays[gameKey], hintUsed: true } },
            },
          },
        });
      },

      completePlay: (date, gameKey, result) => {
        const day = get().days[date];
        if (!day) return;
        const play = day.plays[gameKey];
        if (play.status === 'completed') return;
        set({
          days: {
            ...get().days,
            [date]: {
              ...day,
              plays: {
                ...day.plays,
                [gameKey]: {
                  ...play,
                  status: 'completed',
                  completedAt: Date.now(),
                  elapsedMs: play.elapsedMs + result.elapsedMs,
                  rawScore: result.rawScore,
                  normalizedScore: result.normalizedScore,
                },
              },
            },
          },
        });
      },

      markSetComplete: (date) => {
        const day = get().days[date];
        if (!day || day.setCompletedAt !== null) return;
        set({ days: { ...get().days, [date]: { ...day, setCompletedAt: Date.now() } } });
      },

      resetDay: (date) => set({ days: { ...get().days, [date]: blankDay(date) } }),
    }),
    {
      name: KEYS.days,
      version: SCHEMA_VERSION,
      storage: jsonStorage,
      partialize: ({ _hydrated, ...rest }) => rest as TodayState,
      onRehydrateStorage: onRehydrate<TodayState>(),
    },
  ),
);

/* ---------------------------------------------------------------
   Derived reads. Never stored, because a stored duplicate is how
   the Today list and the Set Complete screen drift apart.
   --------------------------------------------------------------- */

/** Memoized per date. Generation is cheap but not free, and this runs on every render. */
const setCache = new Map<DateKey, ReturnType<typeof generateDailySet>>();

export function dailySetFor(date: DateKey) {
  const hit = setCache.get(date);
  if (hit) return hit;
  const made = generateDailySet(date);
  setCache.set(date, made);
  return made;
}

export function selectDay(state: TodayState, date: DateKey): DayState | undefined {
  return state.days[date];
}

export function completedCount(day: DayState | undefined, slots: readonly GameKey[]): number {
  if (!day) return 0;
  return slots.filter((k) => day.plays[k].status === 'completed').length;
}

export function isSetComplete(day: DayState | undefined, slots: readonly GameKey[]): boolean {
  return completedCount(day, slots) === slots.length && slots.length > 0;
}

export function totalElapsed(day: DayState | undefined, slots: readonly GameKey[]): number {
  if (!day) return 0;
  return slots.reduce((sum, k) => sum + day.plays[k].elapsedMs, 0);
}

export function setScore(day: DayState | undefined, slots: readonly GameKey[]): number {
  if (!day) return 0;
  return slots.reduce((sum, k) => sum + (day.plays[k].normalizedScore ?? 0), 0);
}
