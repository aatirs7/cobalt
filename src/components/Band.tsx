import { Pressable, View } from 'react-native';
import { SPINE, tickLength, tickOffset , MARGIN } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';
import { Text } from './Text';

/**
 * One row of the Today screen.
 *
 * The band supplies the mass. The spine, drawn as an absolutely positioned
 * child at a fixed x, supplies the continuity: because consecutive bands touch
 * with no gutter, the segments join into one unbroken line that crosses every
 * seam. That is the whole premise of the direction, and it is also what makes
 * the spine read as an axis rather than as a scrollbar.
 *
 * Completion is signalled three ways, only one of which is color, so it does
 * not fail for users who cannot distinguish the fill: the band fills, the spine
 * segment thickens, and the tick thickens.
 */
export type BandTone = 'alt' | 'reg' | 'recessed';

type Props = {
  slotLabel: string;
  name: string;
  /** Duration in minutes, or a score once the game is done. */
  trailing: string;
  minutes: number;
  tone: BandTone;
  done?: boolean;
  /** Crossword sits outside the set, so its spine segment is dotted. */
  outside?: boolean;
  fixedHeight?: number;
  onPress?: () => void;
};

export function Band({
  slotLabel,
  name,
  trailing,
  minutes,
  tone,
  done = false,
  outside = false,
  fixedHeight,
  onPress,
}: Props) {
  const theme = useTheme();
  const c = theme.colors;

  const background = done
    ? c.accentSoft
    : tone === 'alt'
      ? c.surfaceAlt
      : tone === 'reg'
        ? c.surface
        : c.bg;

  // On accentSoft, textMuted measures between 2.28 and 3.17 to 1 depending on
  // theme, so completed bands use full text throughout. The fill is already
  // doing the work that muting would otherwise do.
  const labelColor = done ? 'text' : 'textMuted';

  const length = tickLength(minutes);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flex: fixedHeight ? undefined : 1,
        height: fixedHeight,
        backgroundColor: background,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Spine segment. Absolute so it spans the band edge to edge and joins
          seamlessly with its neighbours above and below. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: done ? SPINE.x - SPINE.completedWidth / 2 : SPINE.x,
          top: 0,
          bottom: 0,
          width: done ? SPINE.completedWidth : outside ? 0 : SPINE.restingWidth,
          backgroundColor: done ? c.text : c.line,
          borderLeftWidth: outside && !done ? SPINE.restingWidth : 0,
          borderLeftColor: c.line,
          borderStyle: outside ? 'dotted' : 'solid',
        }}
      />

      <View
        style={{
          width: SPINE.gutter,
          paddingRight: SPINE.gutterPad,
          paddingLeft: MARGIN,
        }}
      >
        <Text variant="label" color={labelColor} style={{ fontSize: 11, textAlign: 'right' }}>
          {slotLabel}
        </Text>
      </View>

      <View style={{ width: SPINE.mark, justifyContent: 'center' }}>
        <View
          style={{
            marginLeft: tickOffset(length),
            width: length,
            height: done ? SPINE.completedWidth : SPINE.restingWidth,
            backgroundColor: done ? c.text : outside ? 'transparent' : c.line,
            borderTopWidth: outside && !done ? SPINE.restingWidth : 0,
            borderTopColor: c.line,
            borderStyle: outside ? 'dotted' : 'solid',
          }}
        />
      </View>

      <View style={{ flex: 1, paddingLeft: SPINE.metaPad }}>
        <Text variant="gameName" color={done ? 'text' : 'text'}>
          {name}
        </Text>
      </View>

      <Text
        variant="label"
        color={labelColor}
        style={{ paddingRight: MARGIN, fontVariant: ['tabular-nums'] }}
      >
        {trailing}
      </Text>
    </Pressable>
  );
}
