import { useState } from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Text } from '@/components/Text';
import { haptics } from '@/lib/haptics';
import { syncReminder } from '@/lib/reminders';
import { useProfile } from '@/state/profileStore';
import { useSettings } from '@/state/settingsStore';
import { useTheme } from '@/theme/useTheme';

/**
 * Screen 6, onboarding spec section 4.
 *
 * The reminder toggle defaults to off. The iOS notification permission prompt
 * fires only if the toggle is on and only on tapping Continue, never on screen
 * entry, because asking before the user has opted in is how apps get
 * permanently denied.
 *
 * Sign in is deferred and skippable. A local anonymous profile already exists
 * and is merged on later sign in. Clerk is not wired in this milestone, so both
 * paths finish onboarding identically.
 */
const DEFAULT_TIME = new Date(2000, 0, 1, 8, 0, 0);

export default function Reminder() {
  const theme = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const setReminderTime = useSettings((s) => s.setReminderTime);
  const completeOnboarding = useProfile((s) => s.completeOnboarding);

  const finish = async () => {
    if (enabled) {
      const hh = String(time.getHours()).padStart(2, '0');
      const mm = String(time.getMinutes()).padStart(2, '0');
      const at = `${hh}:${mm}`;

      // The permission prompt fires here, on Continue, and only because the
      // toggle is on. Never on screen entry: asking before the user has opted
      // in is how apps get permanently denied, and iOS gives one chance.
      const scheduled = await syncReminder(at);

      // If permission was refused, do not store a time. A setting that claims a
      // reminder which will never arrive is worse than no setting.
      setReminderTime(scheduled ? at : null);
    } else {
      await syncReminder(null);
      setReminderTime(null);
    }

    completeOnboarding();
    router.replace('/(main)/today');
  };

  return (
    <OnboardingScreen
      step={5}
      motif="wordmark"
      heading="One reminder a day"
      body="Or none. We will not send anything else."
      content={
        <View style={{ alignItems: 'center', gap: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Text variant="label" color="textMuted">
              Daily reminder
            </Text>
            <Switch
              value={enabled}
              onValueChange={(v) => {
                haptics.select();
                setEnabled(v);
                if (v && Platform.OS === 'android') setShowPicker(true);
              }}
              trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
              thumbColor={theme.colors.bg}
            />
          </View>

          {enabled && showPicker ? (
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'compact' : 'default'}
              themeVariant={theme.dim ? 'dark' : 'light'}
              onChange={(_, d) => {
                if (Platform.OS === 'android') setShowPicker(false);
                if (d) setTime(d);
              }}
            />
          ) : null}

          {enabled && !showPicker && Platform.OS === 'android' ? (
            <Pressable onPress={() => setShowPicker(true)}>
              <Text variant="body" color="accent">
                {`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`}
              </Text>
            </Pressable>
          ) : null}
        </View>
      }
      primary={{ label: 'Continue with Apple', onPress: () => void finish() }}
      secondary={{ label: 'Continue without an account', onPress: () => void finish() }}
    />
  );
}
