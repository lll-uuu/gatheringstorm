// Extract urls from hotspots.json
export function collectAssets(hotspots) {
  // Only preload files that live on this site (images, audio, video).
  // External links, YouTube and SoundCloud pages can't be preloaded by the browser anyway,
  // and waiting on them stalled the whole page whenever one of those sites was slow.
  const urls = new Set();
  const local = u => u && !/^https?:\/\//i.test(u);
  for (const h of hotspots) {
    if (local(h.thumb)) urls.add(h.thumb);
    if ((h.type === 'image' || h.type === 'audio' || h.type === 'video') && local(h.src)) urls.add(h.src);
  }
  return [...urls];
}

// Generic preloader with progress callback
export async function preloadAssets(urls, onProgress = () => {}) {
  let done = 0;
  const total = urls.length || 1;

  const tasks = urls.map(url => {
    const clean = url.split('?')[0].split('#')[0];
    const ext = (clean.split('.').pop() || '').toLowerCase();
    if (url.startsWith('data:image/')) {
      return loadImage(url);
    } else if (url.startsWith('data:audio/')) {
      return loadAudio(url);
    } else if (['png','jpg','jpeg','webp','gif','avif'].includes(ext)) {
      return loadImage(url);
    } else if (['mp3','ogg','wav','m4a'].includes(ext)) {
      return loadAudio(url);
    } else if (['mp4','webm','mov','m4v'].includes(ext)) {
      return loadVideo(url);
    } else {
      return fetch(url, { method: 'HEAD' });
    }
  }).map(p => p.then(v => { done++; onProgress(done, total); return v; }));

  await Promise.allSettled(tasks);
}

function loadImage(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(url);
    img.onerror = rej;
    img.src = url;
  });
}

function loadAudio(url) {
  return new Promise((res) => {
    const a = new Audio();
    a.preload = 'auto';
    const timer = setTimeout(() => res(url), 4000);
    a.addEventListener('canplaythrough', () => { clearTimeout(timer); res(url); }, { once:true });
    a.src = url;
  });
}

function loadVideo(url) {
  return new Promise((res) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    const timer = setTimeout(() => res(url), 5000);
    v.addEventListener('loadeddata', () => { clearTimeout(timer); res(url); }, { once:true });
    v.src = url;
  });
}
