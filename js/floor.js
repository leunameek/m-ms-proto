import * as THREE from 'three';
import { CONFIG } from './config.js';
import { state } from './state.js';

export function createFloorImage() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Colorful gradient background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#ff6b6b');
  grad.addColorStop(0.25, '#ffd93d');
  grad.addColorStop(0.5, '#6bcb77');
  grad.addColorStop(0.75, '#4d96ff');
  grad.addColorStop(1, '#9b59b6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Radial overlay
  const radGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  radGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText('HIDDEN', size / 2, size / 2 - 40);
  ctx.fillText('IMAGE', size / 2, size / 2 + 40);

  const texture = new THREE.CanvasTexture(canvas);
  const geo = new THREE.PlaneGeometry(CONFIG.boxWidth - 0.1, CONFIG.boxDepth - 0.1);
  const mat = new THREE.MeshStandardMaterial({ map: texture });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.01, 0);
  state.scene.add(mesh);
  state.floorMesh = mesh;
}
