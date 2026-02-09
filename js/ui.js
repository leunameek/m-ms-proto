import { CONFIG } from './config.js';
import { state } from './state.js';
import { initAudio, stopAudio } from './audio.js';

export function showError(msg) {
  document.getElementById('error-msg').textContent = msg;
  document.getElementById('error-overlay').classList.remove('hidden');
}

export function bindUI(callbacks) {
  // Mic button
  const btnMic = document.getElementById('btn-mic');
  btnMic.addEventListener('click', async () => {
    if (state.audioCtx) {
      await state.audioCtx.resume();
    }
    if (!state.micActive) {
      const result = await initAudio();
      if (result.ok) {
        btnMic.textContent = 'Detener Micrófono';
        btnMic.classList.add('active');
      } else {
        showError(result.error);
      }
    } else {
      stopAudio();
      btnMic.textContent = 'Iniciar Micrófono';
      btnMic.classList.remove('active');
    }
  });

  // Sliders
  const sliderCandy = document.getElementById('slider-candy');
  const sliderImpulse = document.getElementById('slider-impulse');
  const sliderSensitivity = document.getElementById('slider-sensitivity');
  const sliderCapspeed = document.getElementById('slider-capspeed');

  sliderCandy.addEventListener('input', () => {
    document.getElementById('val-candy').textContent = sliderCandy.value;
  });
  sliderImpulse.addEventListener('input', () => {
    CONFIG.baseImpulse = parseFloat(sliderImpulse.value);
    document.getElementById('val-impulse').textContent = sliderImpulse.value;
  });
  sliderSensitivity.addEventListener('input', () => {
    CONFIG.micSensitivity = parseFloat(sliderSensitivity.value);
    document.getElementById('val-sensitivity').textContent = sliderSensitivity.value;
  });
  sliderCapspeed.addEventListener('input', () => {
    CONFIG.capRotationSpeed = parseFloat(sliderCapspeed.value);
    document.getElementById('val-capspeed').textContent = sliderCapspeed.value;
  });

  // Restart
  document.getElementById('btn-restart').addEventListener('click', callbacks.restart);
  document.getElementById('btn-play-again').addEventListener('click', callbacks.restart);

  // Error dismiss
  document.getElementById('btn-error-dismiss').addEventListener('click', () => {
    document.getElementById('error-overlay').classList.add('hidden');
  });

  // Resize
  window.addEventListener('resize', () => {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
