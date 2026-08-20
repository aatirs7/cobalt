import { Pressable, View } from 'react-native';
import { MARGIN, RAIL, tickLeft } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';
import { Text } from './Text';

/**
 * One row of the Today screen.
 *
 * The band supplies the mass, the rail at the left margin supplies continuity
 * and per row state. Because consecutive bands touch with no gutter, their rail
 * segments join into one unbroken line down the side of the list.
 *
 * The game name leads the row, because it is the only thing the user taps. The
 * cognitive domain sits under it as a caption. An earlier version had these the
 * other way round, which put the least useful text in the position the eye
 * reaches first.
 *
 * Completion is signalled three ways and only one is colour, so it still reads
 * in Pastel Black where the band alternation measures 1.06 contrast and is
 * effectively invisible: the band fills, the rail segment thickens, the tick
 * thickens.
 */
export type BandTone = 'alt' | 'reg' | 'recessed';

type Props = {
  name: string;
  /** Cognitive domain, shown as a caption beneath the name. */
  domain: string;
  /** Duration while unplayed, normalized score once done. */
  trailing: string;
  tone: BandTone;
  done?: boolean;
  /** Crossword sits outside the set, so its rail segment goes dotted. */
  outside?: boolean;
  fixedHeight?: number;
  onPress?: () => void;
};

export function Band({
  name,
  domain,
  trailing,
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

  // On a completed band the rail and tick are drawn in text, not accent.
  // Accent on accentSoft measures 4.08 Gray, 2.91 Green, 2.81 Black, so it
  // would disappear in two themes out of three. Text measures 9.43, 8.20, 5.45.
  const markColor = done ? c.text : c.line;

  // accentSoft already does the muting a completed row needs, and textMuted on
  // accentSoft is only 2.28 to 3.17, so completed rows use full text.
  const captionColor = done ? 'text' : 'textMuted';

  const tickW = done ? RAIL.tickWidthDone : RAIL.tickWidth;

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
        paddingRight: MARGIN,
      }}
    >
      {/* Rail segment. Absolute so it spans the band edge to edge and joins
          seamlessly with its neighbours above and below. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: done ? RAIL.x - RAIL.completedWidth / 2 : RAIL.x,
          top: 0,
          bottom: 0,
          width: done ? RAIL.completedWidth : outside ? 0 : RAIL.restingWidth,
          backgroundColor: done ? markColor : outside ? 'transparent' : c.line,
          borderLeftWidth: outside && !done ? RAIL.restingWidth : 0,
          borderLeftColor: c.line,
          borderStyle: outside ? 'dotted' : 'solid',
        }}
      />

      {/* Tick, centred on the rail. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: tickLeft(tickW),
          width: tickW,
          height: done ? RAIL.completedWidth : RAIL.restingWidth,
          backgroundColor: outside && !done ? 'transparent' : markColor,
          borderTopWidth: outside && !done ? RAIL.restingWidth : 0,
          borderTopColor: c.line,
          borderStyle: outside ? 'dotted' : 'solid',
        }}
      />

      <View style={{ flex: 1, marginLeft: RAIL.bodyOffset }}>
        <Text variant="gameName" style={{ fontSize: fixedHeight ? 20 : 26 }}>
          {name}
        </Text>
        <Text variant="label" color={captionColor} style={{ fontSize: 11, marginTop: 3 }}>
          {domain}
        </Text>
      </View>

      <Text
        variant="label"
        color={captionColor}
        style={{ fontSize: 11, fontVariant: ['tabular-nums'] }}
      >
        {trailing}
      </Text>
    </Pressable>
  );
}
