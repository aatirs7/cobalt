import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MARGIN } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

type Props = {
  children?: ReactNode;
  /**
   * Full bleed screens draw bands to the screen edges and manage their own
   * horizontal insets. Today and Set Complete use this.
   */
  bleed?: boolean;
  /** Centered on both axes, which is the onboarding template. */
  center?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, bleed = false, center = false, style }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingHorizontal: bleed ? 0 : MARGIN,
        },
        center && { alignItems: 'center' },
        style,
      ]}
    >
      {children}
    </View>
  );
}
