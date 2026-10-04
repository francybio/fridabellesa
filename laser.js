/* ==========================================================
   FRIDA BELLESA — cursor láser que borra el texto
   Cada clic dispara el láser: la palabra se "escarcha" en blanco
   (como la piel justo después de una sesión real) y estalla en
   partículas de tinta. Seleccionar texto lo barre entero.
   ========================================================== */
(() => {
'use strict';

const $ = (s, c = document) => c.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const T = {
  es: { erase: 'Borrar', words: n => `${n} ${n === 1 ? 'palabra borrada' : 'palabras borradas'}`, restore: 'Restaurar', sound: 'Sonido del láser' },
  ca: { erase: 'Esborrar', words: n => `${n} ${n === 1 ? 'paraula esborrada' : 'paraules esborrades'}`, restore: 'Restaurar', sound: 'So del làser' },
  en: { erase: 'Erase', words: n => `${n} ${n === 1 ? 'word erased' : 'words erased'}`, restore: 'Restore', sound: 'Laser sound' }
};
const tr = () => T[document.documentElement.lang] || T.es;

// donde NO se borra: controles, enlaces y piezas del propio láser
const NOZAP = 'a,button,input,label,select,textarea,option,summary,[contenteditable],[data-nozap],.laser,.loader,.lab__stage,.zap-pill,iframe,script,style';
const INTERACTIVE = 'a,button,label,input,select,textarea,summary,[data-cursor]';

/* ----------------------------------------------------------
   CANVAS DE EFECTOS
   ---------------------------------------------------------- */
const cv = document.createElement('canvas');
cv.className = 'fx';
cv.setAttribute('aria-hidden', 'true');
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
let W = 0, H = 0;
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.width = `${W}px`; cv.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener('resize', resize);

const parts = [], rings = [], glows = [];
const FROST = '#ffffff';
let running = false, last = 0;
function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); } }

function tick(now) {
  const dt = Math.min(40, now - last); last = now;
  ctx.clearRect(0, 0, W, H);

  // destellos y eritema (la piel enrojecida tras el disparo)
  for (let i = glows.length - 1; i >= 0; i--) {
    const g = glows[i]; g.t += dt;
    const p = g.t / g.life;
    if (p >= 1) { glows[i] = glows[glows.length - 1]; glows.pop(); continue; }
    if (g.type === 'flash') {
      const r = g.r * (.35 + .65 * easeOut(p));
      const a = (1 - p) * (1 - p);
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r);
      grd.addColorStop(0, `rgba(255,255,255,${a})`);
      grd.addColorStop(.22, `rgba(255,220,226,${a * .85})`);
      grd.addColorStop(.55, `rgba(255,46,77,${a * .28})`);
      grd.addColorStop(1, 'rgba(255,46,77,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(g.x, g.y, r, 0, Math.PI * 2); ctx.fill();
    } else {
      // halo elíptico y difuso, como la piel enrojecida tras el láser
      const a = Math.min(1, p * 6) * Math.pow(1 - p, 1.5) * .3;
      const cx = g.x + g.w / 2, cy = g.y + g.h / 2, ry = g.h * .9;
      ctx.save();
      ctx.translate(cx, cy); ctx.scale((g.w / 2 + g.h * .5) / ry, 1);
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      grd.addColorStop(0, `rgba(232,96,116,${a})`);
      grd.addColorStop(.55, `rgba(232,96,116,${a * .45})`);
      grd.addColorStop(1, 'rgba(232,96,116,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(0, 0, ry, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // ondas expansivas
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt;
    const p = r.t / r.life;
    if (p >= 1) { rings[i] = rings[rings.length - 1]; rings.pop(); continue; }
    ctx.strokeStyle = `rgba(${r.c},${(1 - p) * r.a})`;
    ctx.lineWidth = r.w * (1 - p) + .4;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * easeOut(p), 0, Math.PI * 2); ctx.stroke();
  }

  // partículas de tinta
  for (let i = parts.length - 1; i >= 0; i--) {
    const q = parts[i]; q.t += dt;
    let color, alpha, size;
    if (q.t < q.d) {
      // la tinta se queda quieta y se "escarcha" justo antes de romperse
      color = q.t > q.d * .45 ? FROST : q.c; alpha = q.a; size = q.s;
    } else {
      const k = Math.pow(q.drag, dt / 16);
      q.vx *= k; q.vy = q.vy * k + q.g * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.life -= dt / q.ttl;
      if (q.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      color = (q.t - q.d) < 90 ? FROST : q.c;
      alpha = q.a * Math.pow(q.life, 1.3);
      size = q.s * (.35 + .65 * q.life);
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size);
  }
  ctx.globalAlpha = 1;

  if (parts.length || rings.length || glows.length) requestAnimationFrame(tick);
  else { running = false; ctx.clearRect(0, 0, W, H); }
}

/* ----------------------------------------------------------
   DISPARO
   ---------------------------------------------------------- */
function fire(x, y, power = 1) {
  if (reduced) power *= .6;
  glows.push({ type: 'flash', x, y, r: 64 * power, life: 280, t: 0 });
  rings.push({ x, y, r0: 3, r1: 46 * power, life: 420, t: 0, w: 2.2, c: '255,46,77', a: .95 });
  rings.push({ x, y, r0: 6, r1: 86 * power, life: 700, t: 0, w: 1.2, c: '168,107,118', a: .6 });
  if (!reduced) {
    for (let i = 0; i < 12 * power; i++) {
      const ang = Math.random() * Math.PI * 2, sp = .3 + Math.random() * .55;
      parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 0, drag: .9, t: 0, d: 0, life: 1, ttl: 200 + Math.random() * 180, s: 1.8, a: 1, c: i % 3 ? '#FF2E4D' : '#FFD6DD' });
    }
  }
  kick();
}

