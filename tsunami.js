// ============================================================
// IMMERSIVE TSUNAMI PHYSICS EXHIBIT
// A-Frame + Three.js
// Features: Spatial audio, atmospheric transitions, alarm
// system, multi-layered wave physics, particle systems,
// cinematic camera, live data readouts.
// ============================================================

// ============================================================
// PROCEDURAL SAND TEXTURE
// ============================================================

function createSandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(canvas.width, canvas.height);

  for (let i = 0; i < image.data.length; i += 4) {
    const noise = Math.random() * 22;
    const base = 184 + noise;
    image.data[i]     = Math.min(255, base + 28);
    image.data[i + 1] = Math.min(255, base + 8);
    image.data[i + 2] = Math.max(0, base - 65);
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  // Fine grain
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2;
    ctx.fillStyle = `rgba(80,55,25,${Math.random() * 0.18})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft patches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 6 + Math.random() * 20;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(90,65,35,0.14)');
    gradient.addColorStop(1, 'rgba(90,65,35,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(15, 15);
  texture.anisotropy = 2;
  return texture;
}

// ============================================================
// WATER TEXTURE
// ============================================================

function createWaterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0b5c91';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 50; i++) {
    const y = Math.random() * canvas.height;
    ctx.strokeStyle = `rgba(100,210,245,${0.025 + Math.random() * 0.04})`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= canvas.width; x += 20) {
      const wave = Math.sin(x * 0.025 + i) * 4;
      ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 9);
  return texture;
}

// ============================================================
// APPLY TEXTURES
// ============================================================

function applyTextures() {
  const sandTexture = createSandTexture();
  const waterTexture = createWaterTexture();

  const floor = document.querySelector('#seafloor');
  if (floor) {
    const mesh = floor.getObject3D('mesh');
    if (mesh && mesh.material) {
      mesh.material.map = sandTexture;
      mesh.material.color.set('#d7b66a');
      mesh.material.roughness = 1;
      mesh.material.needsUpdate = true;
    }
  }

  const ocean = document.querySelector('#ocean-grid');
  if (ocean) {
    const mesh = ocean.getObject3D('mesh');
    if (mesh && mesh.material) {
      mesh.material.map = waterTexture;
      mesh.material.color.set('#0a4d8f');
      mesh.material.transparent = true;
      mesh.material.opacity = 0.72;
      mesh.material.roughness = 0.28;
      mesh.material.metalness = 0.05;
      mesh.material.needsUpdate = true;
    }
  }
}

// ============================================================
// MOUNTAIN TERRAIN (behind camera)
// ============================================================

function createMountainTerrain() {
  const scene = document.querySelector('a-scene');
  if (!scene) return;

  const group = new THREE.Group();
  group.name = 'mountain-terrain';

  const mountainColors = [0x4a6741, 0x3d5a35, 0x556b4e, 0x2d4a25, 0x3a5c32, 0x4e7345];
  const snowColor = 0xe8e0d4;
  const rockColor = 0x6b5d50;

  const peaks = [
    { x: -22, z: 22, r: 9,  h: 20, segments: 7 },
    { x: -8,  z: 28, r: 7,  h: 16, segments: 6 },
    { x: 5,   z: 24, r: 11, h: 26, segments: 8 },
    { x: 18,  z: 26, r: 8,  h: 18, segments: 6 },
    { x: -18, z: 38, r: 12, h: 30, segments: 8 },
    { x: -3,  z: 40, r: 14, h: 35, segments: 9 },
    { x: 14,  z: 36, r: 10, h: 28, segments: 7 },
    { x: 28,  z: 32, r: 8,  h: 22, segments: 6 },
    { x: -28, z: 34, r: 9,  h: 24, segments: 7 },
    { x: 35,  z: 28, r: 7,  h: 19, segments: 6 },
    { x: -32, z: 42, r: 10, h: 20, segments: 7 },
    { x: 0,   z: 50, r: 16, h: 40, segments: 9 },
    { x: 22,  z: 48, r: 12, h: 32, segments: 8 },
    { x: -15, z: 52, r: 11, h: 28, segments: 7 },
  ];

  peaks.forEach((p, i) => {
    const geo = new THREE.ConeGeometry(p.r, p.h, p.segments);
    const color = mountainColors[i % mountainColors.length];
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true
    });
    const mountain = new THREE.Mesh(geo, mat);
    mountain.position.set(p.x, -1.32 + p.h / 2, p.z);
    mountain.rotation.y = Math.random() * Math.PI;
    group.add(mountain);

    if (p.h > 18) {
      const snowH = p.h * 0.22;
      const snowGeo = new THREE.ConeGeometry(p.r * 0.32, snowH, 5);
      const snowMat = new THREE.MeshStandardMaterial({
        color: snowColor,
        roughness: 0.75,
        metalness: 0.05,
        flatShading: true
      });
      const snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.set(p.x, -1.32 + p.h - snowH / 2 + 1.0, p.z);
      snow.rotation.y = Math.random() * Math.PI;
      group.add(snow);
    }

    const rockGeo = new THREE.CylinderGeometry(p.r * 1.1, p.r * 1.3, p.h * 0.15, p.segments);
    const rockMat = new THREE.MeshStandardMaterial({
      color: rockColor,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(p.x, -1.32 + p.h * 0.075, p.z);
    group.add(rock);
  });

  // Lower backfill ridges
  const ridges = [
    { x: -40, z: 30, r: 14, h: 12 },
    { x: -10, z: 32, r: 10, h: 10 },
    { x: 20,  z: 30, r: 12, h: 11 },
    { x: 40,  z: 35, r: 13, h: 13 },
    { x: -25, z: 45, r: 15, h: 14 },
    { x: 10,  z: 46, r: 13, h: 12 },
    { x: 30,  z: 42, r: 11, h: 10 },
    { x: -35, z: 50, r: 14, h: 15 },
  ];

  ridges.forEach((p) => {
    const geo = new THREE.ConeGeometry(p.r, p.h, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3b5430,
      roughness: 0.98,
      metalness: 0.01,
      flatShading: true
    });
    const ridge = new THREE.Mesh(geo, mat);
    ridge.position.set(p.x, -1.32 + p.h / 2, p.z);
    ridge.rotation.y = Math.random() * Math.PI;
    group.add(ridge);
  });

  // Connecting ground plane (behind)
  const groundGeo = new THREE.PlaneGeometry(120, 60);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x3d5a35,
    roughness: 1.0,
    metalness: 0.0
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -1.33, 38);
  group.add(ground);

  // ============================================================
  // LEFT & RIGHT SIDE ENVIRONMENT (fills empty sky flanks)
  // ============================================================
  const sideColors = [0x3a5c32, 0x4a6741, 0x2d4a25, 0x556b4e, 0x3d5a35, 0x4e7345, 0x2f4a28];
  const sideRock = 0x5c5044;

  // Helper to add a side peak / hill
  function addSideHill(x, z, r, h, segs, colorIdx) {
    const geo = new THREE.ConeGeometry(r, h, segs || 6);
    const mat = new THREE.MeshStandardMaterial({
      color: sideColors[colorIdx % sideColors.length],
      roughness: 0.96,
      metalness: 0.02,
      flatShading: true
    });
    const hill = new THREE.Mesh(geo, mat);
    hill.position.set(x, -1.32 + h / 2, z);
    hill.rotation.y = Math.random() * Math.PI;
    group.add(hill);

    // Rock base for taller ones
    if (h > 10) {
      const rockGeo = new THREE.CylinderGeometry(r * 1.05, r * 1.25, h * 0.18, segs || 6);
      const rockMat = new THREE.MeshStandardMaterial({
        color: sideRock,
        roughness: 1.0,
        metalness: 0.0,
        flatShading: true
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, -1.32 + h * 0.09, z);
      group.add(rock);
    }
  }

  // ----- LEFT SIDE range (negative X) -----
  // Near-coast bluffs
  addSideHill(-28, -8,  6.5, 9,  6, 0);
  addSideHill(-34, -2,  8,  12, 7, 1);
  addSideHill(-30,  6,  7,  11, 6, 2);
  addSideHill(-38,  4,  9,  14, 7, 3);
  addSideHill(-26, 12,  5.5, 8,  5, 4);
  // Mid-distance hills
  addSideHill(-42, -12, 10, 16, 7, 5);
  addSideHill(-48,  2,  12, 20, 8, 0);
  addSideHill(-45, 14,  9,  15, 6, 1);
  addSideHill(-52, -6,  11, 18, 7, 2);
  addSideHill(-40, 22,  8,  13, 6, 3);
  // Far left peaks (fill sky when looking left)
  addSideHill(-58,  8,  14, 26, 8, 4);
  addSideHill(-62, -4,  12, 22, 7, 5);
  addSideHill(-55, 20,  13, 24, 8, 0);
  addSideHill(-65, 12,  10, 19, 6, 1);
  addSideHill(-50, 30,  11, 17, 7, 2);

  // ----- RIGHT SIDE range (positive X) -----
  // Near-coast bluffs
  addSideHill(28,  -6,  6,  9,  6, 3);
  addSideHill(33,   1,  7.5, 11, 7, 4);
  addSideHill(29,   9,  6.5, 10, 6, 5);
  addSideHill(37,   5,  8.5, 13, 7, 0);
  addSideHill(25,  14,  5,  8,  5, 1);
  // Mid-distance hills
  addSideHill(43, -10, 10, 15, 7, 2);
  addSideHill(49,  3,  11, 19, 8, 3);
  addSideHill(46, 16,  9,  14, 6, 4);
  addSideHill(54, -5,  12, 21, 7, 5);
  addSideHill(41, 24,  8,  12, 6, 0);
  // Far right peaks
  addSideHill(60,  7,  13, 25, 8, 1);
  addSideHill(64, -3,  11, 20, 7, 2);
  addSideHill(57, 18,  14, 27, 8, 3);
  addSideHill(68, 11,  10, 18, 6, 4);
  addSideHill(52, 28,  12, 16, 7, 5);

  // Side ground strips so hills sit on land instead of floating over sky
  const sideGroundMat = new THREE.MeshStandardMaterial({
    color: 0x354f2e,
    roughness: 1.0,
    metalness: 0.0
  });

  // Left coastal land
  const leftLand = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 90),
    sideGroundMat
  );
  leftLand.rotation.x = -Math.PI / 2;
  leftLand.position.set(-42, -1.34, 8);
  group.add(leftLand);

  // Right coastal land
  const rightLand = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 90),
    sideGroundMat
  );
  rightLand.rotation.x = -Math.PI / 2;
  rightLand.position.set(42, -1.34, 8);
  group.add(rightLand);

  // Extra far side ridges for depth when looking left/right
  const farSideRidges = [
    { x: -70, z: 0,  r: 16, h: 14 },
    { x: -72, z: 18, r: 14, h: 12 },
    { x: -68, z: -12, r: 15, h: 13 },
    { x: 70,  z: 2,  r: 15, h: 13 },
    { x: 73,  z: 16, r: 13, h: 11 },
    { x: 69,  z: -10, r: 14, h: 12 },
  ];
  farSideRidges.forEach((p, i) => {
    const geo = new THREE.ConeGeometry(p.r, p.h, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a3f24,
      roughness: 0.98,
      metalness: 0.01,
      flatShading: true
    });
    const ridge = new THREE.Mesh(geo, mat);
    ridge.position.set(p.x, -1.32 + p.h / 2, p.z);
    ridge.rotation.y = Math.random() * Math.PI;
    group.add(ridge);
  });

  scene.object3D.add(group);
}

// ============================================================
// GEOLOGICAL CRACKS
// ============================================================

function createCrackSystem() {
  const group = document.querySelector('#cracks');
  if (!group || !group.object3D) return;

  const crackObject = new THREE.Group();
  crackObject.name = 'geological-fractures';
  group.object3D.add(crackObject);

  // Solid black fissure body
  const crackMaterial = new THREE.MeshStandardMaterial({
    color: 000000 ,
    roughness: 1,
    metalness: 0,
    emissive: 000000 ,
    emissiveIntensity: 0
  });

  // Red magma / energy glow inside the crack
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 000000 ,
    emissive: 000000 ,
    emissiveIntensity: 1.8,
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity: 0.95
  });

  // Soft red light halo (slightly wider, dimmer)
  const haloMaterial = new THREE.MeshStandardMaterial({
    color: 000000 ,
    emissive: 000000 ,
    emissiveIntensity: 0.9,
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  });

  function addSegment(x, z, angle, length, width) {
    // Dark outer walls of the fissure
    const bodyGeo = new THREE.BoxGeometry(width, 0.06, length);
    const body = new THREE.Mesh(bodyGeo, crackMaterial);
    body.position.set(x, 0.01, z);
    body.rotation.y = angle;
    crackObject.add(body);

    // Bright red core
    const coreW = Math.max(width * 0.35, 0.04);
    const coreGeo = new THREE.BoxGeometry(coreW, 0.045, length * 0.96);
    const core = new THREE.Mesh(coreGeo, glowMaterial);
    core.position.set(x, 0.035, z);
    core.rotation.y = angle;
    crackObject.add(core);

    // Soft emissive halo sitting just above the fissure
    const haloGeo = new THREE.BoxGeometry(width * 1.35, 0.02, length * 0.98);
    const halo = new THREE.Mesh(haloGeo, haloMaterial);
    halo.position.set(x, 0.055, z);
    halo.rotation.y = angle;
    crackObject.add(halo);
  }

  // Build one continuous jagged crack path with optional side branches
  function buildFracture(startX, startZ, startAngle, segments, baseWidth, branchChance) {
    let cx = startX;
    let cz = startZ;
    let angle = startAngle;
    let width = baseWidth;

    for (let step = 0; step < segments; step++) {
      const length = 1.4 + Math.random() * 2.2;
      addSegment(cx, cz, angle, length, width);

      // Advance along the segment
      cx += Math.sin(angle) * length * 0.92;
      cz += Math.cos(angle) * length * 0.92;

      // Natural meander — tight turns, not random scatter
      angle += (Math.random() - 0.5) * 0.7;
      // Taper as the crack runs outward
      width = Math.max(0.06, width * (0.82 + Math.random() * 0.1));

      // Occasional side branch (looks like real fracture networks)
      if (Math.random() < branchChance && step > 0 && step < segments - 1) {
        const branchAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.7);
        let bx = cx;
        let bz = cz;
        let bw = width * 0.7;
        const branchSegs = 2 + Math.floor(Math.random() * 3);
        for (let b = 0; b < branchSegs; b++) {
          const bl = 0.9 + Math.random() * 1.6;
          addSegment(bx, bz, branchAngle + (Math.random() - 0.5) * 0.35, bl, bw);
          bx += Math.sin(branchAngle) * bl * 0.9;
          bz += Math.cos(branchAngle) * bl * 0.9;
          bw *= 0.75;
        }
      }
    }
  }

  // Main fault-parallel fractures (along the epicenter zone)
  // Local space of #cracks is scaled; origin sits near the fault
  const mains = [
    { x: -12, z: -1.5, angle: 0.05, segs: 8, w: 0.55 },
    { x: -6,  z: -2.0, angle: -0.08, segs: 9, w: 0.48 },
    { x: 0,   z: -1.2, angle: 0.02, segs: 10, w: 0.62 },
    { x: 6,   z: -2.2, angle: 0.1, segs: 8, w: 0.5 },
    { x: 12,  z: -1.0, angle: -0.06, segs: 7, w: 0.45 },
  ];

  mains.forEach((m) => {
    buildFracture(m.x, m.z, m.angle, m.segs, m.w, 0.45);
  });

  // Secondary radiating cracks spreading outward from the fault
  const radials = [
    { x: -10, z: -0.5, angle: -0.9, segs: 5, w: 0.32 },
    { x: -4,  z: 0.2,  angle: -1.1, segs: 6, w: 0.28 },
    { x: 3,   z: -0.3, angle: 1.05, segs: 5, w: 0.3 },
    { x: 9,   z: 0.5,  angle: 0.95, segs: 5, w: 0.26 },
    { x: -14, z: 0.8,  angle: -0.7, segs: 4, w: 0.24 },
    { x: 14,  z: 0.3,  angle: 0.75, segs: 4, w: 0.22 },
  ];

  radials.forEach((r) => {
    buildFracture(r.x, r.z, r.angle, r.segs, r.w, 0.3);
  });

  group.userData = group.userData || {};
  group.userData.crackObject = crackObject;
}

// ============================================================
// FAULT VISUAL
// ============================================================

function createFaultVisual() {
  const fault = document.querySelector('#fault-line');
  if (!fault) return;
  const mesh = fault.getObject3D('mesh');
  if (!mesh) return;

  mesh.material.color.set('#ff0000ff');
  mesh.material.roughness = 1;
  mesh.material.metalness = 0.5;
}

// ============================================================
// TSUNAMI WAVE
// ============================================================

function createTsunamiWave() {
  const container = document.querySelector('#tsunami-wave');
  if (!container || !container.object3D) return;

  const group = new THREE.Group();
  group.name = 'MASSIVE-TSUNAMI-WAVE';

  const waveMaterial = new THREE.MeshStandardMaterial({
    color: 0x168bc4,
    transparent: true,
    opacity: 0.88,
    roughness: 0.18,
    metalness: 0.03,
    side: THREE.DoubleSide
  });

  const foamMaterial = new THREE.MeshStandardMaterial({
    color: 0xd0f6ff,
    transparent: true,
    opacity: 0.82,
    roughness: 0.1,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  // High-res base so organic deformation reads clearly
  const widthSegments = 72;
  const heightSegments = 56;
  const depthSegments = 4;
  const width = 68;
  const height = 24;
  const thickness = 25;

  const geometry = new THREE.BoxGeometry(
    width, height, thickness,
    widthSegments, heightSegments, depthSegments
  );
  const pos = geometry.attributes.position;

  // Multi-frequency organic deformation — not a flat wall
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const v = (y / height) + 0.5;           // 0 bottom → 1 top
    const u = x / (width * 0.5);            // -1 … 1

    // Primary curling face
    const bulge = Math.sin(Math.max(0, v) * Math.PI) * 2.2;
    const curl  = Math.pow(Math.max(0, v - 0.28), 2.15) * 10.5;
    const lip   = Math.pow(Math.max(0, v - 0.72), 2.4) * 4.2;

    // Horizontal ridges / lobes so the crest is irregular
    const lobeA = Math.sin(u * Math.PI * 1.15) * 1.6 * Math.pow(v, 1.4);
    const lobeB = Math.sin(u * Math.PI * 2.4 + 0.7) * 0.85 * Math.pow(v, 1.6);
    const lobeC = Math.sin(u * Math.PI * 4.1 + 1.3) * 0.4 * v;

    // Vertical churn on the face
    const churn = Math.sin(v * 9.0 + u * 3.0) * 0.35 * v
                + Math.sin(v * 15.0 - u * 2.0) * 0.18 * Math.pow(v, 1.2);

    // Side falloff — ends drop slightly so it isn’t a perfect rectangle
    const sideDrop = Math.pow(Math.abs(u), 2.4) * 1.8 * v;

    // Front face pushes out more than the back
    const frontBias = z > 0 ? 1.0 : 0.28;

    const zOff = (bulge + curl + lip + lobeA + lobeB + lobeC + churn - sideDrop * 0.35) * frontBias;
    pos.setZ(i, z + zOff);

    // Crest height variation + side droop
    let yOff = 0;
    if (v > 0.5) {
      yOff += (v - 0.5) * 2.4;
      yOff += Math.sin(u * Math.PI * 1.6) * 0.9 * (v - 0.5);
      yOff += Math.sin(u * Math.PI * 3.3 + 0.4) * 0.45 * (v - 0.5);
    }
    yOff -= sideDrop * 0.55;
    pos.setY(i, y + yOff);

    // Slight width pinch near crest
    if (v > 0.65) {
      pos.setX(i, x * (1 - (v - 0.65) * 0.06));
    }
  }
  geometry.computeVertexNormals();

  const wave = new THREE.Mesh(geometry, waveMaterial);
  wave.position.set(0, -0.5, -58);
  wave.scale.set(0.5, 0.55, 0.45);
  wave.visible = false;
  group.add(wave);

// Foam crest — sits on the thick lip (pushed further forward for thickness 47)
  const foamGeo = new THREE.BoxGeometry(width * 0.95, 2.2, 4.5, 48, 6, 4);
  const foamPos = foamGeo.attributes.position;
  for (let i = 0; i < foamPos.count; i++) {
    const fx = foamPos.getX(i);
    const fy = foamPos.getY(i);
    const fz = foamPos.getZ(i);
    const fu = fx / (width * 0.475);
    const jag = Math.sin(fu * Math.PI * 3.2) * 0.65
              + Math.sin(fu * Math.PI * 7.0 + 1.1) * 0.32
              + Math.sin(fu * Math.PI * 11.0) * 0.14;
    foamPos.setY(i, fy + jag + Math.abs(fu) * 0.22);
    foamPos.setZ(i, fz + 4.0 + jag * 0.9 + Math.sin(fu * Math.PI * 2.0) * 0.55);
  }
  foamGeo.computeVertexNormals();

  const foam = new THREE.Mesh(foamGeo, foamMaterial);
  foam.position.set(0, height * 0.52, thickness * 0.4);
  wave.add(foam);

  // Secondary foam band under the main lip
  const foam2Geo = new THREE.BoxGeometry(width * 0.72, 1.1, 2.8, 28, 3, 3);
  const foam2Pos = foam2Geo.attributes.position;
  for (let i = 0; i < foam2Pos.count; i++) {
    const fx = foam2Pos.getX(i);
    const fu = fx / (width * 0.36);
    foam2Pos.setY(i, foam2Pos.getY(i) + Math.sin(fu * Math.PI * 5.0) * 0.4);
    foam2Pos.setZ(i, foam2Pos.getZ(i) + Math.sin(fu * Math.PI * 2.5) * 0.5);
  }
  foam2Geo.computeVertexNormals();
  const foam2 = new THREE.Mesh(foam2Geo, foamMaterial.clone());
  foam2.material.opacity = 0.45;
  foam2.position.set(0, height * 0.38, thickness * 0.2);
  wave.add(foam2);

  // Spray particles — concentrated on the thicker crest
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 360;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const spread = Math.pow(Math.random(), 0.7);
    particlePositions[i * 3]     = (Math.random() - 0.5) * 58 * spread;
    particlePositions[i * 3 + 1] = 7 + Math.random() * 15;
    particlePositions[i * 3 + 2] = thickness * 0.15 + Math.random() * (thickness * 0.2);
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xc8f4ff,
    size: 0.12,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  const spray = new THREE.Points(particleGeometry, particleMaterial);
  wave.add(spray);

  // Secondary spray cluster
  const spray2Geo = new THREE.BufferGeometry();
  const n2 = 120;
  const p2 = new Float32Array(n2 * 3);
  for (let i = 0; i < n2; i++) {
    p2[i * 3]     = (Math.random() - 0.5) * 40;
    p2[i * 3 + 1] = 10 + Math.random() * 8;
    p2[i * 3 + 2] = 3 + Math.random() * 5;
  }
  spray2Geo.setAttribute('position', new THREE.BufferAttribute(p2, 3));
  const spray2 = new THREE.Points(spray2Geo, new THREE.PointsMaterial({
    color: 0xe8fbff,
    size: 0.08,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  }));
  wave.add(spray2);

  container.object3D.add(group);
  container.userData = container.userData || {};
  container.userData.wave = wave;
  container.userData.waveGroup = group;
}

// ============================================================
// PROCEDURAL AUDIO (Web Audio API)
// Earthquake rumble, ocean waves, underwater ambience
// (no alarm / siren)
// ============================================================

function createAudioSystem() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();

  const master = ctx.createGain();
  master.gain.value = 0.58;
  master.connect(ctx.destination);

  // Helper: fill buffer with white noise
  function makeNoiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ----------------------------------------------------------
  // EARTHQUAKE / TECTONIC LAYER (scary phase 1)
  // Deep filtered noise + sub oscillator + crack impulses
  // ----------------------------------------------------------

  // Primary rumble (very low lowpass noise)
  const rumbleSource = ctx.createBufferSource();
  rumbleSource.buffer = makeNoiseBuffer(3);
  rumbleSource.loop = true;

  const rumbleLPF = ctx.createBiquadFilter();
  rumbleLPF.type = 'lowpass';
  rumbleLPF.frequency.value = 55;
  rumbleLPF.Q.value = 3.5;

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0;

  rumbleSource.connect(rumbleLPF);
  rumbleLPF.connect(rumbleGain);
  rumbleGain.connect(master);
  rumbleSource.start(0);

  // Secondary mid-rumble (rock grinding feel)
  const grindSource = ctx.createBufferSource();
  grindSource.buffer = makeNoiseBuffer(2.5);
  grindSource.loop = true;

  const grindLPF = ctx.createBiquadFilter();
  grindLPF.type = 'lowpass';
  grindLPF.frequency.value = 180;
  grindLPF.Q.value = 1.8;

  const grindHPF = ctx.createBiquadFilter();
  grindHPF.type = 'highpass';
  grindHPF.frequency.value = 40;

  const grindGain = ctx.createGain();
  grindGain.gain.value = 0;

  grindSource.connect(grindHPF);
  grindHPF.connect(grindLPF);
  grindLPF.connect(grindGain);
  grindGain.connect(master);
  grindSource.start(0);

  // Deep sub-bass oscillator (felt as much as heard)
  const subOsc = ctx.createOscillator();
  subOsc.type = 'sine';
  subOsc.frequency.value = 28;
  const subGain = ctx.createGain();
  subGain.gain.value = 0;
  subOsc.connect(subGain);
  subGain.connect(master);
  subOsc.start(0);

  // Secondary sub for beating / unease
  const subOsc2 = ctx.createOscillator();
  subOsc2.type = 'sine';
  subOsc2.frequency.value = 36;
  const subGain2 = ctx.createGain();
  subGain2.gain.value = 0;
  subOsc2.connect(subGain2);
  subGain2.connect(master);
  subOsc2.start(0);

  // Crack / impact impulse generator (triggered during quake)
  const crackGain = ctx.createGain();
  crackGain.gain.value = 0.7;
  crackGain.connect(master);

  function triggerCrack() {
    if (ctx.state !== 'running') return;
    const now = ctx.currentTime;
    // Short noise burst
    const burst = ctx.createBufferSource();
    burst.buffer = makeNoiseBuffer(0.15);
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 180 + Math.random() * 420;
    filt.Q.value = 2.5 + Math.random() * 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.55 + Math.random() * 0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + Math.random() * 0.18);
    burst.connect(filt);
    filt.connect(g);
    g.connect(crackGain);
    burst.start(now);
    burst.stop(now + 0.35);
  }

  // ----------------------------------------------------------
  // OCEAN SURFACE WAVES
  // ----------------------------------------------------------
  const oceanSource = ctx.createBufferSource();
  oceanSource.buffer = makeNoiseBuffer(4);
  oceanSource.loop = true;

  const oceanHPF = ctx.createBiquadFilter();
  oceanHPF.type = 'highpass';
  oceanHPF.frequency.value = 120;

  const oceanBPF = ctx.createBiquadFilter();
  oceanBPF.type = 'bandpass';
  oceanBPF.frequency.value = 520;
  oceanBPF.Q.value = 0.55;

  // Slow amplitude LFO so waves feel surging
  const oceanLFO = ctx.createOscillator();
  oceanLFO.type = 'sine';
  oceanLFO.frequency.value = 0.18;
  const oceanLFOGain = ctx.createGain();
  oceanLFOGain.gain.value = 0.22;
  const oceanGain = ctx.createGain();
  oceanGain.gain.value = 0;
  oceanLFO.connect(oceanLFOGain);
  oceanLFOGain.connect(oceanGain.gain);

  oceanSource.connect(oceanHPF);
  oceanHPF.connect(oceanBPF);
  oceanBPF.connect(oceanGain);
  oceanGain.connect(master);
  oceanSource.start(0);
  oceanLFO.start(0);

  // ----------------------------------------------------------
  // UNDERWATER AMBIENCE (muffled, pressure feel)
  // ----------------------------------------------------------
  const underSource = ctx.createBufferSource();
  underSource.buffer = makeNoiseBuffer(3.5);
  underSource.loop = true;

  const underLPF = ctx.createBiquadFilter();
  underLPF.type = 'lowpass';
  underLPF.frequency.value = 380;
  underLPF.Q.value = 1.2;

  const underHPF = ctx.createBiquadFilter();
  underHPF.type = 'highpass';
  underHPF.frequency.value = 60;

  const underGain = ctx.createGain();
  underGain.gain.value = 0;

  underSource.connect(underHPF);
  underHPF.connect(underLPF);
  underLPF.connect(underGain);
  underGain.connect(master);
  underSource.start(0);

  // Soft underwater pulse (distant pressure / boom)
  const underPulse = ctx.createOscillator();
  underPulse.type = 'sine';
  underPulse.frequency.value = 55;
  const underPulseGain = ctx.createGain();
  underPulseGain.gain.value = 0;
  underPulse.connect(underPulseGain);
  underPulseGain.connect(master);
  underPulse.start(0);

  // ----------------------------------------------------------
  // WIND (storm phases)
  // ----------------------------------------------------------
  const windSource = ctx.createBufferSource();
  windSource.buffer = makeNoiseBuffer(3);
  windSource.loop = true;

  const windHPF = ctx.createBiquadFilter();
  windHPF.type = 'highpass';
  windHPF.frequency.value = 1800;

  const windBPF = ctx.createBiquadFilter();
  windBPF.type = 'bandpass';
  windBPF.frequency.value = 3200;
  windBPF.Q.value = 0.45;

  const windGain = ctx.createGain();
  windGain.gain.value = 0;

  windSource.connect(windHPF);
  windHPF.connect(windBPF);
  windBPF.connect(windGain);
  windGain.connect(master);
  windSource.start(0);

  // Legacy alias so older call sites that used waterGain still work
  // (maps to ocean surface waves)
  const waterGain = oceanGain;
  const waterBPF = oceanBPF;

  return {
    ctx,
    master,
    rumbleGain,
    grindGain,
    subGain,
    subGain2,
    waterGain,       // ocean surface
    waterBPF,
    oceanGain,
    oceanBPF,
    underGain,
    underPulseGain,
    windGain,
    windBPF,
    crackGain,
    triggerCrack,
    resume: () => { if (ctx.state === 'suspended') ctx.resume(); }
  };
}

// ============================================================
// FLOATING DEBRIS
// ============================================================

function createOceanDebris() {
  const container = document.querySelector('#ocean-debris-container');
  if (!container) return;

  const group = new THREE.Group();
  group.name = 'ocean-debris';

  const colors = [0x8b7355, 0x6b5a45, 0x5c4a38, 0x9a8560];

  for (let i = 0; i < 14; i++) {
    const geo = new THREE.BoxGeometry(
      0.15 + Math.random() * 0.5,
      0.06 + Math.random() * 0.08,
      0.10 + Math.random() * 0.3
    );
    const mat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.9,
      metalness: 0.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 16,
      -0.95,
      -5 + Math.random() * -8
    );
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.userData.baseX = mesh.position.x;
    mesh.userData.baseZ = mesh.position.z;
    mesh.userData.driftSpeed = 0.3 + Math.random() * 0.7;
    mesh.userData.driftPhase = Math.random() * Math.PI * 2;
    mesh.userData.swayAmount = 0.1 + Math.random() * 0.15;
    mesh.visible = false;
    group.add(mesh);
  }

  container.object3D.add(group);
  container.userData = container.userData || {};
  container.userData.debrisGroup = group;
}

// ============================================================
// RAIN PARTICLES
// ============================================================

function createRainSystem() {
  const container = document.querySelector('#rain-container');
  if (!container) return;

  const group = new THREE.Group();
  group.name = 'rain-system';

  const rainCount = 450;
  const rainGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);
  const velocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 55;
    positions[i * 3 + 1] = Math.random() * 22;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 55;
    velocities[i] = 0.3 + Math.random() * 0.5;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rainMat = new THREE.PointsMaterial({
    color: 0x88bbee,
    size: 0.055,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });

  const rain = new THREE.Points(rainGeo, rainMat);
  group.add(rain);
  container.object3D.add(group);

  container.userData = container.userData || {};
  container.userData.rain = rain;
  container.userData.rainVelocities = velocities;
}

// ============================================================
// TSUNAMI LOOP COMPONENT
// ============================================================

AFRAME.registerComponent('tsunami-loop', {
  init: function () {
    this.time = 0;
    this.frameCount = 0;
    this.lastPhase = -1;
    this.lastStatus = '';
    this.lastOceanColor = '';
    this.lastSkyColor = '';
    this.lastPanelColor = '';
    this.faultMesh = null;

    this.oceanEl = null;
    this.gridEl = null;
    this.statusText = null;
    this.statusPanel = null;
    this.fault = null;
    this.faultLight = null;
    this.crackGroup = null;
    this.cameraRig = null;
    this.waveContainer = null;
    this.sky = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.hemiLight = null;
    this.alarmLight1 = null;
    this.alarmLight2 = null;
    this.warningBar = null;
    this.cloudLayer = null;
    this.foamLayer = null;
    this.rainContainer = null;
    this.debrisContainer = null;
    this.dataReadout1 = null;
    this.dataReadout2 = null;

    this.baseCamY = 3;

    this.geometry = null;
    this.basePositions = null;

    this.audio = null;
    this.alarmActive = false;
    this.rainActive = false;
    this.debrisActive = false;

    this.STATUS = {
      phase1:  'PHASE 1  —  TECTONIC SHIFT\nEnergy builds beneath the ocean floor…',
      phase2a: 'PHASE 2  —  WATER RECEDES\nOcean draws back as seismic energy forms a distant wave…',
      phase2b: '⚠  TSUNAMI AMPLIFICATION\nWave energy concentrates near shore.',
      phase2c: '⚠  MASSIVE TSUNAMI WAVE  ⚠\nWave height and kinetic energy critically elevated.',
      reset:   'RESETTING SIMULATION…'
    };

    const setupScene = () => {
      this.oceanEl        = document.querySelector('#ocean-grid');
      this.gridEl         = document.querySelector('#ocean-wireframe');
      this.statusText     = document.querySelector('#status-text');
      this.statusPanel    = document.querySelector('#status-panel');
      this.fault          = document.querySelector('#fault-line');
      this.faultLight     = document.querySelector('#fault-light');
      this.crackGroup     = document.querySelector('#cracks');
      this.cameraRig      = document.querySelector('#camera-rig');
      this.waveContainer  = document.querySelector('#tsunami-wave');
      this.sky            = document.querySelector('#sky');
      this.sunLight       = document.querySelector('#sun-light');
      this.ambientLight   = document.querySelector('#ambient-light');
      this.hemiLight      = document.querySelector('#hemisphere-light');
      this.alarmLight1    = document.querySelector('#alarm-light');
      this.alarmLight2    = document.querySelector('#alarm-light-2');
      this.warningBar     = document.querySelector('#warning-bar');
      this.cloudLayer     = document.querySelector('#cloud-layer');
      this.foamLayer      = document.querySelector('#foam-layer');
      this.rainContainer  = document.querySelector('#rain-container');
      this.debrisContainer = document.querySelector('#ocean-debris-container');
      this.dataReadout1   = document.querySelector('#data-readout-1');
      this.dataReadout2   = document.querySelector('#data-readout-2');

      if (this.fault) {
        this.faultMesh = this.fault.getObject3D('mesh');
      }

      const initAudio = () => {
        this.audio = createAudioSystem();
        if (this.audio) this.audio.resume();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
      };
      document.addEventListener('click', initAudio);
      document.addEventListener('touchstart', initAudio);
    };

    if (this.el.sceneEl && this.el.sceneEl.hasLoaded) {
      setupScene();
    } else {
      this.el.sceneEl.addEventListener('loaded', setupScene);
    }
  },

  tick: function (t, dt) {
    if (!this.oceanEl || !this.fault || !this.statusText) return;

    if (dt > 50) dt = 16;
    this.time += dt / 1000;
    this.frameCount++;

    // ---- Phase timing (40 s cycle) ----
    // 0–10: tectonic | 10–20: propagation | 20–30: tsunami | 30–40: reset
    const totalCycle = 40;
    const cycle = this.time % totalCycle;
    let phase = 0;
    let nextPhaseTime = 0;

    if (cycle < 10) {
      phase = 1;
      nextPhaseTime = 10 - cycle;
    } else if (cycle < 20) {
      phase = 2;
      nextPhaseTime = 20 - cycle;
    } else if (cycle < 30) {
      phase = 3;
      nextPhaseTime = 30 - cycle;
    } else {
      phase = 4;
      nextPhaseTime = 40 - cycle;
    }

    const countdown = Math.ceil(nextPhaseTime);

    let amp, freqMul, speedMul, oceanColor, shakeAmt, statusMsg, panelColor, skyColor;
    let fogDensity = 0.008;
    let sunIntensity = 1.35;
    let ambientIntensity = 0.65;
    let hemiIntensity = 0.45;
    let alarmIntensity = 0;
    let warningBarOpacity = 0;
    let showClouds = false;
    let showRain = false;
    let showDebris = false;
    let foamOpacity = 0;
    let dataLine1 = '';
    let dataLine2 = '';
    let recessionOffset = 0; // negative = water draws back (real tsunami drawback)

    // ============================================================
    // PHASE 1 — Tectonic Shift (0–10 s)
    // ============================================================
    if (phase === 1) {
      const progress = cycle / 10;
      amp = 0.02 + progress * 0.03;
      freqMul = 1;
      speedMul = 0.2;
      oceanColor = '#0a4d8f';
      skyColor = '#78c5e8';
      panelColor = '#0b2638';
      shakeAmt = progress * progress * 0.14;
      recessionOffset = 0;
      statusMsg = `${this.STATUS.phase1}\nNext phase in  ${countdown}s`;

      const pulseSpeed = 1 + progress * 10;
      const pulse = Math.sin(this.time * pulseSpeed) * 0.5 + 0.5;
      const glow = progress * (0.4 + pulse * 0.8);

      if (this.faultMesh && this.faultMesh.material) {
        this.faultMesh.material.emissiveIntensity = glow;
      }
      if (this.fault.object3D) {
        this.fault.object3D.scale.set(
          1 + progress * pulse * 0.14,
          1 + progress * pulse * 3.2,
          1 + progress * pulse * 0.25
        );
      }
      if (this.crackGroup && this.crackGroup.object3D) {
        const cs = 0.2 + progress * 0.95;
        this.crackGroup.object3D.scale.set(cs, cs, cs);
      }
      if (this.faultLight && this.frameCount % 4 === 0) {
        this.faultLight.setAttribute('light', 'intensity', glow * 0.5);
      }

      // Hide wave during tectonic phase
      if (this.waveContainer && this.waveContainer.userData && this.waveContainer.userData.wave) {
        this.waveContainer.userData.wave.visible = false;
      }

      if (this.audio) {
        const t = this.audio.ctx.currentTime;
        // Build scary earthquake intensity — peaks hard near end of phase 1
        const quake = Math.pow(progress, 1.35);
        this.audio.rumbleGain.gain.setTargetAtTime(quake * 0.72, t, 0.25);
        this.audio.grindGain.gain.setTargetAtTime(quake * 0.38, t, 0.3);
        this.audio.subGain.gain.setTargetAtTime(quake * 0.55, t, 0.25);
        this.audio.subGain2.gain.setTargetAtTime(quake * 0.28, t, 0.3);
        // Occasional rock-crack impacts
        if (progress > 0.15 && Math.random() < 0.035 + progress * 0.04) {
          this.audio.triggerCrack();
        }
        // Keep ocean / underwater silent during pure tectonic phase
        this.audio.oceanGain.gain.setTargetAtTime(0, t, 0.5);
        this.audio.underGain.gain.setTargetAtTime(0, t, 0.5);
        this.audio.underPulseGain.gain.setTargetAtTime(0, t, 0.5);
        this.audio.windGain.gain.setTargetAtTime(0, t, 0.5);
      }
    }

    // ============================================================
    // PHASE 2 — Wave Propagation (10–20 s)
    // Wave forms far out and travels in, growing steadily
    // ============================================================
    else if (phase === 2) {
      const progress = (cycle - 10) / 10;

      amp = 0.25 + progress * 0.7;
      freqMul = 1.5 + progress * 0.5;
      speedMul = 0.9 + progress * 0.7;
      shakeAmt = 0.04 + progress * 0.06;
      skyColor = '#78c5e8';
      oceanColor = '#2fb8e8';
      panelColor = '#0c2a3a';
      fogDensity = 0.008 + progress * 0.008;
      sunIntensity = 1.35 - progress * 0.35;
      ambientIntensity = 0.65 - progress * 0.1;

      // Real tsunami behavior: water recedes (drawback) as the wave approaches.
      // Builds quickly then holds near maximum so seafloor is exposed.
      const drawProgress = THREE.MathUtils.smoothstep(progress, 0.05, 0.55);
      recessionOffset = -drawProgress * 1.55;

      statusMsg = `${this.STATUS.phase2a}\nNext phase in  ${countdown}s`;
      dataLine1 = `WAVE SPEED\n${(8 + progress * 32).toFixed(1)} m/s`;
      dataLine2 = `WATER LEVEL\n${(recessionOffset * 8).toFixed(1)} m  (receding)`;

      if (this.faultMesh && this.faultMesh.material) {
        this.faultMesh.material.emissiveIntensity = 0;
      }
      if (this.fault.object3D) {
        this.fault.object3D.scale.set(1.08, 2.8, 1.12);
      }
      if (this.crackGroup && this.crackGroup.object3D) {
        const cs = 1.1 + progress * 0.1;
        this.crackGroup.object3D.scale.set(cs, cs, cs);
      }
      if (this.faultLight) {
        this.faultLight.setAttribute('light', 'intensity', 0);
      }

      // Gradual grow + slow travel across the full 10s
      if (this.waveContainer && this.waveContainer.userData && this.waveContainer.userData.wave) {
        const wave = this.waveContainer.userData.wave;
        wave.visible = true;

        const t = THREE.MathUtils.smoothstep(progress, 0, 1);
        // Start modest, end large by end of phase 2
        const sx = 0.5 + t * 1.9;
        const sy = 0.55 + t * 2.3;
        const sz = 0.45 + t * 1.6;
        wave.scale.set(sx, sy, sz);

        // Slow advance: z=-58 → ~-30 over 10s
        wave.position.z = -58 + t * 28;
        wave.position.x = Math.sin(this.time * 0.28) * 1.5
                        + Math.sin(this.time * 0.11) * 0.6;
        wave.position.y = -0.5 + t * 0.25 + Math.sin(this.time * 0.5) * 0.1;
        wave.rotation.z = Math.sin(this.time * 0.3) * 0.05;
        wave.rotation.y = Math.sin(this.time * 0.18) * 0.03;
      }

      if (this.audio) {
        const t = this.audio.ctx.currentTime;
        // Residual aftershock rumble fades while ocean takes over
        this.audio.rumbleGain.gain.setTargetAtTime(0.18 * (1 - progress * 0.6), t, 0.4);
        this.audio.grindGain.gain.setTargetAtTime(0.08 * (1 - progress), t, 0.4);
        this.audio.subGain.gain.setTargetAtTime(0.12 * (1 - progress * 0.5), t, 0.4);
        this.audio.subGain2.gain.setTargetAtTime(0.05, t, 0.4);
        // Ocean surface waves swell in
        const oceanVol = Math.min(0.08 + progress * 0.32, 0.38);
        this.audio.oceanGain.gain.setTargetAtTime(oceanVol, t, 0.35);
        this.audio.oceanBPF.frequency.setTargetAtTime(380 + progress * 480, t, 0.3);
        // Underwater layer starts emerging as wave energy builds
        this.audio.underGain.gain.setTargetAtTime(progress * 0.22, t, 0.4);
        this.audio.underPulseGain.gain.setTargetAtTime(progress * 0.08, t, 0.4);
        this.audio.windGain.gain.setTargetAtTime(progress * 0.1, t, 0.5);
      }
    }

    // ============================================================
    // PHASE 3 — Massive Tsunami (20–30 s)
    // Peak height, storm, alarms, full energy
    // ============================================================
    else if (phase === 3) {
      const progress = (cycle - 20) / 10;

      amp = 0.9 + progress * 0.55;
      freqMul = 2.0 + progress * 0.5;
      speedMul = 1.5 + progress * 0.6;
      shakeAmt = 0.08 + progress * progress * 0.16;

      skyColor = '#2a4a5a';
      oceanColor = '#074060';
      panelColor = '#081820';
      fogDensity = 0.02 + progress * 0.06;
      sunIntensity = 0.5 - progress * 0.15;
      ambientIntensity = 0.35 - progress * 0.08;
      hemiIntensity = 0.25;
      alarmIntensity = 1.0 + Math.sin(this.time * 5) * 0.55;
      warningBarOpacity = 0.55 + Math.sin(this.time * 4) * 0.28;
      showClouds = true;
      showRain = true;
      showDebris = true;
      foamOpacity = 0.08 + progress * 0.1;

      // Keep water strongly receded so the approaching tsunami has room
      // and the exposed seafloor is still visible until the wave arrives.
      // Slight recovery late in the phase as water is forced shoreward.
      recessionOffset = -1.55 + progress * 0.35;

      statusMsg = `${this.STATUS.phase2c}\nResetting in  ${countdown}s`;
      dataLine1 = `⚠  WAVE SPEED\n${(55 + progress * 145).toFixed(1)} m/s`;
      dataLine2 = `⚠  ENERGY\n${(80 + progress * 420).toFixed(0)} TJ`;

      if (this.faultMesh && this.faultMesh.material) {
        this.faultMesh.material.emissiveIntensity = 0;
      }
      if (this.fault.object3D) {
        this.fault.object3D.scale.set(1.12, 3.4, 1.18);
      }
      if (this.crackGroup && this.crackGroup.object3D) {
        const cs = 1.2 + progress * 0.15;
        this.crackGroup.object3D.scale.set(cs, cs, cs);
      }
      if (this.faultLight) {
        this.faultLight.setAttribute('light', 'intensity', 0);
      }

      // Continue gradual growth to peak + slow crawl toward platform
      if (this.waveContainer && this.waveContainer.userData && this.waveContainer.userData.wave) {
        const wave = this.waveContainer.userData.wave;
        wave.visible = true;

        const t = THREE.MathUtils.smoothstep(progress, 0, 1);
        // Pick up from end of phase 2 (~2.4/2.85/2.05) and push to full peak
        const sx = 2.4 + t * 1.0;
        const sy = 2.85 + t * 1.35;
        const sz = 2.05 + t * 0.75;
        wave.scale.set(sx, sy, sz);

        // Slow crawl: z≈-30 → ≈-6 over 10s
        wave.position.z = -30 + t * 24;
        wave.position.x = Math.sin(this.time * 0.35) * 1.9
                        + Math.sin(this.time * 0.14) * 0.9;
        wave.position.y = -0.25 + t * 0.35 + Math.sin(this.time * 0.55) * 0.15;
        wave.rotation.z = Math.sin(this.time * 0.32) * 0.07;
        wave.rotation.y = Math.sin(this.time * 0.2) * 0.04;
      }

      if (this.audio) {
        const t = this.audio.ctx.currentTime;
        // Full ocean roar + deep underwater pressure
        this.audio.oceanGain.gain.setTargetAtTime(0.42 + progress * 0.12, t, 0.3);
        this.audio.oceanBPF.frequency.setTargetAtTime(620 + progress * 520, t, 0.25);
        this.audio.underGain.gain.setTargetAtTime(0.32 + progress * 0.18, t, 0.3);
        this.audio.underPulseGain.gain.setTargetAtTime(0.12 + progress * 0.1, t, 0.3);
        // Low residual tectonic energy under the water chaos
        this.audio.rumbleGain.gain.setTargetAtTime(0.22 + progress * 0.12, t, 0.3);
        this.audio.grindGain.gain.setTargetAtTime(0.1, t, 0.4);
        this.audio.subGain.gain.setTargetAtTime(0.2 + progress * 0.08, t, 0.3);
        this.audio.subGain2.gain.setTargetAtTime(0.1, t, 0.3);
        this.audio.windGain.gain.setTargetAtTime(0.22 + progress * 0.14, t, 0.35);
      }
    }

    // ============================================================
    // PHASE 4 — Reset (30–40 s)
    // ============================================================
    else {
      const resetProgress = (cycle - 30) / 10;

      amp = 0.2 * (1 - resetProgress);
      freqMul = 1.15;
      speedMul = 0.5 * (1 - resetProgress);
      oceanColor = '#166aa8';
      skyColor = '#78c5e8';
      panelColor = '#0b2638';
      shakeAmt = 0;
      fogDensity = 0.028 - resetProgress * 0.02;
      sunIntensity = 0.4 + resetProgress * 0.95;
      ambientIntensity = 0.3 + resetProgress * 0.35;
      hemiIntensity = 0.22 + resetProgress * 0.23;
      // Water level returns to normal as the simulation resets
      recessionOffset = -1.2 * (1 - resetProgress);
      statusMsg = `${this.STATUS.reset}\nNew simulation in  ${countdown}s`;

      if (this.faultMesh && this.faultMesh.material) {
        this.faultMesh.material.emissiveIntensity = 0;
      }
      if (this.fault.object3D) {
        this.fault.object3D.scale.set(1, 1, 1);
      }
      if (this.faultLight) {
        this.faultLight.setAttribute('light', 'intensity', 0);
      }
      if (this.crackGroup && this.crackGroup.object3D) {
        const cs = 1.2 - resetProgress * 1.0;
        this.crackGroup.object3D.scale.set(cs, cs, cs);
      }
      if (this.waveContainer && this.waveContainer.userData && this.waveContainer.userData.wave) {
        const wave = this.waveContainer.userData.wave;
        // Fade out by shrinking / retreating briefly then hide
        if (resetProgress < 0.4) {
          wave.visible = true;
          const fade = 1 - resetProgress / 0.4;
          wave.scale.set(3.4 * fade, 4.2 * fade, 2.8 * fade);
          wave.position.z = -6 - resetProgress * 20;
        } else {
          wave.visible = false;
        }
      }

      if (this.audio) {
        const t = this.audio.ctx.currentTime;
        // Fade everything cleanly for the next cycle
        this.audio.rumbleGain.gain.setTargetAtTime(0, t, 0.5);
        this.audio.grindGain.gain.setTargetAtTime(0, t, 0.5);
        this.audio.subGain.gain.setTargetAtTime(0, t, 0.5);
        this.audio.subGain2.gain.setTargetAtTime(0, t, 0.5);
        this.audio.oceanGain.gain.setTargetAtTime(0, t, 0.45);
        this.audio.underGain.gain.setTargetAtTime(0, t, 0.45);
        this.audio.underPulseGain.gain.setTargetAtTime(0, t, 0.45);
        this.audio.windGain.gain.setTargetAtTime(0, t, 0.5);
      }
    }

    // ============================================================
    // UI UPDATES (change detection)
    // ============================================================
    if (statusMsg !== this.lastStatus) {
      this.statusText.setAttribute('value', statusMsg);
      this.lastStatus = statusMsg;
    }
    if (this.statusPanel && panelColor !== this.lastPanelColor) {
      this.statusPanel.setAttribute('color', panelColor);
      this.lastPanelColor = panelColor;
    }
    if (oceanColor !== this.lastOceanColor) {
      this.oceanEl.setAttribute('color', oceanColor);
      this.lastOceanColor = oceanColor;
    }
    if (this.sky && skyColor !== this.lastSkyColor) {
      this.sky.setAttribute('color', skyColor);
      this.lastSkyColor = skyColor;
    }

    if (this.dataReadout1) this.dataReadout1.setAttribute('value', dataLine1);
    if (this.dataReadout2) this.dataReadout2.setAttribute('value', dataLine2);

    // Fog
    if (this.el.sceneEl.object3D && this.el.sceneEl.object3D.fog) {
      this.el.sceneEl.object3D.fog.density = THREE.MathUtils.lerp(
        this.el.sceneEl.object3D.fog.density, fogDensity, 0.04
      );
    }

    // Lighting
    if (this.sunLight) this.sunLight.setAttribute('light', 'intensity', sunIntensity);
    if (this.ambientLight) this.ambientLight.setAttribute('light', 'intensity', ambientIntensity);
    if (this.hemiLight) this.hemiLight.setAttribute('light', 'intensity', hemiIntensity);

    // Alarm lights (smooth approach)
    if (this.alarmLight1) {
      const current = parseFloat(this.alarmLight1.getAttribute('light').intensity) || 0;
      const newI = current + (alarmIntensity - current) * 0.08;
      if (Math.abs(newI - current) > 0.01) {
        this.alarmLight1.setAttribute('light', 'intensity', newI);
      }
    }
    if (this.alarmLight2) {
      const current = parseFloat(this.alarmLight2.getAttribute('light').intensity) || 0;
      const newI = current + (alarmIntensity - current) * 0.08;
      if (Math.abs(newI - current) > 0.01) {
        this.alarmLight2.setAttribute('light', 'intensity', newI);
      }
    }

    // Warning bar
    if (this.warningBar) {
      const currentOp = parseFloat(this.warningBar.getAttribute('material').opacity) || 0;
      const newOp = currentOp + (warningBarOpacity - currentOp) * 0.08;
      if (Math.abs(newOp - currentOp) > 0.005) {
        this.warningBar.setAttribute('material', 'opacity', newOp);
      }
    }

    // Clouds
    if (this.cloudLayer) {
      this.cloudLayer.setAttribute('visible', showClouds);
    }

    // Foam
    if (this.foamLayer) {
      const currentFop = parseFloat(this.foamLayer.getAttribute('opacity')) || 0;
      const newFop = currentFop + (foamOpacity - currentFop) * 0.05;
      if (Math.abs(newFop - currentFop) > 0.001) {
        this.foamLayer.setAttribute('opacity', newFop);
      }
    }

    // Rain
    if (this.rainContainer) {
      this.rainContainer.setAttribute('visible', showRain);
      if (showRain && this.rainContainer.userData && this.rainContainer.userData.rain) {
        const rain = this.rainContainer.userData.rain;
        const vels = this.rainContainer.userData.rainVelocities;
        const posAttr = rain.geometry.attributes.position;
        if (posAttr && posAttr.array) {
          for (let i = 0; i < posAttr.count; i++) {
            posAttr.array[i * 3 + 1] -= vels[i] * dt * 0.06;
            if (posAttr.array[i * 3 + 1] < -2) {
              posAttr.array[i * 3 + 1] = 16 + Math.random() * 6;
              posAttr.array[i * 3]     = (Math.random() - 0.5) * 55;
              posAttr.array[i * 3 + 2] = (Math.random() - 0.5) * 55;
            }
          }
          posAttr.needsUpdate = true;
        }
      }
    }

    // Debris
    if (this.debrisContainer && this.debrisContainer.userData && this.debrisContainer.userData.debrisGroup) {
      const debrisGroup = this.debrisContainer.userData.debrisGroup;
      debrisGroup.children.forEach(mesh => {
        mesh.visible = showDebris;
        if (showDebris) {
          mesh.position.x = mesh.userData.baseX +
            Math.sin(this.time * mesh.userData.driftSpeed + mesh.userData.driftPhase) * mesh.userData.swayAmount;
          mesh.position.y = -0.95 + Math.sin(this.time * 1.5 + mesh.userData.driftPhase) * 0.03;
          mesh.rotation.z = Math.sin(this.time * 0.8 + mesh.userData.driftPhase) * 0.1;
        }
      });
    }

    this.lastPhase = phase;

    // ============================================================
    // CAMERA
    // ============================================================
    if (this.cameraRig && this.cameraRig.object3D) {
      const cam = this.cameraRig.object3D;

      if (shakeAmt > 0.001) {
        // Violent multi-frequency seismic shake
        cam.position.x = Math.sin(this.time * 18) * shakeAmt
                       + Math.sin(this.time * 41) * shakeAmt * 0.45;
        cam.position.y = this.baseCamY
                       + Math.sin(this.time * 28) * shakeAmt
                       + Math.sin(this.time * 53) * shakeAmt * 0.4;
        cam.position.z = Math.cos(this.time * 22) * shakeAmt * 0.7
                       + Math.cos(this.time * 47) * shakeAmt * 0.25;
        cam.rotation.z = Math.sin(this.time * 9) * shakeAmt * 2.4
                       + Math.sin(this.time * 21) * shakeAmt * 0.8;
        cam.rotation.x = Math.cos(this.time * 11) * shakeAmt * 1.8
                       + Math.cos(this.time * 29) * shakeAmt * 0.6;
        cam.rotation.y = Math.sin(this.time * 6) * shakeAmt * 1.2
                       + Math.sin(this.time * 17) * shakeAmt * 0.5;
      } else {
        cam.position.x = Math.sin(this.time * 0.15) * 0.012;
        cam.position.y = this.baseCamY + Math.sin(this.time * 0.22) * 0.008;
        cam.position.z = Math.cos(this.time * 0.12) * 0.006;
        cam.rotation.z = Math.sin(this.time * 0.18) * 0.0025;
        cam.rotation.x = Math.cos(this.time * 0.14) * 0.0018;
        cam.rotation.y = Math.sin(this.time * 0.10) * 0.001;
      }
    }

    // ============================================================
    // OCEAN SURFACE DEFORMATION
    // ============================================================
    try {
      if (!this.geometry && this.oceanEl) {
        const mesh = this.oceanEl.getObject3D('mesh');
        if (mesh && mesh.geometry && mesh.geometry.attributes.position) {
          this.geometry = mesh.geometry;
          this.basePositions = new Float32Array(mesh.geometry.attributes.position.array);
        }
      }

      if (this.geometry && this.basePositions) {
        const pos = this.geometry.attributes.position;
        if (pos && pos.array) {
          const count = pos.count;
          const array = pos.array;
          const base = this.basePositions;
          if (base.length >= count * 3) {
            const t1 = this.time * 1.0 * speedMul;
            const t2 = this.time * 0.5 * speedMul;
            const t3 = this.time * 1.7 * speedMul;
            const f1 = 0.28 * freqMul;
            const f2 = 0.12 * freqMul;
            const f3 = 0.42 * freqMul;
            const a2 = amp * 0.45;
            const a3 = amp * 0.22;

            for (let i = 0; i < count; i++) {
              const idx = i * 3;
              const y = base[idx + 1];
              const x = base[idx];
              // recessionOffset pulls the entire mean water level down (drawback)
              // so the seafloor becomes visible before the tsunami arrives.
              const val =
                Math.sin(y * f1 + t1) * amp +
                Math.sin(y * f2 + t2) * a2 +
                Math.sin(x * f3 + t3) * a3 +
                recessionOffset;
              if (Number.isFinite(val)) array[idx + 2] = val;
            }
            pos.needsUpdate = true;
          }
        }
      }
    } catch (e) {
      // Keep the tick loop alive
    }
  }
});

// ============================================================
// INITIALIZATION
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  if (!scene) return;

  const initialize = () => {
    applyTextures();
    createCrackSystem();
    createFaultVisual();
    createTsunamiWave();
    createOceanDebris();
    createRainSystem();
    createMountainTerrain();
  };

  if (scene.hasLoaded) {
    initialize();
  } else {
    scene.addEventListener('loaded', initialize);
  }
});
