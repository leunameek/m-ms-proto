import { CONFIG } from './config.js';
import { state } from './state.js';

export async function initAudio() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { ok: false, error: 'API de micrófono no disponible. Use HTTPS o localhost.' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    state.micStream = stream;

    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = state.audioCtx.createMediaStreamSource(stream);
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = CONFIG.fftSize;
    source.connect(state.analyser);

    state.audioBuffer = new Float32Array(state.analyser.fftSize);
    state.micActive = true;
    return { ok: true, error: null };
  } catch (err) {
    let error;
    if (err.name === 'NotAllowedError') {
      error = 'Permiso de micrófono denegado. Por favor permita el acceso y reintente.';
    } else if (err.name === 'NotFoundError') {
      error = 'No se encontró micrófono. Por favor conecte uno.';
    } else {
      error = `Error de micrófono: ${err.message}`;
    }
    return { ok: false, error };
  }
}

export function stopAudio() {
  if (state.micStream) {
    state.micStream.getTracks().forEach(t => t.stop());
    state.micStream = null;
  }
  if (state.audioCtx) {
    state.audioCtx.close().catch(() => { });
    state.audioCtx = null;
  }
  state.analyser = null;
  state.audioBuffer = null;
  state.micActive = false;
}