// salpicadura de tinta en un punto (la usa el simulador)
function burst(x, y, colors, n = 60) {
  if (reduced) return;
  const list = Array.isArray(colors) ? colors : [colors];
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2, sp = Math.random() * .32;
    parts.push({
      x: x + (Math.random() - .5) * 18, y: y + (Math.random() - .5) * 18,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - .06,
      g: .0006, drag: .94, t: 0, d: 30 + Math.random() * 70, life: 1, ttl: 600 + Math.random() * 700,
      s: 1.2 + Math.random() * 1.8, a: .9, c: list[i % list.length]
    });
  }
  kick();
}

/* ----------------------------------------------------------
   DE PALABRA A PARTÍCULAS
   ---------------------------------------------------------- */
const off = document.createElement('canvas');
const octx = off.getContext('2d', { willReadFrequently: true });

function parseRGB(str) {
  const m = (str.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
  return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1];
}
function effectiveOpacity(el) {
  let o = 1;
  for (let e = el; e && e !== document.body; e = e.parentElement) {
    const v = parseFloat(getComputedStyle(e).opacity);
    if (v < 1) o *= v;
  }
  return o;
}

function shatter(span, ox, oy) {
  const r = span.getBoundingClientRect();
  if (!r.width || !r.height || r.bottom < 0 || r.top > H) return;
  const cs = getComputedStyle(span);
  const col = parseRGB(cs.color);
  const alpha = col[3] * effectiveOpacity(span);
  if (alpha < .03) return;
  let text = span.textContent;
  if (cs.textTransform === 'uppercase') text = text.toUpperCase();
  else if (cs.textTransform === 'lowercase') text = text.toLowerCase();
  const fs = parseFloat(cs.fontSize) || 16;
  const pad = Math.ceil(fs * .5);
  const w = Math.ceil(r.width) + pad * 2, h = Math.ceil(r.height) + pad * 2;
  if (w * h > 1.5e6) return;

  off.width = w; off.height = h;
  octx.clearRect(0, 0, w, h);
  octx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  if ('letterSpacing' in octx) octx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
  octx.textBaseline = 'alphabetic';
  octx.fillStyle = '#000';
  const m = octx.measureText(text);
  const fa = m.fontBoundingBoxAscent || fs * .8, fd = m.fontBoundingBoxDescent || fs * .2;
  const base = pad + fa * (r.height / (fa + fd));
  const sx = m.width ? clamp(r.width / m.width, .8, 1.2) : 1;
  octx.save(); octx.translate(pad, 0); octx.scale(sx, 1); octx.fillText(text, 0, base); octx.restore();

  const data = octx.getImageData(0, 0, w, h).data;
  const step = fs < 18 ? 1 : fs < 44 ? 2 : 3;
  const pts = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 110) pts.push(x, y);
  const MAX = 2600;
  const keep = pts.length / 2 > MAX ? MAX / (pts.length / 2) : 1;
  const left = r.left - pad, top = r.top - pad;
  const c = `rgb(${col[0]},${col[1]},${col[2]})`;

  for (let i = 0; i < pts.length; i += 2) {
    if (keep < 1 && Math.random() > keep) continue;
    const px = left + pts[i], py = top + pts[i + 1];
    const dx = px - ox, dy = py - oy, dist = Math.hypot(dx, dy) || 1;
    const vapor = Math.random() < .28;
    const push = 1 / (1 + dist / 240);
    const sp = vapor ? .04 + Math.random() * .1 : .1 + Math.random() * .42 * push;
    const ang = Math.atan2(dy, dx) + (Math.random() - .5) * 1.5;
    parts.push({
      x: px, y: py,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - (vapor ? .05 + Math.random() * .08 : Math.random() * .12),
      g: vapor ? -.00004 : .0008 + Math.random() * .0006,
      drag: vapor ? .965 : .93,
      t: 0, d: 40 + dist / .85 + Math.random() * 40,
      life: 1, ttl: (vapor ? 950 : 620) + Math.random() * 700,
      s: step * (vapor ? 1.5 : 1.05) * (.8 + Math.random() * .5),
      a: alpha * (vapor ? .5 : 1), c
    });
  }
  glows.push({ type: 'skin', x: r.left - 4, y: r.top + r.height * .12, w: r.width + 8, h: r.height * .76, life: 1600, t: 0 });
  kick();
}

