import { View } from 'react-native';
import { SPINE } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';
import { Text } from './Text';

/**
 * Base spec section 4: a small dot plus a number. No flame, no fire, no
 * escalating visual reward. Direction D sits the dot on the spine, so the
 * streak is placed structurally rather than decoratively.
 */
export function StreakDot({ count, onSpine = true }: { count: number; onSpine?: boolean }) {
  const theme = useTheme();
  const size = onSpine ? 15 : 8;

  const dot = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.accent,
      }}
    />
  );

  if (!onSpine) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        {dot}
        <Text variant="label" color="text">
          {String(count)}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: SPINE.x - size / 2,
        bottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
      }}
    >
      {dot}
      <Text variant="label" color="text">
        {String(count)}
      </Text>
    </View>
  );
}
