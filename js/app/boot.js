import { loadFonts } from './fonts.js';

// ... inside the main async IIFE, before sceneSetup(...)
// Never let font loading hold up the page for more than 2 seconds
await Promise.race([loadFonts(), new Promise(r => setTimeout(r, 2000))]);

// js/app/boot.js
//import { initFog }          from './fog.js';
import { initClouds } from './clouds.js';
import { sceneSetup }       from './scene.js';
import { setupVeil }        from './veil.js';
import { setupOverlay }     from './ui.js';
import { runSmokeTests }    from './tests.js';
import { collectAssets, preloadAssets } from './loader.js';
import { CATEGORIES } from './config.js';

// ---------- error reporter ----------
const errBox = document.getElementById('err');
function report(msg){
  if (!errBox) return;
  errBox.style.display = 'block';
  errBox.textContent = msg;
  console.error(msg);
}

// ---------- main ----------
(async () => {
  try {
    // CDN sanity (don’t throw, just warn)
    if (!window.THREE)  report('THREE did not load. Check network/CDN.');
    if (window.THREE && !THREE.OrbitControls) report('OrbitControls did not load.');

    const appEl  = document.getElementById('app');
    const veilEl = document.getElementById('veil');
    const testsEl= document.getElementById('tests');

    // 1) Load hotspots.json (no hard fail; fallback data)
    let hotspotsData = [];
    try {
      const res = await fetch('./hotspots.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      hotspotsData = await res.json();
    } catch (e) {
      report('Could not load hotspots.json (using fallback data).');
      console.warn(e);
      hotspotsData = [
        { id:'text-fallback', title:'Fallback Text', type:'text', content:'Hotspots failed to load.', size:1.0, color:'#ffffff' }
      ];
    }

    // 2) Quick validator (logs only)
    (function validateHotspots(data){
      const issues = [];
      const isHex = v => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
      data.forEach(h => {
        if (h.color && !isHex(h.color)) issues.push(`${h.id}: invalid color "${h.color}" (use #rrggbb)`);
        if (h.type === 'video' && !h.src && !(h.sources && h.sources.length)) {
          issues.push(`${h.id}: video has no src or sources[]`);
        }
        if (h.type === 'link' && !h.url) issues.push(`${h.id}: link has no url`);
      });
      if (issues.length) console.warn('[hotspots validation]\\n' + issues.join('\\n'));
    })(hotspotsData);

    // 3) Preload assets (non-blocking feel; still no hard fail)
    try {
      const assets = collectAssets(hotspotsData);
      if (assets.length) {
        testsEl && (testsEl.textContent = `Loading: 0/${assets.length}`);
        // Wait at most 3 seconds for preloading, then start anyway
        await Promise.race([
          preloadAssets(assets, (done, total) => {
            testsEl && (testsEl.textContent = `Loading: ${done}/${total}`);
          }),
          new Promise(r => setTimeout(r, 3000))
        ]);
      }
      testsEl && (testsEl.textContent = 'Loaded');
    } catch (preErr) {
      console.warn('Preload warning:', preErr);
    }

    /* Fog
    initFog('#bg');
    */

    // Clouds
    initClouds('#bg');

    // 5) Calls js/app/layout.js
    try {
      const { computeNonOverlappingPositions } = await import('./layout.js');
      const laidOut = computeNonOverlappingPositions(hotspotsData, {
        mode: 'viewportPoisson',
        viewportZ: -18,       // fallback plane if depthRange is off
        depthRange: [-28, -10], // stars sit at different depths: parallax when you drag
        topBias: 0.08,        // keep only a thin band clear at the top
        viewportMargin: 0.04, // margin from edges
        minDistPx: 260,       // upper bound; shrinks automatically to fit every item
        // legacy knobs still honored for fixed items' overlap estimation:
        paddingPx: 32,
        fov: 60,
        cameraPos: new THREE.Vector3(0, 4, 12),
        sizeMultiplier: 1.3
      });
      for (const l of laidOut) {
        const h = hotspotsData.find(x => x.id === l.id);
        if (h && (!Array.isArray(h.position) || h.position.length !== 3)) {
          h.position = [ l.position.x, l.position.y, l.position.z ];
        }
      }

    } catch (layoutErr) {
      console.warn('Layout step skipped or failed (this is OK if you didn’t add layout.js):', layoutErr);
    }

    // 6) Scene (safe even if some positions missing; relies on your updated scene.js)
    const { renderer, scene, camera, controls, raycaster, mouse, hotspots, animateFrame, render, setHighlight } =
      sceneSetup(appEl, hotspotsData);

    // 6b) Legend: one row per category in use; hover to highlight that kind of star
    const legend = document.createElement('nav');
    legend.className = 'legend';
    legend.setAttribute('aria-label', 'Kinds of content');
    for (const [key, c] of Object.entries(CATEGORIES)) {
      const n = hotspotsData.filter(h => h.category === key).length;
      if (!n) continue;
      const row = document.createElement('button');
      row.type = 'button';
      row.innerHTML = `<span class="legend-star" style="color:${c.color}">*</span>${c.label}<span class="legend-n">${n}</span>`;
      row.addEventListener('mouseenter', () => setHighlight(key));
      row.addEventListener('focus', () => setHighlight(key));
      row.addEventListener('mouseleave', () => setHighlight(null));
      row.addEventListener('blur', () => setHighlight(null));
      legend.appendChild(row);
    }
    document.body.appendChild(legend);

    // 7) Veil / peephole follow + hover expansion
    const veil = setupVeil(renderer, camera, hotspots, veilEl);

    // 8) Overlay: click opens content (uses id)
    const { openPanelFromHotspot } = setupOverlay(hotspotsData);
    renderer.domElement.addEventListener('click', ()=>{
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObjects(hotspots, true)[0];
      if (hit) {
        const group = hit.object.type === 'Group' ? hit.object : hit.object.parent;
        if (!group || !group.userData) return;
        const h = hotspotsData.find(x => x.id === group.userData.id);
        if (h) openPanelFromHotspot(h);
      }
    });

    // Keep mouse vector updated for raycasting, show titles on hover
    renderer.domElement.addEventListener('mousemove', (e)=>{
  const rect = renderer.domElement.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // existing ray input
  mouse.x = (x/rect.width)*2 - 1;
  mouse.y = -((y/rect.height)*2 - 1);

  // raycast hit test
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(hotspots, true)[0];
  if (hit) {
    // groups store id/title in userData
    const group = hit.object.type === 'Group' ? hit.object : hit.object.parent;
    if (group && group.userData && group.userData.id) {
      const h = hotspotsData.find(d => d.id === group.userData.id);
      const title = (h && h.title) || group.userData.title || 'Untitled';
      // position tooltip using page coords
      showTip(title, e.clientX, e.clientY - 10);
      return;
    }
  }
  hideTip();
});
renderer.domElement.addEventListener('mouseleave', hideTip);

renderer.domElement.addEventListener('touchstart', (e)=>{
  const t = e.touches && e.touches[0];
  if (!t) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const x = t.clientX - rect.left;
  const y = t.clientY - rect.top;
  mouse.x = (x/rect.width)*2 - 1;
  mouse.y = -((y/rect.height)*2 - 1);

  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(hotspots, true)[0];
  if (hit) {
    const group = hit.object.type === 'Group' ? hit.object : hit.object.parent;
    if (group && group.userData && group.userData.id) {
      const h = hotspotsData.find(d => d.id === group.userData.id);
      const title = (h && h.title) || group.userData.title || 'Untitled';
      showTip(title, t.clientX, t.clientY - 12);
      setTimeout(hideTip, 900); // fade after a moment
    }
  }
}, { passive: true });


    // 9) Loop (never skipped)
    function loop(){
      try {
        animateFrame();
        veil.tick();
        render();
      } catch(loopErr){
        report('Render loop error. See console.'); console.error(loopErr);
      }
      requestAnimationFrame(loop);
    }
    loop();

    // 10) Tests
    runSmokeTests({ renderer, camera, hotspots });

  } catch (e) {
    report('Fatal init error — see console for details.');
    console.error(e);
  }

  // --- Tooltip element
const tip = document.createElement('div');
tip.className = 'tooltip';
tip.setAttribute('aria-hidden', 'true');
document.body.appendChild(tip);

function placeTip(x, y) {
  const pad = 8;
  const w = tip.offsetWidth || 120;
  const h = tip.offsetHeight || 30;
  let tx = x, ty = y;
  // Keep inside viewport
  if (tx < pad + w/2) tx = pad + w/2;
  if (tx > innerWidth - pad - w/2) tx = innerWidth - pad - w/2;
  if (ty < pad + h) ty = pad + h;
  if (ty > innerHeight - pad) ty = innerHeight - pad;
  tip.style.left = `${tx}px`;
  tip.style.top  = `${ty}px`;
}
function showTip(text, x, y) {
  tip.textContent = text;
  placeTip(x, y);
  tip.classList.add('show');
  tip.setAttribute('aria-hidden', 'false');
}
function hideTip() {
  tip.classList.remove('show');
  tip.setAttribute('aria-hidden', 'true');
}

})();
