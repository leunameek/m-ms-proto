import RAPIER from 'rapier';
import { CONFIG } from './config.js';
import { state } from './state.js';

export async function initRapier() {
  await RAPIER.init();
  state.RAPIER = RAPIER;
  state.world = new RAPIER.World({ x: 0, y: CONFIG.gravity, z: 0 });
  state._rapierVec = new RAPIER.Vector3(0, 0, 0);
  state._rapierRot = new RAPIER.Quaternion(0, 0, 0, 1);
}
