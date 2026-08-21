import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Text } from './Text';
import type { Instructions } from '@/games/instructions';
import { haptics } from '@/lib/haptics';
import { MARGIN } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * How to play. A few cards, tapped through, one idea each.
 *
 * Deliberately not a sheet of bullet points. This appears in front of a two
 * minute puzzle, so it has to be readable in about four seconds, and anything
 * that needs a scrollbar has already failed at that.
 *
 * Tap anywhere to advance, which means the whole screen is the control and
 * there is nothing to aim at. Dots show how much is left, so the commitment is
 * visible before the first tap.
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
  const [index, setIndex] = useState(0);

  const last = index >= instructions.length - 1;

  const advance = () => {
    haptics.select();
    if (last) {
      onClose();
      // Reset so reopening from the question mark starts at the beginning.
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={advance}
        style={{
          flex: 1,
          backgroundColor: c.bg,
          paddingHorizontal: MARGIN,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* The game name, quiet, so the card never loses its context. */}
        <View style={{ position: 'absolute', top: 72, alignItems: 'center' }}>
          <Text variant="label" color="textMuted">
            {title}
          </Text>
        </View>

        <Text
          variant="screenHeading"
          style={{ textAlign: 'center', maxWidth: 300, fontSize: 26, lineHeight: 34 }}
        >
          {instructions[index]}
        </Text>

        <View style={{ position: 'absolute', bottom: 64, alignItems: 'center', gap: 22 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {instructions.map((_, i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? c.accent : c.line,
                }}
              />
            ))}
          </View>

          <Text variant="label" color="textMuted" style={{ fontSize: 11 }}>
            {last ? 'Tap to play' : 'Tap to continue'}
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

/**
 * The flat question mark that reopens the cards.
 *
 * Base spec section 2.4 bans decorative icons in navigation, but this sits
 * inside a game screen, where glyphs are allowed, and it is doing work rather
 * than decorating.
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