/* ----------------------------------------------------------
   ¿QUÉ PALABRA HAY BAJO EL CURSOR?
   ---------------------------------------------------------- */
function caretAt(x, y) {
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(x, y);
    return p ? { node: p.offsetNode, offset: p.offset } : null;
  }
  if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  return null;
}
function zappable(node) {
  if (!node || node.nodeType !== 3 || !node.data.trim()) return false;
  const el = node.parentElement;
  return !!el && !el.closest(NOZAP) && !el.classList.contains('zap');
}
function wordAt(x, y) {
  const c = caretAt(x, y);
  if (!c || !zappable(c.node)) return null;
  const t = c.node.data;
  let i = c.offset;
  if (i >= t.length || /\s/.test(t[i])) i -= 1;
  if (i < 0 || /\s/.test(t[i])) return null;
  let s = i, e = i + 1;
  while (s > 0 && !/\s/.test(t[s - 1])) s--;
  while (e < t.length && !/\s/.test(t[e])) e++;
  const range = document.createRange();
  range.setStart(c.node, s); range.setEnd(c.node, e);
  const hit = [...range.getClientRects()].some(b => x >= b.left - 3 && x <= b.right + 3 && y >= b.top - 3 && y <= b.bottom + 3);
  return hit ? range : null;
}

/* ----------------------------------------------------------
   BORRAR
   ---------------------------------------------------------- */
