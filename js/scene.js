import * as THREE from 'three';
import { CONFIG } from './config.js';
import { state } from './state.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Isometric camera: 45° elevation, equal distance from each horizontal axis
const ISO_POS    = new THREE.Vector3(10, 18, 10);
const ISO_TARGET = new THREE.Vector3(0, 4, 0);

export function initThree() {
  state.renderer = new THREE.WebGLRenderer({ antialias: true });
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.prepend(state.renderer.domElement);

  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x1a1a2e);

  state.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  state.camera.position.set(0, CONFIG.boxHeight * 0.6, CONFIG.boxDepth * 2.5);

  // Controls
  state.controls = new OrbitControls(state.camera, state.renderer.domElement);
  state.controls.enableDamping = true;
  state.controls.dampingFactor = 0.05;
  state.controls.target.set(0, CONFIG.boxHeight * 0.35, 0);
  state.controls.update();

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7);
  state.scene.add(ambient, dir);
}

export function setCameraMode(mode) {
  if (mode === 'iso') {
    state.controls.enabled = false;
    state.camera.position.copy(ISO_POS);
    state.controls.target.copy(ISO_TARGET);
    state.camera.lookAt(ISO_TARGET);
  } else {
    state.controls.enabled = true;
    state.controls.update();
  }
}
