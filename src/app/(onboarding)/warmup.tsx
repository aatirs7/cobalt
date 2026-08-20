import { router } from 'expo-router';
import { OnboardingScreen } from '@/components/OnboardingScreen';

/**
 * Screen 4, onboarding spec section 4.
 *
 * Framing rules, which are not optional: never call this a test, an assessment,
 * a baseline or a benchmark. No score is shown at any point. No result screen,
 * completion advances straight to screen 5.
 *
 * The warm up itself runs the three abbreviated games once real game mechanics
 * exist. Until then both buttons take the same path and every rating stays at
 * 1000, which is arm B of games spec open question 2 and self corrects within
 * about five sessions. seedRatings is already wired for when it does run.
 */
export default function Warmup() {
  const next = () => router.push('/(onboarding)/friends');
  return (
    <OnboardingScreen
      step={3}
      motif="warmup"
      heading="A quick warm-up"
      body="Three short rounds so the puzzles start at the right level for you."
      primary={{ label: 'Start', onPress: next }}
      skip={{ label: 'Skip this', onPress: next }}
    />
  );
}
