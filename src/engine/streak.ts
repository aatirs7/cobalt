import { addDays, daysBetween, monthOf, type DateKey } from './dateKey';

/**
 * Streak, base spec section 4.
 *
 * A streak increments when all five games in a day are completed. One free skip
 * per calendar month protects it and applies automatically. Losing a streak
 * produces no punishment screen and no red state, it resets silently, so
 * nothing in the UI may render on a decrease.
 */
export type StreakState = {
  current: number;
  longest: number;
  lastCompletedDate: DateKey | null;
  /**
   * The YYYY-MM the free skip was spent on, or null if unspent.
   *
   * The skip belongs to the month of the missed day rather than the month the
   * user happens to open the app in. That is the more generous and more
   * intuitive reading of "one free skip per calendar month", and it avoids the
   * case where missing 31 January silently spends February's skip.
   */
  skipMonth: string | null;
};

export const INITIAL_STREAK: StreakState = {
  current: 0,
  longest: 0,
  lastCompletedDate: null,
  skipMonth: null,
};

type Resolved = { current: number; skipMonth: string | null; skipUsed: boolean };

/**
 * Shared gap logic. Returns what the streak would be if the set were completed
 * on `today`, without committing anything.
 */
function resolve(s: StreakState, today: DateKey): Resolved {
  if (s.lastCompletedDate === null) {
    return { current: 1, skipMonth: s.skipMonth, skipUsed: false };
  }

  const gap = daysBetween(s.lastCompletedDate, today);

  // Already counted today, or a clock that moved backwards. Leave it alone.
  if (gap <= 0) return { current: s.current, skipMonth: s.skipMonth, skipUsed: false };

  // Consecutive day.
  if (gap === 1) return { current: s.current + 1, skipMonth: s.skipMonth, skipUsed: false };

  // Exactly one day missed. The free skip can cover it if this month's is unspent.
  if (gap === 2) {
    const missedMonth = monthOf(addDays(today, -1));
    if (s.skipMonth !== missedMonth) {
      return { current: s.current + 1, skipMonth: missedMonth, skipUsed: true };
    }
    return { current: 1, skipMonth: s.skipMonth, skipUsed: false };
  }

  // Two or more missed. One skip cannot cover it.
  return { current: 1, skipMonth: s.skipMonth, skipUsed: false };
}

/** Called exactly once, when the fifth game of a day completes. */
export function onSetCompleted(s: StreakState, today: DateKey): StreakState {
  const r = resolve(s, today);
  return {
    current: r.current,
    longest: Math.max(s.longest, r.current),
    lastCompletedDate: today,
    skipMonth: r.skipMonth,
  };
}

/**
 * Pure read for the streak indicator. The streak decays with wall clock time,
 * so this must never mutate and must never run on a timer. It answers "what
 * does the dot show right now", which is the count as of the last completed
 * day, zeroed once the gap is too large to recover.
 */
export function effectiveStreak(s: StreakState, today: DateKey): number {
  if (s.lastCompletedDate === null) return 0;

  const gap = daysBetween(s.lastCompletedDate, today);
  if (gap <= 0) return s.current;
  // Today is still in play, and so is a single missed day if the skip is unspent.
  if (gap === 1) return s.current;
  if (gap === 2) {
    const missedMonth = monthOf(addDays(today, -1));
    return s.skipMonth !== missedMonth ? s.current : 0;
  }
  return 0;
}

/** Whether completing today would spend the month's free skip. Never surfaced in the UI. */
export function wouldUseSkip(s: StreakState, today: DateKey): boolean {
  return resolve(s, today).skipUsed;
}
