import { View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

/**
 * Renders one Pattern cell from its encoded "shape:count:fill" string.
 *
 * The three attributes are the three rule dimensions, so they must stay
 * visually independent: changing count must not change apparent size, and
 * changing fill must not change apparent shape. If they interfere, a distractor
 * that is one step away on one dimension starts to look like it is two steps
 * away on another, and the item stops measuring what it claims to.
 */
export function PatternFigure({
  code,
  size,
  color,
}: {
  code: string;
  size: number;
  color: string;
}) {
  const [shape, countStr, fill] = code.split(':');
  const count = Number(countStr);
  const solid = fill === 'solid';

  // Each glyph keeps the same footprint whatever the count, so a row of three
  // never reads as "bigger" than a row of one.
  const unit = size / 3.4;

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: unit * 0.22,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Shape key={i} name={shape} size={unit} solid={solid} color={color} />
      ))}
    </View>
  );
}

function Shape({
  name,
  size,
  solid,
  color,
}: {
  name: string;
  size: number;
  solid: boolean;
  color: string;
}) {
  const s = size;
  const c = s / 2;
  const r = s * 0.36;
  const w = Math.max(1.4, s * 0.09);

  // A single colour throughout. Hue would become a fourth rule dimension the
  // puzzle never intended, so the caller supplies exactly one.
  const paint = solid
    ? { fill: color, stroke: 'none' }
    : { fill: 'none', stroke: color, strokeWidth: w };

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {name === 'dot' && <Circle cx={c} cy={c} r={r * 0.6} {...paint} />}
      {name === 'ring' && <Circle cx={c} cy={c} r={r} {...paint} />}
      {name === 'square' && <Rect x={c - r} y={c - r} width={r * 2} height={r * 2} {...paint} />}
      {name === 'triangle' && (
        <Polygon points={`${c},${c - r} ${c + r},${c + r} ${c - r},${c + r}`} {...paint} />
      )}
      {name === 'wedge' && (
        <Polygon points={`${c - r},${c + r} ${c + r},${c + r} ${c + r},${c - r}`} {...paint} />
      )}
      {name === 'bar' && (
        <Rect x={c - r} y={c - w} width={r * 2} height={w * 2} rx={w * 0.5} {...paint} />
      )}
      {name === 'line' && (
        <Path
          d={`M${c - r} ${c + r} L${c + r} ${c - r}`}
          fill="none"
          stroke={color}
          strokeWidth={solid ? w * 1.8 : w}
          strokeLinecap="round"
        />
      )}
      {name === 'arc' && (
        <Path
          d={`M${c - r} ${c + r * 0.6} A ${r} ${r} 0 0 1 ${c + r} ${c + r * 0.6}`}
          fill="none"
          stroke={color}
          strokeWidth={solid ? w * 1.8 : w}
          strokeLinecap="round"
        />
      )}
      {name === 'cross' && (
        <Path
          d={`M${c - r} ${c - r} L${c + r} ${c + r} M${c + r} ${c - r} L${c - r} ${c + r}`}
          fill="none"
          stroke={color}
          strokeWidth={solid ? w * 1.8 : w}
          strokeLinecap="round"
        />
      )}
    </Svg>
  );
}
