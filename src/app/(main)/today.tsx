import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Band } from '@/components/Band';
import { Meter } from '@/components/Meter';
import { Screen } from '@/components/Screen';
import { StreakDot } from '@/components/StreakDot';
import { Text } from '@/components/Text';
import { TodaySummary } from '@/components/TodaySummary';
import { formatLong } from '@/engine/dateKey';
import { effectiveStreak } from '@/engine/streak';
import { GAMES } from '@/engine/types';
import { useDateKey } from '@/lib/time';
import { TIMING, useMotion } from '@/motion/useMotion';
import { useProfile } from '@/state/profileStore';
import { completedCount, dailySetFor, isSetComplete, useToday } from '@/state/todayStore';
import { MARGIN } from '@/theme/layout';

/**
 * Today.
 *
 * Shaded full bleed bands carry the mass. A rail just inside the left margin
 * carries per row state and joins into one unbroken line down the side of the
 * list. A five segment meter under the date carries the summary.
 *
 * The two indicators answer different questions on purpose: the meter says how
 * many of the five are done, the rail says which ones and where they sit.
 */
const TONES = ['alt', 'reg', 'alt', 'reg', 'alt'] as const;

export default function Today() {
  const date = useDateKey();
  const { duration } = useMotion();

  const set = dailySetFor(date);
  const ensureDay = useToday((s) => s.ensureDay);
  const day = useToday((s) => s.days[date]);
  const streak = useProfile((s) => s.streak);

  useEffect(() => {
    ensureDay(date);
  }, [date, ensureDay]);

  const slotKeys = set.slots.map((s) => s.gameKey);

  if (!day) return <Screen bleed />;

  if (isSetComplete(day, slotKeys)) return <TodaySummary date={date} />;

  const done = completedCount(day, slotKeys);

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
            <Meter total={slotKeys.length} done={done} />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {set.slots.map((assignment, i) => {
            const game = GAMES[assignment.gameKey];
            const play = day.plays[assignment.gameKey];
            const isDone = play.status === 'completed';
            return (
              <Band
                key={assignment.slot}
                name={game.name}
                domain={game.domain}
                trailing={isDone ? String(play.normalizedScore ?? 0) : `${game.minutes} min`}
                tone={TONES[i]}
                done={isDone}
                onPress={() => router.push(`/game/${assignment.gameKey}` as never)}
              />
            );
          })}

          {/* Crossword sits outside the set. The dotted rail segment says so
              without needing a label to explain it. */}
          <Band
            name="Crossword"
            domain="Standalone"
            trailing="Mini"
            tone="recessed"
            outside
            fixedHeight={78}
            onPress={() => router.push('/game/crossword' as never)}
          />
        </View>

        {/* Text affordances rather than a tab bar, since section 2.4 forbids
            decorative icons in navigation. */}
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
