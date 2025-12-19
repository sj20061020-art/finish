export enum VisualMode {
  ORB = 0,
  VORTEX = 1,
  CORE = 2
}

export enum Theme {
  CYBERPUNK = 'CYBERPUNK',
  NEON_NATURE = 'NEON_NATURE',
  MONOCHROME = 'MONOCHROME',
  FIRESTORM = 'FIRESTORM'
}

export interface AudioFrequencyData {
  low: number; // 0-255 normalized
  mid: number;
  high: number;
  raw: Uint8Array; // Full FFT data
  timeDomain: Uint8Array; // Waveform data
}

export interface GamepadState {
  connected: boolean;
  id: string;
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number; angle: number; velocity: number }; // Velocity for scratch
  triggers: { left: number; right: number }; // 0-1
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    lb: boolean;
    rb: boolean;
    select: boolean;
    start: boolean;
    dpadUp: boolean;
    dpadDown: boolean;
    dpadLeft: boolean;
    dpadRight: boolean;
  };
}

export interface VisualizerConfig {
  mode: VisualMode;
  theme: Theme;
  intensity: {
    low: number;
    mid: number;
    high: number;
  };
  particleSpeed: number;
  globalScale: number;
  activeEffect: 'none' | 'explode' | 'ripple';
}