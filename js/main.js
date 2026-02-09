import { CONFIG } from './config.js';
import { initThree } from './scene.js';
import { initRapier } from './physics.js';
import { createBoxAndHoleAndCap } from './box.js';
import { createCandies } from './candies.js';
import { createFloorImage } from './floor.js';
import { bindUI, showError } from './ui.js';
import { animate, restart } from './game.js';

async function main() {
  // HTTPS check
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    console.warn('Microphone requires HTTPS or localhost. Audio may not work.');
  }

  try {
    initThree();
    await initRapier();
    createBoxAndHoleAndCap();
    createCandies(CONFIG.candyCount);
    createFloorImage();
    bindUI({ restart });
    requestAnimationFrame(animate);
  } catch (err) {
    console.error('Initialization failed:', err);
    showError(`Error al inicializar: ${err.message}. Revise la consola para más detalles.`);
  }
}

main();
