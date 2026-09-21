import * as THREE from "three";
import { BoxCollider } from "./types";

export interface ArenaMapData {
  scene: THREE.Scene;
  colliders: BoxCollider[];
  jumpPads: BoxCollider[];
  spawnPoints: THREE.Vector3[];
  lights: THREE.Light[];
}

export function buildKrunkerArena(scene: THREE.Scene): {
  colliders: BoxCollider[];
  jumpPads: BoxCollider[];
  spawnPoints: THREE.Vector3[];
} {
  const colliders: BoxCollider[] = [];
  const jumpPads: BoxCollider[] = [];

  // 1. Procedural Grid Textures for crisp Voxel / Krunker look
  const createBlockCanvas = (baseColor: string, borderColor: string, size = 64) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size - 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  };

  const groundTex = createBlockCanvas("#d4b886", "#bca06c", 64);
  groundTex.repeat.set(50, 50);

  const wallTex = createBlockCanvas("#c49a6c", "#a87e50", 64);
  wallTex.repeat.set(4, 4);

  const stoneTex = createBlockCanvas("#78716c", "#57534e", 64);
  stoneTex.repeat.set(2, 2);

  const crateTex = createBlockCanvas("#9a6438", "#633816", 64);
  crateTex.repeat.set(1, 1);

  // Materials
  const groundMat = new THREE.MeshLambertMaterial({
    map: groundTex,
  });

  const wallMat = new THREE.MeshLambertMaterial({
    map: wallTex,
  });

  const stoneMat = new THREE.MeshLambertMaterial({
    map: stoneTex,
  });

  const crateWoodMat = new THREE.MeshLambertMaterial({
    map: crateTex,
  });

  const containerRedMat = new THREE.MeshLambertMaterial({
    color: 0xd9383a,
  });

  const containerBlueMat = new THREE.MeshLambertMaterial({
    color: 0x2563eb,
  });

  const containerGreenMat = new THREE.MeshLambertMaterial({
    color: 0x059669,
  });

  const jumpPadMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });

  // Helper to add BoxCollider and Mesh
  const addSolidBox = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    castShadow = true,
    receiveShadow = true
  ): THREE.Mesh => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    scene.add(mesh);

    const min = new THREE.Vector3(x - w / 2, y, z - d / 2);
    const max = new THREE.Vector3(x + w / 2, y + h, z + d / 2);
    colliders.push({ min, max, mesh });
    return mesh;
  };

  // Helper to add Jump Pad
  const addJumpPad = (x: number, y: number, z: number, w = 3.5, d = 3.5, jumpForce = 25.0) => {
    const geo = new THREE.BoxGeometry(w, 0.3, d);
    const mesh = new THREE.Mesh(geo, jumpPadMat);
    mesh.position.set(x, y + 0.15, z);
    scene.add(mesh);

    const min = new THREE.Vector3(x - w / 2, y, z - d / 2);
    const max = new THREE.Vector3(x + w / 2, y + 1.2, z + d / 2);
    const pad: BoxCollider = { min, max, mesh, isJumpPad: true, jumpForce };
    colliders.push(pad);
    jumpPads.push(pad);
  };

  // Helper for crates
  const addCrate = (x: number, y: number, z: number, s = 2.5) => {
    addSolidBox(x, y, z, s, s, s, crateWoodMat);
  };

  // 2. Base Arena Ground (110x110)
  const floorGeo = new THREE.PlaneGeometry(120, 120);
  const floorMesh = new THREE.Mesh(floorGeo, groundMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Bottom boundary plane collider
  colliders.push({
    min: new THREE.Vector3(-60, -2, -60),
    max: new THREE.Vector3(60, 0, 60),
  });

  // 3. Perimeter Fortress Walls (Height 14m)
  const wallH = 14;
  const mapR = 52;
  // North wall
  addSolidBox(0, 0, -mapR, 108, wallH, 4, wallMat);
  // South wall
  addSolidBox(0, 0, mapR, 108, wallH, 4, wallMat);
  // West wall
  addSolidBox(-mapR, 0, 0, 4, wallH, 108, wallMat);
  // East wall
  addSolidBox(mapR, 0, 0, 4, wallH, 108, wallMat);

  // 4. Central Courtyard & Monument (Burg style)
  // Central monument platform
  addSolidBox(0, 0, 0, 10, 1.2, 10, stoneMat);
  addSolidBox(0, 1.2, 0, 5, 2.5, 5, stoneMat);
  addSolidBox(0, 3.7, 0, 2.5, 4.0, 2.5, stoneMat);

  // Low barricades around center
  addSolidBox(0, 0, -8, 8, 1.4, 1.2, stoneMat);
  addSolidBox(0, 0, 8, 8, 1.4, 1.2, stoneMat);
  addSolidBox(-8, 0, 0, 1.2, 1.4, 8, stoneMat);
  addSolidBox(8, 0, 0, 1.2, 1.4, 8, stoneMat);

  // 5. Four Corner Fortresses with high vantage walkways
  // North-West Fortress (-30, -30)
  addSolidBox(-32, 0, -32, 16, 7.5, 16, stoneMat);
  // NW Upper walkway
  addSolidBox(-32, 7.5, -32, 14, 1.2, 14, stoneMat);
  // Ramp leading to NW Fortress
  for (let i = 0; i < 7; i++) {
    addSolidBox(-22 - i * 1.4, 0, -32, 1.4, (i + 1) * 1.05, 5, stoneMat);
  }

  // South-East Fortress (32, 32)
  addSolidBox(32, 0, 32, 16, 7.5, 16, stoneMat);
  addSolidBox(32, 7.5, 32, 14, 1.2, 14, stoneMat);
  // Ramp leading to SE Fortress
  for (let i = 0; i < 7; i++) {
    addSolidBox(22 + i * 1.4, 0, 32, 1.4, (i + 1) * 1.05, 5, stoneMat);
  }

  // North-East Vantage Structure (32, -32)
  addSolidBox(32, 0, -32, 14, 6.0, 14, wallMat);
  // Arch tunnel through NE
  addSolidBox(32, 0, -38, 14, 6.0, 4, wallMat);
  addSolidBox(32, 0, -26, 14, 6.0, 4, wallMat);
  addSolidBox(32, 6.0, -32, 14, 1.5, 16, stoneMat);

  // South-West Structure (-32, 32)
  addSolidBox(-32, 0, 32, 14, 6.0, 14, wallMat);
  addSolidBox(-32, 6.0, 32, 14, 1.5, 14, stoneMat);

  // 6. High Bridge / Catwalk connecting across center
  addSolidBox(-18, 5.5, 0, 16, 1.0, 4, stoneMat);
  addSolidBox(18, 5.5, 0, 16, 1.0, 4, stoneMat);

  // 7. Cargo Containers (tactical alleyways)
  // Red container at (14, -14)
  addSolidBox(15, 0, -15, 4, 3.8, 10, containerRedMat);
  // Blue container at (-15, 15)
  addSolidBox(-15, 0, 15, 10, 3.8, 4, containerBlueMat);
  // Green container stack at (-20, -10)
  addSolidBox(-20, 0, -10, 4, 3.8, 10, containerGreenMat);
  addSolidBox(-20, 3.8, -10, 4, 3.8, 8, containerRedMat);
  // Blue container at (20, 10)
  addSolidBox(20, 0, 10, 10, 3.8, 4, containerBlueMat);

  // 8. Voxel Wooden Crates (Stashes & Cover)
  // Center cluster
  addCrate(-5, 0, -4, 2.5);
  addCrate(-5, 2.5, -4, 2.2);
  addCrate(5, 0, 5, 2.5);
  addCrate(7.5, 0, 5, 2.5);
  addCrate(6.2, 2.5, 5, 2.4);

  // West corridor crates
  addCrate(-42, 0, -15, 2.5);
  addCrate(-42, 0, -12.5, 2.5);
  addCrate(-42, 2.5, -13.7, 2.5);
  addCrate(-42, 0, 15, 2.5);

  // East corridor crates
  addCrate(42, 0, -15, 2.5);
  addCrate(42, 0, 15, 2.5);
  addCrate(42, 0, 17.5, 2.5);
  addCrate(42, 2.5, 16.2, 2.5);

  // North & South crates
  addCrate(0, 0, -32, 2.8);
  addCrate(3, 0, -32, 2.8);
  addCrate(0, 0, 32, 2.8);
  addCrate(-3, 0, 32, 2.8);

  // 9. Jump Pads for High-Flying Action (Iconic Krunker element)
  // Jump pad near center North
  addJumpPad(0, 0, -18, 3.2, 3.2, 26.0);
  // Jump pad near center South
  addJumpPad(0, 0, 18, 3.2, 3.2, 26.0);
  // Jump pad on East
  addJumpPad(28, 0, 0, 3.2, 3.2, 25.0);
  // Jump pad on West
  addJumpPad(-28, 0, 0, 3.2, 3.2, 25.0);

  // 10. Ambient & Sun Lighting
  const ambientLight = new THREE.AmbientLight(0xfffaed, 0.75);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff3db, 1.2);
  sunLight.position.set(45, 65, 35);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 180;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 60;
  sunLight.shadow.camera.bottom = -60;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Subtle atmospheric fog for scale and depth
  scene.fog = new THREE.FogExp2(0xd6c29b, 0.008);
  scene.background = new THREE.Color(0x93c5fd); // Clear sunny sky blue

  // Spawn points list
  const spawnPoints: THREE.Vector3[] = [
    new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(-32, 1.5, -15),
    new THREE.Vector3(32, 1.5, -15),
    new THREE.Vector3(-32, 1.5, 15),
    new THREE.Vector3(32, 1.5, 15),
    new THREE.Vector3(0, 1.5, -36),
    new THREE.Vector3(0, 1.5, 36),
    new THREE.Vector3(-38, 1.5, 0),
    new THREE.Vector3(38, 1.5, 0),
    new THREE.Vector3(32, 9.0, 32), // High SE tower
    new THREE.Vector3(-32, 9.0, -32), // High NW tower
  ];

  return { colliders, jumpPads, spawnPoints };
}
