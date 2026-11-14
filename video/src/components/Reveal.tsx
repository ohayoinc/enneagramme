import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/** Fait apparaître son contenu (fondu + léger glissement) à l'image `at`, et le fait disparaître à `out`. */
export const Reveal: React.FC<{
  at: number;
  out?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({at, out, y = 28, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - at, fps, config: {damping: 200}, durationInFrames: 24});
  const o = out === undefined ? 1 : interpolate(frame, [out - 12, out], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{opacity: p * o, transform: `translateY(${(1 - p) * y}px)`, ...style}}>{children}</div>
  );
};
