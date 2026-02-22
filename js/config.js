export const CONFIG = {
  // Box dimensions
  boxWidth: 6,
  boxDepth: 6,
  boxHeight: 8,
  wallThickness: 0.15,

  // Hole in ceiling
  holeSize: 2.0,

  // Cap
  capRadius: 1.8,
  capWindowDeg: 60,
  capRotationSpeed: 0.5,

  // Candies
  candyCount: 300,
  candyRadius: 0.18,
  candyRestitution: 0.3,
  candyFriction: 0.4,
  candyDensity: 1.0,

  // Physics
  gravity: -9.81,
  fixedDt: 1 / 60,
  maxSubsteps: 4,

  // Audio / Pitch
  fftSize: 2048,
  yinThreshold: 0.15,
  minRms: 0.01,
  noteStableMs: 100,
  forceDebounceMs: 120,

  // Force mapping: C=0.3 .. B=1.0
  noteStrengths: { C: 0.3, D: 0.4, E: 0.5, F: 0.6, G: 0.7, A: 0.85, B: 1.0 },
  baseImpulse: 1.0,
  micSensitivity: 1.0,
  holeAttractionStrength: 0.15,
  lateralJitter: 0.05,

  // Win
  winRatio: 0.9,

  // Escape detection
  escapeMargin: 0.5,
  escapeHoleRadius: 1.4,

  // M&M colors
  candyColors: [0xb11224, 0x2f9e44, 0x1971c2, 0xff6d00, 0x6d4c41, 0xfdd835],
};
