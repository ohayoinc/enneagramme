import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Insert} from '../components/Insert';
import {Pill} from '../components/Pill';
import {Reveal} from '../components/Reveal';
import {Rings} from '../components/Rings';
import {INTRO} from '../data/episode25';
import {f, SANS, SERIF, THEMES} from '../theme';

const t = THEMES.noir;

export const Intro: React.FC<{episode: number}> = ({episode}) => {
  const qs = INTRO.questions;
  return (
    <AbsoluteFill style={{background: t.bg, color: t.fg, fontFamily: SANS}}>
      <Rings
        color={t.fg}
        opacity={t.ring}
        clusters={[
          {cx: 1430, cy: 470, maxR: 440, step: 13},
          {cx: 1690, cy: 300, maxR: 400, step: 11.7},
          {cx: 1640, cy: 760, maxR: 360, step: 10.7},
        ]}
      />

      {/* Vidéos d'illustration (Pixabay) */}
      <Insert src="inserts/repetition.mp4" mode="plein" dim={0.62} at={f(qs[0].at)} out={f(qs[1].at)} />
      <Insert src="inserts/eclosion.mp4" mode="cadre" x={1200} y={270} w={600} h={540} at={f(qs[1].at) + 10} out={f(qs[2].at)} />
      <Insert src="inserts/encre.mp4" mode="plein" dim={0.35} at={f(qs[2].at)} out={f(INTRO.end) + 20} />

      {/* En-tête : marque + numéro d'épisode */}
      <Reveal at={8} style={{position: 'absolute', left: 120, top: 104, display: 'flex', alignItems: 'center', gap: 28}}>
        <p style={{margin: 0, fontSize: 42, fontWeight: 500, letterSpacing: '-0.02em'}}>
          L’<span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400}}>Ennéagramme</span>
        </p>
        <Pill t={t} size={26}>Épisode {episode}</Pill>
      </Reveal>

      {/* Titre */}
      <div style={{position: 'absolute', left: 120, top: 0, bottom: 0, width: 1100, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12}}>
        <Reveal at={f(INTRO.titreAt)} out={f(qs[0].at)}>
          <h1 style={{margin: 0, fontSize: 150, lineHeight: 1.02, fontWeight: 500, letterSpacing: '-0.035em'}}>Des fixations</h1>
        </Reveal>
        <Reveal at={f(INTRO.vertusAt)} out={f(qs[0].at)}>
          <p style={{margin: 0, fontFamily: SERIF, fontStyle: 'italic', fontSize: 132, lineHeight: 1.05}}>aux vertus</p>
        </Reveal>
      </div>

      {/* Les trois questions, l'une après l'autre */}
      {qs.map((q, i) => (
        <div key={i} style={{position: 'absolute', left: 120, top: 0, bottom: 0, width: i === 1 ? 980 : 1240, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28}}>
          <Reveal at={f(q.at)} out={i < qs.length - 1 ? f(qs[i + 1].at) : f(INTRO.end)}>
            <p style={{margin: 0, fontSize: 58, lineHeight: 1.2, fontWeight: 500, letterSpacing: '-0.02em'}}>{q.avant}</p>
          </Reveal>
          <Reveal at={f(q.at) + 18} out={i < qs.length - 1 ? f(qs[i + 1].at) : f(INTRO.end)}>
            <p style={{margin: 0, fontFamily: SERIF, fontStyle: 'italic', fontSize: 84, lineHeight: 1.08}}>{q.accent}</p>
          </Reveal>
        </div>
      ))}
    </AbsoluteFill>
  );
};
