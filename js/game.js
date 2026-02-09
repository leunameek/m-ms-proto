import * as THREE from 'three';
import { CONFIG } from './config.js';
import { state } from './state.js';
import { processPitch } from './pitch.js';
import { checkEscapedCandies, createCandies } from './candies.js';
import { updateHUD } from './hud.js';

export function animate(timestamp) {
  if (state.won) return;
  requestAnimationFrame(animate);

  // Delta time (clamped)
  let dt = (timestamp - state.lastTime) / 1000;
  if (dt > 0.1) dt = 0.1;
  if (state.lastTime === 0) dt = CONFIG.fixedDt;
  state.lastTime = timestamp;

  // Process pitch
  processPitch(timestamp);

  // Update controls
  if (state.controls) state.controls.update();

  // Rotate cap
  state.capAngle += CONFIG.capRotationSpeed * dt;
  if (state.capBody) {
    const q = state._quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), state.capAngle);
    state.capBody.setNextKinematicTranslation({ x: 0, y: CONFIG.boxHeight + CONFIG.wallThickness, z: 0 });
    state.capBody.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  }
  if (state.capVisual) {
    state.capVisual.rotation.y = state.capAngle;
  }

  // Fixed timestep physics
  state.physicsAccum += dt;
  let steps = 0;
  while (state.physicsAccum >= CONFIG.fixedDt && steps < CONFIG.maxSubsteps) {
    state.world.step();
    state.physicsAccum -= CONFIG.fixedDt;
    steps++;
  }
  if (state.physicsAccum > CONFIG.fixedDt) state.physicsAccum = 0;

  // Sync instanced mesh from physics
  for (let i = 0; i < state.totalCandies; i++) {
    if (!state.candyAlive[i]) continue;
    const body = state.candyBodies[i];
    if (!body) continue;
    const pos = body.translation();
    const rot = body.rotation();

    state._obj3d.position.set(pos.x, pos.y, pos.z);
    state._obj3d.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    state._obj3d.scale.set(1, 0.6, 1);
    state._obj3d.updateMatrix();
    state.candyMesh.setMatrixAt(i, state._obj3d.matrix);
  }
  state.candyMesh.instanceMatrix.needsUpdate = true;

  // Check escaped
  checkEscapedCandies();

  // Win condition
  if (state.escapedCount >= Math.floor(state.totalCandies * CONFIG.winRatio)) {
    state.won = true;
    document.getElementById('win-screen').classList.remove('hidden');
  }

  // Update HUD
  updateHUD();

  // Render
  state.renderer.render(state.scene, state.camera);
}

export function restart() {
  document.getElementById('win-screen').classList.add('hidden');
  state.won = false;
  state.lastTime = 0;
  state.physicsAccum = 0;
  state.escapedCount = 0;
  state.lastForce = 0;
  state.capAngle = 0;

  // Remove old candy mesh
  if (state.candyMesh) {
    state.scene.remove(state.candyMesh);
    state.candyMesh.geometry.dispose();
    state.candyMesh.material.dispose();
    state.candyMesh = null;
  }

  // Remove old candy bodies
  for (let i = 0; i < state.candyBodies.length; i++) {
    if (state.candyBodies[i]) {
      state.world.removeRigidBody(state.candyBodies[i]);
    }
  }
  state.candyBodies = [];
  state.candyAlive = [];
  state.candyColors = [];

  // Read candy count from slider
  const count = parseInt(document.getElementById('slider-candy').value, 10);
  CONFIG.candyCount = count;

  // Recreate candies
  createCandies(count);

  // Restart animation if won was true
  requestAnimationFrame(animate);
}
