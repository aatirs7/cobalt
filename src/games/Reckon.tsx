import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import type { GameProps, GameResult } from './types';
import type { ReckonPayload } from '@/engine/types';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

/**
 * Reckon, games spec section 2.7.
 *
 * Sixty seconds of arithmetic that escalates as the user answers correctly.
 * Raw score is correct * 40 minus incorrect * 20, floored at 0.
 *
 * Input is a custom numeric pad, never the system keyboard. The system keyboard
 * adds roughly 300ms of latency on presentation and dismissal, which is the
 * difference between a speed game feeling sharp and feeling broken.
 *
 * One deliberate tension with base spec 5.3, which says no timer is visible
 * while playing. Here the sixty seconds is the mechanic rather than pressure
 * applied to a puzzle, so hiding it would be dishonest. The compromise is a
 * thin depleting accent line and no digits: the user can see time running out
 * without watching a number count down at them.
 */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const;

const SYMBOL: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export function Reckon({ payload, onFinish }: GameProps<ReckonPayload>) {
  const theme = useTheme();
  const c = theme.colors;

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [entry, setEntry] = useState('');
  const [remaining, setRemaining] = useState(payload.seconds);
  const [flash, setFlash] = useState<'ok' | 'no' | null>(null);

  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const settledRef = useRef(false);

  const problem = payload.problems[index];

  const finishGame = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    const raw = Math.max(0, correctRef.current * 40 - wrongRef.current * 20);
    const attempts = correctRef.current + wrongRef.current;
    const result: GameResult = {
      rawScore: raw,
      accuracy: attempts === 0 ? 0 : correctRef.current / attempts,
    };
    onFinish(result);
  }, [onFinish]);

  /* One interval for the whole play, rather than a timer per problem. */
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          finishGame();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, finishGame]);

  /* Clear the correct/incorrect flash without blocking input. */
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 220);
    return () => clearTimeout(t);
  }, [flash]);

  const advance = useCallback(
    (wasCorrect: boolean) => {
      if (wasCorrect) correctRef.current += 1;
      else wrongRef.current += 1;
      setFlash(wasCorrect ? 'ok' : 'no');
      setEntry('');
      setIndex((i) => {
        const next = i + 1;
        // The list is generated long enough that nobody reaches the end inside
        // sixty seconds, but never index past it.
        if (next >= payload.problems.length) {
          finishGame();
          return i;
        }
        return next;
      });
    },
    [payload.problems.length, finishGame],
  );

  const press = (k: string) => {
    if (!started || settledRef.current) return;
    haptics.select();

    if (k === 'clear') {
      setEntry('');
      return;
    }
    if (k === 'back') {
      setEntry((e) => e.slice(0, -1));
      return;
    }

    const next = entry + k;
    setEntry(next);

    // Auto submit once the entry is as long as the answer. Keeps the loop tight
    // and removes a confirm tap from every single problem, which at this pace
    // would be most of the interaction.
    const answerLength = String(problem.answer).length;
    if (next.length >= answerLength) {
      advance(Number(next) === problem.answer);
    }
  };

  if (!started) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
        <Text variant="gameName">Sixty seconds.</Text>
        <Text variant="body" color="textMuted">
          Answer as many as you can. The problems get harder as you go. Wrong answers cost you, so
          accuracy still matters.
        </Text>
        <Button label="Start" onPress={() => setStarted(true)} />
      </View>
    );
  }

  const fraction = remaining / payload.seconds;

  return (
    <View style={{ flex: 1, gap: 16 }}>
      {/* Time as a depleting line, never as digits. */}
      <View style={{ height: 2, backgroundColor: c.line }}>
        <View style={{ height: 2, width: `${fraction * 100}%`, backgroundColor: c.accent }} />
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <Text variant="numeric" style={{ fontSize: 44 }}>
          {`${problem.a} ${SYMBOL[problem.op]} ${problem.b}`}
        </Text>

        <View
          style={{
            minWidth: 140,
            borderBottomWidth: 2,
            borderBottomColor:
              flash === 'ok' ? c.success : flash === 'no' ? c.error : c.line,
            paddingBottom: 6,
            alignItems: 'center',
          }}
        >
          <Text variant="numeric" style={{ fontSize: 40 }}>
            {entry || ' '}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
        {KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => press(k)}
            style={{
              width: '31.5%',
              height: 58,
              borderRadius: 4,
              backgroundColor: c.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              variant={k === 'clear' || k === 'back' ? 'label' : 'numeric'}
              color={k === 'clear' || k === 'back' ? 'textMuted' : 'text'}
              style={k === 'clear' || k === 'back' ? undefined : { fontSize: 26 }}
            >
              {k === 'back' ? 'Del' : k === 'clear' ? 'Clear' : k}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
