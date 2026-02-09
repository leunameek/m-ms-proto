import { CONFIG } from './config.js';
import { state } from './state.js';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const C_MAJOR_NOTES = new Set(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
const C_MAJOR_SNAP = { 'C#': 'C', 'D#': 'D', 'F#': 'F', 'G#': 'G', 'A#': 'A' };

export function detectPitch(buffer, sampleRate) {
  const len = buffer.length;
  const halfLen = Math.floor(len / 2);

  // Difference function
  const diff = new Float32Array(halfLen);
  for (let tau = 0; tau < halfLen; tau++) {
    let sum = 0;
    for (let i = 0; i < halfLen; i++) {
      const d = buffer[i] - buffer[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalized difference
  const cmndf = new Float32Array(halfLen);
  cmndf[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfLen; tau++) {
    runningSum += diff[tau];
    cmndf[tau] = diff[tau] * tau / runningSum;
  }

  // Absolute threshold search
  const threshold = CONFIG.yinThreshold;
  let tauEstimate = -1;
  const minTau = Math.floor(sampleRate / 900); // max ~900 Hz
  const maxTau = Math.floor(sampleRate / 60);  // min ~60 Hz

  for (let tau = minTau; tau < Math.min(maxTau, halfLen); tau++) {
    if (cmndf[tau] < threshold) {
      // Find the local minimum
      while (tau + 1 < halfLen && cmndf[tau + 1] < cmndf[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) return -1;

  // Parabolic interpolation
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < halfLen - 1) {
    const s0 = cmndf[tauEstimate - 1];
    const s1 = cmndf[tauEstimate];
    const s2 = cmndf[tauEstimate + 1];
    const adjustment = (s0 - s2) / (2 * (s0 - 2 * s1 + s2));
    if (isFinite(adjustment)) {
      betterTau = tauEstimate + adjustment;
    }
  }

  return sampleRate / betterTau;
}

export function frequencyToNote(freq) {
  if (freq <= 0) return null;
  const midi = 12 * Math.log2(freq / 440) + 69;
  const semitone = Math.round(midi) % 12;
  const noteName = NOTE_NAMES[(semitone + 12) % 12];

  if (C_MAJOR_NOTES.has(noteName)) return noteName;
  return C_MAJOR_SNAP[noteName] || 'C';
}

export function applyNoteForce(note, rms) {
  const strength = CONFIG.noteStrengths[note] || 0.5;
  const loudness = Math.min(rms * CONFIG.micSensitivity * 10, 1.5);
  const impulseY = CONFIG.baseImpulse * strength * loudness;

  state.lastForce = impulseY;

  const holeX = 0;
  const holeZ = 0;

  for (let i = 0; i < state.totalCandies; i++) {
    if (!state.candyAlive[i]) continue;
    const body = state.candyBodies[i];
    if (!body) continue;

    const pos = body.translation();

    // Upward impulse
    let iy = impulseY;

    // Slight attraction toward hole center
    const dx = holeX - pos.x;
    const dz = holeZ - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    let ix = 0, iz = 0;
    if (dist > 0.1) {
      const attr = CONFIG.holeAttractionStrength * strength;
      ix = (dx / dist) * attr;
      iz = (dz / dist) * attr;
    }

    // Random lateral jitter
    ix += (Math.random() - 0.5) * CONFIG.lateralJitter;
    iz += (Math.random() - 0.5) * CONFIG.lateralJitter;

    body.applyImpulse({ x: ix, y: iy, z: iz }, true);
  }
}

export function processPitch(timestamp) {
  if (!state.micActive || !state.analyser || !state.audioBuffer) {
    state.currentNote = null;
    state.currentFreq = 0;
    state.currentRms = 0;
    return;
  }

  state.analyser.getFloatTimeDomainData(state.audioBuffer);

  // Compute RMS
  let sumSq = 0;
  for (let i = 0; i < state.audioBuffer.length; i++) {
    sumSq += state.audioBuffer[i] * state.audioBuffer[i];
  }
  const rms = Math.sqrt(sumSq / state.audioBuffer.length);
  state.currentRms = rms;

  if (rms < CONFIG.minRms) {
    state.currentNote = null;
    state.currentFreq = 0;
    state.stableNote = null;
    return;
  }

  const freq = detectPitch(state.audioBuffer, state.audioCtx.sampleRate);
  if (freq < 60 || freq > 900) {
    state.currentNote = null;
    state.currentFreq = 0;
    state.stableNote = null;
    return;
  }

  state.currentFreq = freq;
  const note = frequencyToNote(freq);
  state.currentNote = note;

  // Stability check
  if (note !== state.stableNote) {
    state.stableNote = note;
    state.noteStableSince = timestamp;
    return;
  }

  const stableDuration = timestamp - state.noteStableSince;
  if (stableDuration < CONFIG.noteStableMs) return;

  // Debounce
  if (timestamp - state.lastForceTime < CONFIG.forceDebounceMs) return;

  // Apply force!
  state.lastForceTime = timestamp;
  applyNoteForce(note, rms);
}
