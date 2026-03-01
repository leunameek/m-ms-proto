import * as THREE from 'three';
import { CONFIG } from './config.js';
import { state } from './state.js';

const SEG = 48; // circumference segments for lathe

// Physics wall profile [radius, y] — matches the outer visual shell exactly
// so candies can never go beyond what's visible.
const INNER_PROFILE = [
  [2.20, 0.00],  // base edge (matches outer flat base)
  [3.10, 0.35],  // base curve
  [3.25, 1.00],  // lower belly
  [3.40, 2.50],  // widest belly
  [3.40, 4.50],  // still wide
  [3.10, 5.50],  // shoulder
  [2.45, 6.50],  // narrowing
  [2.05, 7.20],  // neck
  [2.00, 8.00],  // opening
];

// Outer profile [radius, y] — visual glass shell, slightly larger than inner.
// Starts at center-bottom (r=0) to produce a closed flat bottom visually.
const OUTER_PROFILE = [
  [0.00, 0.00],  // center bottom (closed base)
  [2.20, 0.00],  // flat base extends outward
  [3.10, 0.35],  // base curve up
  [3.25, 1.00],  // lower belly outer
  [3.40, 2.50],  // widest belly outer
  [3.40, 4.50],  // still wide
  [3.10, 5.50],  // shoulder
  [2.45, 6.50],  // narrowing
  [2.05, 7.20],  // neck outer
  [2.00, 8.00],  // rim
];

function profileToVec2(profile) {
  return profile.map(([r, y]) => new THREE.Vector2(r, y));
}

function buildJarVisual() {
  const geo = new THREE.LatheGeometry(profileToVec2(OUTER_PROFILE), SEG);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x99ccff,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    roughness: 0.05,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  state.scene.add(mesh);

  // Wireframe edges for shape clarity
  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x4499ee, transparent: true, opacity: 0.5 })
  );
  state.scene.add(line);
}

function buildJarPhysics() {
  const R = state.RAPIER;
  const t = CONFIG.wallThickness;

  // --- Floor: wide flat cuboid, top surface at y = 0 ---
  const floorBody = state.world.createRigidBody(
    R.RigidBodyDesc.fixed().setTranslation(0, -t / 2, 0)
  );
  const floorCollider = R.ColliderDesc.cuboid(5.0, t / 2, 5.0)
    .setFriction(0.5)
    .setRestitution(0.2);
  state.world.createCollider(floorCollider, floorBody);
  state.staticBodies.push(floorBody);

  // --- Curved walls: trimesh from LatheGeometry ---
  // LatheGeometry normals face OUTWARD by default. Rapier treats trimesh as
  // oriented (one-sided), so candies inside the jar pass through outward-facing
  // triangles. Fix: swap indices[i+1] and indices[i+2] to flip every triangle's
  // winding order, making normals point INWARD toward the jar interior.
  const innerGeo = new THREE.LatheGeometry(profileToVec2(INNER_PROFILE), SEG);
  const posAttr = innerGeo.attributes.position;
  const idxAttr = innerGeo.index;

  const vertices = new Float32Array(posAttr.count * 3);
  for (let i = 0; i < posAttr.count; i++) {
    vertices[i * 3 + 0] = posAttr.getX(i);
    vertices[i * 3 + 1] = posAttr.getY(i);
    vertices[i * 3 + 2] = posAttr.getZ(i);
  }

  // Flip winding: swap the 2nd and 3rd vertex of every triangle
  const indices = new Uint32Array(idxAttr.count);
  for (let i = 0; i < idxAttr.count; i += 3) {
    indices[i]     = idxAttr.getX(i);
    indices[i + 1] = idxAttr.getX(i + 2); // swapped
    indices[i + 2] = idxAttr.getX(i + 1); // swapped
  }

  const wallBody = state.world.createRigidBody(R.RigidBodyDesc.fixed());
  const trimeshCollider = R.ColliderDesc.trimesh(vertices, indices)
    .setFriction(0.5)
    .setRestitution(0.2);
  state.world.createCollider(trimeshCollider, wallBody);
  state.staticBodies.push(wallBody);
}

function createCap() {
  const R = state.RAPIER;
  const capY = CONFIG.boxHeight + CONFIG.wallThickness;
  const radius = CONFIG.capRadius;
  const windowHalfRad = (CONFIG.capWindowDeg / 2) * (Math.PI / 180);

  // Kinematic rigid body for the cap
  const bodyDesc = R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, capY, 0);
  state.capBody = state.world.createRigidBody(bodyDesc);

  // Two wing colliders covering ~150° each (300° total, 60° gap)
  const wingLength = radius;
  const wingWidth = radius * 0.9;
  const wingHeight = 0.3;

  const angle1 = Math.PI / 2 + windowHalfRad;
  const cx1 = Math.cos(angle1) * wingLength * 0.5;
  const cz1 = Math.sin(angle1) * wingLength * 0.5;
  const collDesc1 = R.ColliderDesc.cuboid(wingWidth, wingHeight / 2, wingLength * 0.5)
    .setTranslation(cx1, 0, cz1)
    .setRotation({ x: 0, y: Math.sin(angle1 / 2), z: 0, w: Math.cos(angle1 / 2) })
    .setFriction(0.3);
  state.world.createCollider(collDesc1, state.capBody);

  const angle2 = -(Math.PI / 2 + windowHalfRad);
  const cx2 = Math.cos(angle2) * wingLength * 0.5;
  const cz2 = Math.sin(angle2) * wingLength * 0.5;
  const collDesc2 = R.ColliderDesc.cuboid(wingWidth, wingHeight / 2, wingLength * 0.5)
    .setTranslation(cx2, 0, cz2)
    .setRotation({ x: 0, y: Math.sin(angle2 / 2), z: 0, w: Math.cos(angle2 / 2) })
    .setFriction(0.3);
  state.world.createCollider(collDesc2, state.capBody);

  const plateAngle = Math.PI - windowHalfRad;
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    metalness: 0.3,
    roughness: 0.5,
  });

  // --- Fixed base cap (does not rotate) — sits at the jar rim ---
  const fixedCapGroup = new THREE.Group();
  fixedCapGroup.position.set(0, CONFIG.boxHeight, 0);

  const fixedTorus = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.08, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.4, roughness: 0.45 })
  );
  fixedTorus.rotation.x = Math.PI / 2;
  fixedCapGroup.add(fixedTorus);

  const fixedPlateMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    metalness: 0.2,
    roughness: 0.6,
  });
  fixedCapGroup.add(new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, wingHeight, 24, 1, false, windowHalfRad, plateAngle),
    fixedPlateMat
  ));
  fixedCapGroup.add(new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, wingHeight, 24, 1, false, Math.PI + windowHalfRad, plateAngle),
    fixedPlateMat
  ));
  state.scene.add(fixedCapGroup);

  // --- Rotating visual cap ---
  const capGroup = new THREE.Group();
  capGroup.position.set(0, capY, 0);

  // Torus ring at the jar rim
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.08, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.3 })
  );
  torus.rotation.x = Math.PI / 2;
  capGroup.add(torus);

  capGroup.add(new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, wingHeight, 24, 1, false, windowHalfRad, plateAngle),
    plateMat
  ));
  capGroup.add(new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, wingHeight, 24, 1, false, Math.PI + windowHalfRad, plateAngle),
    plateMat
  ));

  state.scene.add(capGroup);
  state.capVisual = capGroup;
}

export function createBoxAndHoleAndCap() {
  buildJarVisual();
  buildJarPhysics();
  createCap();
}
