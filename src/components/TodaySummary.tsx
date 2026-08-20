import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Screen } from './Screen';
import { StreakDot } from './StreakDot';
import { Text } from './Text';
import { formatLong, type DateKey } from '@/engine/dateKey';
import { effectiveStreak } from '@/engine/streak';
import { formatDuration } from '@/lib/time';
import { TIMING, useMotion } from '@/motion/useMotion';
import { useProfile } from '@/state/profileStore';
import { dailySetFor, setScore, totalElapsed, useToday } from '@/state/todayStore';
import { MARGIN, SPINE } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * Screen 3 of the flow: what Today becomes once the set is done.
 *
 * The bands are gone, because there are no rows left to carry. What remains is
 * the spine, now fully accent, with the stats and the board hanging off it as
 * marks. This answers "how did I do and where do I stand", which is a different
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
  const c = theme.colors;
  const { duration } = useMotion();

  const set = dailySetFor(date);
  const day = useToday((s) => s.days[date]);
  const streak = useProfile((s) => s.streak);
  const slotKeys = set.slots.map((s) => s.gameKey);

  const elapsed = totalElapsed(day, slotKeys);
  const total = setScore(day, slotKeys);

  const stats: [string, string][] = [
    ['Streak', String(effectiveStreak(streak, date))],
    ['Time', formatDuration(elapsed)],
    ['Total', String(total)],
  ];

  return (
    <Screen bleed>
      <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(duration(TIMING.base))}>
        <View style={{ paddingHorizontal: MARGIN, paddingTop: 12, height: 150 }}>
          <Text variant="wordmark">Cobalt</Text>
          <Text variant="label" color="textMuted" style={{ marginTop: 6 }}>
            {formatLong(date)}
          </Text>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: SPINE.x - SPINE.completedWidth / 2,
              top: 96,
              bottom: 0,
              width: SPINE.completedWidth,
              backgroundColor: c.accent,
            }}
          />
          <StreakDot count={effectiveStreak(streak, date)} />
        </View>

        <View style={{ flex: 1 }}>
          {/* The spine, complete. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: SPINE.x - SPINE.completedWidth / 2,
              top: 0,
              bottom: 118,
              width: SPINE.completedWidth,
              backgroundColor: c.accent,
            }}
          />
          {/* Terminating mark. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: SPINE.x - 8,
              top: 10,
              width: 16,
              height: SPINE.completedWidth,
              backgroundColor: c.accent,
            }}
          />
          {/* Crossword still hangs off a dotted continuation. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: SPINE.x,
              bottom: 0,
              height: 110,
              borderLeftWidth: SPINE.restingWidth,
              borderLeftColor: c.line,
              borderStyle: 'dotted',
            }}
          />

          <View style={{ marginLeft: SPINE.x + 16, paddingRight: MARGIN }}>
            <Text variant="screenHeading">{'Done\nfor today.'}</Text>

            <View style={{ marginTop: 34, gap: 18 }}>
              {stats.map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 14 }}>
                  <Text variant="label" color="textMuted" style={{ width: 58, fontSize: 11 }}>
                    {label}
                  </Text>
                  <Text variant="numeric" style={{ fontSize: 26 }}>
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Blind until played, games spec section 5.1. The set is done, so
                the board is visible now and not before. */}
            <View style={{ marginTop: 36 }}>
              <Text variant="label" color="textMuted" style={{ fontSize: 11 }}>
                Today
              </Text>
              {BOARD.map((row) => (
                <View
                  key={row.pos}
                  style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, paddingVertical: 9 }}
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
          </View>
        </View>

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
