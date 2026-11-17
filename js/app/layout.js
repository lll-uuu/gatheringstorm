// js/app/layout.js
// Uses global THREE

export function computeNonOverlappingPositions(
  hotspotsData,
  {
    // Modes:
    //  - 'viewport'         : random in full viewport (previous)
    //  - 'viewportPoisson'  : Poisson-disk in full viewport (even spread) ← recommended
    //  - 'bounds'           : legacy world-box sampling
    mode = 'viewportPoisson',
    

    // Viewport plane and margins
    viewportZ = -2.0,       // z-plane on which we place items
    viewportMargin = 0.05,  // 5% margin from each screen edge

    // Poisson / spacing controls (screen space)
    minDistPx = 120,        // minimum distance between clickable centers in pixels
    maxThrows = 6000,       // effort; raise if you have many items

    // Legacy world-box (kept for backwards compatibility)
    bounds = { x:[-3.8, 3.8], y:[0.6, 2.4], z:[-3.6, -1.2] },

    // Overlap estimate + camera params
    paddingPx = 26,         // extra pad on top of Poisson minDist (used in legacy/random modes)
    fov = 60,
    cameraPos = new THREE.Vector3(0, 4, 12),
    sizeMultiplier = 1.0,

    // New: spread items across a range of depths (parallax when orbiting)
    depthRange = null,      // e.g. [-26, -10]; null = single plane at viewportZ
    topBias = 0.2           // fraction of screen height kept clear at the top
  } = {}
) {
  const W = innerWidth, H = innerHeight;

  // Virtual camera matching your scene camera
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 1000);
  cam.position.copy(cameraPos);
  cam.lookAt(0, 0, 0);              // match the real camera (OrbitControls targets the origin)
  cam.updateMatrixWorld();

  const placed = []; // for overlap checks in pixels
  const out = [];    // { id, position: THREE.Vector3 }

  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -viewportZ); // z = viewportZ
  const raycaster = new THREE.Raycaster();

  const rand = (min, max) => min + Math.random() * (max - min);

  function worldToScreenRadius(pos, worldR = 1) {
    const v1 = pos.clone().project(cam);
    const px = (v1.x * 0.5 + 0.5) * W;
    const py = (-v1.y * 0.5 + 0.5) * H;
    const v2 = pos.clone().add(new THREE.Vector3(worldR, 0, 0)).project(cam);
    const px2 = (v2.x * 0.5 + 0.5) * W;
    const rpx = Math.abs(px2 - px);
    return { px, py, rpx };
  }

  function fits(spt) {
    for (const p of placed) {
      const d = Math.hypot(spt.px - p.px, spt.py - p.py);
      if (d < (spt.rpx + p.rpx + paddingPx)) return false;
    }
    return true;
  }

  // -------- 1) Lock already-positioned hotspots (respect your JSON) --------
  for (const h of hotspotsData) {
    if (Array.isArray(h.position) && h.position.length === 3) {
      const size = (h.size || 1) * sizeMultiplier;
      const pos = new THREE.Vector3(h.position[0], h.position[1], h.position[2]);
      const spt = worldToScreenRadius(pos, size);
      spt.rpx = Math.max(spt.rpx, 14);
      placed.push({ id: h.id, pos, ...spt });
      out.push({ id: h.id, position: pos });
    }
  }

  // Collect items requiring auto-placement
  const toPlace = hotspotsData.filter(h => !(Array.isArray(h.position) && h.position.length === 3));

  // -------- 2) Generate screen-space targets for missing items --------
  let targetsPx = [];

  if (mode === 'viewportPoisson') {
    // Poisson-disk in pixel space (blue-noise)
    const marginPx = viewportMargin * Math.min(W, H);

    const shiftDown = H * topBias;

    const rect = {
        x: marginPx,
        y: marginPx + shiftDown,
        w: W - 2 * marginPx,
        h: H - 2 * marginPx - shiftDown
    };

    const seeds = placed.map(p => ({ x: p.px, y: p.py })); // honor fixed items
    // Spacing adapts to screen size and item count, so every item fits
    // (a fixed 350px only fits ~9 items on a laptop; the rest fell back to random spots).
    const fitDist = Math.sqrt((rect.w * rect.h) / Math.max(1, toPlace.length + seeds.length)) * 0.75;
    const dist = Math.min(minDistPx, fitDist);
    targetsPx = poissonSample(toPlace.length, dist, rect, maxThrows, seeds);
    // If the sampler still came up short, relax spacing and fill the rest
    let relax = dist;
    while (targetsPx.length < toPlace.length && relax > 20) {
      relax *= 0.85;
      targetsPx = targetsPx.concat(
        poissonSample(toPlace.length - targetsPx.length, relax, rect, maxThrows,
                      seeds.concat(targetsPx)));
    }
  } else if (mode === 'viewport') {
    // Simple random in viewport (older behavior)
    const m = viewportMargin;
    for (let i = 0; i < toPlace.length; i++) {
      const ndcx = rand(-1 + m, 1 - m);
      const ndcy = rand(-1 + m, 1 - m);
      targetsPx.push({
        x: (ndcx * 0.5 + 0.5) * W,
        y: (-ndcy * 0.5 + 0.5) * H
      });
    }
  } else {
    // Legacy bounds: sample world box then project to px
    for (let i = 0; i < toPlace.length; i++) {
      const pos = new THREE.Vector3(
        rand(bounds.x[0], bounds.x[1]),
        rand(bounds.y[0], bounds.y[1]),
        rand(bounds.z[0], bounds.z[1])
      );
      const spt = worldToScreenRadius(pos, (toPlace[i].size || 1) * sizeMultiplier);
      targetsPx.push({ x: spt.px, y: spt.py });
    }
  }

  // -------- 3) Convert targets (px) to world positions on z = viewportZ --------
  const assigned = [];
  for (let i = 0; i < toPlace.length; i++) {
    const h = toPlace[i];
    const size = (h.size || 1) * sizeMultiplier;

    // fallback if Poisson couldn't fill all (rare)
    const t = targetsPx[i] || { x: rand(0, W), y: rand(0, H) };

    // px → NDC
    const ndcx = (t.x / W) * 2 - 1;
    const ndcy = -((t.y / H) * 2 - 1);

    raycaster.setFromCamera({ x: ndcx, y: ndcy }, cam);
    const pos = new THREE.Vector3();
    const itemPlane = depthRange
      ? new THREE.Plane(new THREE.Vector3(0, 0, 1), -rand(depthRange[0], depthRange[1]))
      : plane;
    raycaster.ray.intersectPlane(itemPlane, pos);

    const spt = worldToScreenRadius(pos, size);
    spt.rpx = Math.max(spt.rpx, 14);

    // enforce spacing vs already-placed (fixed + newly assigned)
    // Targets already come from the spaced sampler; only nudge exact collisions
    let ok = true;
    for (const p of placed.concat(assigned)) {
      if (Math.hypot(spt.px - p.px, spt.py - p.py) < 24) { ok = false; break; }
    }

    if (!ok) {
      // slight jitter retry around the target
      const jitter = 24;
      const tx = Math.max(0, Math.min(W, t.x + rand(-jitter, jitter)));
      const ty = Math.max(0, Math.min(H, t.y + rand(-jitter, jitter)));
      const ndcx2 = (tx / W) * 2 - 1;
      const ndcy2 = -((ty / H) * 2 - 1);
      raycaster.setFromCamera({ x: ndcx2, y: ndcy2 }, cam);
      raycaster.ray.intersectPlane(itemPlane, pos);
    }

    const finalSpt = worldToScreenRadius(pos, size);
    placed.push({ id: h.id, pos, ...finalSpt });
    assigned.push({ px: finalSpt.px, py: finalSpt.py });
    out.push({ id: h.id, position: pos });
  }

  return out; // [{ id, position: THREE.Vector3 }]
}

/** Simple dart-throwing Poisson-disk sampler in a rect (pixel space). */
function poissonSample(count, minDist, rect, maxThrows = 6000, seedPts = []) {
  // keep stars out from under the legend (bottom-left corner)
  const blocked = (x, y) => x < 230 && y > innerHeight - 220;
  const pts = seedPts.slice(); // start with locked points (in px)
  let throws = 0;
  while (pts.length - seedPts.length < count && throws < maxThrows) {
    throws++;
    const x = rect.x + Math.random() * rect.w;
    const y = rect.y + Math.random() * rect.h;
    let ok = !blocked(x, y);
    for (let i = 0; i < pts.length; i++) {
      const dx = x - pts[i].x, dy = y - pts[i].y;
      if (dx*dx + dy*dy < minDist*minDist) { ok = false; break; }
    }
    if (ok) pts.push({ x, y });
  }
  // return only newly added points (exclude seeds)
  return pts.slice(seedPts.length);
}
