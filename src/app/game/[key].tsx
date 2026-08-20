import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { normalize } from '@/engine/difficulty';
import { GAMES, GAME_KEYS, type GameKey } from '@/engine/types';
import { haptics } from '@/lib/haptics';
import { useDateKey, useElapsed } from '@/lib/time';
import { useProfile } from '@/state/profileStore';
import { dailySetFor, isSetComplete, useToday } from '@/state/todayStore';
import { useTheme } from '@/theme/useTheme';

/**
 * Game shell.
 *
 * The chrome here is final: game name in display serif, a thin accent progress
 * line, a close control, and no visible timer. Time is recorded but never shown
 * while playing, since a visible countdown raises stress and works against the
 * calm positioning.
 *
 * The body is a placeholder that renders the real generated payload and reports
 * a result. That is deliberate and it is the most valuable thing in this
 * milestone: it exercises the entire completion pipeline end to end, from
 * seeded generation through tier freezing, rating update, streak update and the
 * Set Complete transition, without a single real game mechanic existing yet.
 */
export default function GameScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const date = useDateKey();
  const theme = useTheme();

  const set = dailySetFor(date);
  const day = useToday((s) => s.days[date]);
  const startPlay = useToday((s) => s.startPlay);
  const completePlay = useToday((s) => s.completePlay);
  const abandonPlay = useToday((s) => s.abandonPlay);
  const markSetComplete = useToday((s) => s.markSetComplete);
  const recordPlay = useProfile((s) => s.recordPlay);
  const recordSetCompleted = useProfile((s) => s.recordSetCompleted);

  const elapsed = useElapsed();
  const [settled, setSettled] = useState(false);

  const isGame = (GAME_KEYS as readonly string[]).includes(key);
  const gameKey = key as GameKey;

  useEffect(() => {
    if (isGame && day) startPlay(date, gameKey);
  }, [date, gameKey, isGame, day, startPlay]);

  // Crossword is standalone and does not touch the set or the streak.
  if (!isGame) {
    return (
      <Screen>
        <Header title="Crossword" progress={0} />
        <View style={{ flex: 1, justifyContent: 'center', gap: 12 }}>
          <Text variant="body" color="textMuted">
            Crossword sits outside the daily set. It does not count toward completion or the streak.
          </Text>
          <Text variant="body" color="textMuted">
            Mini is the daily size. Clue writing and fill quality decide whether this game is any
            good, so it is authored rather than generated.
          </Text>
        </View>
      </Screen>
    );
  }

  if (!day) return <Screen />;

  const meta = GAMES[gameKey];
  const play = day.plays[gameKey];
  const tier = play.tier ?? 't1200';
  const puzzle = set.puzzles[gameKey][tier];
  const slotKeys = set.slots.map((s) => s.gameKey);
  const doneCount = slotKeys.filter((k) => day.plays[k].status === 'completed').length;

  const finish = (rawFraction: number) => {
    if (settled) return;
    setSettled(true);

    const rawScore = Math.round(meta.rawCeiling * rawFraction);
    const normalized = normalize(rawScore, gameKey, tier);
    const elapsedMs = elapsed();

    completePlay(date, gameKey, { rawScore, normalizedScore: normalized, elapsedMs });
    recordPlay(gameKey, tier, normalized);

    // Re read from the store so the decision uses post write state.
    const after = useToday.getState().days[date];
    if (isSetComplete(after, slotKeys)) {
      markSetComplete(date);
      recordSetCompleted(date);
      haptics.setComplete();
      router.replace('/set-complete');
    } else {
      router.back();
    }
  };

  const close = () => {
    if (!settled && play.status === 'in_progress') {
      abandonPlay(date, gameKey, elapsed());
    }
    router.back();
  };

  return (
    <Screen>
      <Header title={meta.name} progress={doneCount / slotKeys.length} onClose={close} />

      <ScrollView contentContainerStyle={{ paddingVertical: 24, gap: 20 }}>
        <View>
          <Text variant="label" color="textMuted">
            {meta.domain}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            This is the generated puzzle for {date} at the tier your rating selected. The mechanics
            land in the next milestone. Everything under it is real.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text variant="body" style={{ fontSize: 12, lineHeight: 18 }}>
            {JSON.stringify(puzzle.payload, null, 2)}
          </Text>
        </View>
      </ScrollView>

      <View style={{ gap: 12, paddingBottom: 12 }}>
        <Button label="Complete this game" onPress={() => finish(0.6 + Math.random() * 0.35)} />
        <Button label="Leave for now" onPress={close} variant="quiet" />
      </View>
    </Screen>
  );
}

/**
 * Minimal header: name in display serif, a thin accent progress line, and a
 * close control. No timer.
 */
function Header({
  title,
  progress,
  onClose,
}: {
  title: string;
  progress: number;
  onClose?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="gameName">{title}</Text>
        <Pressable onPress={onClose ?? (() => router.back())} hitSlop={16}>
          <Text variant="label" color="textMuted">
            Close
          </Text>
        </Pressable>
      </View>
      <View style={{ height: 1, backgroundColor: theme.colors.line, marginTop: 14 }}>
        <View
          style={{
            height: 1,
            width: `${Math.round(progress * 100)}%`,
            backgroundColor: theme.colors.accent,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Route level error boundary, picked up automatically by expo-router.
 *
 * A game blowing up should cost the user that game, not the app. Without this,
 * anything thrown while rendering a puzzle takes down the whole screen with no
 * way back to Today.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
        <Text variant="gameName">This game could not load.</Text>
        <Text variant="body" color="textMuted">
          Your streak and the rest of today are unaffected. The other games still work.
        </Text>
        <Text variant="body" color="textMuted" style={{ fontSize: 12 }}>
          {error.message}
        </Text>
        <View style={{ gap: 12, marginTop: 12 }}>
          <Button label="Try again" onPress={() => { void retry(); }} />
          <Button label="Back to today" onPress={() => router.replace('/(main)/today')} variant="quiet" />
        </View>
      </View>
    </Screen>
  );
}
