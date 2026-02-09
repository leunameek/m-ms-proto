import * as THREE from 'three';
import { CONFIG } from './config.js';
import { state } from './state.js';

function createCap() {
  const R = state.RAPIER;
  const capY = CONFIG.boxHeight + CONFIG.wallThickness;
  const radius = CONFIG.capRadius;
  const windowHalfRad = (CONFIG.capWindowDeg / 2) * (Math.PI / 180);

  // Kinematic rigid body for the cap
  const bodyDesc = R.RigidBodyDesc.kinematicPositionBased().setTranslation(0, capY, 0);
  state.capBody = state.world.createRigidBody(bodyDesc);

  // Two wing colliders — each covering ~150 degrees (total 300, gap 60)
  // Approximate each wing as a cuboid positioned/rotated to block
  const wingLength = radius;
  const wingWidth = radius * 0.9;
  const wingHeight = 0.3;

  // Wing 1 at +90 degrees from gap center
  const angle1 = Math.PI / 2 + windowHalfRad;
  const cx1 = Math.cos(angle1) * wingLength * 0.5;
  const cz1 = Math.sin(angle1) * wingLength * 0.5;
  const collDesc1 = R.ColliderDesc.cuboid(wingWidth, wingHeight / 2, wingLength * 0.5)
    .setTranslation(cx1, 0, cz1)
    .setRotation({ x: 0, y: Math.sin(angle1 / 2), z: 0, w: Math.cos(angle1 / 2) })
    .setFriction(0.3);
  state.world.createCollider(collDesc1, state.capBody);

  // Wing 2 at -90 degrees from gap center
  const angle2 = -(Math.PI / 2 + windowHalfRad);
  const cx2 = Math.cos(angle2) * wingLength * 0.5;
  const cz2 = Math.sin(angle2) * wingLength * 0.5;
  const collDesc2 = R.ColliderDesc.cuboid(wingWidth, wingHeight / 2, wingLength * 0.5)
    .setTranslation(cx2, 0, cz2)
    .setRotation({ x: 0, y: Math.sin(angle2 / 2), z: 0, w: Math.cos(angle2 / 2) })
    .setFriction(0.3);
  state.world.createCollider(collDesc2, state.capBody);

  // --- Visual cap ---
  const capGroup = new THREE.Group();
  capGroup.position.set(0, capY, 0);

  // Torus ring
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.08, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5, roughness: 0.3 })
  );
  torus.rotation.x = Math.PI / 2;
  capGroup.add(torus);

  // Two blocking plates
  const plateAngle = Math.PI - windowHalfRad;
  const plateGeo = new THREE.CylinderGeometry(radius, radius, wingHeight, 24, 1, false, windowHalfRad, plateAngle);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    metalness: 0.3,
    roughness: 0.5,
  });

  const plate1 = new THREE.Mesh(plateGeo, plateMat);
  capGroup.add(plate1);

  const plateGeo2 = new THREE.CylinderGeometry(radius, radius, wingHeight, 24, 1, false, Math.PI + windowHalfRad, plateAngle);
  const plate2 = new THREE.Mesh(plateGeo2, plateMat);
  capGroup.add(plate2);

  state.scene.add(capGroup);
  state.capVisual = capGroup;
}

export function createBoxAndHoleAndCap() {
  const R = state.RAPIER;
  const w = CONFIG.boxWidth;
  const d = CONFIG.boxDepth;
  const h = CONFIG.boxHeight;
  const t = CONFIG.wallThickness;
  const hole = CONFIG.holeSize;

  // Helper: static cuboid collider + translucent visual
  function addWall(hx, hy, hz, px, py, pz, showVisual = true) {
    const bodyDesc = R.RigidBodyDesc.fixed().setTranslation(px, py, pz);
    const body = state.world.createRigidBody(bodyDesc);
    const collDesc = R.ColliderDesc.cuboid(hx, hy, hz).setFriction(0.5).setRestitution(0.2);
    state.world.createCollider(collDesc, body);
    state.staticBodies.push(body);

    if (showVisual) {
      const geo = new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      state.scene.add(mesh);

      // Wireframe edges
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.4 }));
      line.position.set(px, py, pz);
      state.scene.add(line);
    }
  }

  const hw = w / 2, hd = d / 2;

  // Floor
  addWall(hw, t / 2, hd, 0, -t / 2, 0);
  // Left wall
  addWall(t / 2, h / 2, hd, -(hw + t / 2), h / 2, 0);
  // Right wall
  addWall(t / 2, h / 2, hd, hw + t / 2, h / 2, 0);
  // Front wall
  addWall(hw + t, h / 2, t / 2, 0, h / 2, hd + t / 2);
  // Back wall
  addWall(hw + t, h / 2, t / 2, 0, h / 2, -(hd + t / 2));

  // Ceiling with hole — 4 pieces around a square hole
  const ceilY = h;
  const holeHalf = hole / 2;

  // Left ceiling strip
  const leftW = (hw - holeHalf) / 2;
  addWall(leftW, t / 2, hd, -(holeHalf + leftW), ceilY, 0);
  // Right ceiling strip
  addWall(leftW, t / 2, hd, holeHalf + leftW, ceilY, 0);
  // Front ceiling strip (between left and right)
  const frontD = (hd - holeHalf) / 2;
  addWall(holeHalf, t / 2, frontD, 0, ceilY, holeHalf + frontD);
  // Back ceiling strip
  addWall(holeHalf, t / 2, frontD, 0, ceilY, -(holeHalf + frontD));

  // --- Cap: kinematic body with two wing colliders ---
  createCap();
}
