import { Theme } from './types';

export const COLORS = {
  [Theme.CYBERPUNK]: {
    primary: 0x00f3ff, // Cyan
    secondary: 0xff00aa, // Magenta
    tertiary: 0xaa00ff, // Purple
    bg: 0x050510
  },
  [Theme.NEON_NATURE]: {
    primary: 0x00ff44, // Green
    secondary: 0xffff00, // Yellow
    tertiary: 0x00aaff, // Blue
    bg: 0x001005
  },
  [Theme.MONOCHROME]: {
    primary: 0xffffff,
    secondary: 0x888888,
    tertiary: 0x444444,
    bg: 0x000000
  },
  [Theme.FIRESTORM]: {
    primary: 0xff4400, // Red-Orange
    secondary: 0xffaa00, // Orange
    tertiary: 0xffff00, // Yellow
    bg: 0x100500
  }
};

export const FFT_SIZE = 2048;
export const SAMPLE_RATE = 44100;
export const MAX_PARTICLES = 5000;
