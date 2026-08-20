import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import type { GameProps, GameResult } from './types';
import type { ClustersPayload } from '@/engine/types';
import { haptics } from '@/lib/haptics';
import { useElapsed } from '@/lib/time';
import { useTheme } from '@/theme/useTheme';

/**
 * Clusters, games spec section 2.2.
 *
 * Sixteen words, four groups of four. Four mistakes and the round ends.
 * Raw score is 400 minus mistakes * 75, plus groups solved * 100, plus a time
 * bonus capped at 100.
 *
 * Groups are revealed with their tier colour on solve. The tiers run easiest to
 * hardest, and they are distinguished by lightness rather than hue for the same
 * reason as Five: the palette has one accent, and lightness is the colourblind
 * safe axis.
 *
 * The whole difficulty of this format lives in the trap words, which is why the
 * group definitions are authored rather than generated.
 */
const MAX_SELECTED = 4;

export function Clusters({ payload, onFinish }: GameProps<ClustersPayload>) {
  const theme = useTheme();
  const c = theme.colors;

  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState('');

  const elapsed = useElapsed();
  const settledRef = useRef(false);

  const finishGame = useCallback(
    (groupsSolved: number, mistakeCount: number) => {
      if (settledRef.current) return;
      settledRef.current = true;

      const seconds = elapsed() / 1000;
      const bonus = Math.round(Math.max(0, Math.min(100, 100 * (1 - seconds / 240))));
      const raw = Math.max(0, 400 - mistakeCount * 75 + groupsSolved * 100 + bonus);

      const result: GameResult = {
        rawScore: raw,
        accuracy: groupsSolved / payload.groups.length,
      };
      onFinish(result);
    },
    [onFinish, payload.groups.length],
  );

  const remaining = payload.words.filter(
    (w) => !solved.some((gi) => payload.groups[gi].members.includes(w)),
  );

  const toggle = (word: string) => {
    if (settledRef.current) return;
    haptics.select();
    setMessage('');
    setSelected((s) => {
      if (s.includes(word)) return s.filter((x) => x !== word);
      if (s.length >= MAX_SELECTED) return s;
      return [...s, word];
    });
  };

  const submit = () => {
    if (selected.length !== MAX_SELECTED) return;

    const hitIndex = payload.groups.findIndex(
      (g) => g.members.every((m) => selected.includes(m)) && !solved.includes(payload.groups.indexOf(g)),
    );

    if (hitIndex !== -1) {
      const nextSolved = [...solved, hitIndex];
      setSolved(nextSolved);
      setSelected([]);
      if (nextSolved.length === payload.groups.length) {
        setTimeout(() => finishGame(nextSolved.length, mistakes), 500);
      }
      return;
    }

    // "One away" is the single most useful piece of feedback in this format and
    // it costs nothing, since the user already knows the group is wrong.
    const best = Math.max(
      ...payload.groups.map((g, i) =>
        solved.includes(i) ? 0 : g.members.filter((m) => selected.includes(m)).length,
      ),
    );

    const next = mistakes + 1;
    setMistakes(next);
    setMessage(best === 3 ? 'One away.' : 'Not a group.');

    if (next >= payload.maxMistakes) {
      setTimeout(() => finishGame(solved.length, next), 700);
    }
  };

  /** Tier one is lightest, tier four the strongest. Lightness, not hue. */
  const tierFill = (tier: number) =>
    tier === 1 ? c.surfaceAlt : tier === 2 ? c.surface : tier === 3 ? c.accentSoft : c.accent;
  const tierInk = (tier: number) => (tier === 4 ? 'bg' : 'text');

  return (
    <View style={{ flex: 1, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="label" color="textMuted">
          {`${payload.maxMistakes - mistakes} mistakes left`}
        </Text>
        <Text variant="body" color="error" style={{ fontSize: 13 }}>
          {message}
        </Text>
      </View>

      {/* Solved groups lift out of the grid, in solve order. */}
      <View style={{ gap: 6 }}>
        {solved.map((gi) => {
          const g = payload.groups[gi];
          return (
            <View
              key={gi}
              style={{
                backgroundColor: tierFill(g.tier),
                borderRadius: 4,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text variant="label" color={tierInk(g.tier)} style={{ fontSize: 11 }}>
                {g.label}
              </Text>
              <Text variant="body" color={tierInk(g.tier)} style={{ marginTop: 3 }}>
                {g.members.join('  ·  ')}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {remaining.map((word) => {
          const picked = selected.includes(word);
          return (
            <Pressable
              key={word}
              onPress={() => toggle(word)}
              style={{
                width: '23.5%',
                minHeight: 62,
                borderRadius: 4,
                backgroundColor: picked ? c.accentSoft : c.surface,
                borderWidth: picked ? 1.5 : 1,
                borderColor: picked ? c.text : c.line,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text
                variant="label"
                style={{ fontSize: word.length > 8 ? 9 : 11, textAlign: 'center' }}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 8 }}>
        <Pressable
          onPress={() => setSelected([])}
          disabled={selected.length === 0}
          style={{
            flex: 1,
            height: 50,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: c.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="label" color="textMuted">
            Clear
          </Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={selected.length !== MAX_SELECTED}
          style={{
            flex: 2,
            height: 50,
            borderRadius: 4,
            backgroundColor: selected.length === MAX_SELECTED ? c.accent : c.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="label" color={selected.length === MAX_SELECTED ? 'bg' : 'textMuted'}>
            Submit
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
