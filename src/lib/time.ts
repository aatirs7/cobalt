import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { toDateKey, type DateKey } from '@/engine/dateKey';

/**
 * The only place in the app that reads the system clock.
 *
 * Uses local getFullYear, getMonth and getDate rather than toISOString, which is
 * UTC and would roll the daily set over at the wrong hour for anyone not on UTC.
 */
export function currentDateKey(now: Date = new Date()): DateKey {
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function msUntilNextMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * The current local date, refreshed when the app returns to the foreground and
 * when local midnight passes. Never polls: one timer, re armed on each fire.
 */
export function useDateKey(): DateKey {
  const [key, setKey] = useState<DateKey>(() => currentDateKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const sync = () => setKey(currentDateKey());

    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sync();
        arm();
      }, msUntilNextMidnight());
    };

    arm();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
        arm();
      }
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return key;
}

/**
 * Time spent on the current screen.
 *
 * The clock is read in an effect and in a callback, never during render. Base
 * spec section 5.3 records time but never shows it while playing, since a
 * visible countdown raises stress and works against the calm positioning.
 */
export function useElapsed(): () => number {
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  return useCallback(() => (startedAt.current === 0 ? 0 : Date.now() - startedAt.current), []);
}

/** Elapsed milliseconds as m:ss, for the Set Complete stats. */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Stable enough id for a local play. Merged server side on sign in. */
export function makePlayId(date: DateKey, gameKey: string, salt: number): string {
  return `${date}-${gameKey}-${salt.toString(36)}`;
}
