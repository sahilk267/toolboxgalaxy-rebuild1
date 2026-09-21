import * as THREE from "three";
import { WeaponClass } from "./types";
import { WEAPON_DEFS } from "./constants";

export interface BotVisuals {
  group: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  weaponMesh: THREE.Group;
}

// Build 3D Voxel Bot character model
export function buildBotCharacter(colorHex: string, weaponClass: WeaponClass): BotVisuals {
  const group = new THREE.Group();
  const color = new THREE.Color(colorHex);

  // Materials
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd1a4 }); // Peachy skin tone
  const shirtMat = new THREE.MeshLambertMaterial({ color: color });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1e293b }); // Dark slate
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a }); // Dark visor/eyes

  // 1. Head (0.6 x 0.6 x 0.6) - Center y = 1.95
  const headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.position.set(0, 1.95, 0);
  headMesh.castShadow = true;
  group.add(headMesh);

  // Cap / Beanie on head matching shirt
  const capGeo = new THREE.BoxGeometry(0.7, 0.25, 0.7);
  const capMesh = new THREE.Mesh(capGeo, shirtMat);
  capMesh.position.set(0, 0.25, 0);
  headMesh.add(capMesh);

  // Eyes / Visor
  const visorGeo = new THREE.BoxGeometry(0.5, 0.15, 0.1);
  const visorMesh = new THREE.Mesh(visorGeo, eyeMat);
  visorMesh.position.set(0, 0.05, 0.33);
  headMesh.add(visorMesh);

  // 2. Torso (0.8 x 0.9 x 0.45) - Center y = 1.25
  const bodyGeo = new THREE.BoxGeometry(0.8, 0.9, 0.45);
  const bodyMesh = new THREE.Mesh(bodyGeo, shirtMat);
  bodyMesh.position.set(0, 1.25, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 3. Arms
  const armGeo = new THREE.BoxGeometry(0.25, 0.85, 0.25);

  const leftArm = new THREE.Mesh(armGeo, shirtMat);
  leftArm.position.set(-0.55, 1.2, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.set(0.55, 1.2, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // 4. Legs
  const legGeo = new THREE.BoxGeometry(0.32, 0.85, 0.32);

  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.22, 0.42, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.22, 0.42, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);

  // 5. Bot Weapon in hand
  const weaponMesh = buildWorldWeapon(weaponClass);
  weaponMesh.position.set(0.45, 1.15, 0.35);
  weaponMesh.rotation.y = 0;
  group.add(weaponMesh);

  return {
    group,
    headMesh,
    bodyMesh,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponMesh,
  };
}

// Build 3D Voxel Weapon held in world
export function buildWorldWeapon(weaponClass: WeaponClass): THREE.Group {
  const weaponGroup = new THREE.Group();
  const gunMat = new THREE.MeshLambertMaterial({ color: 0x27272a }); // Matte gunmetal
  const accentMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(WEAPON_DEFS[weaponClass].primaryColor),
  });
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350f }); // Sniper/rifle wood

  if (weaponClass === "hunter") {
    // Sniper: long barrel, scope
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 1.2), woodMat);
    weaponGroup.add(body);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), gunMat);
    barrel.position.set(0, 0.04, 0.8);
    weaponGroup.add(barrel);

    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.45), accentMat);
    scope.position.set(0, 0.16, 0.05);
    weaponGroup.add(scope);
  } else if (weaponClass === "vince") {
    // Shotgun: double barrel, pump
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.9), gunMat);
    weaponGroup.add(body);

    const barrel1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), gunMat);
    barrel1.position.set(-0.04, 0.05, 0.6);
    weaponGroup.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.5), gunMat);
    barrel2.position.set(0.04, 0.05, 0.6);
    weaponGroup.add(barrel2);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.25), woodMat);
    pump.position.set(0, -0.05, 0.4);
    weaponGroup.add(pump);
  } else if (weaponClass === "run-n-gun") {
    // SMG: compact, long magazine
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.65), gunMat);
    weaponGroup.add(body);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.12), accentMat);
    mag.position.set(0, -0.22, 0.05);
    weaponGroup.add(mag);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.25), gunMat);
    barrel.position.set(0, 0.04, 0.4);
    weaponGroup.add(barrel);
  } else if (weaponClass === "detective") {
    // Revolver: cylinder, barrel
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.35), gunMat);
    weaponGroup.add(body);

    const cyl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.18), accentMat);
    cyl.position.set(0, 0.02, 0.02);
    weaponGroup.add(cyl);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.35), gunMat);
    barrel.position.set(0, 0.05, 0.3);
    weaponGroup.add(barrel);
  } else {
    // Triggerman: Assault Rifle
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.85), gunMat);
    weaponGroup.add(body);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.14), accentMat);
    mag.position.set(0, -0.18, 0.1);
    weaponGroup.add(mag);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.45), gunMat);
    barrel.position.set(0, 0.04, 0.6);
    weaponGroup.add(barrel);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), accentMat);
    sight.position.set(0, 0.13, 0.4);
    weaponGroup.add(sight);
  }

  return weaponGroup;
}

