import { CONFIG } from './config.js';
import { state } from './state.js';

export function updateHUD() {
  const noteEl = document.getElementById('hud-note');
  const hzEl = document.getElementById('hud-hz');
  const levelFill = document.getElementById('level-fill');
  const forceEl = document.getElementById('hud-force');
  const escapedEl = document.getElementById('hud-escaped');

  const NOTE_MAP = {
    'C': 'Do', 'C#': 'Do#',
    'D': 'Re', 'D#': 'Re#',
    'E': 'Mi',
    'F': 'Fa', 'F#': 'Fa#',
    'G': 'Sol', 'G#': 'Sol#',
    'A': 'La', 'A#': 'La#',
    'B': 'Si'
  };
  const displayNote = state.currentNote ? (NOTE_MAP[state.currentNote] || state.currentNote) : '—';
  noteEl.textContent = `Nota: ${displayNote}`;
  hzEl.textContent = `${state.currentFreq > 0 ? state.currentFreq.toFixed(1) : '0'} Hz`;

  const pct = Math.min(state.currentRms * CONFIG.micSensitivity * 500, 100);
  levelFill.style.width = pct + '%';
  if (pct < 40) levelFill.style.background = '#4caf50';
  else if (pct < 70) levelFill.style.background = '#ff9800';
  else levelFill.style.background = '#f44336';

  forceEl.textContent = `Fuerza: ${state.lastForce.toFixed(2)}`;
  escapedEl.textContent = `Escapados: ${state.escapedCount} / ${state.totalCandies}`;
}