let count = 0;
function wrap(range) {
  const span = document.createElement('span');
  span.className = 'zap';
  try { range.surroundContents(span); } catch (e) { return null; }
  return span;
}
function erase(span, ox, oy) {
  if (!span.getClientRects().length) return false;
  if (!reduced) shatter(span, ox, oy);
  span.classList.add('is-gone');
  count++;
  updatePill();
  return true;
}
function zapAt(x, y) {
  const range = wordAt(x, y);
  if (!range) return false;
  const span = wrap(range);
  return span ? erase(span, x, y) : false;
}

// seleccionar texto con el ratón = barrido láser de toda la selección
function sweep(sel) {
  const range = sel.getRangeAt(0);
  const rootNode = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode;
  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (range.intersectsNode(n) && zappable(n)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  });
  const items = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const s0 = n === range.startContainer ? range.startOffset : 0;
    const e0 = n === range.endContainer ? range.endOffset : n.data.length;
    const local = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(n.data))) {
      const s = m.index, e = s + m[0].length;
      if (e > s0 && s < e0) local.push([Math.max(s, s0), Math.min(e, e0)]);
    }
    // de atrás hacia delante para que los offsets sigan siendo válidos al partir el nodo
    for (let i = local.length - 1; i >= 0; i--) items.push({ n, s: local[i][0], e: local[i][1] });
  }
  sel.removeAllRanges();
  const spans = [];
  for (const it of items) {
    if (spans.length >= 140) break;
    const r = document.createRange();
    r.setStart(it.n, it.s); r.setEnd(it.n, it.e);
    const sp = wrap(r);
    if (sp) spans.push(sp);
  }
  spans.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
  spans.forEach((sp, i) => setTimeout(() => {
    const b = sp.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    if (i % 2 === 0) { fire(cx, cy, .55); snap(.45); }
    erase(sp, cx, cy);
  }, i * 45));
  return spans.length > 0;
}

function restore() {
  document.querySelectorAll('.zap').forEach(sp => {
    sp.classList.remove('is-gone');
    sp.classList.add('is-heal');
    setTimeout(() => {
      const p = sp.parentNode;
      if (!p) return;
      sp.replaceWith(...sp.childNodes);
      p.normalize();
    }, 1000);
  });
  count = 0;
  updatePill();
}

/* ----------------------------------------------------------
   SONIDO · chasquido del disparo (Web Audio, sin archivos)
   ---------------------------------------------------------- */
let actx = null, noise = null;
let soundOn = true;
try { soundOn = localStorage.getItem('fb-laser-sound') !== '0'; } catch (e) { /* sin almacenamiento */ }
function snap(vol = 1) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    if (!noise) {
      const len = Math.floor(actx.sampleRate * .05);
      noise = actx.createBuffer(1, len, actx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    }
    const t0 = actx.currentTime;
    const src = actx.createBufferSource(); src.buffer = noise;
    const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    const g = actx.createGain(); g.gain.value = .2 * vol;
    src.connect(hp); hp.connect(g); g.connect(actx.destination); src.start(t0);
    const o = actx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(190, t0); o.frequency.exponentialRampToValueAtTime(55, t0 + .07);
    const og = actx.createGain();
    og.gain.setValueAtTime(.16 * vol, t0); og.gain.exponentialRampToValueAtTime(.0001, t0 + .09);
    o.connect(og); og.connect(actx.destination); o.start(t0); o.stop(t0 + .1);
  } catch (e) { /* sin audio */ }
}

/* ----------------------------------------------------------
   CONTADOR + RESTAURAR
   ---------------------------------------------------------- */
