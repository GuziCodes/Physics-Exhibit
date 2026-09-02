// ============================================================
// IMMERSIVE TSUNAMI PHYSICS EXHIBIT
// A-Frame + Three.js
// Features: Atmospheric transitions, alarm system, multi-layered wave physics, particle systems,
// cinematic camera, live data readouts. (Audio removed for VR headset builds)
// ============================================================

// ... (keep the existing procedural textures and terrain code unchanged) ...

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
    color: 0x000000,
    roughness: 1,
    metalness: 0,
    emissive: 0x000000,
    emissiveIntensity: 0
  });

  // Red magma / energy glow inside the crack
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0xff334f,
    emissive: 0xff334f,
    emissiveIntensity: 1.8,
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity: 0.95
  });

  // Soft red light halo (slightly wider, dimmer)
  const haloMaterial = new THREE.MeshStandardMaterial({
    color: 0xff334f,
    emissive: 0xff334f,
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

  mesh.material.color.set('#ff334f');
  mesh.material.roughness = 1;
  mesh.material.metalness = 0.5;
}

// ============================================================
// TSUNAMI WAVE
// ============================================================

// (the rest of the file is unchanged; we only modified the crack + fault helpers above)
