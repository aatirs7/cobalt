import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { MAX_SCALE, textStyles, type TextVariant } from '@/theme/typography';
import type { ColorToken } from '@/theme/tokens';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  /** A palette token name. Raw hex values are not accepted anywhere in the app. */
  color?: ColorToken;
};

/**
 * Every string in the app goes through here, which is what keeps the type scale
 * and the palette intact. Importing Text directly from react-native is blocked
 * by lint.
 */
export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={MAX_SCALE[variant]}
      style={[textStyles[variant], { color: theme.colors[color] }, style]}
    />
  );
}
