/**
 * Local calendar dates as opaque YYYY-MM-DD strings.
 *
 * All arithmetic goes through UTC noon. A UTC midnight epoch combined with a
 * daylight saving transition can land a day off, and the daily set rolling over
 * an hour early for part of the year is not an acceptable failure.
 *
 * Nothing in this file reads the system clock. That belongs to src/lib/time.ts
 * on the app side, which is what lets the server call these functions for any
 * date it likes.
 */

declare const brand: unique symbol;
export type DateKey = string & { readonly [brand]: 'DateKey' };

const PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(year: number, month1: number, day: number): DateKey {
  return `${year}-${pad(month1)}-${pad(day)}` as DateKey;
}

export function isDateKey(v: string): v is DateKey {
  return PATTERN.test(v);
}

export function asDateKey(v: string): DateKey {
  if (!isDateKey(v)) throw new Error(`Not a date key: ${v}`);
  return v;
}

function parts(k: DateKey): [number, number, number] {
  return [Number(k.slice(0, 4)), Number(k.slice(5, 7)), Number(k.slice(8, 10))];
}

/** Epoch milliseconds at UTC noon on that calendar day. */
function noon(k: DateKey): number {
  const [y, m, d] = parts(k);
  return Date.UTC(y, m - 1, d, 12);
}

const DAY_MS = 86400000;

export function addDays(k: DateKey, n: number): DateKey {
  const t = new Date(noon(k) + n * DAY_MS);
  return toDateKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Whole days from a to b. Positive when b is later. */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((noon(b) - noon(a)) / DAY_MS);
}

/** YYYY-MM, used by the streak's one free skip per calendar month. */
export function monthOf(k: DateKey): string {
  return k.slice(0, 7);
}

/** 0 is Sunday, matching Date.getUTCDay. */
export function weekdayOf(k: DateKey): number {
  return new Date(noon(k)).getUTCDay();
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "Wednesday 20 August". Rendered in label style, so casing is applied by the view. */
export function formatLong(k: DateKey): string {
  const [, m, d] = parts(k);
  return `${WEEKDAYS[weekdayOf(k)]} ${d} ${MONTHS[m - 1]}`;
}
