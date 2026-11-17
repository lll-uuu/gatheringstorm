// js/app/projectmap.js
// Interactive version of the research map. Coordinates follow the hand-made map (644 x 500).
// link: a hotspot id (opens inside the site) or an external URL.

const CLUSTERS = {
  spell:  { color: '#ff2d95', label: 'Spellbreak' },
  report: { color: '#2f7bff', label: 'Community research report' },
  film:   { color: '#9d3dff', label: 'Field research in Rio de Janeiro' },
};

const NODES = [
  // Spellbreak
  { id: 'spell',   c: 'spell',  x: 192, y: 165, r: 70, label: 'Spellbreak\ntraining', link: 'spellbreak' },
  { id: 'bru',     c: 'spell',  x: 122, y: 102, r: 42, label: 'Spellbreak\ntraining\nBrussels', parent: 'spell' },
  { id: 'maiz',    c: 'spell',  x: 52,  y: 140, r: 40, label: 'maiz\nwebinar', parent: 'spell', link: 'migrazine' },
  { id: 'ber',     c: 'spell',  x: 110, y: 192, r: 42, label: 'Spellbreak\ntraining\nBerlin', parent: 'spell' },
  { id: 'part',    c: 'spell',  x: 74,  y: 252, r: 30, label: 'Participants:\nhow many?\nopen call?\nwhere?', parent: 'ber', small: true },
  { id: 'host',    c: 'spell',  x: 124, y: 262, r: 27, label: 'Host:\nSuperrr', parent: 'ber', small: true },
  // Community research report
  { id: 'report',  c: 'report', x: 238, y: 275, r: 65, label: 'Community\nresearch\nreport' },
  { id: 'video',   c: 'report', x: 338, y: 280, r: 40, label: 'Short format\nvideo\ninterviews', parent: 'report' },
  { id: 'people',  c: 'report', x: 302, y: 222, r: 26, label: 'Beach workers\nIT expert\nAI researcher\nGeologist', parent: 'video', small: true },
  { id: 'write',   c: 'report', x: 232, y: 362, r: 40, label: 'Write-up', parent: 'report' },
  { id: 'pub',     c: 'report', x: 305, y: 350, r: 42, label: 'Short form\npublication', parent: 'report' },
  { id: 'formats', c: 'report', x: 275, y: 414, r: 28, label: 'Video\n& text.\nPrint\n& digital?', parent: 'pub', small: true },
  // Field research in Rio de Janeiro
  { id: 'film',    c: 'film',   x: 440, y: 285, r: 72, label: 'Field\nresearch in\nRio de Janeiro' },
  { id: 'niob',    c: 'film',   x: 400, y: 182, r: 40, label: 'Niobium &\ncloud\nmilitarisation', parent: 'film', link: 'link-10' },
  { id: 'drone',   c: 'film',   x: 338, y: 150, r: 24, label: 'Drone strikes\non\nVenezuelan\nboats', parent: 'niob', small: true, link: 'boat-strikes' },
  { id: 'usmil',   c: 'film',   x: 386, y: 118, r: 28, label: 'Increased\nUS military\npresence in\nLatAm &\nCaribbean', parent: 'niob', small: true, link: 'us-buildup' },
  { id: 'araxa',   c: 'film',   x: 438, y: 130, r: 26, label: 'Araxá\nmine\n(MG)', parent: 'niob', small: true, link: 'araxa' },
  { id: 'silica',  c: 'film',   x: 500, y: 198, r: 42, label: 'Silica sand\nextraction', parent: 'film' },
  { id: 'belm',    c: 'film',   x: 566, y: 196, r: 28, label: 'Belmonte\nsilica sand\ndistrict\n(BA)', parent: 'silica', small: true, link: 'belmonte' },
  { id: 'dc',      c: 'film',   x: 540, y: 278, r: 42, label: 'Data center\npolicy in BR\n&\ndigital\ngold rush', parent: 'film', link: 'link-6' },
  { id: 'rio',     c: 'film',   x: 602, y: 242, r: 24, label: 'Rio AI City', parent: 'dc', small: true, link: 'rio-ai-city' },
  { id: 'eld',     c: 'film',   x: 605, y: 296, r: 26, label: 'Eldorado\ndo Sul (RS)', parent: 'dc', small: true, link: 'link-8' },
  { id: 'cauc',    c: 'film',   x: 572, y: 346, r: 26, label: 'Caucaia (CE)\n& Pecém Port', parent: 'dc', small: true, link: 'link-7' },
  { id: 'ppp',     c: 'film',   x: 552, y: 402, r: 42, label: 'Private-\npublic\npartnerships\nGovernment\ncontracts', parent: 'film', link: 'link-5' },
  { id: 'sov',     c: 'film',   x: 478, y: 368, r: 42, label: 'Digital\nsovereignty\n&\nUS imperialism', parent: 'film', link: 'link-4' },
  { id: 'pix',     c: 'film',   x: 392, y: 366, r: 42, label: 'PIX', parent: 'film', link: 'link-2' },
  { id: 'tariff',  c: 'film',   x: 432, y: 432, r: 27, label: 'Trump tariffs\n&\nthreats\nover PIX', parent: 'pix', small: true, link: 'pix-301' },
  { id: 'interf',  c: 'film',   x: 500, y: 442, r: 27, label: 'Direct US\ninterference\nin BR legal\nprocesses', parent: 'sov', small: true, link: 'moraes' },
  { id: 'alliance',c: 'film',   x: 540, y: 468, r: 26, label: 'Trump-\nBolsonaro\nalliance', parent: 'sov', small: true, link: 'trump-bolsonaro' },
];

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };

