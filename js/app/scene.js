// js/app/scene.js
// Uses global THREE and OrbitControls from index.html <script> tags
import { CATEGORIES } from './config.js';

export function createRenderer(appEl) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 0);
  appEl.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera(renderer) {
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 12);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  return { camera, controls };
}

/**
 * Create a glowing asterisk sprite group.
 * Safe even if position is missing -> defaults to visible center.
 */
export function createAsterisk({ id, title, position, color = '#ffffff', size = 1.0, category, ring = false, pulse = 1.6 }, scene) {
  const group = new THREE.Group();

  // --- Core asterisk texture ---
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = color;
// Core asterisk texture
ctx.fillStyle = color;
// IMPORTANT: use our custom family; no "bold" here, just regular FT88
ctx.font = '180px "FT88", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('*', 128, 140);   // single glyph (it was drawn twice, slightly offset)

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  tex.premultiplyAlpha = true;

  const coreMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const core = new THREE.Sprite(coreMat);
  core.scale.set(size, size, 1);

  // --- Soft radial glow (additive blending) ---
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 256;
  const g = glowCanvas.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 118);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);

  const glowTex = new THREE.CanvasTexture(glowCanvas);
  glowTex.anisotropy = 2;
  glowTex.needsUpdate = true;
  glowTex.premultiplyAlpha = true;

  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(size * 3.0, size * 3.0, 1);
  glow.raycast = () => {};   // the glow is decoration: it must not catch clicks meant for nearby stars

  // Add both to group
  group.add(glow);
  group.add(core);

  // Optional halo ring (used for your own research and the reading list)
  if (ring) {
    const rc = document.createElement('canvas');
    rc.width = rc.height = 256;
    const r = rc.getContext('2d');
    r.strokeStyle = color; r.lineWidth = 5; r.setLineDash([14, 10]);
    r.beginPath(); r.arc(128, 128, 110, 0, Math.PI * 2); r.stroke();
    const ringMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(rc), transparent: true, opacity: 0.7, depthWrite: false });
    const halo = new THREE.Sprite(ringMat);
    halo.scale.set(size * 1.9, size * 1.9, 1);
    halo.userData.isRing = true;
    halo.raycast = () => {};
    group.add(halo);
  }

  // ✅ Safe fallback position if undefined
  let px = 0, py = 1.5, pz = -3.0; // visible center default
  if (Array.isArray(position) && position.length === 3) {
    px = Number(position[0]);
    py = Number(position[1]);
    pz = Number(position[2]);
  }
  group.position.set(px, py, pz);
  group.userData = { id, title, baseY: py, category, pulse };

  scene.add(group);
  return group;
}

/**
 * Build the full scene using the provided hotspotsData.
 * Safe if some items lack positions.
 */
export function sceneSetup(appEl, hotspotsData) {
  const renderer = createRenderer(appEl);
  const scene = new THREE.Scene();
  const { camera, controls } = createCamera(renderer);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const clock = new THREE.Clock();

  // Build all hotspot sprites
  const hotspots = (hotspotsData || []).map(h =>
    createAsterisk(
      {
        id: h.id,
        title: h.title,
        position: h.position, // may be undefined — handled safely
        ...(CATEGORIES[h.category] || {}),
        color: h.color || (CATEGORIES[h.category] || {}).color || '#ffffff',
        category: h.category,
        size: h.size || 1.0
      },
      scene
    )
  );

  // --- Ambient dust: faint, non-clickable asterisks that add depth and density ---
  const dust = createDust(scene, { count: 420 });

  // --- Animation helpers ---
  const wobble = t => Math.sin(t * 0.9) * 0.3;
  let highlight = null;
  const setHighlight = cat => { highlight = cat; };

  function animateFrame() {
    const t = clock.getElapsedTime();
    dust.tick(t);
    hotspots.forEach((s, i) => {
      s.position.y = s.userData.baseY + wobble(t + i);
      // dim everything outside the highlighted category (legend hover)
      const dim = highlight && s.userData.category !== highlight ? 0.15 : 1;
      const glow = s.children[0], core = s.children[1], ring = s.children[2];
      if (glow) glow.material.opacity = dim * (0.35 + 0.25 * Math.sin(t * (s.userData.pulse || 1.6) + i));
      if (core) core.material.opacity = dim;
      if (ring) { ring.material.rotation = t * 0.25 + i; ring.material.opacity = dim * 0.7; }
    });
  }

  function render() {
    controls.update();
    renderer.render(scene, camera);
  }

  function onResize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', onResize);

  return { renderer, scene, camera, controls, raycaster, mouse, hotspots, animateFrame, render, setHighlight };
}

/**
 * A drifting field of small asterisks in the hotspot palette.
 * Purely decorative: not part of the raycast targets, so it never blocks clicks.
 */
function createDust(scene, { count = 400, palette = ['#ffffff', '#00f0ff', '#ff8a00', '#b6ff00', '#ffe500'] } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.font = '56px "FT88", ui-sans-serif, system-ui';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('*', 32, 38);
  const tex = new THREE.CanvasTexture(c);

  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // denser toward the middle of the sky, thinning at the edges
    const r = Math.pow(Math.random(), 0.7);
    const a = Math.random() * Math.PI * 2;
    pos[i*3]     = Math.cos(a) * r * 42;
    pos[i*3 + 1] = -2 + Math.sin(a) * r * 26;
    pos[i*3 + 2] = -6 - Math.random() * 60;
    tmp.set(palette[(Math.random() * palette.length) | 0]);
    col[i*3] = tmp.r; col[i*3 + 1] = tmp.g; col[i*3 + 2] = tmp.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    map: tex, size: 1.4, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.75, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  return {
    points,
    tick(t) {
      points.rotation.z = Math.sin(t * 0.05) * 0.04;   // slow sway
      points.position.x = Math.sin(t * 0.07) * 0.8;    // gentle drift
      mat.opacity = 0.7 + 0.15 * Math.sin(t * 0.8);   // breathing twinkle
    }
  };
}
