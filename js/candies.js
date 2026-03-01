import * as THREE from 'three';
import { CONFIG } from './config.js';
import { state } from './state.js';

export function createCandies(count) {
  const R = state.RAPIER;
  state.totalCandies = count;
  state.escapedCount = 0;
  state.candyBodies = [];
  state.candyAlive = [];
  state.candyColors = [];

  const r = CONFIG.candyRadius;
  const geo = new THREE.SphereGeometry(r, 16, 12);

  // Canvas texture with "UMNG" stamp
  const texSize = 256;
  const cvs = document.createElement('canvas');
  cvs.width = texSize;
  cvs.height = texSize;
  const c = cvs.getContext('2d');
  c.fillStyle = '#d0d0d0';
  c.fillRect(0, 0, texSize, texSize);
  c.fillStyle = '#ffffff';
  c.font = 'bold 64px Arial, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('UMNG', texSize / 2, texSize / 2);
  const stampTex = new THREE.CanvasTexture(cvs);

  const mat = new THREE.MeshStandardMaterial({
    map: stampTex,
    metalness: 0.3,
    roughness: 0.5,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  state.scene.add(mesh);
  state.candyMesh = mesh;

  // Spawn within a cylinder matching the jar's belly (inner radius ~3.15).
  // Use 80% of max belly radius to keep candies safely away from the walls.
  const spawnR = CONFIG.boxWidth / 2 * 0.8 - r;
  // Limit height to the wide belly section (avoid the narrow neck region).
  const maxY = CONFIG.boxHeight * 0.75;
  const colors = CONFIG.candyColors;
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * spawnR;  // sqrt = uniform disk dist
    const x = Math.cos(angle) * dist;
    const y = r + Math.random() * (maxY - r);
    const z = Math.sin(angle) * dist;

    // Physics body
    const bodyDesc = R.RigidBodyDesc.dynamic()
      .setTranslation(x, y, z)
      .setCcdEnabled(true);
    const body = state.world.createRigidBody(bodyDesc);
    const collDesc = R.ColliderDesc.ball(r)
      .setRestitution(CONFIG.candyRestitution)
      .setFriction(CONFIG.candyFriction)
      .setDensity(CONFIG.candyDensity);
    state.world.createCollider(collDesc, body);

    state.candyBodies.push(body);
    state.candyAlive.push(true);

    // Color
    const ci = Math.floor(Math.random() * colors.length);
    state.candyColors.push(ci);
    color.setHex(colors[ci]);
    mesh.setColorAt(i, color);

    // Initial matrix
    state._obj3d.position.set(x, y, z);
    state._obj3d.scale.set(1, 0.6, 1);
    state._obj3d.updateMatrix();
    mesh.setMatrixAt(i, state._obj3d.matrix);
  }

  mesh.instanceColor.needsUpdate = true;
  mesh.instanceMatrix.needsUpdate = true;
}

export function checkEscapedCandies() {
  const escapeY = CONFIG.boxHeight + CONFIG.escapeMargin;
  const holeR = CONFIG.escapeHoleRadius;

  for (let i = 0; i < state.totalCandies; i++) {
    if (!state.candyAlive[i]) continue;
    const body = state.candyBodies[i];
    if (!body) continue;

    const pos = body.translation();
    if (pos.y > escapeY) {
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      if (dist < holeR) {
        // Mark dead
        state.candyAlive[i] = false;
        state.escapedCount++;

        // Remove physics body
        state.world.removeRigidBody(body);
        state.candyBodies[i] = null;

        // Hide instance (scale 0, move offscreen)
        state._obj3d.position.set(0, -100, 0);
        state._obj3d.scale.set(0, 0, 0);
        state._obj3d.updateMatrix();
        state.candyMesh.setMatrixAt(i, state._obj3d.matrix);
        state.candyMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
}
