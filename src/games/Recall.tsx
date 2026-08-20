import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { Glyph } from './Glyph';
import type { GameProps, GameResult } from './types';
import type { RecallPayload } from '@/engine/types';
import { RECALL_SYMBOLS } from '@/engine/wordlist';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

/**
 * Recall, games spec section 2.4.
 *
 * A grid briefly reveals symbols, then hides them. Three round types cycle
 * within one play, and they are not interchangeable:
 *
 *   location  where were the symbols, ignore what they were
 *   symbol    which symbols appeared, ignore where
 *   bound     where was this specific symbol
 *
 * The bound condition is the actual working memory load, because it requires
 * holding the pairing rather than either feature alone. It always comes last.
 *
 * Raw score is (correct placements / total placements) * 700, plus 100 per
 * perfect round.
 */
type Phase = 'ready' | 'expose' | 'retain' | 'respond' | 'between';

export function Recall({ payload, onFinish, reduced }: GameProps<RecallPayload>) {
  const theme = useTheme();
  const c = theme.colors;

  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [selected, setSelected] = useState<number[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  /** For bound rounds: which of the round's distinct symbols we are asking about. */
  const [probeIndex, setProbeIndex] = useState(0);

  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const perfectRef = useRef(0);
  const roundCorrectRef = useRef(0);
  const roundTotalRef = useRef(0);

  const round = payload.rounds[roundIndex];
  const cellCount = payload.cols * payload.rows;

  /** Distinct symbols in this round, each with every cell it occupied. */
  const bound = useMemo(() => {
    const map = new Map<string, number[]>();
    round.cells.forEach((cell, i) => {
      const sym = round.symbols[i];
      map.set(sym, [...(map.get(sym) ?? []), cell]);
    });
    return Array.from(map.entries()).map(([symbol, cells]) => ({ symbol, cells }));
  }, [round]);

  /* ---------------- stimulus timing ---------------- */

  useEffect(() => {
    if (phase !== 'expose') return;
    const t = setTimeout(() => setPhase('retain'), payload.exposureMs);
    return () => clearTimeout(t);
  }, [phase, payload.exposureMs]);

  useEffect(() => {
    if (phase !== 'retain') return;
    const t = setTimeout(() => setPhase('respond'), payload.retentionMs);
    return () => clearTimeout(t);
  }, [phase, payload.retentionMs]);

  /* ---------------- scoring ---------------- */

  const finishGame = useCallback(() => {
    const ratio = totalRef.current === 0 ? 0 : correctRef.current / totalRef.current;
    const raw = Math.round(ratio * 700 + perfectRef.current * 100);
    const result: GameResult = { rawScore: raw, accuracy: ratio };
    onFinish(result);
  }, [onFinish]);

  const commitRound = useCallback(() => {
    correctRef.current += roundCorrectRef.current;
    totalRef.current += roundTotalRef.current;
    if (roundTotalRef.current > 0 && roundCorrectRef.current === roundTotalRef.current) {
      perfectRef.current += 1;
    }
    roundCorrectRef.current = 0;
    roundTotalRef.current = 0;

    if (roundIndex + 1 >= payload.rounds.length) {
      finishGame();
    } else {
      setRoundIndex((i) => i + 1);
      setSelected([]);
      setSelectedSymbols([]);
      setProbeIndex(0);
      setPhase('expose');
    }
  }, [roundIndex, payload.rounds.length, finishGame]);

  /** Compares a chosen set against the truth and banks the overlap. */
  const score = useCallback((chosen: readonly (number | string)[], truth: readonly (number | string)[]) => {
    const truthSet = new Set(truth);
    let hits = 0;
    for (const v of new Set(chosen)) if (truthSet.has(v)) hits += 1;
    roundCorrectRef.current += hits;
    roundTotalRef.current += truth.length;
  }, []);

  const submit = useCallback(() => {
    if (round.type === 'location') {
      score(selected, round.cells);
      commitRound();
      return;
    }

    if (round.type === 'symbol') {
      score(selectedSymbols, round.symbols);
      commitRound();
      return;
    }

    // bound: one probe per distinct symbol, then the round ends
    score(selected, bound[probeIndex].cells);
    if (probeIndex + 1 >= bound.length) {
      commitRound();
    } else {
      setProbeIndex((i) => i + 1);
      setSelected([]);
    }
  }, [round, selected, selectedSymbols, bound, probeIndex, score, commitRound]);


  const toggleCell = (cell: number) => {
    haptics.select();
    setSelected((s) => (s.includes(cell) ? s.filter((x) => x !== cell) : [...s, cell]));
  };

  const toggleSymbol = (sym: string) => {
    haptics.select();
    setSelectedSymbols((s) => (s.includes(sym) ? s.filter((x) => x !== sym) : [...s, sym]));
  };

  /* ---------------- rendering ---------------- */

  const showSymbols = phase === 'expose';
  const gridGap = 8;

  const prompt = (() => {
    if (phase === 'ready') return 'Watch the grid, then reproduce what you saw.';
    if (phase === 'expose') return 'Remember.';
    if (phase === 'retain') return ' ';
    if (round.type === 'location') return 'Tap every tile that held a symbol.';
    if (round.type === 'symbol') return 'Which symbols appeared?';
    return 'Where was this symbol?';
  })();

  const expected =
    round.type === 'location' ? round.cells.length
      : round.type === 'symbol' ? new Set(round.symbols).size
        : bound[probeIndex]?.cells.length ?? 0;

  const chosenCount = round.type === 'symbol' ? selectedSymbols.length : selected.length;

  return (
    <View style={{ flex: 1, gap: 20 }}>
      <View style={{ gap: 6 }}>
        <Text variant="label" color="textMuted">
          {`Round ${roundIndex + 1} of ${payload.rounds.length}`}
        </Text>
        <Text variant="body" style={{ minHeight: 48 }}>
          {prompt}
        </Text>
      </View>

      {/* The symbol being probed in a bound round. */}
      {phase === 'respond' && round.type === 'bound' && bound[probeIndex] ? (
        <View style={{ alignItems: 'center' }}>
          <Glyph name={bound[probeIndex].symbol} size={40} color={c.accent} />
        </View>
      ) : null}

      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: payload.cols * 56 + (payload.cols - 1) * gridGap,
            gap: gridGap,
          }}
        >
          {Array.from({ length: cellCount }, (_, cell) => {
            const idx = round.cells.indexOf(cell);
            const isTarget = idx !== -1;
            const isPicked = selected.includes(cell);
            const canTap = phase === 'respond' && round.type !== 'symbol';

            return (
              <Pressable
                key={cell}
                disabled={!canTap}
                onPress={() => toggleCell(cell)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 4,
                  backgroundColor: isPicked ? c.accentSoft : c.surface,
                  borderWidth: isPicked ? 1.5 : 1,
                  borderColor: isPicked ? c.text : c.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showSymbols && isTarget ? (
                  <Glyph name={round.symbols[idx]} size={30} color={c.text} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Symbol round: pick from the whole set rather than from a generated
          shortlist, so there is nothing to infer from which options appear. */}
      {phase === 'respond' && round.type === 'symbol' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {RECALL_SYMBOLS.map((sym) => {
            const picked = selectedSymbols.includes(sym);
            return (
              <Pressable
                key={sym}
                onPress={() => toggleSymbol(sym)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 4,
                  backgroundColor: picked ? c.accentSoft : c.surface,
                  borderWidth: picked ? 1.5 : 1,
                  borderColor: picked ? c.text : c.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Glyph name={sym} size={26} color={c.text} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={{ gap: 10, paddingBottom: 8 }}>
        {phase === 'ready' ? (
          <Button label="Start" onPress={() => setPhase('expose')} />
        ) : phase === 'respond' ? (
          <>
            <Text variant="label" color="textMuted" style={{ textAlign: 'center' }}>
              {`${chosenCount} of ${expected} chosen`}
            </Text>
            <Button label="Confirm" onPress={submit} disabled={chosenCount === 0} />
          </>
        ) : (
          // Reserve the same height so the grid never jumps between phases.
          <View style={{ height: reduced ? 52 : 52 }} />
        )}
      </View>
    </View>
  );
}
