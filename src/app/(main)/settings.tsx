import { useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { haptics } from '@/lib/haptics';
import { syncReminder } from '@/lib/reminders';
import { DIFFICULTY_PREFERENCES, type DifficultyPreference } from '@/engine/difficulty';
import { useProfile } from '@/state/profileStore';
import { useSettings } from '@/state/settingsStore';
import { THEMES, THEME_KEYS } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Base spec section 5.6. */
const DIFFICULTY_LABEL: Record<DifficultyPreference, string> = {
  easier: 'Easier',
  adaptive: 'Adaptive',
  harder: 'Harder',
};

const DIFFICULTY_NOTE: Record<DifficultyPreference, string> = {
  easier: 'One step below where your play suggests.',
  adaptive: 'Follows your play. Recommended.',
  harder: 'One step above, and worth more when you hold your accuracy.',
};

function parseTime(value: string | null): Date {
  const base = new Date(2000, 0, 1, 8, 0, 0);
  if (!value) return base;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return base;
  return new Date(2000, 0, 1, h, m, 0);
}

export default function Settings() {
  const theme = useTheme();
  const c = theme.colors;
  const s = useSettings();
  const resetProfile = useProfile((p) => p.reset);

  const [time, setTime] = useState(() => parseTime(s.reminderTime));
  const [showPicker, setShowPicker] = useState(false);

  // Spec section 7: the theme picker and reminder settings are both reachable
  // here, so nothing shown during onboarding is one time only.
  const applyReminder = async (on: boolean, at: Date) => {
    if (!on) {
      await syncReminder(null);
      s.setReminderTime(null);
      return;
    }
    const hh = String(at.getHours()).padStart(2, '0');
    const mm = String(at.getMinutes()).padStart(2, '0');
    const scheduled = await syncReminder(`${hh}:${mm}`);
    // Permission refused means no stored time, rather than a setting promising
    // a reminder that will never arrive.
    s.setReminderTime(scheduled ? `${hh}:${mm}` : null);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingVertical: 16, gap: 34 }}>
        <Text variant="screenHeading">Settings</Text>

        <View style={{ gap: 14 }}>
          <Text variant="label" color="textMuted">
            Theme
          </Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            {THEME_KEYS.map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  haptics.select();
                  s.setTheme(k);
                }}
                style={{ alignItems: 'center' }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: THEMES[k].colors.bg,
                    borderWidth: 1,
                    borderColor: c.line,
                  }}
                />
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -5.5,
                    left: -5.5,
                    width: 67,
                    height: 67,
                    borderRadius: 33.5,
                    borderWidth: 1.5,
                    borderColor: s.themeKey === k ? c.text : 'transparent',
                  }}
                />
                <Text variant="label" color="textMuted" style={{ marginTop: 10, fontSize: 11 }}>
                  {THEMES[k].name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <Row
            label="Haptics"
            value={s.hapticsEnabled}
            onChange={s.setHaptics}
            note="Light impact on selection, one success on finishing the set."
          />
          <Row label="Sound" value={s.soundEnabled} onChange={s.setSound} note="Off by default." />
          <Row
            label="Reduce motion"
            value={s.reduceMotion}
            onChange={s.setReduceMotion}
            note="Also follows your system setting."
          />
          <Row
            label="Link on share"
            value={s.shareIncludesLink}
            onChange={s.setShareIncludesLink}
            note="Appends a link to the share card. Off by default."
          />
        </View>

        <View style={{ gap: 14 }}>
          <Text variant="label" color="textMuted">
            Reminder
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: c.line,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="body">One reminder a day</Text>
              <Text variant="body" color="textMuted" style={{ fontSize: 13, marginTop: 2 }}>
                {s.reminderTime ? `At ${s.reminderTime}. Nothing else is ever sent.` : 'Off.'}
              </Text>
            </View>
            <Switch
              value={s.reminderTime !== null}
              onValueChange={(v) => {
                haptics.select();
                if (v && Platform.OS === 'android') setShowPicker(true);
                void applyReminder(v, time);
              }}
              trackColor={{ false: c.line, true: c.accent }}
              thumbColor={c.bg}
            />
          </View>

          {s.reminderTime !== null && (Platform.OS === 'ios' || showPicker) ? (
            <View style={{ alignItems: 'flex-start' }}>
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                themeVariant={theme.dim ? 'dark' : 'light'}
                onChange={(_, d) => {
                  if (Platform.OS === 'android') setShowPicker(false);
                  if (!d) return;
                  setTime(d);
                  void applyReminder(true, d);
                }}
              />
            </View>
          ) : null}
        </View>

        <View style={{ gap: 14 }}>
          <Text variant="label" color="textMuted">
            Difficulty
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {DIFFICULTY_PREFERENCES.map((p) => {
              const active = s.difficulty === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    haptics.select();
                    s.setDifficulty(p);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 4,
                    alignItems: 'center',
                    backgroundColor: active ? c.accent : c.surface,
                  }}
                >
                  <Text variant="label" color={active ? 'bg' : 'textMuted'}>
                    {DIFFICULTY_LABEL[p]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="body" color="textMuted" style={{ fontSize: 13 }}>
            {DIFFICULTY_NOTE[s.difficulty]}
          </Text>
          <Text variant="body" color="textMuted" style={{ fontSize: 13 }}>
            This nudges the puzzles you are given. It applies to games you have not started yet
            today, since a game keeps the level it began on.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text variant="label" color="textMuted">
            Calibration
          </Text>
          <Text variant="body" color="textMuted" style={{ fontSize: 13 }}>
            Three short rounds that reset where the puzzles start. No score is shown.
          </Text>
          <Button
            label="Retake the warm-up"
            onPress={() => router.push('/warmup-run')}
            variant="quiet"
          />
        </View>

        <View style={{ gap: 12 }}>
          <Button
            label="Reset local data"
            onPress={() => {
              resetProfile();
              router.replace('/');
            }}
            variant="quiet"
          />
          <Button label="Back" onPress={() => router.back()} variant="quiet" />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({
  label,
  note,
  value,
  onChange,
}: {
  label: string;
  note: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: theme.colors.line,
        gap: 16,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        <Text variant="body" color="textMuted" style={{ fontSize: 13, marginTop: 2 }}>
          {note}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptics.select();
          onChange(v);
        }}
        trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
        thumbColor={theme.colors.bg}
      />
    </View>
  );
}