// Build First-Person Viewmodel attached to camera
export function buildFPSViewmodel(weaponClass: WeaponClass): THREE.Group {
  const viewmodel = new THREE.Group();
  const gunMat = new THREE.MeshLambertMaterial({ color: 0x18181b }); // Rich dark metal
  const accentColor = new THREE.Color(WEAPON_DEFS[weaponClass].primaryColor);
  const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
  const armMat = new THREE.MeshLambertMaterial({ color: 0xffd1a4 }); // Hands

  // Right Hand holding grip
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.2), armMat);
  handR.position.set(0.06, -0.15, -0.05);
  viewmodel.add(handR);

  if (weaponClass === "hunter") {
    // Sniper Viewmodel
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.6), woodMat);
    stock.position.set(0, 0, -0.2);
    viewmodel.add(stock);

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.5), gunMat);
    receiver.position.set(0, 0.02, 0.25);
    viewmodel.add(receiver);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.85), gunMat);
    barrel.position.set(0, 0.05, 0.85);
    viewmodel.add(barrel);

    // Sniper Scope
    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), accentMat);
    scope.position.set(0, 0.16, 0.2);
    viewmodel.add(scope);
  } else if (weaponClass === "vince") {
    // Shotgun Viewmodel
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.7), gunMat);
    receiver.position.set(0, 0, 0.15);
    viewmodel.add(receiver);

    const barrel1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), gunMat);
    barrel1.position.set(-0.045, 0.06, 0.7);
    viewmodel.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.7), gunMat);
    barrel2.position.set(0.045, 0.06, 0.7);
    viewmodel.add(barrel2);

    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.28), woodMat);
    pump.position.set(0, -0.06, 0.55);
    viewmodel.add(pump);
  } else if (weaponClass === "run-n-gun") {
    // SMG Viewmodel
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.7), gunMat);
    body.position.set(0, 0, 0.2);
    viewmodel.add(body);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.14), accentMat);
    mag.position.set(0, -0.22, 0.15);
    viewmodel.add(mag);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.35), gunMat);
    barrel.position.set(0, 0.04, 0.65);
    viewmodel.add(barrel);
  } else if (weaponClass === "detective") {
    // Revolver Viewmodel
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.15), woodMat);
    grip.position.set(0, -0.15, -0.05);
    viewmodel.add(grip);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.35), gunMat);
    frame.position.set(0, 0.02, 0.15);
    viewmodel.add(frame);

    const cylinder = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.18), accentMat);
    cylinder.position.set(0, 0.02, 0.12);
    viewmodel.add(cylinder);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.45), gunMat);
    barrel.position.set(0, 0.06, 0.45);
    viewmodel.add(barrel);
  } else {
    // Triggerman AR Viewmodel
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.4), gunMat);
    stock.position.set(0, -0.02, -0.2);
    viewmodel.add(stock);

    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.6), gunMat);
    receiver.position.set(0, 0.02, 0.2);
    viewmodel.add(receiver);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.16), accentMat);
    mag.position.set(0, -0.22, 0.25);
    mag.rotation.x = 0.15;
    viewmodel.add(mag);

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.6), gunMat);
    barrel.position.set(0, 0.05, 0.7);
    viewmodel.add(barrel);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.04), accentMat);
    sight.position.set(0, 0.15, 0.5);
    viewmodel.add(sight);
  }

  // Position on bottom-right of camera
  viewmodel.position.set(0.32, -0.28, -0.55);
  viewmodel.scale.set(0.85, 0.85, 0.85);

  return viewmodel;
}
