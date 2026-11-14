import React from 'react';
import {Theme} from '../theme';

/** Pastille arrondie : pleine (`filled`) ou en contour, comme sur les visuels Facebook. */
export const Pill: React.FC<{t: Theme; filled?: boolean; size?: number; children: React.ReactNode}> = ({
  t,
  filled,
  size = 28,
  children,
}) => (
  <span
    style={{
      display: 'inline-block',
      padding: `${size * 0.45}px ${size * 0.95}px`,
      borderRadius: 999,
      border: `1.5px solid ${t.fg}`,
      background: filled ? t.fg : 'transparent',
      color: filled ? t.bg : t.fg,
      fontSize: size,
      fontWeight: 500,
      lineHeight: 1,
    }}
  >
    {children}
  </span>
);
