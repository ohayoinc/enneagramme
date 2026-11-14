import React from 'react';
import {Audio, Composition, Sequence, staticFile} from 'remotion';
import './fonts';
import {AUDIO, FIXATIONS, INTRO} from './data/episode25';
import {Intro} from './scenes/Intro';
import {NeufFixations} from './scenes/NeufFixations';
import {f, FPS, H, W} from './theme';

const introLen = f(INTRO.end - INTRO.start);
const fixLen = f(FIXATIONS.end - FIXATIONS.start);

/** Test : l'introduction, puis les neuf fixations (deux extraits de l'épisode 25). */
const Test: React.FC = () => (
  <>
    <Sequence durationInFrames={introLen}>
      <Intro />
      <Audio src={staticFile(AUDIO)} trimBefore={f(INTRO.start)} />
    </Sequence>
    <Sequence from={introLen} durationInFrames={fixLen}>
      <NeufFixations />
      <Audio src={staticFile(AUDIO)} trimBefore={f(FIXATIONS.start)} />
    </Sequence>
  </>
);

export const Root: React.FC = () => (
  <Composition id="Test" component={Test} durationInFrames={introLen + fixLen} fps={FPS} width={W} height={H} />
);
