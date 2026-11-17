/* FOG cofig
export const FOG_OPTIONS = {
  speed: 1.0,
  backgroundAlpha: 1.0,
  baseColor: 0xEAF4FF,
  highlightColor: 0xd8abff,
  lowlightColor: 0x9900e0,
  midtoneColor: 0x0090fc,
  blurFactor: 0.2
};
*/

// CLOUD config
export const CLOUDS_OPTIONS = {
  // motion
  speed: 1.3,
  // palette: brighter, more saturated (v2)
  backgroundColor: 0x2a00e0, // page tint behind clouds
  skyColor:        0x1238ff, // electric blue sky
  cloudColor:      0xa82ee6, // violet-magenta cloud body
  cloudShadowColor:0x1f007a, // violet shadows
  sunColor:        0xff9a1f, // sun
  sunGlareColor:   0xffd0f2, // orange glare
  sunlightColor:   0xffb8ec, // warm ambient light
  zoom: 4.0,
};

export const VEIL = {
  rMin: 50,
  rMax: 100,
  ease: 0.12
};

// CATEGORIES: each kind of content gets its own star.
// color = glyph + glow, ring = an orbiting halo (marks your own research), pulse = breathing speed
export const CATEGORIES = {
  writing:  { label: 'Essays & stories', color: '#00f0ff', ring: false, pulse: 1.6 },
  research: { label: 'Research',         color: '#b6ff00', ring: true,  pulse: 1.0 },
  reading:  { label: 'Reading list',     color: '#ffe500', ring: true,  pulse: 1.0 },
  news:     { label: 'Field notes',      color: '#ff8a00', ring: false, pulse: 2.2 },
  media:    { label: 'Sound & image',    color: '#ffffff', ring: false, pulse: 0.7 },
};
