import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { useProfile } from '@/state/profileStore';
import { RADIUS } from '@/theme/layout';
import { textStyles } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';

/**
 * Screen 5. Joining is by code only. No friend search, no contact upload, no
 * suggested friends, no social graph.
 *
 * Primary stays disabled until six characters are entered, and the disabled
 * state is a surface fill with a muted label rather than an opacity fade.
 */
const CODE_LENGTH = 6;

export default function Friends() {
  const [code, setCode] = useState('');
  const theme = useTheme();
  const setPendingGroupCode = useProfile((s) => s.setPendingGroupCode);

  const next = () => router.push('/(onboarding)/reminder');

  // Groups need a backend, which does not exist yet. Storing the code means
  // Join records a real intent to be redeemed later, rather than quietly doing
  // nothing while looking like it worked.
  const join = () => {
    setPendingGroupCode(code);
    next();
  };

  return (
    <OnboardingScreen
      step={4}
      motif="friends"
      heading="Play with a few people"
      body="Compare scores with a small group. Invite by code. No feeds, no strangers."
      content={
        <View style={{ width: 220 }}>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH))}
            placeholder="ENTER CODE"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={CODE_LENGTH}
            style={[
              textStyles.body,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: RADIUS.lg - 4,
                color: theme.colors.text,
                paddingVertical: 14,
                textAlign: 'center',
                letterSpacing: 4,
                fontVariant: ['tabular-nums'],
              },
            ]}
          />
        </View>
      }
      primary={{ label: 'Join', onPress: join, disabled: code.length < CODE_LENGTH }}
      secondary={{ label: 'Create a group', onPress: next }}
      skip={{ label: 'Not now', onPress: next }}
    />
  );
}
