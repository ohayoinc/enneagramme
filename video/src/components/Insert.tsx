import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, random, staticFile, useCurrentFrame} from 'remotion';

export type InsertMode = 'plein' | 'cadre' | 'cercle';

/**
 * Vidéo d'illustration (Pexels) passée en noir et blanc, avec un léger grain,
 * pour rester dans la charte. Trois présentations :
 *  - plein  : plein écran, assombri pour que le texte reste lisible par-dessus
 *  - cadre  : fenêtre aux coins arrondis (x, y, w, h)
 *  - cercle : vidéo dans un cercle (x, y = centre, w = diamètre)
 * `at` / `out` : images d'entrée et de sortie (fondu).
 */
export const Insert: React.FC<{
  src: string; // ex. 'inserts/tasse.mp4'
  at: number;
  out: number;
  mode: InsertMode;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  dim?: number; // assombrissement en plein écran (0–1)
  trimBefore?: number; // images à sauter au début du clip
}> = ({src, at, out, mode, x = 0, y = 0, w = 800, h = 450, dim = 0.45, trimBefore = 0}) => {
  const frame = useCurrentFrame();
  if (frame < at - 1 || frame > out) return null;
  const o = interpolate(frame, [at, at + 15, out - 15, out], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // léger zoom lent (effet « Ken Burns »)
  const zoom = interpolate(frame, [at, out], [1.04, 1.12]);

  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      muted
      trimBefore={trimBefore}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${zoom})`,
        filter: 'grayscale(1) contrast(1.08) brightness(0.95)',
      }}
    />
  );
  const grain = (
    <AbsoluteFill
      style={{
        opacity: 0.08,
        mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' seed='${Math.floor(
          random(frame) * 1000,
        )}'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")`,
      }}
    />
  );

  if (mode === 'plein') {
    return (
      <AbsoluteFill style={{opacity: o, overflow: 'hidden'}}>
        {video}
        {grain}
        <AbsoluteFill style={{background: `rgba(0,0,0,${dim})`}} />
      </AbsoluteFill>
    );
  }
  const shape: React.CSSProperties =
    mode === 'cercle'
      ? {left: x - w / 2, top: y - w / 2, width: w, height: w, borderRadius: '50%'}
      : {left: x, top: y, width: w, height: h, borderRadius: 28};
  return (
    <div style={{position: 'absolute', overflow: 'hidden', opacity: o, ...shape}}>
      {video}
      {grain}
    </div>
  );
};
