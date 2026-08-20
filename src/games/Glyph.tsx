import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

/**
 * The Recall symbol set.
 *
 * Geometric and calm, drawn in one stroke weight so no symbol is louder than
 * another. Loudness would give one item an unearned memory advantage and quietly
 * corrupt the measurement.
 *
 * Every shape reads at 24pt on a 5x5 grid, which is the tightest case.
 */
export function Glyph({ name, size = 28, color }: { name: string; size?: number; color: string }) {
  const s = size;
  const c = s / 2;
  const r = s * 0.32;
  const stroke = Math.max(1.5, s * 0.07);
  const common = { stroke: color, strokeWidth: stroke, fill: 'none' as const };

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {name === 'circle' && <Circle cx={c} cy={c} r={r} fill={color} />}
      {name === 'ring' && <Circle cx={c} cy={c} r={r} {...common} />}
      {name === 'square' && (
        <Rect x={c - r} y={c - r} width={r * 2} height={r * 2} fill={color} />
      )}
      {name === 'triangle' && (
        <Polygon points={`${c},${c - r} ${c + r},${c + r} ${c - r},${c + r}`} fill={color} />
      )}
      {name === 'diamond' && (
        <Polygon points={`${c},${c - r} ${c + r},${c} ${c},${c + r} ${c - r},${c}`} fill={color} />
      )}
      {name === 'cross' && (
        <Path d={`M${c - r} ${c - r} L${c + r} ${c + r} M${c + r} ${c - r} L${c - r} ${c + r}`}
          {...common} strokeLinecap="round" />
      )}
      {name === 'chevron' && (
        <Path d={`M${c - r} ${c + r * 0.5} L${c} ${c - r * 0.5} L${c + r} ${c + r * 0.5}`}
          {...common} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {name === 'bar' && (
        <Rect x={c - r} y={c - stroke} width={r * 2} height={stroke * 2} rx={stroke} fill={color} />
      )}
      {name === 'wedge' && (
        <Polygon points={`${c - r},${c + r} ${c + r},${c + r} ${c + r},${c - r}`} fill={color} />
      )}
    </Svg>
  );
}
