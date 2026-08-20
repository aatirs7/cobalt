import { View } from 'react-native';
import { METER } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * The header summary meter. One segment per game in the set.
 *
 * This is the single place to look to answer "how far through am I", which the
 * previous Today screen had no answer to: it encoded progress three times over
 * inside the rows and legibly zero times overall.
 *
 * Deliberately not a continuous bar. Five discrete segments say the set is
 * finite and countable, which is the whole product promise.
 */
export function Meter({ total, done }: { total: number; done: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: METER.gap }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: METER.height,
            backgroundColor: i < done ? theme.colors.accent : theme.colors.line,
          }}
        />
      ))}
    </View>
  );
}
