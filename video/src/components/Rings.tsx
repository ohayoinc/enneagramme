import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {H, W} from '../theme';

type Cluster = {cx: number; cy: number; maxR: number; step?: number};

/**
 * Faisceaux de cercles concentriques en trait fin (motif des visuels Facebook).
 * Les cercles s'écartent lentement du centre, comme une onde qui respire.
 */
export const Rings: React.FC<{
  clusters: Cluster[];
  color: string;
  opacity: number;
  speed?: number; // pixels par image
}> = ({clusters, color, opacity, speed = 0.25}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 40], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <svg
      aria-hidden
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{position: 'absolute', inset: 0}}
    >
      {clusters.map(({cx, cy, maxR, step = 13}, ci) => {
        const offset = (frame * speed) % step;
        const n = Math.ceil(maxR / step) + 1;
        return (
          <g key={ci} fill="none" stroke={color} strokeWidth={1}>
            {Array.from({length: n}, (_, i) => {
              const r = i * step + offset;
              if (r <= 0.5 || r > maxR) return null;
              // apparition au centre, disparition au bord extérieur
              const edge = interpolate(r, [0, step * 2, maxR * 0.8, maxR], [0, 1, 1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return <circle key={i} cx={cx} cy={cy} r={r} strokeOpacity={opacity * edge * fadeIn} />;
            })}
          </g>
        );
      })}
    </svg>
  );
};
