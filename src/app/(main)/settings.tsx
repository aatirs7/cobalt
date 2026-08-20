import { Pressable, ScrollView, Switch, View } from 'react-native';
import { router } from 'expo-router';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { haptics } from '@/lib/haptics';
import { useProfile } from '@/state/profileStore';
import { useSettings } from '@/state/settingsStore';
import { THEMES, THEME_KEYS } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

/** Base spec section 5.6. */
export default function Settings() {
  const theme = useTheme();
  const c = theme.colors;
  const s = useSettings();
  const resetProfile = useProfile((p) => p.reset);

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

        <View style={{ gap: 12 }}>
          <Text variant="label" color="textMuted">
            Reminder
          </Text>
          <Text variant="body" color="textMuted">
            {s.reminderTime ? `One reminder a day at ${s.reminderTime}.` : 'No reminder.'}
          </Text>
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
