import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { PatternFigure } from './PatternFigure';
import type { GameProps, GameResult } from './types';
import type { PatternPayload } from '@/engine/types';
import { haptics } from '@/lib/haptics';
import { useElapsed } from '@/lib/time';
import { useTheme } from '@/theme/useTheme';

/**
 * Pattern, games spec section 2.10.
 *
 * Five 3x3 matrices, each missing its bottom right cell, six options apiece.
 * Raw score is correct * 120 plus a time bonus capped at 100.
 *
 * No feedback on whether an answer was right. Matrix items leak their rule the
 * moment you learn the answer, so telling the user mid play would hand them the
 * later items. The result arrives once, at the end, as a score.
 */
const CELL = 62;
const OPTION = 74;

export function Pattern({ payload, onFinish }: GameProps<PatternPayload>) {
  const theme = useTheme();
  const c = theme.colors;

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const correctRef = useRef(0);
  const settledRef = useRef(false);
  const elapsed = useElapsed();

  const item = payload.items[index];

  const finishGame = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;

    // Time bonus tapers over three minutes, the advertised length. Finishing
    // faster is worth something, but never enough to reward guessing.
    const seconds = elapsed() / 1000;
    const bonus = Math.round(Math.max(0, Math.min(100, 100 * (1 - seconds / 180))));

    const raw = correctRef.current * 120 + bonus;
    const result: GameResult = {
      rawScore: raw,
      accuracy: correctRef.current / payload.items.length,
    };
    onFinish(result);
  }, [onFinish, payload.items.length, elapsed]);

  const choose = (optionIndex: number) => {
    if (picked !== null) return;
    haptics.select();
    setPicked(optionIndex);

    if (optionIndex === item.answerIndex) correctRef.current += 1;

    // A short beat so the selection registers visually, then straight on. No
    // right or wrong shown, deliberately.
    setTimeout(() => {
      if (index + 1 >= payload.items.length) {
        finishGame();
      } else {
        setIndex((i) => i + 1);
        setPicked(null);
      }
    }, 260);
  };

  return (
    <View style={{ flex: 1, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text variant="label" color="textMuted">
          {`Matrix ${index + 1} of ${payload.items.length}`}
        </Text>
        <Text variant="body" color="textMuted">
          Which figure completes the pattern?
        </Text>
      </View>

      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: CELL * 3 + 4,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderColor: c.line,
          }}
        >
          {item.matrix.map((cell, i) => (
            <View
              key={i}
              style={{
                width: CELL,
                height: CELL,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderColor: c.line,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: cell === null ? c.surface : 'transparent',
              }}
            >
              {cell === null ? (
                <Text variant="numeric" color="textMuted" style={{ fontSize: 24 }}>
                  ?
                </Text>
              ) : (
                <PatternFigure code={cell} size={CELL - 14} color={c.text} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {item.options.map((opt, i) => {
            const isPicked = picked === i;
            return (
              <Pressable
                key={i}
                onPress={() => choose(i)}
                disabled={picked !== null}
                style={{
                  width: OPTION,
                  height: OPTION,
                  borderRadius: 4,
                  backgroundColor: isPicked ? c.accentSoft : c.surface,
                  borderWidth: isPicked ? 1.5 : 1,
                  borderColor: isPicked ? c.text : c.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PatternFigure code={opt} size={OPTION - 20} color={c.text} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
