// Collage maker: 2 to 9 photos, ready-made layouts, spacing, corners, background.
import { $, $$, esc, clamp, ic, toast, slider, paintSlider, pickFiles, loadImage, toBlob, saveFiles } from './ui.js';
import { FONTS, fontSpec, drawText, loadFonts } from './text.js';

const grid = (c, r) => { const o = []; for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) o.push([x / c, y / r, 1 / c, 1 / r]); return o; };
const rows = (...counts) => { const o = [], h = 1 / counts.length; counts.forEach((n, j) => { for (let i = 0; i < n; i++) o.push([i / n, j * h, 1 / n, h]); }); return o; };
const cols = (...counts) => rows(...counts).map(([x, y, w, h]) => [y, x, h, w]);
const LAYOUTS = {
  2: [grid(2, 1), grid(1, 2), [[0, 0, .62, 1], [.62, 0, .38, 1]], [[0, 0, 1, .62], [0, .62, 1, .38]]],
  3: [[[0, 0, .5, 1], [.5, 0, .5, .5], [.5, .5, .5, .5]], grid(3, 1), rows(1, 2), grid(1, 3), [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, 1, .5]], cols(1, 2)],
  4: [grid(2, 2), [[0, 0, .6, 1], [.6, 0, .4, 1 / 3], [.6, 1 / 3, .4, 1 / 3], [.6, 2 / 3, .4, 1 / 3]], [[0, 0, 1, .6], [0, .6, 1 / 3, .4], [1 / 3, .6, 1 / 3, .4], [2 / 3, .6, 1 / 3, .4]], grid(4, 1), rows(1, 3), cols(1, 3), [[0, 0, .5, 1 / 3], [0, 1 / 3, .5, 2 / 3], [.5, 0, .5, 2 / 3], [.5, 2 / 3, .5, 1 / 3]]],
  5: [rows(2, 3), rows(3, 2), [[0, 0, .6, .6], [.6, 0, .4, .3], [.6, .3, .4, .3], [0, .6, .5, .4], [.5, .6, .5, .4]], cols(2, 3), [[.25, .25, .5, .5], [0, 0, .25, 1], [.75, 0, .25, 1], [.25, 0, .5, .25], [.25, .75, .5, .25]], [[0, 0, .5, .6], [.5, 0, .5, .4], [0, .6, .5, .4], [.5, .4, .5, .3], [.5, .7, .5, .3]]],
  6: [grid(3, 2), grid(2, 3), [[0, 0, 2 / 3, 2 / 3], [2 / 3, 0, 1 / 3, 1 / 3], [2 / 3, 1 / 3, 1 / 3, 1 / 3], [0, 2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 1 / 3, 1 / 3], [2 / 3, 2 / 3, 1 / 3, 1 / 3]], rows(1, 2, 3), cols(1, 2, 3), [[0, 0, 1 / 3, .6], [1 / 3, 0, 1 / 3, .4], [2 / 3, 0, 1 / 3, .6], [0, .6, 1 / 3, .4], [1 / 3, .4, 1 / 3, .6], [2 / 3, .6, 1 / 3, .4]]],
  7: [rows(3, 4), rows(4, 3), rows(2, 3, 2), cols(3, 4), cols(2, 3, 2)],
  8: [grid(4, 2), grid(2, 4), rows(3, 2, 3), rows(1, 3, 4), cols(3, 2, 3)],
  9: [grid(3, 3), rows(2, 3, 4), rows(4, 1, 4), cols(2, 3, 4)],
};
// story and poster templates: slots for photos, a title and decorations
const TEMPLATES = [
  { id: 'polaroid', name: 'Polaroid wall', ratio: 9 / 16, bg: ['#f6e7d8', '#e7d2bf'], slots: [[.07, .07, .58, .3, -6, 'pol'], [.36, .33, .58, .3, 5, 'pol'], [.09, .6, .56, .28, -3, 'pol']], title: [.5, .94, 7, '#3a2a2e', .075, 'good days'] },
  { id: 'film', name: 'Film strip', ratio: 9 / 16, bg: ['#141012', '#141012'], deco: 'film', slots: [[.14, .08, .72, .2, 0], [.14, .3, .72, .2, 0], [.14, .52, .72, .2, 0], [.14, .74, .72, .2, 0]], title: [.5, .045, 3, '#f2a33a', .035, 'DARLIA 400'] },
  { id: 'mag', name: 'Magazine', ratio: 4 / 5, bg: ['#111', '#111'], slots: [[0, 0, 1, 1, 0], [.6, .62, .33, .3, 3, 'white']], title: [.5, .11, 8, '#ffffff', .15, 'Darlia'], sub: [.5, .2, 5, '#ffffff', .04, 'THE SUMMER ISSUE'] },
  { id: 'minimal', name: 'Minimal', ratio: 9 / 16, bg: ['#ffffff', '#f5f0ee'], slots: [[.1, .12, .8, .6, 0]], title: [.5, .81, 1, '#1b1416', .065, 'Slow mornings'], sub: [.5, .87, 3, '#8a7a80', .025, 'NOV 2026'] },
  { id: 'bday', name: 'Birthday', ratio: 4 / 5, bg: ['#ff8fb4', '#e0143c'], deco: 'confetti', slots: [[.12, .22, .76, .56, 0, 'round']], title: [.5, .12, 6, '#ffffff', .1, 'Happy Birthday'], sub: [.5, .88, 0, '#ffffff', .045, 'make a wish'] },
  { id: 'travel', name: 'Travel', ratio: 9 / 16, bg: ['#fbf9f4', '#f1ebe1'], slots: [[.06, .06, .88, .44, 0], [.06, .52, .43, .3, 0], [.51, .52, .43, .3, 0]], title: [.5, .9, 5, '#e0143c', .1, 'WANDERLUST'] },
];
const RATIOS = [['1:1', 1], ['4:5', .8], ['9:16', 9 / 16], ['16:9', 16 / 9], ['3:2', 1.5]];
const BGS = ['#ffffff', '#111111', '#f6d5dc', '#ff2d55', '#f6e7d8', '#8b5a3c', '#1f171a', '#ffd34d'];

