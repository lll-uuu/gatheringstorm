// js/app/clouds.js
import { CLOUDS_OPTIONS } from './config.js';

export function initClouds(bgSelector = '#bg') {
  if (!window.VANTA || !VANTA.CLOUDS) return null;
  try {
    return VANTA.CLOUDS({
      el: bgSelector,
      mouseControls: true,
      touchControls: true,
      gyroControls: true,
      minHeight: 200,
      minWidth: 200,
      scale: 2,
      scaleMobile: 4,
      ...CLOUDS_OPTIONS
    });
  } catch (e) {
    console.warn('VANTA CLOUDS init failed:', e);
    return null;
  }
}
