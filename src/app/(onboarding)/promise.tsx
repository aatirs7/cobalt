import { router } from 'expo-router';
import { OnboardingScreen } from '@/components/OnboardingScreen';

/**
 * Screen 2. This screen exists to set the expectation that the app is finite.
 * It is the differentiator and it needs stating explicitly, because every
 * competitor in the category is infinite and users assume the same of you.
 */
export default function Promise() {
  const next = () => router.push('/(onboarding)/theme');
  return (
    <OnboardingScreen
      step={1}
      motif="promise"
      heading="A new set every day"
      body="It arrives at midnight. When you finish it, you are done. There is nothing left to grind."
      primary={{ label: 'Next', onPress: next }}
      skip={{ label: 'Skip', onPress: next }}
    />
  );
}
