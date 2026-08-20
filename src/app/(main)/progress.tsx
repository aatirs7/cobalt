import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { addDays } from '@/engine/dateKey';
import { GAMES, GAME_KEYS } from '@/engine/types';
import { effectiveStreak } from '@/engine/streak';
import { useDateKey } from '@/lib/time';
import { useProfile } from '@/state/profileStore';
import { useToday } from '@/state/todayStore';
import { useTheme } from '@/theme/useTheme';

/**
 * Progress, base spec section 5.5.
 *
 * Copy is descriptive, never diagnostic. No brain age, no IQ estimate, no
 * leaderboards beyond the friends board on Today. Ratings are never shown as
 * numbers, so the domain meters are relative fills rather than scores.
 */
const CALENDAR_DAYS = 28;

export default function Progress() {
  const date = useDateKey();
  const theme = useTheme();
  const c = theme.colors;

  const streak = useProfile((s) => s.streak);
  const ratings = useProfile((s) => s.ratings);
  const days = useToday((s) => s.days);

  const calendar = Array.from({ length: CALENDAR_DAYS }, (_, i) => {
    const d = addDays(date, -(CALENDAR_DAYS - 1 - i));
    return { key: d, filled: days[d]?.setCompletedAt != null };
  });

  // Ratings span roughly 700 to 1700 in practice. Map to a relative fill without
  // ever surfacing the underlying number.
  const fillFor = (rating: number) => Math.min(1, Math.max(0.06, (rating - 700) / 1000));

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingVertical: 16, gap: 36 }}>
        <View>
          <Text variant="screenHeading">Progress</Text>
          <Text variant="label" color="textMuted" style={{ marginTop: 8 }}>
            Last 28 days
          </Text>
        </View>

        <View>
          <Text variant="label" color="textMuted" style={{ marginBottom: 14 }}>
            Streak
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {calendar.map((d) => (
              <View
                key={d.key}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: d.filled ? c.accent : c.line,
                }}
              />
            ))}
          </View>
          <Text variant="body" color="textMuted" style={{ marginTop: 16 }}>
            {effectiveStreak(streak, date) > 0
              ? `You have finished the set ${effectiveStreak(streak, date)} days running. Your longest run is ${streak.longest}.`
              : 'Finish today to start a run.'}
          </Text>
        </View>

        <View style={{ gap: 20 }}>
          <Text variant="label" color="textMuted">
            By domain
          </Text>
          {GAME_KEYS.map((k) => (
            <View key={k} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body">{GAMES[k].name}</Text>
                <Text variant="body" color="textMuted" style={{ fontSize: 13 }}>
                  {GAMES[k].domain}
                </Text>
              </View>
              <View style={{ height: 2, backgroundColor: c.line }}>
                <View
                  style={{
                    height: 2,
                    width: `${Math.round(fillFor(ratings[k]) * 100)}%`,
                    backgroundColor: c.accent,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        <Button label="Back" onPress={() => router.back()} variant="quiet" />
      </ScrollView>
    </Screen>
  );
}
