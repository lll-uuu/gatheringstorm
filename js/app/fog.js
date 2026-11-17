import { FOG_OPTIONS } from './config.js';

export function initFog(bgSelector = '#bg') {
  if (!window.VANTA || !VANTA.FOG) return null;
  try {
    return VANTA.FOG({
      el: bgSelector,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 2,
      scaleMobile: 4,
      zoom: 1.0,
      ...FOG_OPTIONS
    });
  } catch (e) {
    console.warn('VANTA init failed:', e);
    return null;
  }
}