export function renderProjectMap(container, { openHotspot }) {
  container.innerHTML = '';
  const svg = el('svg', { viewBox: '0 40 644 460', role: 'img', 'aria-label': 'Interactive map of the research project', class: 'pm-svg' });
  const caption = document.createElement('p');
  caption.className = 'pm-caption';
  const hint = 'Hover a bubble to follow its thread. Bubbles with a ring open related material.';
  caption.textContent = hint;

  // largest first, so small bubbles sit on top and stay clickable
  const sorted = [...NODES].sort((a, b) => b.r - a.r);
  const groups = new Map();

  sorted.forEach((n, i) => {
    const color = CLUSTERS[n.c].color;
    const g = el('g', { class: `pm-node pm-${n.c}${n.link ? ' pm-linked' : ''}`, tabindex: n.link ? '0' : '-1' });
    g.style.setProperty('--d', `${(i * 0.37) % 4}s`);
    g.style.transformOrigin = `${n.x}px ${n.y}px`;
    g.append(el('circle', { cx: n.x, cy: n.y, r: n.r, fill: color, class: 'pm-fill' }));
    if (n.link) g.append(el('circle', { cx: n.x, cy: n.y, r: n.r + 3.5, fill: 'none', stroke: color, class: 'pm-ring' }));
    const lines = n.label.split('\n');
    const fs = n.small ? 6.2 : (n.r > 60 ? 13 : 8.4);
    const t = el('text', { x: n.x, y: n.y - ((lines.length - 1) * fs * 1.15) / 2, 'font-size': fs, class: 'pm-label' });
    lines.forEach((line, k) => {
      const ts = el('tspan', { x: n.x, dy: k === 0 ? fs * 0.35 : fs * 1.15 });
      ts.textContent = line;
      t.append(ts);
    });
    g.append(t);
    svg.append(g);
    groups.set(n.id, g);

    const branch = () => {   // the node, its ancestors and descendants
      const ids = new Set([n.id]);
      let p = n.parent; while (p) { ids.add(p); p = NODES.find(x => x.id === p).parent; }
      // descendants of this node only (not of its ancestors)
      const down = new Set([n.id]);
      let grew = true;
      while (grew) { grew = false; for (const x of NODES) if (x.parent && down.has(x.parent) && !down.has(x.id)) { down.add(x.id); grew = true; } }
      down.forEach(id => ids.add(id));
      return ids;
    };
    const on = () => {
      const ids = branch();
      svg.classList.add('pm-focus');
      for (const [id, gg] of groups) gg.classList.toggle('pm-lit', ids.has(id));
      caption.textContent = `${CLUSTERS[n.c].label}: ${n.label.replace(/\n/g, ' ')}` + (n.link ? '  (click to open)' : '');
    };
    const off = () => { svg.classList.remove('pm-focus'); caption.textContent = hint; };
    const open = () => {
      if (!n.link) return;
      if (/^https?:/.test(n.link)) window.open(n.link, '_blank', 'noopener');
      else openHotspot(n.link);
    };
    g.addEventListener('mouseenter', on);
    g.addEventListener('focus', on);
    g.addEventListener('mouseleave', off);
    g.addEventListener('blur', off);
    g.addEventListener('click', open);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  const key = document.createElement('div');
  key.className = 'pm-key';
  key.innerHTML = Object.values(CLUSTERS).map(c => `<span><i style="background:${c.color}"></i>${c.label}</span>`).join('');

  container.append(svg, caption, key);
}
