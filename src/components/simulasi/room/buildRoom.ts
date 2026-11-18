import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  SHELF_BOOK_COUNT,
  createSeededRandom,
  fallHeight,
  rollDistance,
  sampleCharacterState,
  type CharacterFrameState,
  type CharacterSimOptions,
  type VibrationFrameSample,
  type VibrationProfile,
} from "@/lib/simulasi-visual";
import { buildCharacter } from "./buildCharacter";
import {
  clockFaceTexture,
  contactShadowTexture,
  crackTexture,
  edgeShadeTexture,
  lightBeamTexture,
  pictureTexture,
  rugTexture,
  woodFloorTexture,
} from "./textures";

/**
 * Diorama ruangan hangat untuk mode "Getaran 3D". Ukuran dalam meter kira-kira:
 * lantai 3,2 x 2,6 (x -1,6..1,6, z -1,3..1,3), tinggi dinding 2,2.
 * Semua benda yang bisa jatuh ditaruh langsung di `roomGroup` agar posisinya dihitung
 * terhadap lantai, bukan terhadap perabot yang ikut bergeser.
 */

export interface RoomRig {
  roomGroup: THREE.Group;
  apply: (
    sample: VibrationFrameSample,
    elapsedSec: number,
    profile?: VibrationProfile,
    options?: CharacterSimOptions
  ) => CharacterFrameState | null;
  setCharacterVisible: (visible: boolean) => void;
  dispose: () => void;
}

// Palet hangat diorama. Hijau #6AA400 = --color-primary (aksen sinyal SIGAP) hanya di vas dan satu buku.
const COLORS = {
  wallBack: "#EFE5D6",
  wallSide: "#E7DCCB",
  wallCap: "#CDBEA8",
  trim: "#F6F0E6",
  slab: "#A8825D",
  teak: "#9A6440",
  teakDark: "#7C4D30",
  fabric: "#D4A48A",
  lampShade: "#F1E6D3",
  bulb: "#FFE2A8",
  windowFrame: "#F7F2EA",
  windowGlass: "#D8E8EE",
  frameWood: "#6E4B32",
  clockRim: "#3A2E25",
  ceramic: "#F7F2EA",
  pot: "#B8734F",
  soil: "#5A4030",
  leafA: "#5F8A3E",
  leafB: "#4E7533",
  accent: "#6AA400",
  dust: "#D9CBB5",
  books: ["#7A4E3A", "#C9A66B", "#5D6B57", "#6AA400", "#B5654A", "#E2D5BF"],
} as const;

const TABLE_BASE = { x: 0.35, z: 0.2 };
const TABLE_TOP_Y = 0.69;
const CHAIR_BASE = { x: -0.62, z: 0.42, yaw: 0.55 };
const SHELF = { x: -0.85, y: 1.15, z: -1.18, topY: 1.175 };
const GLASS_REL = { x: 0.08, z: 0.02 };
const PLATE_REL = { x: -0.22, z: 0.12 };
const FRAME_NAIL = { x: -1.585, y: 1.62, z: 0.15 };
const CLOCK_NAIL = { x: -0.15, y: 1.95, z: -1.275 };
const DUST_COUNT = 140;
const CEILING_Y = 2.2;

function std(color: string, roughness = 0.75, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
}

function rounded(w: number, h: number, d: number, r: number, segments = 2) {
  return new RoundedBoxGeometry(w, h, d, segments, Math.min(r, w / 2, h / 2, d / 2));
}

function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material | THREE.Material[],
  cast = true,
  receive = true
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/** Memindahkan benda dari posisi awal ke lantai dengan lintasan jatuh, pantulan, lalu gelinding. */
function placeFalling(
  obj: THREE.Object3D,
  start: THREE.Vector3,
  restY: number,
  drift: { x: number; z: number },
  progress: number
): { airborne: number; roll: number } {
  if (progress <= 0) {
    obj.position.copy(start);
    return { airborne: 0, roll: 0 };
  }
  const airborne = Math.min(1, progress / 0.7);
  const roll = rollDistance(progress);
  obj.position.set(
    start.x + drift.x * (airborne + 0.6 * roll),
    restY + (start.y - restY) * fallHeight(progress),
    start.z + drift.z * (airborne + 0.6 * roll)
  );
  return { airborne, roll };
}

