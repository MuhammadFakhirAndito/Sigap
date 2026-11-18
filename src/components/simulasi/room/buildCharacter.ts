import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { CHARACTER_CONFIG, type CharacterFrameState } from "@/lib/simulasi-visual";

export interface CharacterRig {
  root: THREE.Group;
  applyPose: (state: CharacterFrameState, dtSec?: number) => void;
}

const CHAR_COLORS = {
  shirt: "#587A42",
  shirtAccent: "#466333",
  pants: "#2F2A27",
  shoes: "#5A4030",
  skin: "#E2B48D",
  hair: "#362820",
  eye: "#231E1B",
} as const;

function std(color: string, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function makeMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  cast = true,
  receive = true
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function roundedBox(w: number, h: number, d: number, r: number) {
  return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2));
}

function damp(current: number, target: number, alpha: number): number {
  return current + (target - current) * alpha;
}

function dampAngle(current: number, target: number, alpha: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

/**
 * Membangun karakter manusia low-poly prosedural berbasis hierarki THREE.Object3D.
 * Dilengkapi sambungan bola di bahu/siku/pinggul/lutut agar tekukan mulus tanpa celah,
 * serta peredaman eksponensial antar-bingkai saat pemutaran langsung.
 */
export function buildCharacter(): CharacterRig {
  const root = new THREE.Group();
  root.name = "DropCoverHoldCharacter";
  root.scale.setScalar(CHARACTER_CONFIG.scale);

  const shirtMat = std(CHAR_COLORS.shirt, 0.8);
  const shirtAccentMat = std(CHAR_COLORS.shirtAccent, 0.82);
  const pantsMat = std(CHAR_COLORS.pants, 0.88);
  const shoesMat = std(CHAR_COLORS.shoes, 0.82);
  const skinMat = std(CHAR_COLORS.skin, 0.72);
  const hairMat = std(CHAR_COLORS.hair, 0.85);
  const eyeMat = std(CHAR_COLORS.eye, 0.5);

  // ---------- Pinggul (pusat keseimbangan) ----------
  const hips = new THREE.Group();
  hips.position.y = 0.56;
  root.add(hips);

  const pelvisMesh = makeMesh(roundedBox(0.24, 0.12, 0.16, 0.045), pantsMat);
  pelvisMesh.position.y = -0.01;
  hips.add(pelvisMesh);

  // ---------- Badan & Kerah ----------
  const torso = new THREE.Group();
  torso.position.set(0, 0.04, 0);
  hips.add(torso);

  const torsoMesh = makeMesh(roundedBox(0.25, 0.36, 0.16, 0.055), shirtMat);
  torsoMesh.position.y = 0.18;
  torso.add(torsoMesh);

  const collarMesh = makeMesh(new THREE.CylinderGeometry(0.068, 0.078, 0.045, 16), shirtAccentMat);
  collarMesh.position.y = 0.365;
  torso.add(collarMesh);

  // ---------- Kepala & Rambut ----------
  const head = new THREE.Group();
  head.position.set(0, 0.39, 0);
  torso.add(head);

  const neckMesh = makeMesh(new THREE.CylinderGeometry(0.038, 0.044, 0.055, 12), skinMat);
  neckMesh.position.y = 0.02;
  head.add(neckMesh);

  const headMesh = makeMesh(new THREE.SphereGeometry(0.125, 20, 16), skinMat);
  headMesh.scale.set(0.96, 1.04, 0.98);
  headMesh.position.y = 0.15;
  head.add(headMesh);

  const hairCrown = makeMesh(new THREE.SphereGeometry(0.132, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
  hairCrown.position.set(0, 0.158, -0.012);
  hairCrown.rotation.x = -0.18;
  head.add(hairCrown);

  const hairBack = makeMesh(roundedBox(0.22, 0.13, 0.11, 0.05), hairMat);
  hairBack.position.set(0, 0.15, -0.085);
  head.add(hairBack);

  const eyeGeo = new THREE.SphereGeometry(0.014, 10, 8);
  for (const ex of [-0.042, 0.042]) {
    const eye = makeMesh(eyeGeo, eyeMat, false, false);
    eye.position.set(ex, 0.148, 0.114);
    head.add(eye);
  }

  // ---------- Lengan Kiri & Kanan (urutan YXZ untuk jangkauan anatomis) ----------
  const shoulderJointGeo = new THREE.SphereGeometry(0.042, 12, 10);
  const elbowJointGeo = new THREE.SphereGeometry(0.032, 10, 8);
  const upperArmGeo = new THREE.CapsuleGeometry(0.036, 0.14, 6, 12);
  const sleeveGeo = new THREE.CapsuleGeometry(0.042, 0.075, 6, 12);
  const forearmGeo = new THREE.CapsuleGeometry(0.031, 0.135, 6, 12);
  const handGeo = roundedBox(0.042, 0.068, 0.026, 0.012);

  const buildArm = (side: 1 | -1) => {
    const shoulder = new THREE.Group();
    shoulder.rotation.order = "YXZ";
    shoulder.position.set(side * 0.145, 0.33, 0);
    torso.add(shoulder);

    const shoulderJoint = makeMesh(shoulderJointGeo, shirtMat);
    shoulder.add(shoulderJoint);

    const sleeve = makeMesh(sleeveGeo, shirtMat);
    sleeve.position.y = -0.055;
    shoulder.add(sleeve);

    const upperArm = makeMesh(upperArmGeo, skinMat);
    upperArm.position.y = -0.125;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.23, 0);
    shoulder.add(elbow);

    const elbowJoint = makeMesh(elbowJointGeo, skinMat);
    elbow.add(elbowJoint);

    const forearm = makeMesh(forearmGeo, skinMat);
    forearm.position.y = -0.105;
    elbow.add(forearm);

    const hand = makeMesh(handGeo, skinMat);
    hand.position.y = -0.215;
    elbow.add(hand);

    return { shoulder, elbow };
  };

  const leftArm = buildArm(1);
  const rightArm = buildArm(-1);

  // ---------- Kaki Kiri & Kanan (sendi pinggul & lutut menyatu halus) ----------
  const hipJointGeo = new THREE.SphereGeometry(0.048, 12, 10);
  const kneeJointGeo = new THREE.SphereGeometry(0.04, 12, 10);
  const thighGeo = new THREE.CapsuleGeometry(0.047, 0.2, 6, 12);
  const shinGeo = new THREE.CapsuleGeometry(0.039, 0.3, 6, 12);
  const shoeGeo = roundedBox(0.095, 0.06, 0.17, 0.022);

  const buildLeg = (side: 1 | -1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.085, -0.02, 0);
    hips.add(hip);

    const hipJoint = makeMesh(hipJointGeo, pantsMat);
    hip.add(hipJoint);

    const thigh = makeMesh(thighGeo, pantsMat);
    thigh.position.y = -0.15;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.3, 0);
    hip.add(knee);

    const kneeJoint = makeMesh(kneeJointGeo, pantsMat);
    knee.add(kneeJoint);

    const shin = makeMesh(shinGeo, pantsMat);
    shin.position.y = -0.2;
    knee.add(shin);

    const shoe = makeMesh(shoeGeo, shoesMat);
    shoe.position.set(0, -0.43, 0.036);
    knee.add(shoe);

    return { hip, knee };
  };

  const leftLeg = buildLeg(1);
  const rightLeg = buildLeg(-1);

  let hasPose = false;

  const applyPose = (s: CharacterFrameState, dtSec = 0) => {
    // Posisi XZ dijaga langsung agar akurat terhadap lintasan Cubic Bezier dan pergeseran meja;
    // seluruh sendi diredam secara eksponensial saat pemutaran langsung untuk kehalusan ekstra.
    root.position.set(s.rootPosition.x, s.rootPosition.y, s.rootPosition.z);

    if (!hasPose || dtSec <= 0) {
      hasPose = true;
      root.rotation.set(0, s.rootYaw, 0);

      hips.position.y = s.hipsY;
      hips.rotation.set(s.hipsPitch, 0, s.hipsRoll);

      torso.rotation.set(s.torsoPitch, s.torsoYaw, s.torsoRoll);
      head.rotation.set(s.headPitch, s.headYaw, s.headRoll);

      leftArm.shoulder.rotation.set(s.leftShoulderPitch, s.leftShoulderYaw, s.leftShoulderRoll);
      leftArm.elbow.rotation.set(s.leftElbowPitch, 0, 0);

      rightArm.shoulder.rotation.set(s.rightShoulderPitch, s.rightShoulderYaw, s.rightShoulderRoll);
      rightArm.elbow.rotation.set(s.rightElbowPitch, 0, 0);

      leftLeg.hip.rotation.set(s.leftHipPitch, 0, 0);
      leftLeg.knee.rotation.set(s.leftKneePitch, 0, 0);

      rightLeg.hip.rotation.set(s.rightHipPitch, 0, 0);
      rightLeg.knee.rotation.set(s.rightKneePitch, 0, 0);
      return;
    }

    const alpha = 1 - Math.exp(-18 * dtSec);
    root.rotation.y = dampAngle(root.rotation.y, s.rootYaw, alpha);

    hips.position.y = damp(hips.position.y, s.hipsY, alpha);
    hips.rotation.x = damp(hips.rotation.x, s.hipsPitch, alpha);
    hips.rotation.z = damp(hips.rotation.z, s.hipsRoll, alpha);

    torso.rotation.x = damp(torso.rotation.x, s.torsoPitch, alpha);
    torso.rotation.y = damp(torso.rotation.y, s.torsoYaw, alpha);
    torso.rotation.z = damp(torso.rotation.z, s.torsoRoll, alpha);

    head.rotation.x = damp(head.rotation.x, s.headPitch, alpha);
    head.rotation.y = damp(head.rotation.y, s.headYaw, alpha);
    head.rotation.z = damp(head.rotation.z, s.headRoll, alpha);

    leftArm.shoulder.rotation.x = damp(leftArm.shoulder.rotation.x, s.leftShoulderPitch, alpha);
    leftArm.shoulder.rotation.y = damp(leftArm.shoulder.rotation.y, s.leftShoulderYaw, alpha);
    leftArm.shoulder.rotation.z = damp(leftArm.shoulder.rotation.z, s.leftShoulderRoll, alpha);
    leftArm.elbow.rotation.x = damp(leftArm.elbow.rotation.x, s.leftElbowPitch, alpha);

    rightArm.shoulder.rotation.x = damp(rightArm.shoulder.rotation.x, s.rightShoulderPitch, alpha);
    rightArm.shoulder.rotation.y = damp(rightArm.shoulder.rotation.y, s.rightShoulderYaw, alpha);
    rightArm.shoulder.rotation.z = damp(rightArm.shoulder.rotation.z, s.rightShoulderRoll, alpha);
    rightArm.elbow.rotation.x = damp(rightArm.elbow.rotation.x, s.rightElbowPitch, alpha);

    leftLeg.hip.rotation.x = damp(leftLeg.hip.rotation.x, s.leftHipPitch, alpha);
    leftLeg.knee.rotation.x = damp(leftLeg.knee.rotation.x, s.leftKneePitch, alpha);

    rightLeg.hip.rotation.x = damp(rightLeg.hip.rotation.x, s.rightHipPitch, alpha);
    rightLeg.knee.rotation.x = damp(rightLeg.knee.rotation.x, s.rightKneePitch, alpha);
  };

  return { root, applyPose };
}
