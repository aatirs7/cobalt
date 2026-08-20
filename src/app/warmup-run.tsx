import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Pattern } from '@/games/Pattern';
import { Reckon } from '@/games/Reckon';
import { Sequence } from '@/games/Sequence';
import type { GameResult } from '@/games/types';
import { generateWarmup, ratingFromWarmup, WARMUP_SEEDS } from '@/engine/warmup';
import type { GameKey } from '@/engine/types';
import { TIMING, useMotion } from '@/motion/useMotion';
import { useProfile } from '@/state/profileStore';
import { MARGIN } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * The warm-up itself, onboarding spec section 4.
 *
 * A modal route over the onboarding stack, so its own navigation never pollutes
 * the six dot progress indicator.
 *
 * The framing rules are the whole point and they are not optional. Never a
 * test, an assessment, a baseline or a benchmark. No score at any point, during
 * or after. No result screen: on completion it advances straight to screen 5.
 *
 * It runs the standard in-game UI rather than a special onboarding treatment,
 * so the user's first contact with a puzzle is the actual product.
 */
type Round = 'sequence' | 'reckon' | 'pattern';
const ORDER: Round[] = ['sequence', 'reckon', 'pattern'];

const LABEL: Record<Round, string> = {
  sequence: 'Round one',
  reckon: 'Round two',
  pattern: 'Round three',
};

export default function WarmupRun() {
  const theme = useTheme();
  const { duration } = useMotion();
  const seedRatings = useProfile((s) => s.seedRatings);

  const puzzles = useMemo(() => generateWarmup(), []);
  const [index, setIndex] = useState(0);
  const seeded = useRef<Partial<Record<GameKey, number>>>({});

  const round = ORDER[index];

  const handle = useCallback(
    (result: GameResult) => {
      // A round informs its own game and its slot mate, nothing further.
      const gameKey = round as GameKey;
      const rating = ratingFromWarmup(result.rawScore, gameKey);
      for (const target of WARMUP_SEEDS[round]) {
        seeded.current[target] = rating;
      }

      if (index + 1 >= ORDER.length) {
        seedRatings(seeded.current);
        // Straight on. No result screen, and nothing that reads as a score.
        router.replace('/(onboarding)/friends');
      } else {
        setIndex((i) => i + 1);
      }
    },
    [round, index, seedRatings],
  );

  return (
    <Screen>
      <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(duration(TIMING.base))}>
        <View style={{ paddingTop: 8 }}>
          <Text variant="label" color="textMuted">
            {`${LABEL[round]} of three`}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            {ORDER.map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: i <= index ? theme.colors.accent : theme.colors.line,
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ flex: 1, paddingTop: 20, marginHorizontal: -MARGIN, paddingHorizontal: MARGIN }}>
          {round === 'sequence' ? (
            <Sequence key="sequence" payload={puzzles.sequence} onFinish={handle} reduced={false} />
          ) : round === 'reckon' ? (
            <Reckon key="reckon" payload={puzzles.reckon} onFinish={handle} reduced={false} />
          ) : (
            <Pattern key="pattern" payload={puzzles.pattern} onFinish={handle} reduced={false} />
          )}
        </View>
      </Animated.View>
    </Screen>
  );
}
