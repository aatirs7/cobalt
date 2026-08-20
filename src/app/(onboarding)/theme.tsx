import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Text } from '@/components/Text';
import { haptics } from '@/lib/haptics';
import { useSettings } from '@/state/settingsStore';
import { THEMES, THEME_KEYS, type ThemeKey } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/**
 * Screen 3. Tapping a swatch retints the entire screen immediately. No modal,
 * no preview card, no confirmation. The screen itself is the preview.
 *
 * No skip, since a default is always selected.
 */
export default function ThemePicker() {
  const active = useSettings((s) => s.themeKey);
  const setTheme = useSettings((s) => s.setTheme);
  const theme = useTheme();

  const pick = (k: ThemeKey) => {
    haptics.select();
    setTheme(k);
  };

  return (
    <OnboardingScreen
      step={2}
      motif="theme"
      heading="Choose your palette"
      body="You can change this any time."
      content={
        <View style={{ flexDirection: 'row', gap: 24 }}>
          {THEME_KEYS.map((k) => (
            <Pressable key={k} onPress={() => pick(k)} style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: THEMES[k].colors.bg,
                  borderWidth: 1,
                  borderColor: theme.colors.line,
                }}
              />
              {/* Selected is a 1.5pt ring in text at 4pt offset. Not a check, not a scale up. */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -5.5,
                  left: -5.5,
                  width: 83,
                  height: 83,
                  borderRadius: 41.5,
                  borderWidth: 1.5,
                  borderColor: active === k ? theme.colors.text : 'transparent',
                }}
              />
              <Text variant="label" color="textMuted" style={{ marginTop: 10, fontSize: 11 }}>
                {THEMES[k].name}
              </Text>
            </Pressable>
          ))}
        </View>
      }
      primary={{ label: 'Next', onPress: () => router.push('/(onboarding)/warmup') }}
    />
  );
}
