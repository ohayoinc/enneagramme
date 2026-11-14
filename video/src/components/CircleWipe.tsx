import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/** Transition : la scène suivante apparaît dans un cercle qui s'agrandit depuis (x, y). */
export const CircleWipe: React.FC<{at: number; x: number; y: number; dur?: number; children: React.ReactNode}> = ({
  at,
  x,
  y,
  dur = 32,
  children,
}) => {
  const frame = useCurrentFrame();
  const r = interpolate(frame, [at, at + dur], [0, 2300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (p) => p * p * (3 - 2 * p),
  });
  if (frame < at) return null;
  return <AbsoluteFill style={{clipPath: `circle(${r}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>;
};
