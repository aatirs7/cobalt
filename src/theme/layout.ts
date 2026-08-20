/** Layout constants from cobalt-spec.md section 2.4 and the Today screen geometry. */

/** Base spacing unit. Multiply, never guess. */
export const UNIT = 8;
export const space = (n: number) => n * UNIT;

/** Safe horizontal margin, section 2.4. */
export const MARGIN = 24;

export const RADIUS = {
  /** Small elements. */
  sm: 4,
  /** Full width surfaces. */
  lg: 12,
  /** Full bleed bands. */
  none: 0,
} as const;

export const HAIRLINE = 1;

/**
 * The rail.
 *
 * Sits just inside the safe margin so it borders the list rather than running
 * through it. An earlier version placed this axis at x 88, between the domain
 * label and the game name, which split every row in two and forced the eye to
 * hop a vertical line to connect the two halves of one row.
 *
 * The rail now carries per row state: which games are done, and where they sit
 * in the list. The five segment meter in the header carries the summary. Two
 * indicators are only worth having because they answer different questions,
 * how many versus which.
 */
export const RAIL = {
  /** Distance from the screen's left edge to the rail. */
  x: 28,
  restingWidth: 1,
  completedWidth: 2,
  /** Tick crossing the rail, centred on it. */
  tickWidth: 18,
  tickWidthDone: 20,
  /** Where row content begins, clear of the rail and its ticks. */
  bodyOffset: 56,
} as const;

/** Centres a tick of the given width on the rail. */
export function tickLeft(width: number): number {
  return RAIL.x - width / 2;
}

/** Header progress meter, five segments for five games. */
export const METER = {
  height: 2,
  gap: 6,
} as const;
