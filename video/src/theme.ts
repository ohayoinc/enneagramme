// Charte reprise des visuels Facebook « Les samedis pour soi ».
export type Theme = {bg: string; fg: string; muted: string; ring: number};

export const THEMES = {
  noir: {bg: '#0d0d0d', fg: '#ffffff', muted: 'rgba(255,255,255,0.72)', ring: 0.5},
  blanc: {bg: '#ffffff', fg: '#000000', muted: '#6e6e6e', ring: 0.45},
  graphite: {bg: '#545454', fg: '#ffffff', muted: 'rgba(255,255,255,0.86)', ring: 0.5},
  grisClair: {bg: '#e4e4e4', fg: '#000000', muted: '#4a4a4a', ring: 0.45},
} satisfies Record<string, Theme>;

export const SANS = "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif";
export const SERIF = "'Instrument Serif', 'Times New Roman', serif";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

/** secondes → images */
export const f = (s: number) => Math.round(s * FPS);