export function openCollage({ back, edit, mode }) {
  const C = { mode: mode || 'grid', tpl: 0, imgs: [], lay: 0, ratio: 1, gap: .4, radius: .2, bg: '#ffffff', pan: [], zoom: [], sel: -1, text: { value: '', font: 1, color: '#ffffff', pos: 'bottom', size: .08, band: false } };
  loadFonts().then(() => draw());
  const app = $('#app');
  app.innerHTML = `<section class="ed">
    <header class="top"><button class="ib" id="cback" title="Home">${ic('back')}</button><span class="name">Collage</span>
      <div class="tr"><button class="btn ghost sm" id="cedit">${ic('edit')}<span>Edit as photo</span></button><button class="btn primary sm" id="cexp">${ic('download')}<span>Export</span></button></div></header>
    <div class="body"><div class="stage" id="cstage"><canvas id="ccv" class="ccv"></canvas><div class="empty" id="cempty"><button class="btn primary big" id="cadd0">${ic('image')}<span>Pick 2 to 9 photos</span></button></div></div>
      <aside class="side"><div class="panel" id="cpanel"></div></aside></div></section>`;
  $('#cback').onclick = back;
  const cv = $('#ccv'), st = $('#cstage');
  const cells = () => { const n = clamp(C.imgs.length, 2, 9), L = LAYOUTS[n]; return L[C.lay % L.length].slice(0, C.imgs.length); };
  const band = () => (C.text.band && C.text.value.trim() ? C.text.size * 2.2 : 0);
  const T = () => TEMPLATES[C.tpl];
  const tslots = (W, H) => T().slots.map(([x, y, w, h]) => [x * W, y * H, w * W, h * H]);
  const ratio = () => (C.mode === 'tpl' ? T().ratio : C.ratio);
  const rects = (W, H0) => { if (C.mode === 'tpl') return tslots(W, H0).slice(0, C.imgs.length); const bh = band() * W, H = H0 - bh, g = C.gap * .035 * Math.min(W, H), top = C.text.pos === 'top' ? bh : 0; return cells().map(([x, y, w, h]) => [x * (W - g) + g, top + y * (H - g) + g, w * (W - g) - g, h * (H - g) - g]); };
  function cover(x, im, i, rx, ry, rw, rh) { const z = C.zoom[i] || 1, p = C.pan[i] || [.5, .5], s2 = Math.max(rw / im.width, rh / im.height) * z, dw = im.width * s2, dh = im.height * s2; x.drawImage(im, rx + (rw - dw) * p[0], ry + (rh - dh) * p[1], dw, dh); }
  function paintTpl(x, W, H, sel) {
    const t = T(), g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, t.bg[0]); g.addColorStop(1, t.bg[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    let sd = 5; const R2 = () => { sd ^= sd << 13; sd ^= sd >>> 17; sd ^= sd << 5; return (sd >>> 0) / 4294967296; };
    if (t.deco === 'confetti') for (let i = 0; i < 90; i++) { x.save(); x.translate(R2() * W, R2() * H); x.rotate(R2() * 6); x.fillStyle = ['#ffd34d', '#ffffff', '#60a5fa', '#4ade80', '#a78bfa'][(R2() * 5) | 0]; x.globalAlpha = .8; x.fillRect(-W * .008, -W * .004, W * .016, W * .008); x.restore(); }
    if (t.deco === 'film') { x.fillStyle = '#e9e2d6'; const hw = W * .035, hh = H * .018; for (let y = H * .02; y < H; y += hh * 2.2) for (const xx of [W * .04, W - W * .04 - hw]) { x.beginPath(); x.roundRect ? x.roundRect(xx, y, hw, hh, 3) : x.rect(xx, y, hw, hh); x.fill(); } }
    t.slots.forEach(([sx, sy, sw, sh, rot, kind], i) => {
      const rx = sx * W, ry = sy * H, rw = sw * W, rh = sh * H; x.save(); x.translate(rx + rw / 2, ry + rh / 2); x.rotate((rot || 0) * Math.PI / 180); x.translate(-rw / 2, -rh / 2);
      if (kind === 'pol' || kind === 'white') { const pd = rw * .05, pb = kind === 'pol' ? rw * .16 : pd; x.save(); x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = W * .02; x.shadowOffsetY = W * .008; x.fillStyle = '#fbf9f4'; x.fillRect(-pd, -pd, rw + pd * 2, rh + pd + pb); x.restore(); }
      x.save(); x.beginPath(); kind === 'round' && x.roundRect ? x.roundRect(0, 0, rw, rh, rw * .06) : x.rect(0, 0, rw, rh); x.clip();
      const im = C.imgs[i]; if (im) cover(x, im, i, 0, 0, rw, rh); else { x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, rw, rh); x.fillStyle = 'rgba(255,255,255,.6)'; x.font = `600 ${rw * .07}px Inter, sans-serif`; x.textAlign = 'center'; x.fillText('+ photo ' + (i + 1), rw / 2, rh / 2); }
      x.restore(); if (sel && i === C.sel) { x.strokeStyle = '#ff4d8d'; x.lineWidth = 3 * (devicePixelRatio || 1); x.strokeRect(0, 0, rw, rh); } x.restore();
    });
    for (const [key, d] of [['title', C.text.value.trim() || t.title[5]], ['sub', t.sub && t.sub[5]]]) { const a = t[key]; if (!a || !d) continue; x.save(); x.translate(a[0] * W, a[1] * H); drawText(x, { text: d, font: key === 'title' ? C.text.tfont ?? a[2] : a[2], color: key === 'title' ? C.text.tcolor || a[3] : a[3], size: a[4], shadow: t.id === 'mag' }, W); x.restore(); }
  }
  function paint(x, W, H, sel) {
    if (C.mode === 'tpl') return paintTpl(x, W, H, sel);
    x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
    rects(W, H).forEach(([rx, ry, rw, rh], i) => {
      const im = C.imgs[i]; if (!im || rw <= 0 || rh <= 0) return; const z = C.zoom[i] || 1, p = C.pan[i] || [.5, .5];
      const s = Math.max(rw / im.width, rh / im.height) * z, dw = im.width * s, dh = im.height * s;
      x.save(); x.beginPath(); const r = C.radius * Math.min(rw, rh) * .25; x.roundRect ? x.roundRect(rx, ry, rw, rh, r) : x.rect(rx, ry, rw, rh); x.clip();
      x.drawImage(im, rx + (rw - dw) * p[0], ry + (rh - dh) * p[1], dw, dh); x.restore();
      if (sel && i === C.sel) { x.save(); x.strokeStyle = '#ff4d8d'; x.lineWidth = 3 * (devicePixelRatio || 1); x.beginPath(); x.roundRect ? x.roundRect(rx, ry, rw, rh, r) : x.rect(rx, ry, rw, rh); x.stroke(); x.restore(); }
    });
    const T = C.text; if (T.value.trim()) {
      const it = { text: T.value, font: T.font, color: T.color, size: T.size, shadow: !T.band }, bh = band() * W;
      const y = T.band ? (T.pos === 'top' ? bh / 2 : H - bh / 2) : T.pos === 'top' ? H * .12 : T.pos === 'middle' ? H / 2 : H * .88;
      x.save(); x.translate(W / 2, y); drawText(x, it, W); x.restore();
    }
  }
  function draw() {
    if (!st.isConnected) return;
    const has = C.imgs.length >= (C.mode === 'tpl' ? 1 : 2); $('#cempty').hidden = has; cv.hidden = !has; $('#cexp').disabled = $('#cedit').disabled = !has; if (!has) return;
    const pad = 28, bw = st.clientWidth - pad * 2, bh = st.clientHeight - pad * 2, k = Math.min(bw / ratio(), bh), w = Math.round(k * ratio()), h = Math.round(k), d = Math.min(2, devicePixelRatio || 1);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * d); cv.height = Math.round(h * d); paint(cv.getContext('2d'), cv.width, cv.height, true);
  }
  function panel() {
    const p = $('#cpanel'), n = C.imgs.length, L = n >= 2 ? LAYOUTS[clamp(n, 2, 9)] : [];
    const tplHTML = `<div class="tpls">${TEMPLATES.map((t, i) => `<button class="tplb ${C.tpl === i ? 'on' : ''}" data-tpl="${i}"><img src="${tplThumb(i)}" alt=""><span>${t.name}</span></button>`).join('')}</div>
      <div class="pl">Title</div><input class="field" id="ttl" maxlength="30" placeholder="${esc(T().title[5])}" value="${esc(C.text.value)}">
      <div class="chips fonts">${FONTS.map(([fn], i) => `<button class="chip ${(C.text.tfont ?? T().title[2]) === i ? 'on' : ''}" data-tf="${i}" style="font:${fontSpec(i, 15).replace(/"/g, "'")}">${fn}</button>`).join('')}</div>
      <div class="sw">${['#ffffff', '#111111', '#e0143c', '#ff4d8d', '#ffd34d', '#3a2a2e', '#f2a33a'].map((c) => `<button class="swc ${(C.text.tcolor || T().title[3]) === c ? 'on' : ''}" data-tcl="${c}" style="background:${c}"></button>`).join('')}</div>
      <p class="muted small">This template has ${T().slots.length} photo spot${T().slots.length > 1 ? 's' : ''}. Drag a photo to move it in its spot.</p>`;
    p.innerHTML = `<div class="seg"><button class="${C.mode === 'grid' ? 'on' : ''}" data-cm="grid">${ic('grid')} Grid</button><button class="${C.mode === 'tpl' ? 'on' : ''}" data-cm="tpl">${ic('photo')} Templates</button></div><div class="ph"><h3>${C.mode === 'tpl' ? 'Templates' : 'Collage'}</h3><span class="muted">${n} photo${n === 1 ? '' : 's'}</span><button class="chip" id="cadd" ${n >= 9 ? 'disabled' : ''}>${ic('plus')}Add</button></div>
      ${C.mode === 'tpl' ? tplHTML : n >= 2 ? `<div class="pl">Layout</div><div class="lays">${L.map((cl, i) => `<button class="lay ${i === C.lay % L.length ? 'on' : ''}" data-lay="${i}"><svg viewBox="0 0 40 40">${cl.slice(0, n).map(([x, y, w, h]) => `<rect x="${x * 40 + 1.5}" y="${y * 40 + 1.5}" width="${w * 40 - 3}" height="${h * 40 - 3}" rx="2"/>`).join('')}</svg></button>`).join('')}</div>
      <div class="pl">Shape</div><div class="chips">${RATIOS.map(([t, r]) => `<button class="chip ${C.ratio === r ? 'on' : ''}" data-r="${r}">${t}</button>`).join('')}</div>
      <div class="sls">${slider('gap', 'Spacing', 0, 1, C.gap)}${slider('radius', 'Corners', 0, 1, C.radius)}</div>
      <div class="pl">Background</div><div class="sw">${BGS.map((c) => `<button class="swc ${C.bg === c ? 'on' : ''}" data-bg="${c}" style="background:${c}"></button>`).join('')}<label class="swc pickc"><input type="color" id="cbgp" value="${C.bg}"></label></div>
      ${C.sel >= 0 ? `<div class="pl">Selected photo</div><div class="sls">${slider('zoom', 'Zoom', 1, 3, C.zoom[C.sel] || 1)}</div><div class="chips"><button class="chip" id="cswap">${ic('swap')}Move to next</button><button class="chip" id="crep">${ic('image')}Replace</button><button class="chip danger" id="cdel">${ic('trash')}Remove</button></div>`
        : '<p class="muted small">Drag a photo to move it inside its box. Tap a photo for more options.</p>'}
      <div class="pl">Text</div><input class="field" id="ctx" maxlength="40" placeholder="Add a title, e.g. Summer 2026" value="${esc(C.text.value)}">
      ${C.text.value.trim() ? `<div class="chips fonts">${FONTS.map(([n], i) => `<button class="chip ${C.text.font === i ? 'on' : ''}" data-cf="${i}" style="font:${fontSpec(i, 15).replace(/"/g, "'")}">${n}</button>`).join('')}</div>
      <div class="sw">${['#ffffff', '#111111', '#ff2d55', '#ff4d8d', '#ffd34d', '#8b5a3c', '#f6e7d8'].map((c) => `<button class="swc ${C.text.color === c ? 'on' : ''}" data-cc="${c}" style="background:${c}"></button>`).join('')}</div>
      <div class="chips">${[['top', 'Top'], ['middle', 'Middle'], ['bottom', 'Bottom']].map(([k, n]) => `<button class="chip ${C.text.pos === k ? 'on' : ''}" data-cpos="${k}">${n}</button>`).join('')}<button class="chip ${C.text.band ? 'on' : ''}" id="cband">Own strip</button></div>
      <div class="sls">${slider('tsize', 'Text size', .03, .16, C.text.size, .002)}</div>` : ''}` : '<p class="muted">Pick at least 2 photos to start.</p>'}`;
    const ctx = $('#ctx', p); if (ctx) { ctx.oninput = () => { const had = !!C.text.value.trim(); C.text.value = ctx.value; draw(); if (had !== !!C.text.value.trim()) { panel(); const n = $('#ctx'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }; }
    $$('[data-cf]', p).forEach((b) => (b.onclick = () => { C.text.font = +b.dataset.cf; panel(); draw(); }));
    $$('[data-cc]', p).forEach((b) => (b.onclick = () => { C.text.color = b.dataset.cc; panel(); draw(); }));
    $$('[data-cpos]', p).forEach((b) => (b.onclick = () => { C.text.pos = b.dataset.cpos; if (C.text.pos === 'middle') C.text.band = false; panel(); draw(); }));
    const cb = $('#cband', p); if (cb) cb.onclick = () => { C.text.band = !C.text.band; if (C.text.band && C.text.pos === 'middle') C.text.pos = 'bottom'; if (C.text.band && C.text.color === '#ffffff' && C.bg === '#ffffff') C.text.color = '#111111'; panel(); draw(); };
    const add = $('#cadd', p); if (add) add.onclick = addPhotos;
    $$('[data-cm]', p).forEach((b) => (b.onclick = () => { C.mode = b.dataset.cm; C.text.value = ''; C.pan = []; C.zoom = []; C.sel = -1; panel(); draw(); }));
    $$('[data-tpl]', p).forEach((b) => (b.onclick = () => { C.tpl = +b.dataset.tpl; C.text.value = ''; delete C.text.tfont; delete C.text.tcolor; C.pan = []; C.zoom = []; panel(); draw(); }));
    const tt = $('#ttl', p); if (tt) tt.oninput = () => { C.text.value = tt.value; draw(); };
    $$('[data-tf]', p).forEach((b) => (b.onclick = () => { C.text.tfont = +b.dataset.tf; panel(); draw(); }));
    $$('[data-tcl]', p).forEach((b) => (b.onclick = () => { C.text.tcolor = b.dataset.tcl; panel(); draw(); }));
    $$('[data-lay]', p).forEach((b) => (b.onclick = () => { C.lay = +b.dataset.lay; C.pan = []; C.zoom = []; panel(); draw(); }));
    $$('[data-r]', p).forEach((b) => (b.onclick = () => { C.ratio = +b.dataset.r; panel(); draw(); }));
    $$('[data-bg]', p).forEach((b) => (b.onclick = () => { C.bg = b.dataset.bg; panel(); draw(); }));
    const bp = $('#cbgp', p); if (bp) bp.oninput = () => { C.bg = bp.value; draw(); };
    $$('.sl input', p).forEach((inp) => (inp.oninput = () => { const k = inp.closest('.sl').dataset.k, v = +inp.value; if (k === 'zoom') C.zoom[C.sel] = v; else if (k === 'tsize') C.text.size = v; else C[k] = v; paintSlider(inp); inp.closest('.sl').querySelector('b').textContent = Math.round(v * 100); draw(); }));
    const sw = $('#cswap', p); if (sw) sw.onclick = () => { const i = C.sel, j = (i + 1) % C.imgs.length; [C.imgs[i], C.imgs[j]] = [C.imgs[j], C.imgs[i]]; [C.pan[i], C.pan[j]] = [C.pan[j], C.pan[i]]; [C.zoom[i], C.zoom[j]] = [C.zoom[j], C.zoom[i]]; C.sel = j; panel(); draw(); };
    const rp = $('#crep', p); if (rp) rp.onclick = async () => { const [f] = await pickFiles(); if (!f) return; C.imgs[C.sel] = await loadImage(f, 2400); C.pan[C.sel] = null; C.zoom[C.sel] = 1; draw(); };
    const dl = $('#cdel', p); if (dl) dl.onclick = () => { C.imgs.splice(C.sel, 1); C.pan.splice(C.sel, 1); C.zoom.splice(C.sel, 1); C.sel = -1; panel(); draw(); };
  }
  async function addPhotos() {
    const fs = (await pickFiles(true)).slice(0, 9 - C.imgs.length); if (!fs.length) return;
    toast('Opening photos…');
    for (const f of fs) { try { C.imgs.push(await loadImage(f, 2400)); } catch (e) { /* skip */ } }
    if (C.imgs.length === 1) toast('Add one more photo'); panel(); draw();
  }
  // drag to pan, tap to select
  let d = null;
  cv.addEventListener('pointerdown', (e) => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height;
    const i = rects(cv.width, cv.height).findIndex(([rx, ry, rw, rh]) => x >= rx && y >= ry && x <= rx + rw && y <= ry + rh); if (i < 0) return;
    cv.setPointerCapture(e.pointerId); d = { i, x: e.clientX, y: e.clientY, p: [...(C.pan[i] || [.5, .5])], moved: false, r };
  });
  cv.addEventListener('pointermove', (e) => {
    if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.hypot(dx, dy) > 4) d.moved = true; if (!d.moved) return;
    const [, , rw, rh] = rects(cv.width, cv.height)[d.i], im = C.imgs[d.i], z = C.zoom[d.i] || 1, s = Math.max(rw / im.width, rh / im.height) * z, k = cv.width / d.r.width;
    const ex = im.width * s - rw, ey = im.height * s - rh;
    C.pan[d.i] = [clamp(d.p[0] - (ex > 0 ? dx * k / ex : 0), 0, 1), clamp(d.p[1] - (ey > 0 ? dy * k / ey : 0), 0, 1)]; draw();
  });
  const up = () => { if (!d) return; if (!d.moved) { C.sel = C.sel === d.i ? -1 : d.i; panel(); draw(); } d = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const tplThumb = (i) => { const old = [C.tpl, C.imgs]; C.tpl = i; const t = TEMPLATES[i], c = document.createElement('canvas'); c.height = 160; c.width = Math.round(160 * t.ratio); paintTpl(c.getContext('2d'), c.width, c.height, false); C.tpl = old[0]; return c.toDataURL('image/jpeg', .8); };
  const out = () => { const r = ratio(), W = Math.round(r >= 1 ? 3000 : 3000 * r), H = Math.round(r >= 1 ? 3000 / r : 3000), c = document.createElement('canvas'); c.width = W; c.height = H; paint(c.getContext('2d'), W, H, false); return c; };
  $('#cexp').onclick = async () => { const c = out(), b = await toBlob(c, 'jpeg', .93); if (await saveFiles([new File([b], 'collage-darlia.jpg', { type: 'image/jpeg' })])) toast('Collage saved'); };
  $('#cedit').onclick = () => edit(out());
  $('#cadd0').onclick = addPhotos;
  new ResizeObserver(draw).observe(st); panel(); draw();
}
