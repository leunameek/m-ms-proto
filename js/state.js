import * as THREE from 'three';

export const state = {
  scene: null,
  camera: null,
  renderer: null,

  world: null,
  RAPIER: null,

  // Candy tracking
  candyBodies: [],     // Rapier rigid bodies (or null if dead)
  candyAlive: [],      // boolean flags
  candyColors: [],     // per-instance color index
  candyMesh: null,     // InstancedMesh
  totalCandies: 0,
  escapedCount: 0,

  // Cap
  capBody: null,
  capVisual: null,
  capAngle: 0,

  // Floor image
  floorMesh: null,

  // Audio
  audioCtx: null,
  analyser: null,
  micStream: null,
  audioBuffer: null,
  micActive: false,

  // Pitch state
  currentNote: null,
  currentFreq: 0,
  currentRms: 0,
  lastForce: 0,
  noteStableSince: 0,
  lastForceTime: 0,
  stableNote: null,

  // Animation
  lastTime: 0,
  physicsAccum: 0,

  // Pre-allocated reusables
  _mat4: new THREE.Matrix4(),
  _vec3: new THREE.Vector3(),
  _quat: new THREE.Quaternion(),
  _obj3d: new THREE.Object3D(),
  _color: new THREE.Color(),
  _rapierVec: null,  // set after RAPIER init
  _rapierRot: null,

  // Box collider refs (for cleanup on restart)
  staticBodies: [],
};
