import { CATEGORIES } from './config.js';
export function setupOverlay(hotspotsData = []) {
  const overlay = document.getElementById('overlay') || createOverlay();
  const panel   = document.getElementById('panel');
  const closeBtn= document.getElementById('closeBtn');
  const panelContent = document.getElementById('panel-content');
  const panelTitle   = document.getElementById('panel-title');

  function child(tag, attrs={}, ...children){
    const n = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs)){
      if (k === 'class') n.className = v;
      else if (k === 'style') n.setAttribute('style', v);
      else n.setAttribute(k, v);
    }
    for (const c of children) n.append(c);
    return n;
  }

  function openPanelFromHotspot(h) {
    // unified entry point for all hotspot types
    panelTitle.textContent = h.title || 'Content';
    panel.classList.remove('is-essay', 'is-map');
    panel.scrollTop = 0;
    const cat = CATEGORIES[h.category];
    panel.style.setProperty('--accent', cat ? cat.color : '#00aeef');
    panelKicker.textContent = cat ? cat.label : '';
    panelContent.innerHTML = '';

    function stripTags(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // remove scripts/styles
  tmp.querySelectorAll('script,style,noscript').forEach(n => n.remove());
  return tmp.textContent || tmp.innerText || '';
}

function firstSentences(text, count = 2) {
  const t = text.replace(/\s+/g, ' ').trim();
  const parts = t.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý0-9“"(\[])/);
  return parts.slice(0, count).join(' ');
}

async function fetchExcerpt(url, timeoutMs = 3500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { mode: 'cors', signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    // Try <meta name="description"> or og:description first
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const metaDesc =
      doc.querySelector('meta[name=description]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      '';

    if (metaDesc && metaDesc.trim().length > 40) {
      return firstSentences(metaDesc, 2);
    }

    // Else, pull main text from common containers
    const main =
      doc.querySelector('article, main, .content, #content, .mw-parser-output') ||
      doc.body;
    const raw = stripTags(main ? main.innerHTML : html);
    const excerpt = firstSentences(raw, 2);
    return excerpt.length > 20 ? excerpt : '';
  } catch (e) {
    // CORS/timeout/parse issues → no excerpt
    return '';
  } finally {
    clearTimeout(timer);
  }
}

    switch (h.type) {
  case 'video': {
  let embedHTML = '';
  const src = h.src || '';

  // Detect YouTube or Vimeo and generate embed iframe
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    const id = src.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    const videoId = id ? id[1] : '';
    if (videoId)
      embedHTML = `<iframe
        src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        style="width:100%;aspect-ratio:16/9;border-radius:12px;border:1px solid rgba(255,255,255,.08)">
      </iframe>`;
  } else if (src.includes('vimeo.com')) {
    const id = src.match(/vimeo\.com\/(\d+)/);
    const videoId = id ? id[1] : '';
    if (videoId)
      embedHTML = `<iframe
        src="https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        style="width:100%;aspect-ratio:16/9;border-radius:12px;border:1px solid rgba(255,255,255,.08)">
      </iframe>`;
  }

  // Fallback to local video if no embed pattern matched
  if (!embedHTML) {
    embedHTML = `<video controls playsinline style="width:100%;border-radius:12px;border:1px solid rgba(255,255,255,.08)">
                   <source src="${src}" type="video/mp4">
                   Your browser does not support the video tag.
                 </video>`;
  }

  panelContent.innerHTML = `
    <div class="thumb">${embedHTML}</div>
    <p>${h.title || 'Video content'}</p>
  `;
  break;
}

function guessMime(url = '') {
  const u = url.split('?')[0].toLowerCase();
  if (u.endsWith('.mp3')) return 'audio/mpeg';
  if (u.endsWith('.ogg') || u.endsWith('.oga')) return 'audio/ogg';
  if (u.endsWith('.wav')) return 'audio/wav';
  return 'audio/mpeg';
}

  case 'audio': {
  const src = h.src || '';
  let embedHTML = '';

  // --- Detect SoundCloud (soundcloud.com / snd.sc) and build widget iframe ---
  if (/soundcloud\.com|snd\.sc/i.test(src)) {
    const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(src)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=false`;
    embedHTML = `
      <iframe
        title="${(h.title || 'SoundCloud audio').replace(/"/g,'&quot;')}"
        width="100%" height="166"
        allow="autoplay"
        scrolling="no" frameborder="no"
        style="border-radius:12px;border:1px solid rgba(255,255,255,.08);width:100%;aspect-ratio:16/9;background:#0b0d14"
        src="${widgetUrl}">
      </iframe>
    `;
  }

  // --- Fallback: native HTML5 audio for direct files (mp3/ogg/wav) ---
  if (!embedHTML) {
    embedHTML = `
      <audio class="audio" controls preload="metadata" style="width:100%">
        <source src="${src}" type="${guessMime(src)}" />
        Your browser does not support the audio element.
      </audio>
    `;
  }

  panelContent.innerHTML = `
    <div class="thumb">${embedHTML}</div>
    ${h.caption ? `<p style="opacity:.85;margin-top:.5rem">${h.caption}</p>` : ''}
  `;
  break;
}


  case 'image':
    panelContent.append(
      child('img', {
        src: h.src || h.thumb || '',
        alt: h.title || 'image',
        style: 'width:100%;height:auto;border-radius:12px;'
      })
    );
    if (h.caption) {
      panelContent.append(child('p', { style:'opacity:.85;margin:.25rem 0 0' }, h.caption));
    }
    break;

case 'link': {
  const host = (() => {
    try { return new URL(h.url).hostname.replace(/^www\./,''); } catch { return ''; }
  })();
  const card = child('div', { class: 'link-card' });
  if (h.thumb) {
    const img = new Image();
    img.src = h.thumb; img.alt = ''; img.className = 'link-thumb';
    img.onerror = () => img.remove();
    card.appendChild(img);
  }
  const excerptBox = child('p', { class: 'link-excerpt' }, '');
  card.appendChild(excerptBox);
  card.appendChild(child('div', { class: 'link-meta' },
    child('span', { class: 'link-host' }, host),
    child('a', { href: h.url || '#', target: '_blank', rel: 'noopener noreferrer', class: 'link-visit' }, 'Read the source ↗')
  ));
  (async () => {
    if (h.excerpt && h.excerpt.trim()) { excerptBox.textContent = h.excerpt.trim(); return; }
    const ex = await fetchExcerpt(h.url);
    if (ex) excerptBox.textContent = ex; else excerptBox.remove();
  })();
  panelContent.append(card);
  break;
}


  case 'text':
  default:
    if (h.src && /\.html(\?.*)?(#.*)?$/i.test(h.src)) {
      const loading = child('p', { style:'opacity:.8' }, 'Loading…');
      panelContent.append(loading);
      fetch(h.src, { cache: 'no-cache' })
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(html => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          panelContent.innerHTML = `<div class="essay-body">${doc.body.innerHTML}</div>`;
          const body = panelContent.firstElementChild;
          // Paragraphs with several line breaks are verse: set them as poems
          body.querySelectorAll('p').forEach(p => {
            if (p.querySelectorAll('br').length >= 2) p.classList.add('verse');
            if (/^\s*Excerpt from:/i.test(p.textContent)) p.classList.add('source');
          });
          // Reading time (~220 words per minute)
          const words = body.textContent.trim().split(/\s+/).length;
          const mins = Math.max(1, Math.round(words / 220));
          panelKicker.textContent += (panelKicker.textContent ? ' · ' : '') + `${mins} min read`;
          panel.classList.add('is-essay');
          // Long texts split into <section data-page> become a paged reader
          const pages = [...body.querySelectorAll('section[data-page]')];
          if (pages.length > 1) setupPager(body, pages);
          const mapEl = body.querySelector('[data-project-map]');
          if (mapEl) {
            panel.classList.add('is-map');
            import('./projectmap.js').then(m => m.renderProjectMap(mapEl, {
              openHotspot: id => { const t = hotspotsData.find(x => x.id === id); if (t) openPanelFromHotspot(t); }
            }));
          }
        })
        .catch(err => {
          console.error('Failed to load text HTML:', err);
          panelContent.innerHTML = '<p style="opacity:.8">Failed to load text content.</p>';
        });
    } else {
      panelContent.innerHTML = h.content || '<p>No text content.</p>';
    }
    break;
}

    overlay.style.display = 'grid';
    overlay.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>{ overlay.classList.add('is-open'); panel.classList.add('in'); });
  }

  function setupPager(body, pages) {
    const base = panelKicker.textContent;
    const n = pages.length;
    const top = child('nav', { class: 'pager-index', 'aria-label': 'Pages' });
    const bottom = child('nav', { class: 'pager-nav', 'aria-label': 'Page navigation' });
    const prev = child('button', { type: 'button', class: 'pager-btn' }, '← Previous');
    const count = child('span', { class: 'pager-count' }, '');
    const next = child('button', { type: 'button', class: 'pager-btn' }, 'Next →');
    bottom.append(prev, count, next);
    const links = pages.map((pg, i) => {
      const a = child('button', { type: 'button', class: 'pager-link' }, `${i + 1}. ${pg.dataset.title}`);
      a.addEventListener('click', () => show(i));
      top.append(a);
      return a;
    });
    body.prepend(top);
    body.append(bottom);
    let cur = 0;
    function show(i) {
      cur = Math.max(0, Math.min(n - 1, i));
      pages.forEach((pg, k) => { pg.hidden = k !== cur; });
      links.forEach((a, k) => { a.classList.toggle('is-current', k === cur); a.setAttribute('aria-current', k === cur ? 'page' : 'false'); });
      prev.disabled = cur === 0;
      next.disabled = cur === n - 1;
      next.textContent = cur < n - 1 ? `Next: ${pages[cur + 1].dataset.title} →` : 'Next →';
      count.textContent = `Page ${cur + 1} of ${n}`;
      panelKicker.textContent = `${base} · page ${cur + 1} of ${n}`;
      panel.scrollTop = 0;
    }
    prev.addEventListener('click', () => show(cur - 1));
    next.addEventListener('click', () => show(cur + 1));
    show(0);
  }

  function closePanel(){
    if (!overlay.classList.contains('is-open')) return;   // nothing open: don't queue a stale hide
    overlay.classList.remove('is-open'); panel.classList.remove('in');
    const onEnd = (e)=>{ if(e.target !== overlay) return;
      if (overlay.classList.contains('is-open')) { overlay.removeEventListener('transitionend', onEnd); return; }  // reopened meanwhile
      overlay.style.display = 'none'; overlay.setAttribute('aria-hidden','true');
      overlay.removeEventListener('transitionend', onEnd);
    };
    overlay.addEventListener('transitionend', onEnd);
  }

  const panelKicker = document.getElementById('panel-kicker');
  const progress = document.getElementById('panel-progress');
  panel.addEventListener('scroll', () => {
    const max = panel.scrollHeight - panel.clientHeight;
    progress.style.transform = `scaleX(${max > 0 ? panel.scrollTop / max : 0})`;
  });

  closeBtn.addEventListener('click', closePanel);
  // Close when clicking anywhere outside the panel (on the dimmed backdrop)
  overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closePanel(); });
  addEventListener('keydown', (e)=>{ if(e.key==='Escape') closePanel(); });

  return { openPanelFromHotspot, closePanel };

  function createOverlay(){
    const tpl = document.createElement('div');
    tpl.innerHTML = `
      <div class="overlay" id="overlay" aria-hidden="true">
        <article class="panel" id="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
          <header>
            <div class="panel-heading">
              <span class="kicker" id="panel-kicker"></span>
              <h3 id="panel-title">Title</h3>
            </div>
            <button class="close" id="closeBtn" aria-label="Close">×</button>
            <span class="progress" id="panel-progress" aria-hidden="true"></span>
          </header>
          <div class="content" id="panel-content"></div>
        </article>
      </div>`;
    document.body.appendChild(tpl.firstElementChild);
    return document.getElementById('overlay');
  }

}
