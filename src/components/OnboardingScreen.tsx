import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MARGIN } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';
import { TIMING, useMotion } from '@/motion/useMotion';
import { Motif, type MotifKey } from './Motif';
import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

/**
 * The single onboarding layout, onboarding spec section 2. No screen implements
 * its own layout.
 *
 * Everything is centered on both axes. The motif slot, heading baseline and
 * button all sit at fixed Y across all six screens, so nothing shifts position
 * between them. That is what makes the transitions feel calm rather than jumpy.
 */
type Props = {
  motif: MotifKey;
  heading: string;
  body: string;
  /** Optional interactive element, centered. */
  content?: ReactNode;
  primary: { label: string; onPress: () => void; disabled?: boolean };
  secondary?: { label: string; onPress: () => void };
  skip?: { label: string; onPress: () => void };
  /** Screen 1 sets the wordmark at 40 rather than 32. It is the only deviation. */
  headingVariant?: 'onboardHeading' | 'screenHeading';
  step: number;
  steps?: number;
};

export function OnboardingScreen({
  motif,
  heading,
  body,
  content,
  primary,
  secondary,
  skip,
  headingVariant = 'onboardHeading',
  step,
  steps = 6,
}: Props) {
  const theme = useTheme();
  const { duration, translate } = useMotion();

  return (
    <Screen center>
      <Animated.View
        style={{ flex: 1, width: '100%', alignItems: 'center', paddingBottom: 34 }}
        entering={FadeIn.duration(duration(TIMING.onboarding))
          .withInitialValues({ transform: [{ translateY: translate(12) }] })}
        exiting={FadeOut.duration(duration(TIMING.onboardingOut))}
      >
        <View style={{ flex: 1 }} />

        <Motif name={motif} />

        <Text variant={headingVariant} style={{ marginTop: 48, textAlign: 'center' }}>
          {heading}
        </Text>

        <Text
          variant="body"
          color="textMuted"
          style={{ marginTop: 16, maxWidth: 280, textAlign: 'center' }}
        >
          {body}
        </Text>

        <View style={{ flex: 1 }} />

        {content ? <View style={{ alignItems: 'center' }}>{content}</View> : null}

        <View style={{ width: '100%', paddingHorizontal: MARGIN, marginTop: 40 }}>
          <Button label={primary.label} onPress={primary.onPress} disabled={primary.disabled} />
        </View>

        {secondary ? (
          <View style={{ marginTop: 16 }}>
            <Button label={secondary.label} onPress={secondary.onPress} variant="accentText" />
          </View>
        ) : null}

        {skip ? (
          <View style={{ marginTop: 20 }}>
            <Button label={skip.label} onPress={skip.onPress} variant="quiet" />
          </View>
        ) : null}

        {/* Six dots, section 5. Color only, never size. */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 30 }}>
          {Array.from({ length: steps }, (_, i) => (
            <View
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === step ? theme.colors.accent : theme.colors.line,
              }}
            />
          ))}
        </View>
      </Animated.View>
    </Screen>
  );
}