export function buildRoom(scene: THREE.Scene): RoomRig {
  const textures: THREE.Texture[] = [];
  const track = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  // Bayangan kontak di bawah diorama: diam di tempat, sehingga guncangan ruangan terlihat jelas.
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 4.4),
    new THREE.MeshBasicMaterial({ map: track(contactShadowTexture()), transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -0.16;
  scene.add(contactShadow);

  const roomGroup = new THREE.Group();
  scene.add(roomGroup);

  // ---------- Lantai, dinding, plint ----------
  const slab = mesh(rounded(3.34, 0.14, 2.74, 0.03), std(COLORS.slab, 0.8), true, true);
  slab.position.y = -0.07;
  roomGroup.add(slab);

  const floorTex = track(woodFloorTexture());
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(1.6, 1.3);
  const floor = mesh(new THREE.PlaneGeometry(3.2, 2.6), std("#FFFFFF", 0.62, { map: floorTex }), false, true);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  roomGroup.add(floor);

  const backWall = mesh(new THREE.BoxGeometry(3.34, CEILING_Y, 0.1), std(COLORS.wallBack, 0.92), false, true);
  backWall.position.set(0.02, CEILING_Y / 2, -1.35);
  roomGroup.add(backWall);

  const leftWall = mesh(new THREE.BoxGeometry(0.1, CEILING_Y, 2.74), std(COLORS.wallSide, 0.92), false, true);
  leftWall.position.set(-1.65, CEILING_Y / 2, 0);
  roomGroup.add(leftWall);

  const capMat = std(COLORS.wallCap, 0.85);
  const backCap = mesh(new THREE.BoxGeometry(3.36, 0.025, 0.12), capMat, false, false);
  backCap.position.set(0.02, CEILING_Y + 0.0125, -1.35);
  const leftCap = mesh(new THREE.BoxGeometry(0.12, 0.025, 2.76), capMat, false, false);
  leftCap.position.set(-1.65, CEILING_Y + 0.0125, 0);
  roomGroup.add(backCap, leftCap);

  const trimMat = std(COLORS.trim, 0.6);
  const backBoard = mesh(rounded(3.2, 0.1, 0.03, 0.01), trimMat, false, true);
  backBoard.position.set(0, 0.05, -1.285);
  const leftBoard = mesh(rounded(0.03, 0.1, 2.6, 0.01), trimMat, false, true);
  leftBoard.position.set(-1.585, 0.05, 0);
  roomGroup.add(backBoard, leftBoard);

  // ---------- Ambient occlusion palsu di tepi lantai dan sudut dinding ----------
  const shadeUp = track(edgeShadeTexture("up"));
  const shadeLeft = track(edgeShadeTexture("left"));
  const shadeRight = track(edgeShadeTexture("right"));
  const shadeMat = (map: THREE.Texture) =>
    new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

  const floorAoBack = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.4), shadeMat(shadeUp));
  floorAoBack.rotation.x = -Math.PI / 2;
  floorAoBack.position.set(0, 0.003, -1.3 + 0.2);
  const floorAoLeftPivot = new THREE.Group();
  floorAoLeftPivot.rotation.y = Math.PI / 2;
  floorAoLeftPivot.position.set(-1.6 + 0.2, 0.003, 0);
  const floorAoLeft = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.4), shadeMat(shadeUp));
  floorAoLeft.rotation.x = -Math.PI / 2;
  floorAoLeftPivot.add(floorAoLeft);
  const cornerAoBack = new THREE.Mesh(new THREE.PlaneGeometry(0.45, CEILING_Y), shadeMat(shadeLeft));
  cornerAoBack.position.set(-1.6 + 0.225, CEILING_Y / 2, -1.299);
  const cornerAoLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.45, CEILING_Y), shadeMat(shadeRight));
  cornerAoLeft.rotation.y = Math.PI / 2;
  cornerAoLeft.position.set(-1.599, CEILING_Y / 2, -1.3 + 0.225);
  roomGroup.add(floorAoBack, floorAoLeftPivot, cornerAoBack, cornerAoLeft);

  // ---------- Jendela + berkas cahaya ----------
  const windowGroup = new THREE.Group();
  windowGroup.position.set(0.75, 1.3, -1.27);
  const windowFrameMat = std(COLORS.windowFrame, 0.5);
  const sill = mesh(rounded(1.05, 0.05, 0.1, 0.015), windowFrameMat);
  sill.position.set(0, -0.42, 0.03);
  const glassPane = mesh(
    new THREE.PlaneGeometry(0.84, 0.7),
    std(COLORS.windowGlass, 0.2, { emissive: new THREE.Color("#FFF1D6"), emissiveIntensity: 0.55 }),
    false,
    false
  );
  glassPane.position.z = -0.005;
  windowGroup.add(sill, glassPane);
  const bars: [number, number, number, number][] = [
    [0.94, 0.05, 0, 0.375],
    [0.94, 0.05, 0, -0.375],
    [0.05, 0.8, 0.445, 0],
    [0.05, 0.8, -0.445, 0],
    [0.03, 0.7, 0, 0],
    [0.84, 0.03, 0, 0],
  ];
  for (const [w, h, x, y] of bars) {
    const bar = mesh(rounded(w, h, 0.05, 0.01), windowFrameMat, false, true);
    bar.position.set(x, y, 0.01);
    windowGroup.add(bar);
  }
  roomGroup.add(windowGroup);

  const beamTex = track(lightBeamTexture());
  const beamMat = new THREE.MeshBasicMaterial({
    map: beamTex,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.7), beamMat);
  beam.position.set(0.8, 0.66, -0.74);
  beam.rotation.x = Math.atan2(-1.05, 1.3);
  const sunPatch = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.7),
    new THREE.MeshBasicMaterial({ color: "#FFE9C4", transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  sunPatch.rotation.x = -Math.PI / 2;
  sunPatch.position.set(0.85, 0.004, -0.2);
  roomGroup.add(beam, sunPatch);

  // ---------- Karpet ----------
  const rug = mesh(new THREE.PlaneGeometry(1.7, 1.15), std("#FFFFFF", 1, { map: track(rugTexture()) }), false, true);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.2, 0.004, 0.3);
  roomGroup.add(rug);

  // ---------- Meja jati ----------
  const teak = std(COLORS.teak, 0.55);
  // Material khusus papan & apron meja agar bisa dibuat agak tembus pandang saat karakter berlindung di bawahnya.
  const tableTopMat = std(COLORS.teak, 0.55, { transparent: false, opacity: 1 });
  const apronMat = std(COLORS.teakDark, 0.6, { transparent: false, opacity: 1 });
  const table = new THREE.Group();
  const tableTop = mesh(rounded(1.1, 0.06, 0.66, 0.02), tableTopMat);
  tableTop.position.y = TABLE_TOP_Y - 0.03;
  table.add(tableTop);
  const tableLegGeo = rounded(0.06, TABLE_TOP_Y - 0.06, 0.06, 0.012);
  for (const [lx, lz] of [[-0.48, -0.26], [0.48, -0.26], [-0.48, 0.26], [0.48, 0.26]] as const) {
    const leg = mesh(tableLegGeo, teak);
    leg.position.set(lx, (TABLE_TOP_Y - 0.06) / 2, lz);
    table.add(leg);
  }
  const apron = mesh(rounded(0.9, 0.06, 0.48, 0.01), apronMat);
  apron.position.y = TABLE_TOP_Y - 0.09;
  table.add(apron);
  table.position.set(TABLE_BASE.x, 0, TABLE_BASE.z);
  roomGroup.add(table);

  // ---------- Kursi berbantalan ----------
  const chair = new THREE.Group();
  const seat = mesh(rounded(0.44, 0.04, 0.42, 0.012), teak);
  seat.position.y = 0.44;
  const cushion = mesh(rounded(0.4, 0.06, 0.38, 0.028, 3), std(COLORS.fabric, 0.95));
  cushion.position.y = 0.49;
  const backRest = mesh(rounded(0.42, 0.2, 0.04, 0.015), teak);
  backRest.position.set(0, 0.8, -0.19);
  chair.add(seat, cushion, backRest);
  const chairLegGeo = rounded(0.04, 0.44, 0.04, 0.01);
  for (const [cx, cz] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]] as const) {
    const leg = mesh(chairLegGeo, teak);
    leg.position.set(cx, 0.22, cz);
    chair.add(leg);
  }
  const postGeo = rounded(0.04, 0.42, 0.04, 0.01);
  for (const px of [-0.18, 0.18]) {
    const post = mesh(postGeo, teak);
    post.position.set(px, 0.67, -0.19);
    chair.add(post);
  }
  chair.position.set(CHAIR_BASE.x, 0, CHAIR_BASE.z);
  chair.rotation.y = CHAIR_BASE.yaw;
  roomGroup.add(chair);

  // ---------- Gelas & piring (bisa jatuh dan menggelinding) ----------
  const glassOuter = new THREE.Group();
  const glassInner = new THREE.Group();
  glassOuter.add(glassInner);
  const glassBody = mesh(
    new THREE.LatheGeometry(
      [new THREE.Vector2(0, 0), new THREE.Vector2(0.038, 0), new THREE.Vector2(0.045, 0.13), new THREE.Vector2(0.043, 0.13)],
      20
    ),
    std("#EAF3F5", 0.08, { transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  glassBody.position.y = -0.065;
  const water = mesh(new THREE.CylinderGeometry(0.039, 0.036, 0.07, 20), std("#BFDCE6", 0.1, { transparent: true, opacity: 0.55 }), false, false);
  water.position.y = -0.03;
  glassInner.add(glassBody, water);
  roomGroup.add(glassOuter);

  const plate = mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.016, 28), std(COLORS.ceramic, 0.35));
  roomGroup.add(plate);

  // ---------- Rak dinding, buku, vas aksen ----------
  const shelfBoard = mesh(rounded(1.0, 0.05, 0.24, 0.012), teak);
  shelfBoard.position.set(SHELF.x, SHELF.y, SHELF.z);
  roomGroup.add(shelfBoard);
  for (const bx of [-0.35, 0.35]) {
    const bracket = mesh(rounded(0.03, 0.14, 0.18, 0.008), std(COLORS.teakDark, 0.6));
    bracket.position.set(SHELF.x + bx, SHELF.y - 0.09, SHELF.z - 0.02);
    roomGroup.add(bracket);
  }

  const bookRand = createSeededRandom(911);
  const books: { mesh: THREE.Mesh; start: THREE.Vector3; lean: number; restY: number; drift: { x: number; z: number }; spin: number }[] = [];
  let bookX = SHELF.x - 0.44;
  for (let i = 0; i < SHELF_BOOK_COUNT; i++) {
    const w = 0.045 + bookRand() * 0.03;
    const h = 0.18 + bookRand() * 0.08;
    const color = COLORS.books[i % COLORS.books.length]!;
    const book = mesh(rounded(w, h, 0.16, 0.008), std(color, color === COLORS.accent ? 0.45 : 0.8));
    const lean = i === SHELF_BOOK_COUNT - 1 ? -0.22 : 0;
    const start = new THREE.Vector3(bookX + w / 2 + (lean ? 0.03 : 0), SHELF.topY + h / 2 - (lean ? 0.01 : 0), SHELF.z + 0.01);
    book.position.copy(start);
    book.rotation.z = lean;
    books.push({
      mesh: book,
      start,
      lean,
      restY: w / 2,
      drift: { x: (bookRand() - 0.5) * 0.3, z: 0.38 + bookRand() * 0.25 },
      spin: (bookRand() - 0.5) * 1.6,
    });
    roomGroup.add(book);
    bookX += w + 0.01;
  }

  const vase = mesh(
    new THREE.LatheGeometry(
      [new THREE.Vector2(0, 0), new THREE.Vector2(0.05, 0), new THREE.Vector2(0.07, 0.07), new THREE.Vector2(0.04, 0.17), new THREE.Vector2(0.05, 0.2)],
      24
    ),
    std(COLORS.accent, 0.35)
  );
  vase.position.set(SHELF.x + 0.36, SHELF.topY, SHELF.z + 0.02);
  roomGroup.add(vase);

  // ---------- Jam dinding & bingkai foto (berayun dari paku, bisa jatuh) ----------
  const clockPivot = new THREE.Group();
  const clockBody = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 36), [
    std(COLORS.clockRim, 0.5),
    std("#FFFFFF", 0.6, { map: track(clockFaceTexture()) }),
    std(COLORS.clockRim, 0.5),
  ]);
  clockBody.rotation.x = Math.PI / 2;
  clockBody.position.y = -0.16;
  clockPivot.add(clockBody);
  const clockStart = new THREE.Vector3(CLOCK_NAIL.x, CLOCK_NAIL.y, CLOCK_NAIL.z);
  clockPivot.position.copy(clockStart);
  roomGroup.add(clockPivot);

  const framePivot = new THREE.Group();
  const frameBody = mesh(rounded(0.04, 0.5, 0.64, 0.012), std(COLORS.frameWood, 0.6));
  frameBody.position.y = -0.27;
  const picture = mesh(new THREE.PlaneGeometry(0.54, 0.4), std("#FFFFFF", 0.85, { map: track(pictureTexture()) }), false, true);
  picture.rotation.y = Math.PI / 2;
  picture.position.set(0.021, -0.27, 0);
  framePivot.add(frameBody, picture);
  const frameStart = new THREE.Vector3(FRAME_NAIL.x, FRAME_NAIL.y, FRAME_NAIL.z);
  framePivot.position.copy(frameStart);
  roomGroup.add(framePivot);

  // ---------- Lampu gantung (bandul) ----------
  const canopy = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.03, 20), std(COLORS.lampShade, 0.5), false, false);
  canopy.position.set(0.3, CEILING_Y - 0.015, 0.15);
  roomGroup.add(canopy);
  const lampPivot = new THREE.Group();
  lampPivot.position.set(0.3, CEILING_Y - 0.03, 0.15);
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.62, 6), std(COLORS.clockRim, 0.6), true, false);
  cord.position.y = -0.31;
  const shade = mesh(
    new THREE.ConeGeometry(0.2, 0.18, 32, 1, true),
    std(COLORS.lampShade, 0.55, { side: THREE.DoubleSide })
  );
  shade.position.y = -0.68;
  const bulb = mesh(
    new THREE.SphereGeometry(0.045, 16, 12),
    std(COLORS.bulb, 0.3, { emissive: new THREE.Color(COLORS.bulb), emissiveIntensity: 2.2 }),
    false,
    false
  );
  bulb.position.y = -0.74;
  const bulbLight = new THREE.PointLight("#FFD9A0", 0.9, 3.2, 2);
  bulbLight.position.y = -0.78;
  lampPivot.add(cord, shade, bulb, bulbLight);
  roomGroup.add(lampPivot);

  // ---------- Tanaman pot dekat jendela ----------
  const plantBase = new THREE.Group();
  plantBase.position.set(1.28, 0, -0.95);
  const pot = mesh(
    new THREE.LatheGeometry(
      [new THREE.Vector2(0, 0), new THREE.Vector2(0.1, 0), new THREE.Vector2(0.13, 0.26), new THREE.Vector2(0.14, 0.27)],
      24
    ),
    std(COLORS.pot, 0.85)
  );
  const soil = mesh(new THREE.CircleGeometry(0.125, 20), std(COLORS.soil, 1), false, true);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.25;
  plantBase.add(pot, soil);
  const plantPivot = new THREE.Group();
  plantPivot.position.y = 0.25;
  const leafRand = createSeededRandom(77);
  const leafGeo = new THREE.SphereGeometry(0.09, 12, 8);
  for (let i = 0; i < 9; i++) {
    const leaf = mesh(leafGeo, std(i % 2 ? COLORS.leafA : COLORS.leafB, 0.7));
    const angle = (i / 9) * Math.PI * 2 + leafRand() * 0.4;
    const height = 0.14 + leafRand() * 0.32;
    leaf.scale.set(0.5, 1.6, 0.22);
    leaf.position.set(Math.cos(angle) * 0.09, height, Math.sin(angle) * 0.09);
    leaf.rotation.set(Math.sin(angle) * 0.6, -angle, Math.cos(angle) * 0.6);
    plantPivot.add(leaf);
  }
  plantBase.add(plantPivot);
  roomGroup.add(plantBase);

  // ---------- Retakan dinding (MMI VIII ke atas) ----------
  const crackMaterials = [crackTexture(1307), crackTexture(4409)].map(
    (tex) =>
      new THREE.MeshStandardMaterial({
        map: track(tex),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        roughness: 1,
      })
  );
  const crackBack = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), crackMaterials[0]!);
  crackBack.position.set(0.05, 1.55, -1.298);
  const crackLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), crackMaterials[1]!);
  crackLeft.rotation.y = Math.PI / 2;
  crackLeft.position.set(-1.598, 1.5, -0.55);
  crackBack.visible = crackLeft.visible = false;
  roomGroup.add(crackBack, crackLeft);

  // ---------- Debu dari langit-langit (MMI IX ke atas) ----------
  const dustRand = createSeededRandom(2024);
  const dustBase = new Float32Array(DUST_COUNT * 3);
  const dustSpeed = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    dustBase[i * 3] = -1.45 + dustRand() * 2.9;
    dustBase[i * 3 + 1] = dustRand() * CEILING_Y;
    dustBase[i * 3 + 2] = -1.15 + dustRand() * 2.3;
    dustSpeed[i] = 0.25 + dustRand() * 0.35;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustBase.slice(), 3));
  const dustMat = new THREE.PointsMaterial({
    color: COLORS.dust,
    size: 0.03,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.visible = false;
  roomGroup.add(dust);

  // ---------- Zona bahaya lantai (rak & jendela) & karakter edukasi ----------
  const hazardMat = new THREE.MeshBasicMaterial({
    color: "#D97706",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const shelfHazard = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.62), hazardMat);
  shelfHazard.rotation.x = -Math.PI / 2;
  shelfHazard.position.set(SHELF.x, 0.005, -0.9);
  const windowHazard = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.58), hazardMat);
  windowHazard.rotation.x = -Math.PI / 2;
  windowHazard.position.set(0.75, 0.005, -0.92);
  shelfHazard.visible = windowHazard.visible = false;
  roomGroup.add(shelfHazard, windowHazard);

  const character = buildCharacter();
  let characterVisible = true;
  roomGroup.add(character.root);

  const updateTableOpacity = (opacity: number) => {
    const translucent = opacity < 0.99;
    if (tableTopMat.transparent !== translucent || Math.abs(tableTopMat.opacity - opacity) > 0.005) {
      tableTopMat.transparent = translucent;
      tableTopMat.opacity = opacity;
      tableTopMat.depthWrite = !translucent;
      tableTopMat.needsUpdate = true;

      apronMat.transparent = translucent;
      apronMat.opacity = opacity;
      apronMat.depthWrite = !translucent;
      apronMat.needsUpdate = true;
    }
  };

  // ---------- Pemetaan sampel getaran ke objek ----------
  const tmp = new THREE.Vector3();

  const apply = (
    s: VibrationFrameSample,
    elapsedSec: number,
    profile?: VibrationProfile,
    options?: CharacterSimOptions
  ): CharacterFrameState | null => {
    roomGroup.position.set(s.roomOffsetX, s.roomOffsetY, s.roomOffsetZ);
    lampPivot.rotation.set(s.lampAngleX, 0, s.lampAngleZ);
    plantPivot.rotation.set(s.plantSway * 0.5, 0, s.plantSway);

    table.position.set(TABLE_BASE.x + s.tableOffsetX, 0, TABLE_BASE.z);
    chair.position.set(CHAIR_BASE.x + s.furnitureOffsetX, 0, CHAIR_BASE.z + s.furnitureOffsetZ);
    chair.rotation.y = CHAIR_BASE.yaw + s.furnitureYaw;

    // Gelas: bergeser di meja, jatuh, lalu rebah dan menggelinding di lantai.
    tmp.set(table.position.x + GLASS_REL.x + s.glassOffsetX, TABLE_TOP_Y + 0.065, table.position.z + GLASS_REL.z);
    const g = placeFalling(glassOuter, tmp, 0.045, { x: 0.45, z: 0.12 }, s.glassFall);
    glassOuter.rotation.set(0, 0, -(Math.PI / 2) * g.airborne);
    glassInner.rotation.y = g.roll * 5;

    tmp.set(table.position.x + PLATE_REL.x + s.plateOffsetX, TABLE_TOP_Y + 0.008, table.position.z + PLATE_REL.z);
    const p = placeFalling(plate, tmp, 0.008, { x: -0.1, z: 0.62 }, s.plateFall);
    plate.rotation.set(p.airborne * 0.9 * (1 - p.roll), 0, p.airborne * 0.4 * (1 - p.roll));

    books.forEach((b, i) => {
      const prog = s.bookFall[i] ?? 0;
      if (prog <= 0) {
        b.mesh.position.set(b.start.x + s.bookJitter * (i % 2 ? 1 : -0.6), b.start.y, b.start.z);
        b.mesh.rotation.set(0, 0, b.lean + s.bookJitter * 2.5);
        return;
      }
      const r = placeFalling(b.mesh, b.start, b.restY, b.drift, prog);
      b.mesh.rotation.set(-(Math.PI / 2) * r.airborne, b.spin * r.airborne, (Math.PI / 2) * r.airborne + b.lean * (1 - r.airborne));
    });

    // Bingkai foto: berayun di paku, lalu jatuh dan bersandar di dinding.
    const f = placeFalling(framePivot, frameStart, 0.52, { x: 0.18, z: 0.05 }, s.frameFall);
    framePivot.rotation.set(s.frameTilt * (1 - f.airborne), 0, -0.32 * f.airborne);

    const c = placeFalling(clockPivot, clockStart, 0.2, { x: 0.05, z: 0.42 }, s.clockFall);
    clockPivot.rotation.set(-(Math.PI / 2) * c.airborne, 0, s.clockTilt * (1 - c.airborne));

    for (const mat of crackMaterials) mat.opacity = s.crackOpacity;
    crackBack.visible = crackLeft.visible = s.crackOpacity > 0.001;

    dust.visible = s.dustAmount > 0.01;
    if (dust.visible) {
      dustMat.opacity = Math.min(0.85, s.dustAmount);
      const pos = dustGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < DUST_COUNT; i++) {
        const fall = (dustBase[i * 3 + 1]! + elapsedSec * dustSpeed[i]!) % CEILING_Y;
        pos.setY(i, CEILING_Y - fall);
      }
      pos.needsUpdate = true;
    }

    let charState: CharacterFrameState | null = null;
    if (profile && characterVisible) {
      charState = sampleCharacterState(elapsedSec, s, profile, options);
      character.root.visible = true;
      character.applyPose(charState, options?.dtSec);
      updateTableOpacity(charState.tableTopOpacity);
      hazardMat.opacity = charState.hazardHighlightOpacity;
      shelfHazard.visible = windowHazard.visible = charState.hazardHighlightOpacity > 0.01;
    } else {
      character.root.visible = false;
      updateTableOpacity(1);
      shelfHazard.visible = windowHazard.visible = false;
    }

    return charState;
  };

  const setCharacterVisible = (visible: boolean) => {
    characterVisible = visible;
    character.root.visible = visible;
    if (!visible) {
      updateTableOpacity(1);
      shelfHazard.visible = windowHazard.visible = false;
    }
  };

  const dispose = () => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m.dispose();
      }
    });
    for (const t of textures) t.dispose();
  };

  return { roomGroup, apply, setCharacterVisible, dispose };
}
