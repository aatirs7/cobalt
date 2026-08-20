import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Band } from '@/components/Band';
import { Screen } from '@/components/Screen';
import { StreakDot } from '@/components/StreakDot';
import { Text } from '@/components/Text';
import { formatLong } from '@/engine/dateKey';
import { effectiveStreak } from '@/engine/streak';
import { GAMES, SLOT_LABEL, type GameKey } from '@/engine/types';
import { useDateKey } from '@/lib/time';
import { TIMING, useMotion } from '@/motion/useMotion';
import { useProfile } from '@/state/profileStore';
import { dailySetFor, isSetComplete, useToday } from '@/state/todayStore';
import { MARGIN, SPINE } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';
import { TodaySummary } from '@/components/TodaySummary';

/**
 * Today, Direction D.
 *
 * The bands carry the mass. The spine, drawn per band at a fixed x, carries the
 * continuity: because consecutive bands touch with no gutter, the segments join
 * into one unbroken line from the streak dot down to the dotted Crossword
 * segment at the bottom.
 *
 * Once all five are done this screen becomes the spine summary instead. That is
 * screen 3 of the flow, and it answers a different question than the Set
 * Complete field does.
 */
export default function Today() {
  const date = useDateKey();
  const theme = useTheme();
  const { duration } = useMotion();

  const set = dailySetFor(date);
  const ensureDay = useToday((s) => s.ensureDay);
  const day = useToday((s) => s.days[date]);
  const streak = useProfile((s) => s.streak);

  useEffect(() => {
    ensureDay(date);
  }, [date, ensureDay]);

  const slotKeys = set.slots.map((s) => s.gameKey);
  const complete = isSetComplete(day, slotKeys);

  if (!day) return <Screen bleed />;

  if (complete) return <TodaySummary date={date} />;

  const tones = ['alt', 'reg', 'alt', 'reg', 'alt'] as const;

  return (
    <Screen bleed>
      <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(duration(TIMING.base))}>
        {/* Header. The spine stub descends from the wordmark block into the
            first band, so the line is continuous from the very top. */}
        <View style={{ paddingHorizontal: MARGIN, paddingTop: 12, height: 150 }}>
          <Text variant="wordmark">Cobalt</Text>
          <Text variant="label" color="textMuted" style={{ marginTop: 6 }}>
            {formatLong(date)}
          </Text>

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: SPINE.x,
              top: 96,
              bottom: 0,
              width: SPINE.restingWidth,
              backgroundColor: theme.colors.line,
            }}
          />
          <StreakDot count={effectiveStreak(streak, date)} />
        </View>

        <View style={{ flex: 1 }}>
          {set.slots.map((assignment, i) => {
            const game = GAMES[assignment.gameKey];
            const play = day.plays[assignment.gameKey];
            const done = play.status === 'completed';
            return (
              <Band
                key={assignment.slot}
                slotLabel={SLOT_LABEL[assignment.slot]}
                name={game.name}
                minutes={game.minutes}
                trailing={done ? String(play.normalizedScore ?? 0) : `${game.minutes} min`}
                tone={tones[i]}
                done={done}
                onPress={() => router.push(`/game/${assignment.gameKey}` as never)}
              />
            );
          })}

          {/* Crossword sits outside the set. Its segment is dotted, which says
              so without needing a label to explain it. */}
          <Band
            slotLabel="Standalone"
            name="Crossword"
            minutes={5}
            trailing="Mini"
            tone="recessed"
            outside
            fixedHeight={84}
            onPress={() => router.push('/game/crossword' as never)}
          />
        </View>

        {/* Text affordances rather than a tab bar. */}
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

export type { GameKey };
