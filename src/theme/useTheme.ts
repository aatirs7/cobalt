import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSettings } from '@/state/settingsStore';
import { THEMES, type Theme, type ThemeKey } from './tokens';

export function useTheme(): Theme {
  const key = useSettings((s) => s.themeKey);
  return THEMES[key];
}

type NamedStyles = Record<string, object>;

/**
 * StyleSheet.create cannot take dynamic values, so theme dependent styles are
 * built per theme and cached. The cache is bounded at three entries, one per
 * palette, so it never grows.
 */
export function makeStyles<T extends NamedStyles>(fn: (t: Theme) => T) {
  const cache = new Map<ThemeKey, T>();
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => {
      const hit = cache.get(theme.key);
      if (hit) return hit;
      const made = StyleSheet.create(fn(theme) as NamedStyles) as T;
      cache.set(theme.key, made);
      return made;
    }, [theme]);
  };
}
