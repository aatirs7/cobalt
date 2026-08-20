import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Meter } from './Meter';
import { Screen } from './Screen';
import { StreakDot } from './StreakDot';
import { Text } from './Text';
import { formatLong, type DateKey } from '@/engine/dateKey';
import { effectiveStreak } from '@/engine/streak';
import { formatDuration } from '@/lib/time';
import { TIMING, useMotion } from '@/motion/useMotion';
import { useProfile } from '@/state/profileStore';
import { dailySetFor, setScore, totalElapsed, useToday } from '@/state/todayStore';
import { MARGIN } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * What Today becomes once the set is done.
 *
 * The list gives way entirely, because there are no rows left to carry. The
 * header keeps its meter, now full, so the screen still reports the same thing
 * in the same place it always did.
 *
 * This answers "how did I do and where do I stand", which is a different
 * question from the one the Set Complete field answers, which is why the two
 * are separate screens rather than one crowded one.
 */

/** Placeholder board. Real groups arrive with the backend. */
const BOARD = [
  { pos: 1, name: 'Priya', total: 4380 },
  { pos: 2, name: 'You', total: 4120, me: true },
  { pos: 3, name: 'Sam', total: 3910 },
];

export function TodaySummary({ date }: { date: DateKey }) {
  const theme = useTheme();
  const { duration } = useMotion();

  const set = dailySetFor(date);
  const day = useToday((s) => s.days[date]);
  const streak = useProfile((s) => s.streak);
  const slotKeys = set.slots.map((s) => s.gameKey);

  const stats: [string, string][] = [
    ['Streak', String(effectiveStreak(streak, date))],
    ['Time', formatDuration(totalElapsed(day, slotKeys))],
    ['Total', String(setScore(day, slotKeys))],
  ];

  return (
    <Screen bleed>
      <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(duration(TIMING.base))}>
        <View style={{ paddingHorizontal: MARGIN, paddingTop: 12, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text variant="wordmark">Cobalt</Text>
              <Text variant="label" color="textMuted" style={{ marginTop: 6 }}>
                {formatLong(date)}
              </Text>
            </View>
            <StreakDot count={effectiveStreak(streak, date)} />
          </View>
          <View style={{ marginTop: 18 }}>
            <Meter total={slotKeys.length} done={slotKeys.length} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: MARGIN }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 44, gap: 24 }}>
            <Text variant="screenHeading">Done for today.</Text>

            <View style={{ flexDirection: 'row', gap: 34 }}>
              {stats.map(([label, value]) => (
                <View key={label} style={{ alignItems: 'center' }}>
                  <Text variant="label" color="textMuted" style={{ fontSize: 11 }}>
                    {label}
                  </Text>
                  <Text variant="numeric" style={{ fontSize: 26, marginTop: 4 }}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Blind until played, games spec section 5.1. The set is done, so the
              board is visible now and not a moment before. */}
          <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: 18 }}>
            <Text variant="label" color="textMuted" style={{ fontSize: 11 }}>
              Today
            </Text>
            {BOARD.map((row) => (
              <View
                key={row.pos}
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 12,
                  paddingVertical: 10,
                }}
              >
                <Text variant="body" color="textMuted" style={{ fontSize: 13, width: 16 }}>
                  {row.pos}
                </Text>
                <Text variant="body" color={row.me ? 'accent' : 'text'}>
                  {row.name}
                </Text>
                <Text
                  variant="body"
                  color={row.me ? 'accent' : 'text'}
                  style={{ marginLeft: 'auto', fontVariant: ['tabular-nums'] }}
                >
                  {row.total}
                </Text>
              </View>
            ))}
          </View>

          <Text variant="body" color="textMuted" style={{ marginTop: 26, fontSize: 13 }}>
            New set at midnight.
          </Text>
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: MARGIN,
            paddingVertical: 14,
          }}
        >
          <Pressable onPress={() => router.push('/(main)/progress')} hitSlop={12}>
            <Text variant="label" color="textMuted">
              Progress
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/settings')} hitSlop={12}>
            <Text variant="label" color="textMuted">
              Settings
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}
