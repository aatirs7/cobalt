import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSettings } from '@/state/settingsStore';

/**
 * Motion gating, base spec section 2.5 and onboarding spec section 5.
 *
 * Two inputs, one output: the OS reduce motion setting and the user's own
 * toggle in Settings. Either one on means reduced.
 *
 * When reduced, opacity still animates but nothing translates. Cross fades are
 * not what motion sensitivity is about, positional movement is.
 */
export function useMotion() {
  const userReduced = useSettings((s) => s.reduceMotion);
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setOsReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOsReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  const reduced = osReduced || userReduced;

  return {
    reduced,
    /** Every duration in the app passes through here. */
    duration: (ms: number) => (reduced ? 0 : ms),
    /** Translate deltas collapse to zero when reduced. */
    translate: (px: number) => (reduced ? 0 : px),
  };
}

/** Section 2.5 timings, in one place so they cannot drift. */
export const TIMING = {
  /** Screen and element transitions. */
  base: 200,
  /** Onboarding cross fade, onboarding spec section 5. */
  onboarding: 280,
  onboardingOut: 180,
  /** Correct answer: fade in, hold, fade out. */
  successIn: 150,
  successHold: 300,
  successOut: 150,
  /** Wrong answer: one excursion, no repeat shake loop. */
  errorHalf: 60,
  /** Motif stroke draw and its per element stagger. */
  motifDraw: 600,
  motifStagger: 40,
  /** Motif entry begins after the screen transition so the two do not compete. */
  motifDelay: 100,
  /** Theme retint on the picker. */
  retint: 300,
} as const;
