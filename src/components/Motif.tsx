import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { THEMES } from '@/theme/tokens';
import { FONTS } from '@/theme/typography';
import { useTheme } from '@/theme/useTheme';
import { TIMING, useMotion } from '@/motion/useMotion';

/**
 * Onboarding motifs, onboarding spec section 3.
 *
 * 200 by 200 with 24 of internal padding, stroke width 1.5, round caps. No
 * illustrations, no photography, no mascot. Every motif is procedurally drawn
 * and tinted by the active theme.
 *
 * The selected set mixes two systems that share one primitive, a short straight
 * stroke. The rule that emerged: bars when the screen is about quantity, ticks
 * on a centered axis when it is about position or choice.
 */
export type MotifKey = 'welcome' | 'promise' | 'theme' | 'warmup' | 'friends' | 'wordmark';

const SIZE = 200;
const STROKE = 1.5;

/** Elements draw in with a stagger. Reduced motion shows them fully drawn. */
function useEntry(index: number) {
  const { reduced } = useMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      TIMING.motifDelay + index * TIMING.motifStagger,
      withTiming(1, { duration: TIMING.motifDraw, easing: Easing.out(Easing.ease) }),
    );
  }, [index, progress, reduced]);

  return useAnimatedStyle(() => ({ opacity: progress.value }));
}

function Element({ index, children }: { index: number; children: React.ReactNode }) {
  const style = useEntry(index);
  return <Animated.View style={[{ position: 'absolute', inset: 0 }, style]}>{children}</Animated.View>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return <View style={{ width: SIZE, height: SIZE }}>{children}</View>;
}

/** A single full height axis through the centre, the same axis Today is built on. */
function Axis({ color }: { color: string }) {
  return (
    <Svg width={SIZE} height={SIZE}>
      <Line x1={100} y1={24} x2={100} y2={176} stroke={color} strokeWidth={1} />
    </Svg>
  );
}

export function Motif({ name }: { name: MotifKey }) {
  const theme = useTheme();
  const c = theme.colors;

  switch (name) {
    /* Bars. 25 in a 5x5 block, one in accent. Quantity. */
    case 'welcome':
      return (
        <Frame>
          {Array.from({ length: 5 }, (_, r) => (
            <Element key={r} index={r}>
              <Svg width={SIZE} height={SIZE}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Rect
                    key={i}
                    x={30 + i * 28}
                    y={40 + r * 26}
                    width={20}
                    height={8}
                    fill={r === 2 && i === 3 ? c.accent : c.line}
                  />
                ))}
              </Svg>
            </Element>
          ))}
        </Frame>
      );

    /* Bars of increasing width. Reads as a set, a week, a scorecard. */
    case 'promise':
      return (
        <Frame>
          {[40, 66, 92, 118, 144].map((w, i) => (
            <Element key={i} index={i}>
              <Svg width={SIZE} height={SIZE}>
                <Rect x={28} y={52 + i * 22} width={w} height={9} fill={i === 4 ? c.accent : c.text} />
              </Svg>
            </Element>
          ))}
        </Frame>
      );

    /* Ticks on the axis, one per theme, in that theme's own accent. Choice. */
    case 'theme':
      return (
        <Frame>
          <Element index={0}>
            <Axis color={c.line} />
          </Element>
          {(['gray', 'green', 'black'] as const).map((k, i) => (
            <Element key={k} index={i + 1}>
              <Svg width={SIZE} height={SIZE}>
                <Line
                  x1={60}
                  y1={62 + i * 38}
                  x2={140}
                  y2={62 + i * 38}
                  stroke={THEMES[k].colors.accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </Svg>
            </Element>
          ))}
        </Frame>
      );

    /* Bars forming a rising and settling profile. Progress without a number. */
    case 'warmup':
      return (
        <Frame>
          {[26, 48, 74, 106, 128, 112, 96, 88].map((w, i) => (
            <Element key={i} index={i}>
              <Svg width={SIZE} height={SIZE}>
                <Rect
                  x={100 - w / 2}
                  y={38 + i * 16}
                  width={w}
                  height={7}
                  fill={i === 4 ? c.accent : c.text}
                />
              </Svg>
            </Element>
          ))}
        </Frame>
      );

    /* Six ticks radiating from the axis, one filled. A small group. */
    case 'friends':
      return (
        <Frame>
          <Element index={0}>
            <Axis color={c.line} />
          </Element>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            return (
              <Element key={i} index={i + 1}>
                <Svg width={SIZE} height={SIZE}>
                  <Line
                    x1={100 + Math.cos(a) * 34}
                    y1={100 + Math.sin(a) * 34}
                    x2={100 + Math.cos(a) * 62}
                    y2={100 + Math.sin(a) * 62}
                    stroke={i === 0 ? c.accent : c.text}
                    strokeWidth={i === 0 ? 2.5 : STROKE}
                    strokeLinecap="round"
                  />
                </Svg>
              </Element>
            );
          })}
        </Frame>
      );

    /* The wordmark, fading in rather than drawing, with the axis behind it. */
    case 'wordmark':
      return (
        <Frame>
          <Element index={0}>
            <Axis color={c.line} />
          </Element>
          <Element index={1}>
            <Svg width={SIZE} height={SIZE}>
              <SvgText
                x={100}
                y={112}
                fill={c.text}
                fontSize={40}
                fontFamily={FONTS.displayMedium}
                textAnchor="middle"
              >
                Cobalt
              </SvgText>
            </Svg>
          </Element>
        </Frame>
      );
  }
}
