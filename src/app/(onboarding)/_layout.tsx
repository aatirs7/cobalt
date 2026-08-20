import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';
import { TIMING } from '@/motion/useMotion';

/**
 * Onboarding stack, onboarding spec section 8.
 *
 * Cross fade only. No horizontal page slide, no parallax, no card stack. Back
 * is the left edge swipe, reversing the transition, since a back chevron would
 * violate the centered layout rule.
 */
export default function OnboardingLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: TIMING.onboarding,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      {/* No swiping back out of the first screen. */}
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
