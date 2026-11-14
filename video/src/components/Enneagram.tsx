import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SANS, SERIF, Theme} from '../theme';

/** Position du point `n` (1–9) : le 9 en haut, puis sens horaire tous les 40°. */
export const pointOf = (n: number, cx: number, cy: number, r: number) => {
  const a = ((-90 + 40 * (n % 9)) * Math.PI) / 180;
  return {x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), a};
};

const TRIANGLE = [3, 6, 9, 3];
const HEXADE = [1, 4, 2, 8, 5, 7, 1];

const pathOf = (seq: number[], cx: number, cy: number, r: number) =>
  seq.map((n, i) => {
    const p = pointOf(n, cx, cy, r);
    return `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

const lengthOf = (seq: number[], cx: number, cy: number, r: number) => {
  let l = 0;
  for (let i = 1; i < seq.length; i++) {
    const a = pointOf(seq[i - 1], cx, cy, r);
    const b = pointOf(seq[i], cx, cy, r);
    l += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return l;
};

/**
 * Le symbole de l'ennéagramme, dessiné progressivement.
 * `drawAt` : image où le tracé commence. `lit` : pour chaque profil, l'image où il s'allume.
 * `labels` : mot affiché à côté de chaque profil allumé.
 */
export const Enneagram: React.FC<{
  t: Theme;
  cx: number;
  cy: number;
  r: number;
  drawAt: number;
  lit: Partial<Record<number, number>>;
  current?: number;
  labels?: Partial<Record<number, string>>;
}> = ({t, cx, cy, r, drawAt, lit, current, labels = {}}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ease = (from: number, dur: number) =>
    interpolate(frame, [from, from + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3)});

  const circ = 2 * Math.PI * r;
  const pCircle = ease(drawAt, 50);
  const pTri = ease(drawAt + 35, 40);
  const pHex = ease(drawAt + 55, 60);
  const lTri = lengthOf(TRIANGLE, cx, cy, r);
  const lHex = lengthOf(HEXADE, cx, cy, r);

  return (
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <g fill="none" stroke={t.fg} strokeLinejoin="round">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          strokeWidth={2}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pCircle)}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <path d={pathOf(TRIANGLE, cx, cy, r)} strokeWidth={1.2} strokeOpacity={0.55} strokeDasharray={lTri} strokeDashoffset={lTri * (1 - pTri)} />
        <path d={pathOf(HEXADE, cx, cy, r)} strokeWidth={1.2} strokeOpacity={0.55} strokeDasharray={lHex} strokeDashoffset={lHex * (1 - pHex)} />
      </g>
      {Array.from({length: 9}, (_, i) => i + 1).map((n) => {
        const p = pointOf(n, cx, cy, r);
        const appear = ease(drawAt + 20 + n * 4, 20);
        const litAt = lit[n];
        const on = litAt === undefined ? 0 : spring({frame: frame - litAt, fps, config: {damping: 14, mass: 0.6}});
        const isCurrent = current === n;
        // onde qui part du point courant
        const pulseT = litAt === undefined ? -1 : ((frame - litAt) % 60) / 60;
        const lx = cx + (r + 62) * Math.cos(p.a);
        const ly = cy + (r + 62) * Math.sin(p.a);
        const anchor = Math.abs(Math.cos(p.a)) < 0.2 ? 'middle' : Math.cos(p.a) > 0 ? 'start' : 'end';
        const label = labels[n];
        const top = Math.sin(p.a) < -0.9; // le 9 : le mot passe au-dessus du chiffre
        const numY = label ? (top ? ly + 8 : ly - 6) : ly + 12;
        const labelY = top ? ly - 34 : ly + 32;
        return (
          <g key={n} opacity={appear}>
            {isCurrent && pulseT >= 0 && (
              <circle cx={p.x} cy={p.y} r={16 + pulseT * 46} fill="none" stroke={t.fg} strokeOpacity={(1 - pulseT) * 0.6} />
            )}
            <circle cx={p.x} cy={p.y} r={11 + on * 7} fill={on > 0.5 ? t.fg : t.bg} stroke={t.fg} strokeWidth={2} />
            <text
              x={lx}
              y={numY}
              textAnchor={anchor}
              fill={t.fg}
              fontFamily={SANS}
              fontWeight={500}
              fontSize={36}
              opacity={litAt === undefined ? 0.45 : 0.45 + on * 0.55}
            >
              {n}
            </text>
            {label && litAt !== undefined && (
              <text
                x={lx}
                y={labelY}
                textAnchor={anchor}
                fill={t.fg}
                fontFamily={SERIF}
                fontStyle="italic"
                fontSize={30}
                opacity={Math.min(1, on) * (isCurrent ? 1 : 0.7)}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
