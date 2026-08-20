import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import type { GameProps, GameResult } from './types';
import type { FivePayload } from '@/engine/types';
import { FIVE_GUESSABLE } from '@/engine/wordlist';
import { haptics } from '@/lib/haptics';
import { useElapsed } from '@/lib/time';
import { useTheme } from '@/theme/useTheme';

/**
 * Five, games spec section 2.1.
 *
 * Guess a five letter word in six attempts, with per letter feedback. Guesses
 * must be valid dictionary words. Raw score is (7 - attempts) * 100 plus a time
 * bonus capped at 100, and a failure scores 0.
 *
 * Feedback uses lightness rather than hue: accent for a letter in the right
 * place, accentSoft for present but misplaced, surface for absent. The palette
 * has no second hue to spend here, and encoding by lightness happens to be the
 * colourblind safe choice anyway.
 *
 * The keyboard is custom rather than the system one. A system keyboard cannot
 * carry per key feedback, which is half of how this format is actually played.
 */
type Mark = 'correct' | 'present' | 'absent';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

/** Standard two pass scoring, so a duplicate letter cannot be over credited. */
function judge(guess: string, target: string): Mark[] {
  const marks: Mark[] = Array(guess.length).fill('absent');
  const pool: Record<string, number> = {};

  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) marks[i] = 'correct';
    else pool[target[i]] = (pool[target[i]] ?? 0) + 1;
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'correct') continue;
    const ch = guess[i];
    if ((pool[ch] ?? 0) > 0) {
      marks[i] = 'present';
      pool[ch] -= 1;
    }
  }
  return marks;
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

export function Five({ payload, onFinish }: GameProps<FivePayload>) {
  const theme = useTheme();
  const c = theme.colors;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [entry, setEntry] = useState('');
  const [message, setMessage] = useState('');

  const elapsed = useElapsed();
  const settledRef = useRef(false);

  const target = payload.target.toLowerCase();
  const marksFor = useCallback((g: string) => judge(g, target), [target]);

  /** Best mark seen per letter, for keyboard state. */
  const keyMarks: Record<string, Mark> = {};
  for (const g of guesses) {
    marksFor(g).forEach((m, i) => {
      const ch = g[i];
      if (!keyMarks[ch] || RANK[m] > RANK[keyMarks[ch]]) keyMarks[ch] = m;
    });
  }

  const finishGame = useCallback(
    (solvedIn: number | null) => {
      if (settledRef.current) return;
      settledRef.current = true;

      const seconds = elapsed() / 1000;
      const bonus = Math.round(Math.max(0, Math.min(100, 100 * (1 - seconds / 180))));
      const raw = solvedIn === null ? 0 : (7 - solvedIn) * 100 + bonus;

      const result: GameResult = { rawScore: raw, accuracy: solvedIn === null ? 0 : 1 };
      onFinish(result);
    },
    [onFinish],
  );

  const submit = () => {
    if (entry.length < 5) return;

    // Section 2.1 requires guesses to be real words. The bundled list is small,
    // so say so plainly rather than implying the user made a spelling mistake.
    if (!FIVE_GUESSABLE.has(entry)) {
      setMessage('Not in the word list yet.');
      return;
    }

    haptics.select();
    const next = [...guesses, entry];
    setGuesses(next);
    setEntry('');
    setMessage('');

    if (entry === target) {
      setTimeout(() => finishGame(next.length), 400);
    } else if (next.length >= payload.maxAttempts) {
      setMessage(target.toUpperCase());
      setTimeout(() => finishGame(null), 900);
    }
  };

  const press = (k: string) => {
    if (settledRef.current) return;
    haptics.select();
    setMessage('');
    if (k === 'back') setEntry((e) => e.slice(0, -1));
    else if (k === 'enter') submit();
    else if (entry.length < 5) setEntry((e) => e + k);
  };

  const fill = (m: Mark | null) =>
    m === 'correct' ? c.accent : m === 'present' ? c.accentSoft : m === 'absent' ? c.surface : 'transparent';

  const ink = (m: Mark | null) => (m === 'correct' ? 'bg' : m === 'absent' ? 'textMuted' : 'text');

  return (
    <View style={{ flex: 1, gap: 14 }}>
      <Text variant="body" color="error" style={{ minHeight: 24, textAlign: 'center' }}>
        {message}
      </Text>

      <View style={{ alignItems: 'center', gap: 6 }}>
        {Array.from({ length: payload.maxAttempts }, (_, row) => {
          const submitted = guesses[row];
          const isCurrent = row === guesses.length;
          const word = submitted ?? (isCurrent ? entry : '');
          const marks = submitted ? marksFor(submitted) : null;

          return (
            <View key={row} style={{ flexDirection: 'row', gap: 6 }}>
              {Array.from({ length: 5 }, (_, col) => {
                const ch = word[col] ?? '';
                const m = marks ? marks[col] : null;
                return (
                  <View
                    key={col}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 4,
                      backgroundColor: fill(m),
                      borderWidth: m ? 0 : 1,
                      borderColor: ch ? c.textMuted : c.line,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text variant="gameName" color={ink(m)} style={{ fontSize: 26 }}>
                      {ch.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: 6, paddingBottom: 8 }}>
        {ROWS.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 5, justifyContent: 'center' }}>
            {r === 2 ? <KeyCap label="Enter" wide onPress={() => press('enter')} /> : null}
            {row.split('').map((ch) => (
              <KeyCap
                key={ch}
                label={ch.toUpperCase()}
                mark={keyMarks[ch]}
                onPress={() => press(ch)}
              />
            ))}
            {r === 2 ? <KeyCap label="Del" wide onPress={() => press('back')} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function KeyCap({
  label,
  mark,
  wide,
  onPress,
}: {
  label: string;
  mark?: Mark;
  wide?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const c = theme.colors;

  const bg =
    mark === 'correct' ? c.accent
      : mark === 'present' ? c.accentSoft
        : mark === 'absent' ? c.bg
          : c.surface;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: wide ? 1.6 : 1,
        height: 46,
        borderRadius: 4,
        backgroundColor: bg,
        borderWidth: mark === 'absent' ? 1 : 0,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        variant="label"
        color={mark === 'correct' ? 'bg' : mark === 'absent' ? 'textMuted' : 'text'}
        style={{ fontSize: wide ? 11 : 13 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