const pill = $('.zap-pill');
const pillText = pill && $('.zap-pill__text', pill);
const pillRestore = pill && $('.zap-pill__restore', pill);
const pillSound = pill && $('.zap-pill__sound', pill);
function updatePill() {
  if (!pill) return;
  pill.classList.toggle('is-on', count > 0);
  pillText.textContent = tr().words(count);
  pillRestore.textContent = tr().restore;
  pillSound.setAttribute('aria-label', tr().sound);
  pillSound.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
}
if (pill) {
  pillRestore.addEventListener('click', restore);
  pillSound.addEventListener('click', () => {
    soundOn = !soundOn;
    try { localStorage.setItem('fb-laser-sound', soundOn ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    updatePill();
  });
}

/* ----------------------------------------------------------
   CURSOR: pieza de mano láser
   ---------------------------------------------------------- */
const laser = $('.laser');
const aim = laser && $('.laser__aim', laser);
const hand = laser && $('.laser__hand', laser);
const label = laser && $('.laser__label', laser);
let mx = innerWidth / 2, my = innerHeight / 2, hx = mx, hy = my, pmx = mx, vx = 0, ang = 40;
let hoverEl = null, isText = false, needsCheck = false, lastCheck = 0;

function shootFx(x, y) {
  fire(x, y);
  snap();
  if (laser) {
    laser.classList.remove('is-fire');
    void laser.offsetWidth;
    laser.classList.add('is-fire');
  }
}

if (fine && laser) {
  document.documentElement.classList.add('has-laser');
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    laser.classList.add('is-visible');
    needsCheck = true;
  }, { passive: true });
  document.addEventListener('mouseleave', () => laser.classList.remove('is-visible'));
  document.addEventListener('mouseover', e => {
    hoverEl = e.target.closest ? e.target.closest(INTERACTIVE) : null;
    needsCheck = true;
  });
  document.querySelectorAll('iframe').forEach(f => {
    f.addEventListener('mouseenter', () => laser.classList.remove('is-visible'));
  });

  (function loop(now) {
    hx += (mx - hx) * .42; hy += (my - hy) * .42;
    vx += ((mx - pmx) - vx) * .18; pmx = mx;
    ang += ((40 + clamp(vx * 1.1, -20, 20)) - ang) * .15;
    aim.style.transform = `translate3d(${mx}px,${my}px,0)`;
    hand.style.transform = `translate3d(${hx.toFixed(1)}px,${hy.toFixed(1)}px,0) rotate(${ang.toFixed(2)}deg)`;
    label.style.transform = `translate3d(${mx + 18}px,${my - 38}px,0)`;

    if (needsCheck && now - lastCheck > 70) {
      lastCheck = now; needsCheck = false;
      isText = !hoverEl && !!wordAt(mx, my);
      const cue = hoverEl && hoverEl.dataset ? hoverEl.dataset.cursor : '';
      laser.classList.toggle('is-link', !!hoverEl);
      laser.classList.toggle('is-text', isText);
      const showErase = isText && count < 3;
      label.textContent = cue || (showErase ? tr().erase : '');
      label.classList.toggle('is-on', !!(cue || showErase));
      label.classList.toggle('laser__label--laser', !cue && showErase);
    }
    requestAnimationFrame(loop);
  })(performance.now());
} else if (laser) {
  laser.remove();
}

/* ----------------------------------------------------------
   PULSAR = DISPARAR · SOLTAR = BORRAR
   ---------------------------------------------------------- */
let down = null;
addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  if (e.target.closest && e.target.closest('.zap-pill')) return;
  down = { x: e.clientX, y: e.clientY };
  if (laser) laser.classList.add('is-down');
  shootFx(e.clientX, e.clientY);
}, { passive: true });

addEventListener('pointerup', e => {
  if (laser) laser.classList.remove('is-down');
  if (!down) return;
  const d = down; down = null;
  const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
  setTimeout(() => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim()) { sweep(sel); return; }
    if (moved < 8) zapAt(d.x, d.y);
  }, 0);
}, { passive: true });
addEventListener('pointercancel', () => { down = null; if (laser) laser.classList.remove('is-down'); });

/* ----------------------------------------------------------
   API para app.js
   ---------------------------------------------------------- */
window.FridaLaser = {
  fire, burst, snap,
  sync() { count = document.querySelectorAll('.zap.is-gone').length; updatePill(); }
};
updatePill();
})();
