import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CircleWipe} from '../components/CircleWipe';
import {Enneagram} from '../components/Enneagram';
import {Pill} from '../components/Pill';
import {Reveal} from '../components/Reveal';
import {Rings} from '../components/Rings';
import {FIXATIONS} from '../data/episode25';
import {f, SANS, SERIF, THEMES} from '../theme';

const blanc = THEMES.blanc;
const noir = THEMES.noir;

// Temps relatifs au début de la séquence
const rel = (s: number) => f(s - FIXATIONS.start);
const CX = 1440;
const CY = 560;
const R = 300;

export const NeufFixations: React.FC = () => {
  const frame = useCurrentFrame();
  const profils = FIXATIONS.profils;
  const wipeAt = rel(178.6); // « Examinons maintenant la cartographie complète »
  const lit = Object.fromEntries(profils.map((p) => [p.n, rel(p.at)]));
  const labels = Object.fromEntries(profils.map((p) => [p.n, p.court]));
  const currentIdx = profils.reduce((acc, p, i) => (frame >= rel(p.at) ? i : acc), -1);
  const current = currentIdx >= 0 ? profils[currentIdx] : undefined;
  const end = rel(FIXATIONS.end);
  const fadeOut = interpolate(frame, [end - 20, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{fontFamily: SANS, opacity: fadeOut}}>
      {/* Carton de titre, fond blanc */}
      <AbsoluteFill style={{background: blanc.bg, color: blanc.fg}}>
        <Rings
          color={blanc.fg}
          opacity={blanc.ring}
          clusters={[
            {cx: 1500, cy: 620, maxR: 420, step: 12},
            {cx: 1760, cy: 260, maxR: 380, step: 11},
          ]}
        />
        <div style={{position: 'absolute', left: 120, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20}}>
          <Reveal at={4}>
            <Pill t={blanc} size={30}>Première partie</Pill>
          </Reveal>
          <Reveal at={10}>
            <h1 style={{margin: '24px 0 0', fontSize: 150, lineHeight: 1.02, fontWeight: 500, letterSpacing: '-0.035em'}}>Les neuf</h1>
          </Reveal>
          <Reveal at={18}>
            <p style={{margin: 0, fontFamily: SERIF, fontStyle: 'italic', fontSize: 128, lineHeight: 1.05}}>fixations fondamentales</p>
          </Reveal>
        </div>
      </AbsoluteFill>

      {/* Cartographie, fond noir */}
      <CircleWipe at={wipeAt} x={CX} y={CY}>
        <AbsoluteFill style={{background: noir.bg, color: noir.fg}}>
          <Enneagram t={noir} cx={CX} cy={CY} r={R} drawAt={wipeAt + 10} lit={lit} labels={labels} current={current?.n} />

          <Reveal at={wipeAt + 20} style={{position: 'absolute', left: 120, top: 104}}>
            <p style={{margin: 0, fontSize: 36, fontWeight: 500, letterSpacing: '-0.01em', color: noir.muted}}>
              Les neuf <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400}}>fixations</span>
            </p>
          </Reveal>

          {profils.map((p, i) => {
            const next = profils[i + 1];
            return (
              <div key={p.n} style={{position: 'absolute', left: 120, top: 0, bottom: 0, width: 700, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28}}>
                <Reveal at={rel(p.at)} out={next ? rel(next.at) : undefined}>
                  <Pill t={noir} filled size={30}>Profil {p.n}</Pill>
                </Reveal>
                <Reveal at={rel(p.at) + 6} out={next ? rel(next.at) : undefined}>
                  <p style={{margin: 0, fontFamily: SERIF, fontStyle: 'italic', fontSize: 112, lineHeight: 1.02}}>{p.nom}</p>
                </Reveal>
                <Reveal at={rel(p.at) + 20} out={next ? rel(next.at) : undefined}>
                  <p style={{margin: 0, fontSize: 40, lineHeight: 1.3, color: noir.muted}}>{p.desc}</p>
                </Reveal>
              </div>
            );
          })}
        </AbsoluteFill>
      </CircleWipe>
    </AbsoluteFill>
  );
};
