import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from './Button';
import { Text } from './Text';
import type { Instructions } from '@/games/instructions';
import { TIMING, useMotion } from '@/motion/useMotion';
import { MARGIN, RADIUS } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * How to play, shown on first visit to a game and any time after from the
 * question mark in the header.
 *
 * A sheet rather than a full screen, so the game stays visible behind it and it
 * reads as a note about the thing rather than a detour away from it.
 *
 * No drop shadow, per base spec section 2.4. The sheet separates from what is
 * behind it with a dimmed ground and a hairline, not elevation.
 */
export function InstructionsSheet({
  title,
  instructions,
  visible,
  onClose,
}: {
  title: string;
  instructions: Instructions;
  visible: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const { duration } = useMotion();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tapping the ground dismisses, which is the fastest way out for someone
          who opened this by accident. */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          // Dimming uses the palette's own dim ground rather than pure black,
          // which section 2.1 rules out everywhere.
          backgroundColor: theme.dim ? 'rgba(0,0,0,0.55)' : 'rgba(38,38,43,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        {/* Stops a tap inside the sheet from closing it. */}
        <Pressable onPress={() => {}}>
          <Animated.View
            entering={FadeIn.duration(duration(TIMING.base))}
            style={{
              backgroundColor: c.bg,
              borderTopLeftRadius: RADIUS.lg,
              borderTopRightRadius: RADIUS.lg,
              borderTopWidth: 1,
              borderTopColor: c.line,
              paddingHorizontal: MARGIN,
              paddingTop: 22,
              paddingBottom: 34,
              maxHeight: '82%',
            }}
          >
            <Text variant="gameName">{title}</Text>
            <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
              {instructions.summary}
            </Text>

            <ScrollView
              style={{ marginTop: 20 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="label" color="textMuted">
                How to play
              </Text>

              <View style={{ marginTop: 12, gap: 12 }}>
                {instructions.steps.map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                    {/* A hairline tick rather than a bullet glyph, matching the
                        marks used everywhere else in the app. */}
                    <View
                      style={{
                        width: 10,
                        height: 1,
                        backgroundColor: c.line,
                        marginTop: 11,
                      }}
                    />
                    <Text variant="body" style={{ flex: 1 }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>

              <View
                style={{
                  marginTop: 24,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: c.line,
                }}
              >
                <Text variant="label" color="textMuted">
                  What it works on
                </Text>
                <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
                  {instructions.trains}
                </Text>
              </View>
            </ScrollView>

            <View style={{ marginTop: 20 }}>
              <Button label="Got it" onPress={onClose} />
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * The flat question mark that opens the sheet.
 *
 * Sits in the game header. Base spec section 2.4 bans decorative icons in
 * navigation, but this is inside a game screen, where glyphs are allowed, and
 * it is doing work rather than decorating.
 */
export function HelpButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={14}
      accessibilityRole="button"
      accessibilityLabel="How to play"
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: theme.colors.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="label" color="textMuted" style={{ fontSize: 12, letterSpacing: 0 }}>
        ?
      </Text>
    </Pressable>
  );
}
