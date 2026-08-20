/** Layout constants from cobalt-spec.md section 2.4 and the Direction D spine geometry. */

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
 * Direction D geometry. The spine sits at a fixed x on every screen and never
 * moves, which is the whole premise. The gutter to its left carries slot labels
 * right aligned, the mark column straddles it, and content begins after.
 */
export const SPINE = {
  /** Distance from the screen's left edge to the spine itself. */
  x: 88,
  /** Right aligned slot label column, from x 0 to 72. */
  gutter: 72,
  gutterPad: 8,
  /** Column the tick is drawn in, straddling the spine. */
  mark: 32,
  /** Gap between the mark column and the game name. */
  metaPad: 16,
  restingWidth: 1,
  completedWidth: 2,
} as const;

/**
 * Tick length encodes duration. Section 3 of the direction notes this is a
 * learned convention, so the duration is also printed at the band's right edge.
 */
export function tickLength(minutes: number): number {
  if (minutes <= 2) return 8;
  if (minutes === 3) return 12;
  return 16;
}

/** Centers a tick of the given length on the spine, as a left offset inside the mark column. */
export function tickOffset(length: number): number {
  return SPINE.x - SPINE.gutter - length / 2;
}
