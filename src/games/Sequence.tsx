import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import type { GameProps, GameResult } from './types';
import type { SequencePayload } from '@/engine/types';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

/**
 * Sequence, games spec section 2.5.
 *
 * Tiles illuminate in order and the user reproduces it. Length grows by one on
 * each success. Two consecutive failures at a length end the play.
 *
 * Alternating rounds require reverse reproduction, which loads working memory
 * considerably harder than forward span and is the more informative measure, so
 * it is weighted 1.4x in scoring.
 *
 * Raw score is max span reached times 90, with reverse spans weighted 1.4x.
 */
type Phase = 'ready' | 'playing' | 'responding' | 'verdict';

const LIT_MS = 320;

export function Sequence({ payload, onFinish, reduced }: GameProps<SequencePayload>) {
  const theme = useTheme();
  const c = theme.colors;

  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [lit, setLit] = useState<number | null>(null);
  const [entered, setEntered] = useState<number[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  /** Consecutive failures at the current length. Two ends the play. */
  const failuresRef = useRef(0);
  const bestForwardRef = useRef(0);
  const bestReverseRef = useRef(0);
  const trialsRef = useRef(0);
  const correctRef = useRef(0);

  const trial = payload.trials[trialIndex];
  const direction = payload.directions[trialIndex];
  const expected = direction === 'reverse' ? [...trial].reverse() : trial;

  const cols = payload.tileCount <= 4 ? 2 : payload.tileCount <= 6 ? 3 : 3;

  /* ---------------- playback ---------------- */

  useEffect(() => {
    if (phase !== 'playing') return;

    let step = 0;
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runStep = () => {
      if (!alive) return;
      if (step >= trial.length) {
        setLit(null);
        setPhase('responding');
        return;
      }
      setLit(trial[step]);
      timers.push(
        setTimeout(() => {
          if (!alive) return;
          setLit(null);
          step += 1;
          // The gap between tiles is what makes the sequence countable. Without
          // it two identical-looking steps merge into one perceived flash.
          timers.push(setTimeout(runStep, Math.max(90, payload.interStimulusMs - LIT_MS)));
        }, LIT_MS),
      );
    };

    // A beat before the first tile, so the user is not already mid blink.
    timers.push(setTimeout(runStep, 500));

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [phase, trial, payload.interStimulusMs]);

  /* ---------------- scoring ---------------- */

  const finishGame = useCallback(() => {
    // Reverse spans are worth more, per section 2.5.
    const weighted = Math.max(bestForwardRef.current, bestReverseRef.current * 1.4);
    const raw = Math.round(weighted * 90);
    const accuracy = trialsRef.current === 0 ? 0 : correctRef.current / trialsRef.current;
    const result: GameResult = { rawScore: raw, accuracy };
    onFinish(result);
  }, [onFinish]);

  const judge = useCallback(
    (answer: number[]) => {
      const ok = answer.length === expected.length && answer.every((v, i) => v === expected[i]);

      trialsRef.current += 1;
      if (ok) correctRef.current += 1;

      if (ok) {
        failuresRef.current = 0;
        if (direction === 'reverse') {
          bestReverseRef.current = Math.max(bestReverseRef.current, trial.length);
        } else {
          bestForwardRef.current = Math.max(bestForwardRef.current, trial.length);
        }
      } else {
        failuresRef.current += 1;
      }

      setLastCorrect(ok);
      setPhase('verdict');
    },
    [expected, direction, trial.length],
  );

  /* Advance once the verdict has been shown. */
  useEffect(() => {
    if (phase !== 'verdict') return;
    const t = setTimeout(() => {
      // Two consecutive failures at a length ends the play.
      if (failuresRef.current >= 2 || trialIndex + 1 >= payload.trials.length) {
        finishGame();
        return;
      }
      // A failure repeats the same length rather than escalating.
      setTrialIndex((i) => (lastCorrect ? i + 1 : i));
      setEntered([]);
      setLastCorrect(null);
      setPhase('playing');
    }, 900);
    return () => clearTimeout(t);
  }, [phase, lastCorrect, trialIndex, payload.trials.length, finishGame]);

  const tap = (tile: number) => {
    if (phase !== 'responding') return;
    haptics.select();
    const next = [...entered, tile];
    setEntered(next);
    if (next.length === expected.length) judge(next);
  };

  /* ---------------- rendering ---------------- */

  const prompt = (() => {
    if (phase === 'ready') return 'Tiles will light in order. Repeat them.';
    if (phase === 'playing') return 'Watch.';
    if (phase === 'responding') {
      return direction === 'reverse' ? 'Repeat in reverse order.' : 'Repeat the order.';
    }
    return lastCorrect ? 'Correct.' : 'Not quite.';
  })();

  const tileSize = 76;

  return (
    <View style={{ flex: 1, gap: 20 }}>
      <View style={{ gap: 6 }}>
        <Text variant="label" color="textMuted">
          {`Length ${trial.length}`}
          {direction === 'reverse' ? '  ·  Reverse' : ''}
        </Text>
        <Text
          variant="body"
          color={phase === 'verdict' ? (lastCorrect ? 'success' : 'error') : 'text'}
          style={{ minHeight: 48 }}
        >
          {prompt}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: cols * tileSize + (cols - 1) * 10,
            gap: 10,
          }}
        >
          {Array.from({ length: payload.tileCount }, (_, tile) => {
            const isLit = lit === tile;
            const wasTapped = phase === 'responding' && entered.includes(tile);
            return (
              <Pressable
                key={tile}
                disabled={phase !== 'responding'}
                onPress={() => tap(tile)}
                style={{
                  width: tileSize,
                  height: tileSize,
                  borderRadius: 4,
                  backgroundColor: isLit ? c.accent : wasTapped ? c.accentSoft : c.surface,
                  borderWidth: 1,
                  borderColor: isLit ? c.accent : c.line,
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10, paddingBottom: 8, minHeight: 62 }}>
        {phase === 'ready' ? (
          <Button label="Start" onPress={() => setPhase('playing')} />
        ) : phase === 'responding' ? (
          <Text variant="label" color="textMuted" style={{ textAlign: 'center' }}>
            {`${entered.length} of ${expected.length}`}
          </Text>
        ) : null}
      </View>

      {/* reduced is honoured by having no animation at all here: state changes
          are instant colour swaps, which is what the spec asks for anyway. */}
      {reduced ? null : null}
    </View>
  );
}
