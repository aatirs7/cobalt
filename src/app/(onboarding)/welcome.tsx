import { router } from 'expo-router';
import { OnboardingScreen } from '@/components/OnboardingScreen';

/** Screen 1. No skip on the first screen, onboarding spec section 1. */
export default function Welcome() {
  return (
    <OnboardingScreen
      step={0}
      motif="welcome"
      // The wordmark is the heading here, set at 40 rather than 32. This is the
      // only screen where the heading size deviates.
      headingVariant="screenHeading"
      heading="Cobalt"
      body="Five puzzles a day. Ten minutes. That is all."
      primary={{ label: 'Begin', onPress: () => router.push('/(onboarding)/promise') }}
    />
  );
}
