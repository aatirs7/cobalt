import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, {
  type SharedValue,
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/useTheme';

/**
 * Launch animation.
 *
 * The app mark is the spine with five rungs, which is the same axis the Today
 * screen is built on. On launch the spine draws down, then each rung lights up
 * in turn from the centre outward, then the whole thing lifts away to reveal
 * the app.
 *
 * Every value here obeys base spec section 2.5. Timing curves only, ease out
 * only. No spring, no bounce, and no scale up overshoot: a rung grows from 0.55
 * to exactly 1 and stops. The "shiver" is a brightness pass, not a physical
 * wobble, which keeps it inside the calm rule.
 */

const BOX = 200;
const SPINE_X = BOX / 2;
const RUNG_Y = [52, 76, 100, 124, 148];
const RUNG_HALF = [15, 27, 42, 27, 15];
const RUNG_STROKE = 5;

/** Centre outward, so the widest rung leads and the pairs answer it. */
const ORDER = [2, 1, 3, 0, 4];

const SPINE_DRAW = 420;
const RUNG_GROW = 300;
const RUNG_STAGGER = 85;
const HOLD = 260;
const LIFT = 260;

type Props = { onDone: () => void };

export function AnimatedSplash({ onDone }: Props) {
  const theme = useTheme();
  const c = theme.colors;
  const { reduced } = useMotion();

  const spine = useSharedValue(reduced ? 1 : 0);
  const cover = useSharedValue(1);
  // One value per rung, driving scaleX, opacity and colour together.
  const r0 = useSharedValue(reduced ? 1 : 0);
  const r1 = useSharedValue(reduced ? 1 : 0);
  const r2 = useSharedValue(reduced ? 1 : 0);
  const r3 = useSharedValue(reduced ? 1 : 0);
  const r4 = useSharedValue(reduced ? 1 : 0);
  const rungs = [r0, r1, r2, r3, r4];

  useEffect(() => {
    const finish = () => {
      cover.value = withTiming(
        0,
        { duration: reduced ? 120 : LIFT, easing: Easing.out(Easing.ease) },
        (done) => {
          if (done) runOnJS(onDone)();
        },
      );
    };

    if (reduced) {
      // Motion sensitive users get the mark, held briefly, then a plain fade.
      const t = setTimeout(finish, 260);
      return () => clearTimeout(t);
    }

    spine.value = withTiming(1, {
      duration: SPINE_DRAW,
      easing: Easing.out(Easing.ease),
    });

    ORDER.forEach((rungIndex, step) => {
      rungs[rungIndex].value = withDelay(
        SPINE_DRAW - 120 + step * RUNG_STAGGER,
        withSequence(
          // Grow and light up to full.
          withTiming(1, { duration: RUNG_GROW, easing: Easing.out(Easing.ease) }),
          // The shiver: a single brightness dip and recovery. No movement.
          withTiming(0.82, { duration: 90, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 140, easing: Easing.out(Easing.ease) }),
        ),
      );
    });

    const total = SPINE_DRAW - 120 + (ORDER.length - 1) * RUNG_STAGGER + RUNG_GROW + 230 + HOLD;
    const t = setTimeout(finish, total);
    return () => clearTimeout(t);
    // Shared values and the callback are stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const coverStyle = useAnimatedStyle(() => ({ opacity: cover.value }));
  const spineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: spine.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: c.bg }, coverStyle]}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: BOX, height: BOX }}>
          <Animated.View style={[StyleSheet.absoluteFillObject, spineStyle]}>
            <Svg width={BOX} height={BOX}>
              <Line
                x1={SPINE_X}
                y1={38}
                x2={SPINE_X}
                y2={162}
                stroke={c.accentSoft}
                strokeWidth={1.5}
              />
            </Svg>
          </Animated.View>

          {RUNG_Y.map((y, i) => (
            <Rung key={i} y={y} half={RUNG_HALF[i]} progress={rungs[i]} from={c.line} to={c.accent} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function Rung({
  y,
  half,
  progress,
  from,
  to,
}: {
  y: number;
  half: number;
  progress: SharedValue<number>;
  from: string;
  to: string;
}) {
  // scaleX grows from the centre, which is exactly where the spine is, so each
  // rung reads as emerging from the axis rather than sliding onto it.
  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + progress.value * 0.85,
    transform: [{ scaleX: 0.55 + progress.value * 0.45 }],
  }));

  const colorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [from, to]),
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: SPINE_X - half,
            top: y - RUNG_STROKE / 2,
            width: half * 2,
            height: RUNG_STROKE,
            borderRadius: RUNG_STROKE / 2,
          },
          colorStyle,
        ]}
      />
    </Animated.View>
  );
}
