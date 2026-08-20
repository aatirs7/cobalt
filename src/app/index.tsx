import { Redirect } from 'expo-router';
import { useProfile } from '@/state/profileStore';

/**
 * Boot gate.
 *
 * A real index route that redirects, rather than conditional rendering inside
 * the root layout. That keeps deep links working and keeps the layout tree
 * stable across the onboarding boundary.
 */
export default function Boot() {
  const onboarded = useProfile((s) => s.onboardedAt !== null);
  return <Redirect href={onboarded ? '/(main)/today' : '/(onboarding)/welcome'} />;
}
