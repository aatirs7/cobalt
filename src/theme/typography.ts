import type { TextStyle } from 'react-native';

/**
 * Type scale from cobalt-spec.md section 2.3. Two families only.
 *
 * Each weight is registered as its own family name and fontWeight is never set
 * anywhere in the app. On iOS, combining a custom fontFamily with fontWeight
 * produces synthesized bolding or silently picks the wrong face.
 */
export const FONTS = {
  displayRegular: 'SourceSerif4_400Regular',
  displayMedium: 'SourceSerif4_500Medium',
  uiLight: 'Inter_300Light',
  uiRegular: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
} as const;

export type TextVariant =
  | 'wordmark'
  | 'screenHeading'
  | 'onboardHeading'
  | 'gameName'
  | 'body'
  | 'label'
  | 'numeric';

type Spec = {
  family: string;
  size: number;
  /** Tracking as specified, in em. Converted to points below. */
  em: number;
  lineHeightRatio: number;
  uppercase?: true;
  tabular?: true;
};

const SPECS: Record<TextVariant, Spec> = {
  wordmark: { family: FONTS.displayMedium, size: 28, em: -0.02, lineHeightRatio: 1.15 },
  screenHeading: { family: FONTS.displayRegular, size: 34, em: -0.02, lineHeightRatio: 1.15 },
  // Onboarding spec section 2 fixes the heading at 32.
  onboardHeading: { family: FONTS.displayRegular, size: 32, em: -0.02, lineHeightRatio: 1.15 },
  gameName: { family: FONTS.displayRegular, size: 24, em: -0.01, lineHeightRatio: 1.25 },
  body: { family: FONTS.uiRegular, size: 16, em: 0, lineHeightRatio: 1.5 },
  label: { family: FONTS.uiMedium, size: 13, em: 0.04, lineHeightRatio: 1.2, uppercase: true },
  numeric: { family: FONTS.uiLight, size: 40, em: -0.01, lineHeightRatio: 1.0, tabular: true },
};

function build(s: Spec): TextStyle {
  return {
    fontFamily: s.family,
    fontSize: s.size,
    lineHeight: Math.round(s.size * s.lineHeightRatio),
    // React Native letterSpacing is in points, the spec states em.
    letterSpacing: Number((s.size * s.em).toFixed(2)),
    ...(s.uppercase ? { textTransform: 'uppercase' as const } : null),
    ...(s.tabular ? { fontVariant: ['tabular-nums' as const] } : null),
  };
}

export const textStyles = Object.fromEntries(
  (Object.keys(SPECS) as TextVariant[]).map((k) => [k, build(SPECS[k])]),
) as Record<TextVariant, TextStyle>;

/**
 * Dynamic Type would break the 32pt row rhythm and the fixed onboarding
 * template, so display variants are capped. Body and label scale freely.
 */
export const MAX_SCALE: Partial<Record<TextVariant, number>> = {
  wordmark: 1.3,
  screenHeading: 1.3,
  onboardHeading: 1.3,
  gameName: 1.3,
  numeric: 1.3,
};
