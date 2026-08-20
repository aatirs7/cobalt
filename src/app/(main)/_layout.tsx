import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';
import { TIMING } from '@/motion/useMotion';

/**
 * A stack, deliberately not a tab bar.
 *
 * Base spec section 2.4 forbids decorative icons in navigation, and a tab bar
 * with text only labels is a worse fit than reaching Progress and Settings from
 * small text affordances on Today.
 */
export default function MainLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: TIMING.base,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    />
  );
}
