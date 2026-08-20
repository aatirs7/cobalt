/**
 * Color tokens. Every hex here comes verbatim from cobalt-spec.md section 2.2.
 * No color in this file is invented, and nothing else in the app may declare a
 * literal color. See src/theme/__tests__/harshness.test.ts, which enforces the
 * harshness rule from section 2.1 numerically.
 */

export const THEME_KEYS = ['gray', 'green', 'black'] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export type ColorToken =
  | 'bg'
  | 'surface'
  | 'surfaceAlt'
  | 'text'
  | 'textMuted'
  | 'line'
  | 'accent'
  | 'accentSoft'
  | 'success'
  | 'error';

export type Hex = `#${string}`;
export type Palette = Readonly<Record<ColorToken, Hex>>;

export type Theme = Readonly<{
  key: ThemeKey;
  /** Shown in the onboarding picker and in Settings. */
  name: string;
  /**
   * True for Pastel Black only. Drives the status bar and the native keyboard.
   * Deliberately not called isDark, because section 2.2 is explicit that this
   * is a dimmed palette rather than an inverted one.
   */
  dim: boolean;
  colors: Palette;
}>;

const gray: Palette = {
  bg: '#EDEDEA',
  surface: '#E4E4E0',
  surfaceAlt: '#F2F2EF',
  text: '#26262B',
  textMuted: '#6E6E76',
  line: '#D2D2CD',
  accent: '#4A5D8A',
  accentSoft: '#C4CDE0',
  success: '#6E8C6A',
  error: '#A8706A',
};

const green: Palette = {
  bg: '#E8EDE5',
  surface: '#DDE4D9',
  surfaceAlt: '#F0F3ED',
  text: '#2A302A',
  textMuted: '#6B7268',
  line: '#CDD5C8',
  accent: '#5A7A5E',
  accentSoft: '#BDCEBF',
  success: '#5A7A5E',
  error: '#A8756A',
};

const black: Palette = {
  bg: '#1E1E22',
  surface: '#2A2A2F',
  surfaceAlt: '#26262A',
  text: '#D8D8D2',
  textMuted: '#8A8A92',
  line: '#38383E',
  accent: '#8A9BC4',
  accentSoft: '#4A5266',
  success: '#7E9B7A',
  error: '#B08078',
};

export const THEMES: Readonly<Record<ThemeKey, Theme>> = {
  gray: { key: 'gray', name: 'Gray', dim: false, colors: gray },
  green: { key: 'green', name: 'Green', dim: false, colors: green },
  black: { key: 'black', name: 'Black', dim: true, colors: black },
};

export const DEFAULT_THEME_KEY: ThemeKey = 'gray';
