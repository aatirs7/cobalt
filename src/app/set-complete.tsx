import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { formatDuration , useDateKey } from '@/lib/time';
import { haptics } from '@/lib/haptics';
import { effectiveStreak } from '@/engine/streak';
import { TIMING, useMotion } from '@/motion/useMotion';
import { useProfile } from '@/state/profileStore';
import { dailySetFor, setScore, totalElapsed, useToday } from '@/state/todayStore';
import { useTheme } from '@/theme/useTheme';

/**
 * Screen 2 of the flow, base spec section 5.4.
 *
 * The full bleed field. It fires once, on finishing the fifth game, and it
 * answers exactly one question: am I done. No board, no detail, nothing to
 * read for more than two seconds.
 *
 * One deviation from section 5.4, forced by contrast. The spec asks for an
 * accent check mark, but accent on accentSoft measures 4.08, 2.91 and 2.81 to 1
 * across the three themes, so it is not legible in any of them. The spine,
 * circle and check are drawn in text instead: 9.43, 8.20 and 5.45. Same
 * restraint, readable everywhere.
 */
export default function SetComplete() {
  const date = useDateKey();
  const theme = useTheme();
  const c = theme.colors;
  const { duration } = useMotion();

  const set = dailySetFor(date);
  const day = useToday((s) => s.days[date]);
  const streak = useProfile((s) => s.streak);
  const slotKeys = set.slots.map((s) => s.gameKey);

  useEffect(() => {
    haptics.setComplete();
  }, []);

  const stats: [string, string][] = [
    ['Streak', String(effectiveStreak(streak, date))],
    ['Time', formatDuration(totalElapsed(day, slotKeys))],
    ['Total', String(setScore(day, slotKeys))],
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(duration(TIMING.base))}
      style={{
        flex: 1,
        backgroundColor: c.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
      }}
    >
      {/* The spine, complete, entering from the top and terminating in the mark. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          height: '32%',
          width: 2,
          backgroundColor: c.text,
        }}
      />

      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 1.5,
          borderColor: c.text,
          backgroundColor: c.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M5 12.5 L10 17 L19 7"
            stroke={c.text}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>

      <Text variant="screenHeading">Done for today.</Text>

      <View style={{ flexDirection: 'row', gap: 38 }}>
        {stats.map(([label, value]) => (
          <View key={label} style={{ alignItems: 'center' }}>
            <Text variant="label" style={{ fontSize: 11, marginBottom: 5 }}>
              {label}
            </Text>
            <Text variant="numeric" style={{ fontSize: 28 }}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ position: 'absolute', bottom: 46, alignItems: 'center', gap: 18 }}>
        <Text variant="body" style={{ opacity: 0.8 }}>
          New set at midnight.
        </Text>
        <Text variant="label" onPress={() => router.back()} style={{ paddingVertical: 8 }}>
          Close
        </Text>
      </View>
    </Animated.View>
  );
}
