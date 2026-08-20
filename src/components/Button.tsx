import { Pressable, View } from 'react-native';
import { RADIUS } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';
import { haptics } from '@/lib/haptics';
import { Text } from './Text';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Quiet is the muted text affordance used for Skip and secondary actions. */
  variant?: 'primary' | 'quiet' | 'accentText';
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
}: Props) {
  const theme = useTheme();
  const c = theme.colors;

  const handle = () => {
    haptics.select();
    onPress();
  };

  if (variant !== 'primary') {
    return (
      <Pressable onPress={handle} disabled={disabled} hitSlop={12}>
        <Text
          variant="body"
          color={variant === 'accentText' ? 'accent' : 'textMuted'}
          style={{ textAlign: 'center', fontSize: 14 }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  // Disabled state is a surface fill with muted label, never an opacity fade.
  // Onboarding spec section 4, screen 5.
  return (
    <Pressable onPress={handle} disabled={disabled} style={{ width: fullWidth ? '100%' : undefined }}>
      <View
        style={{
          backgroundColor: disabled ? c.surface : c.accent,
          borderRadius: RADIUS.sm,
          paddingVertical: 15,
          alignItems: 'center',
        }}
      >
        <Text variant="body" color={disabled ? 'textMuted' : 'bg'} style={{ fontWeight: undefined }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
