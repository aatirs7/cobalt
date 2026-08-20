import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { Text } from './Text';

/**
 * Base spec section 4: a small dot plus a number. No flame, no fire, no
 * escalating visual reward.
 *
 * It sits top right of the header, opposite the wordmark. An earlier version
 * placed it on the axis running through the list, which read as though the
 * streak were the first item in the set rather than a property of the header.
 */
export function StreakDot({ count }: { count: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.accent,
        }}
      />
      <Text variant="label" color="text" style={{ fontVariant: ['tabular-nums'] }}>
        {String(count)}
      </Text>
    </View>
  );
}
