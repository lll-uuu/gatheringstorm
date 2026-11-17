import { VEIL } from './config.js';

export function setupVeil(renderer, camera, hotspots, veilEl) {
  let rCurrent = VEIL.rMin;
  let rTarget  = VEIL.rMin;

  function updateVeilFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    veilEl.style.setProperty('--x', x + 'px');
    veilEl.style.setProperty('--y', y + 'px');

    // raycast for hover expansion
    const mouse = new THREE.Vector2();
    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -((y / rect.height) * 2 - 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(hotspots, true)[0];
    rTarget = hit ? VEIL.rMax : VEIL.rMin;
  }

  function tick() {
    rCurrent += (rTarget - rCurrent) * VEIL.ease;
    veilEl.style.setProperty('--r', rCurrent.toFixed(2) + 'px');
  }

  renderer.domElement.addEventListener('mousemove', updateVeilFromEvent);
  renderer.domElement.addEventListener('mouseenter', updateVeilFromEvent);

  return { tick };
}
