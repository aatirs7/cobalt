import { router } from 'expo-router';
import { OnboardingScreen } from '@/components/OnboardingScreen';

/**
 * Screen 4, onboarding spec section 4.
 *
 * Framing rules, which are not optional: never call this a test, an assessment,
 * a baseline or a benchmark. No score is shown at any point. No result screen,
 * completion advances straight to screen 5.
 *
 * Start runs three abbreviated rounds in a modal route, so the warm-up's own
 * navigation never pollutes the six dot progress indicator.
 *
 * Skip leaves every rating at 1000, which is arm B of games spec open question
 * 2 and self corrects within about five sessions. Neither path shows a score.
 */
export default function Warmup() {
  return (
    <OnboardingScreen
      step={3}
      motif="warmup"
      heading="A quick warm-up"
      body="Three short rounds so the puzzles start at the right level for you."
      primary={{ label: 'Start', onPress: () => router.push('/warmup-run') }}
      skip={{ label: 'Skip this', onPress: () => router.push('/(onboarding)/friends') }}
    />
  );
}
