import { Engine } from './engine.js';
import { LOOKS, ADJUST, HSL_BANDS, STICKERS, STICKER_PACKS, stickerSrc, COLORS } from './looks.js';
import { FONTS, fontSpec, TEXT_PRESETS, blankText, drawText, textCanvas, loadFonts } from './text.js';
import { LEAKS, TEXTURES, blankFx, fxOn, paintFx } from './fx.js';
import { listProjects, saveProject, loadProject, deleteProject, renameProject, ago } from './drafts.js';
import { $, $$, esc, clamp, ic, toast, logo, slider, paintSlider, pickFiles, loadImage, toBlob, saveFiles, shareFiles, canShareFiles, NATIVE, sheet, store } from './ui.js';
import { blankCurve, isFlat, curveLUT, curveEditor, CURVE_PRESETS } from './curves.js';
import { faceMask, faceField, faceWidth, gridSize, Liquify, addField, makeupGeo, bodyField } from './warp.js';
import { palette, paletteImage, gridTiles, makeGif, drawWatermark, autoAngle, suggestLooks, lookCode, parseCode } from './extras.js';
import { detectQuad, warpQuad, cleanPage } from './scan.js';
import { refineMask, skyMask } from './refine.js';
import { getExif, withExif } from './formats.js';
import { FRAMES, COLORABLE, frameGeom, paintFrame, paintFrameTop, hasTop } from './frames.js';
import * as AI from './ai.js';
import { startI18n, setLang, LANG } from './i18n.js';

// ---------------- state ----------------
const blankHSL = () => ({ h: Array(8).fill(0), s: Array(8).fill(0), l: Array(8).fill(0) });
const fresh = () => ({
  base: 0, adj: {}, lookId: 'none', look: {}, lookAmt: 1, hsl: blankHSL(), curve: blankCurve(),
  geo: { crop: { x: 0, y: 0, w: 1, h: 1 }, ratio: 'free', rot90: 0, flipH: false, flipV: false, straighten: 0, persp: [0, 0] },
  bg: { on: false, mode: 'clear', color: '#ffffff', blur: .6, photo: '' }, items: [], seed: 7, fx: blankFx(),
  face: { smooth: 0, bright: 0, slim: 0, eyes: 0, teeth: 0, eyeBright: 0, shine: 0 },
  makeup: { lip: 0, lipCol: '#c2185b', blush: 0, blushCol: '#ff8fa3', lid: 0, lidCol: '#8b5a3c' }, hair: { amt: 0, col: '#7a2a3a' }, body: { slim: 0, legs: 0 },
  sky: { amt: 0, key: 'sunset', tint: '#ff9a6a' }, eff: { glitch: 0, vhs: 0, art: 'none', artAmt: 1, splash: false, splashHue: 0, splashRange: .06, splashKeep: false },
  blend: { key: '', mode: 'screen', amt: .6, person: false },
  local: { strokes: [], auto: null, expo: 0, contrast: 0, sat: 0, temp: 0 },
  blur: { mode: 'off', amount: .5, size: .16, feather: .5, angle: 0, x: .5, y: .5, keep: false },
  frame: { type: 'none', size: .5, color: '', caption: '' },
});
let S = fresh(), E = null, TH = null, NAME = 'photo', MASK = null;
const BASES = new Map(), FACES = new Map(); let baseSeq = 0;
let tool = 'looks', sel = -1, undo = [], redo = [], comparing = false, busy = '', band = 0, adjGroup = 0, curveCh = 'm';
const IMGS = new Map(), BGP = new Map(), SKY = new Map(), HAIR = new Map(), PROXY = new Map(); let PROJ = null, VIEW = { z: 1, x: 0, y: 0 }, split = false, splitX = .5, GESTURE = false, eraseTap = false, maskSeq = 0;
const srcOf = (it) => (it.src && it.src.startsWith('ref:') ? IMGS.get(it.src.slice(4)) || '' : it.src);
const setMask = (m) => { MASK = m; if (m) m._id = ++maskSeq; };
function normalize(st) { const f = fresh(), o = { ...f, ...st }; for (const k of ['geo', 'bg', 'face', 'local', 'blur', 'frame', 'fx', 'makeup', 'hair', 'body', 'sky', 'eff', 'blend']) o[k] = { ...f[k], ...(st[k] || {}) }; return o; }
let stkPack = 0, pathMode = false, LIQ = null, liqMode = 'push', ERASE = null, brushSize = 46, brushErase = false, showArea = false, pen = { color: '#ff2d55', w: .012, glow: false };
const BRUSH_TOOLS = ['erase', 'brush', 'reshape', 'draw', 'blur'];
let cancelStroke = () => {}, cancelItem = () => {};
const app = $('#app');
const IMG = () => BASES.get(S.base);

const snap = () => JSON.stringify(S);
let lastSnap = null, histT = 0;
function commit(now) { clearTimeout(histT); const f = () => { const s = snap(); if (s === lastSnap) return; if (lastSnap) { undo.push(lastSnap); if (undo.length > 60) undo.shift(); } redo = []; lastSnap = s; topBtns(); saveSoon(); }; if (now) f(); else histT = setTimeout(f, 350); }
async function restore(s) { const st = JSON.parse(s); await ensureBase(st.base); S = st; lastSnap = s; sel = -1; LIQ = null; draw(); panel(); items(); topBtns(); }
async function ensureBase(id) { const v = BASES.get(id); if (v && v.blob) BASES.set(id, await loadImage(v.blob, 16384)); }
function trimBases() {
  const ids = [...BASES.keys()].filter((k) => k !== 0 && k !== S.base && !BASES.get(k).blob).sort((a, b) => b - a);
  for (const k of ids.slice(1)) { const c = BASES.get(k); c.toBlob((b) => { if (b && BASES.get(k) === c) BASES.set(k, { blob: b, width: c.width, height: c.height }); }, 'image/jpeg', .95); }
}

// ---------------- recipes (copy/paste, my looks, batch) ----------------
export const recipe = (s = S) => JSON.parse(JSON.stringify({ adj: s.adj, lookId: s.lookId, look: s.look, lookAmt: s.lookAmt, hsl: s.hsl, curve: s.curve }));
function applyRecipe(r) { Object.assign(S, JSON.parse(JSON.stringify(r))); if (!S.curve) S.curve = blankCurve(); if (!S.hsl) S.hsl = blankHSL(); }

// ---------------- home ----------------
function home() {
  E = null; document.onkeydown = null;
  const tiles = [['collage', 'grid', 'Collage'], ['tpl', 'photo', 'Templates'], ['batch', 'stack', 'Batch edit'], ['video', 'video', 'Video'], ['sample', 'image', 'Sample photo'], ['pfile', 'file', 'Project file']];
  app.innerHTML = `<section class="hm">
    <div class="hm-bg" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
    <header class="hm-top"><div class="hm-brand"><span class="hm-logo">${logo()}</span><b>Darlia</b></div>
      <div class="hm-act"><button class="hm-ib" id="theme" title="Theme">${ic(store.get('theme', 'dark') === 'dark' ? 'sun' : 'moon')}</button><button class="hm-ib wide" id="lang" title="Language">${ic('globe')}<b>${LANG === 'ms' ? 'BM' : 'EN'}</b></button></div></header>
    <main class="hm-main">
      <div class="hm-hero"><h1>Make every photo <em>yours.</em></h1><p>A beautiful photo editor that works right on your device.</p></div>
      <button class="hm-drop" id="open"><span class="hm-drop-ic">${ic('plus')}</span><b>Open a photo</b><span class="hm-drop-sub">or drop it here</span><span class="hm-fmt">JPG · PNG · HEIC · RAW</span></button>
      <div class="hm-quick">${tiles.map(([id, i, n]) => `<button class="hm-tile" id="${id}"><span>${ic(i)}</span><b>${n}</b></button>`).join('')}</div>
      <div class="recent" id="recent"></div>
      ${NATIVE ? '' : `<div class="hm-get"><span>Get the app</span><a href="https://github.com/Pidii1/darlia/releases/latest/download/Darlia.apk">Android</a><a href="https://github.com/Pidii1/darlia/releases/latest/download/Darlia-Setup.msi">Windows</a></div>`}
    </main>
  </section>`;
  $('#open').onclick = async () => { const [f] = await pickFiles(); if (f) loadFile(f); };
  $('#sample').onclick = () => loadSrc('img/sample.jpg', 'sample');
  $('#lang').onclick = () => { setLang(LANG === 'ms' ? 'en' : 'ms'); home(); };
  $('#theme').onclick = () => { setTheme(store.get('theme', 'dark') === 'dark' ? 'light' : 'dark'); home(); };
  $('#video').onclick = async () => (await import('./video.js')).openVideo({ back: home, myLooks: () => store.get('mylooks', []) });
  $('#pfile').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.darlia,.rouge,application/json'; i.onchange = () => i.files[0] && importProjectFile(i.files[0]); i.click(); };
  $('#collage').onclick = async () => (await import('./collage.js')).openCollage({ back: home, edit: (c) => openCanvas(c, 'collage') });
  $('#tpl').onclick = async () => (await import('./collage.js')).openCollage({ back: home, edit: (c) => openCanvas(c, 'template'), mode: 'tpl' });
  $('#batch').onclick = async () => (await import('./batch.js')).openBatch({ back: home, myLooks: () => store.get('mylooks', []) });
  const drop = $('#open'); ['dragenter', 'dragover'].forEach((e) => drop.addEventListener(e, () => drop.classList.add('over'))); ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, () => drop.classList.remove('over')));
  fillRecent();
}
let albumPick = '';
async function fillRecent() {
  const all = await listProjects(), el = $('#recent'); if (!el) return;
  if (!all.length) { el.innerHTML = ''; return; }
  const albums = [...new Set(all.map((p) => p.album).filter(Boolean))], list = albumPick ? all.filter((p) => p.album === albumPick) : all;
  el.innerHTML = `<div class="rh"><b>Recent</b><small>Saved on this device</small></div>${albums.length ? `<div class="chips albums"><button class="chip ${albumPick ? '' : 'on'}" data-ap="">All</button>${albums.map((a) => `<button class="chip ${albumPick === a ? 'on' : ''}" data-ap="${esc(a)}">${ic('album')}${esc(a)}</button>`).join('')}</div>` : ''}<div class="rgrid">${list.map((m) => `<div class="rc" data-pid="${m.id}" role="button" tabindex="0"><img src="${m.thumb || ''}" alt=""><span>${esc(m.name)}</span><small>${ago(m.updated)}</small><button class="rdel" data-pdel="${m.id}" title="Delete">${ic('x')}</button><button class="rren" data-pren="${m.id}" title="Rename">${ic('edit')}</button></div>`).join('')}</div>`;
  $$('[data-ap]', el).forEach((b) => (b.onclick = () => { albumPick = b.dataset.ap; fillRecent(); }));
  $$('[data-pid]', el).forEach((c) => (c.onclick = async (e) => {
    if (e.target.closest('[data-pdel]')) { e.stopPropagation(); await deleteProject(c.dataset.pid); toast('Project deleted'); fillRecent(); return; }
    if (e.target.closest('[data-pren]')) {
      e.stopPropagation(); const cur = (all.find((x) => x.id === c.dataset.pid) || {}).name || '';
      const m = sheet(`<h3>Rename</h3><p class="muted small">This name is used for your saved photos and in Recent.</p><input class="field" id="rn" maxlength="60" value="${esc(cur)}"><div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" id="rngo">${ic('check')}<span>Save</span></button></div>`);
      const i = $('#rn', m); i.focus(); i.select();
      const go = async () => { const n = safeName(i.value); if (!n) { toast('Type a name first'); return; } await renameProject(c.dataset.pid, n); m.remove(); toast('Renamed'); fillRecent(); };
      $('#rngo', m).onclick = go; i.onkeydown = (ev) => { if (ev.key === 'Enter') go(); }; return;
    }
    openProject(c.dataset.pid);
  }));
}
async function openProject(id) {
  try {
    toast('Opening…'); const d = await loadProject(id); if (!d) throw new Error('missing');
    BASES.clear(); FACES.clear(); IMGS.clear(); BGP.clear(); SKY.clear(); HAIR.clear(); PROXY.clear(); SUGG = null;
    BASES.set(0, await loadImage(d.b0)); const st = normalize(d.state || {});
    if (st.base && d.cur) BASES.set(st.base, await loadImage(d.cur, 8192)); else st.base = 0;
    baseSeq = st.base || 0; setMask(d.mask ? await loadImage(d.mask, 8192) : null);
    for (const [k, v] of Object.entries(d.imgs || {})) IMGS.set(k, v);
    for (const [k, v] of Object.entries(d.bgp || {})) BGP.set(k, await loadImage(v, 2048));
    S = st; NAME = d.name || 'photo'; PROJ = { id, b0blob: d.b0, blobs: new Map(), album: d.album || '' }; LIQ = null; ERASE = null; undo = []; redo = []; lastSnap = snap(); sel = -1; VIEW = { z: 1, x: 0, y: 0 };
    editor();
    const F = S.face; if (F.smooth || F.bright || F.slim || F.eyes || F.teeth || F.eyeBright) findFaces(true);
    if (S.local.auto === 'sky') ensureSky().then(() => draw());
  } catch (e) { console.error(e); toast('Could not open that project'); }
}
const fromDataURL = async (u) => (u ? (await fetch(u)).blob() : null);
async function importProjectFile(f) {
  try {
    const j = JSON.parse(await f.text()); if (!(j.darlia || j.rouge) || !j.b0) throw new Error('not a project');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), bgp = {}; for (const [k, v] of Object.entries(j.bgp || {})) bgp[k] = await fromDataURL(v);
    const b0 = await fromDataURL(j.b0), thumbC = await loadImage(b0, 240);
    await saveProject({ id, name: j.name || 'project', updated: Date.now(), thumb: thumbC.toDataURL('image/jpeg', .7) }, { id, name: j.name, state: j.state, b0, cur: await fromDataURL(j.cur), mask: await fromDataURL(j.mask), imgs: j.imgs || {}, bgp });
    openProject(id);
  } catch (e) { console.error(e); toast('That is not a Darlia project file'); }
}
// ---------------- drafts: saved automatically while you edit ----------------
let draftT = 0;
function saveSoon() { clearTimeout(draftT); draftT = setTimeout(saveDraft, 1500); }
async function saveDraft() {
  clearTimeout(draftT); if (!PROJ || !BASES.size || !E) return;
  try {
    const big = (c) => c.width * c.height > 2.5e6;
    if (!PROJ.b0blob) { const b = BASES.get(0); PROJ.b0blob = await toBlob(b, big(b) ? 'jpeg' : 'png', .95); }
    let cur = null; if (S.base) { cur = PROJ.blobs.get('b' + S.base); if (!cur) { cur = await toBlob(IMG(), 'jpeg', .95); PROJ.blobs.set('b' + S.base, cur); } }
    let mask = null; if (MASK) { mask = PROJ.blobs.get('m' + MASK._id); if (!mask) { mask = await toBlob(MASK, 'png'); PROJ.blobs.set('m' + MASK._id, mask); } }
    const imgs = {}; for (const it of S.items) if (it.src && it.src.startsWith('ref:')) { const k = it.src.slice(4); if (IMGS.has(k)) imgs[k] = IMGS.get(k); }
    const bgp = {}; if (S.bg.photo && S.bg.photo.startsWith('u:') && BGP.has(S.bg.photo)) { let b = PROJ.blobs.get(S.bg.photo); if (!b) { b = await toBlob(BGP.get(S.bg.photo), 'jpeg', .92); PROJ.blobs.set(S.bg.photo, b); } bgp[S.bg.photo] = b; }
    const t = document.createElement('canvas'), k = 240 / Math.max(E.cv.width, E.cv.height); t.width = Math.max(1, E.cv.width * k | 0); t.height = Math.max(1, E.cv.height * k | 0);
    const tx = t.getContext('2d'); tx.fillStyle = '#1f171a'; tx.fillRect(0, 0, t.width, t.height); tx.drawImage(E.cv, 0, 0, t.width, t.height);
    await saveProject({ id: PROJ.id, name: NAME, album: PROJ.album || '', updated: Date.now(), thumb: t.toDataURL('image/jpeg', .7) }, { id: PROJ.id, name: NAME, album: PROJ.album || '', state: JSON.parse(snap()), b0: PROJ.b0blob, cur, mask, imgs, bgp });
  } catch (e) { console.warn('Could not save the draft', e); }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveDraft(); });
function loadFile(f) { loadSrc(f, (f.name || 'photo').replace(/\.[^.]+$/, ''), f); }
async function loadSrc(src, name, file) { try { openCanvas(await loadImage(src), name, file); } catch (e) { toast('Could not open that picture'); } }
function openCanvas(c, name, file) {
  BASES.clear(); FACES.clear(); IMGS.clear(); BGP.clear(); SKY.clear(); HAIR.clear(); PROXY.clear(); SUGG = null; baseSeq = 0; BASES.set(0, c); NAME = name || NAME;
  const okFile = file && /^image\/(jpeg|png|webp)$/.test(file.type) && file.size < 30e6;
  PROJ = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), b0blob: okFile ? file : null, blobs: new Map() };
  S = fresh(); setMask(null); LIQ = null; ERASE = null; undo = []; redo = []; lastSnap = snap(); sel = -1; VIEW = { z: 1, x: 0, y: 0 }; editor(); saveSoon();
}
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (!f) return; if (/\.(darlia|rouge)$/i.test(f.name)) importProjectFile(f); else if (/^image\//.test(f.type) || /\.(heic|heif|dng|cr2|cr3|nef|arw|raf|orf|rw2)$/i.test(f.name)) loadFile(f); });

// ---------------- keeping the engine in step with the state ----------------
let LC = null, LCkey = '';
function paintSize() { const b = IMG(), k = Math.min(1, 1024 / Math.max(b.width, b.height)); return [Math.max(1, Math.round(b.width * k)), Math.max(1, Math.round(b.height * k))]; }
function blankPaint() { const [w, h] = paintSize(), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); c._v = 1; return c; }
function dab(c, pts, r, white, soft = .35) {
  const x = c.getContext('2d'), W = c.width, H = c.height, R = Math.max(.5, r * W);
  x.save(); x.strokeStyle = x.fillStyle = white ? '#fff' : '#000'; x.lineWidth = R * 2; x.lineCap = x.lineJoin = 'round'; if (soft) x.filter = `blur(${R * soft}px)`;
  x.beginPath(); pts.forEach(([u, v], i) => (i ? x.lineTo(u * W, v * H) : x.moveTo(u * W, v * H))); if (pts.length === 1) x.lineTo(pts[0][0] * W + .1, pts[0][1] * H); x.stroke(); x.restore(); c._v = (c._v || 0) + 1;
}
const localKey = () => S.base + ':' + (S.local.auto || '') + ':' + (S.local.auto === 'sky' ? (SKY.has(S.base) ? 1 : 0) : S.local.auto ? (MASK ? MASK._id : 0) : '') + ':' + JSON.stringify(S.local.strokes);
function localCanvas() {
  const key = localKey(); if (LC && LCkey === key) return LC;
  LC = blankPaint(); const a = S.local.auto, src = a === 'sky' ? SKY.get(S.base) : a ? MASK : null;
  if (src) { const x = LC.getContext('2d'); x.drawImage(src, 0, 0, LC.width, LC.height); if (a === 'bg') { x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, LC.width, LC.height); x.globalCompositeOperation = 'source-over'; } }
  for (const st of S.local.strokes) dab(LC, st.pts, st.r, !st.erase); LCkey = key; LC._v = (LC._v || 0) + 1; return LC;
}
// sky: bright or blue areas joined to the top edge
async function ensureSky() {
  if (SKY.has(S.base)) return SKY.get(S.base); const id = S.base, [pw, ph] = paintSize();
  await new Promise((r) => setTimeout(r, 30)); const m = skyMask(proxyOf(id, IMG()), pw, ph); SKY.set(id, m); return m;
}
// ready-made backgrounds for Cutout
const BG_PRESETS = [['g:studio', 'Studio'], ['g:blush', 'Blush'], ['g:sunset', 'Sunset'], ['g:night', 'Night'], ['g:cream', 'Cream'], ['g:rouge', 'Darlia']];
function bgCanvas(key) {
  if (BGP.has(key)) return BGP.get(key); if (!key.startsWith('g:')) return null;
  const c = document.createElement('canvas'); c.width = c.height = 1200; const x = c.getContext('2d'), W = 1200, k = key.slice(2);
  const rad = (a, b) => { const g = x.createRadialGradient(W / 2, W * .4, W * .05, W / 2, W / 2, W * .8); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const lin = (...cs) => { const g = x.createLinearGradient(0, 0, 0, W); cs.forEach((cc, i) => g.addColorStop(i / (cs.length - 1), cc)); return g; };
  x.fillStyle = k === 'studio' ? rad('#d9d4d6', '#5d5559') : k === 'blush' ? rad('#ffe3ec', '#f29bb8') : k === 'sunset' ? lin('#ffb46a', '#ff6f91', '#7a3d8f') : k === 'night' ? rad('#2b3a6b', '#070912') : k === 'cream' ? rad('#fbf4ea', '#e3d2bd') : lin('#ff4d8d', '#e0143c', '#3a0a14');
  x.fillRect(0, 0, W, W); BGP.set(key, c); return c;
}
function sync(eng, opts = {}) {
  const K = eng._k || (eng._k = {}), want = opts.orig ? 0 : S.base;
  // the preview works on a smaller copy of big photos so sliders stay smooth; export uses the full size
  if (K.base !== want) { const b = BASES.get(want); eng.setImage(eng === E ? proxyOf(want, b) : b); K.base = want; }
  const skyM = (S.sky.amt > 0 || S.local.auto === 'sky') ? SKY.get(S.base) || null : null, hairM = S.hair.amt > 0 ? HAIR.get(S.base) || null : null;
  if (K.mask !== MASK || K.skym !== skyM || K.hairm !== hairM) { eng.setMasks(MASK, skyM, hairM); K.mask = MASK; K.skym = skyM; K.hairm = hairM; }
  const skw = S.sky.amt > 0 ? skyCanvas(S.sky.key) : null; if (K.sky !== skw) { eng.setSky(skw); K.sky = skw; }
  const ck = JSON.stringify(S.curve); if (K.curve !== ck) { eng.setCurve(isFlat(S.curve) ? null : curveLUT(S.curve)); K.curve = ck; }
  const ps = eng === E && tool === 'erase' ? ERASE : S.local.strokes.length || S.local.auto ? localCanvas() : null;
  const bgw = S.bg.mode === 'photo' && S.bg.photo ? bgCanvas(S.bg.photo) : null; if (K.bg !== bgw) { eng.setBg(bgw); K.bg = bgw; }
  if (K.paint !== ps || (ps && K.paintV !== ps._v)) { eng.setPaint(ps); K.paint = ps; K.paintV = ps && ps._v; }
  const fd = FACES.get(S.base), fo = S.face, mu = S.makeup, look = fo.smooth || fo.bright || fo.teeth || fo.eyeBright || fo.shine || mu.lip || mu.blush || mu.lid;
  const fm = fd && fd.mask && look ? fd.mask : null, rad = fd && fd.rad * (eng.w / IMG().width); if (K.face !== fm || K.frad !== rad) { eng.setFace(fm, rad); K.face = fm; K.frad = rad; }
  if (fd && fd.faces && fd.faces.length) { if (!fd.mk) fd.mk = makeupGeo(IMG().width, IMG().height, fd.faces); eng.setMakeup(fd.mk); } else eng.setMakeup(null);
  const liq = eng === E && LIQ && LIQ.used ? LIQ : null, warpOn = fd && fd.faces && fd.faces.length && (fo.slim || fo.eyes);
  const bo = S.body, bodyOn = MASK && (bo.slim || bo.legs);
  const dk = (warpOn ? `${S.base}|${fo.slim}|${fo.eyes}` : '') + (bodyOn ? `|B${MASK._id}|${bo.slim}|${bo.legs}` : '') + (liq ? '|L' + liq.v : '');
  if (K.disp !== dk) {
    K.disp = dk;
    if (!dk) eng.setDisp(null);
    else {
      const b = IMG(), [gw, gh] = liq ? [liq.gw, liq.gh] : gridSize(b.width, b.height, 256);
      let F = new Float32Array(gw * gh * 2);
      if (warpOn) { const fk = `${gw}x${gh}|${fo.slim}|${fo.eyes}`; if (fd.fk !== fk) { fd.field = faceField(b.width, b.height, fd.faces, fo, gw, gh); fd.fk = fk; } F = fd.field.slice(); }
      if (bodyOn) F = addField(F, gw, gh, bodyField(b.width, b.height, MASK, bo, gw, gh), gw, gh);
      if (liq) F = addField(F, gw, gh, liq.F, liq.gw, liq.gh);
      eng.setDisp(F, gw, gh);
    }
  }
}
function proxyOf(id, b) {
  const lim = LITE ? 1600 : 2048; if (Math.max(b.width, b.height) <= lim) return b; const key = id + ':' + b.width; if (PROXY.has(key)) return PROXY.get(key);
  const k = lim / Math.max(b.width, b.height), c = document.createElement('canvas'); c.width = Math.round(b.width * k); c.height = Math.round(b.height * k); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(b, 0, 0, c.width, c.height); PROXY.set(key, c); return c;
}
// skies for Sky replace
const SKIES = [['sunset', 'Sunset'], ['blue', 'Blue sky'], ['pink', 'Cotton candy'], ['stars', 'Starry night'], ['storm', 'Storm'], ['golden', 'Golden hour']];
const SKYC = new Map();
function skyCanvas(key) {
  if (BGP.has(key)) return BGP.get(key); if (SKYC.has(key)) return SKYC.get(key);
  const W = 1600, H = 1000, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const lin = (...cs) => { const g = x.createLinearGradient(0, 0, 0, H); cs.forEach((cc, i) => g.addColorStop(i / (cs.length - 1), cc)); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  let s = 11; const R2 = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const clouds = (n, col, a) => { for (let i = 0; i < n; i++) { const cx = R2() * W, cy = R2() * H * .7, rw = 120 + R2() * 260; for (let j = 0; j < 7; j++) { const g = x.createRadialGradient(cx + (j - 3) * rw * .35, cy + Math.sin(j) * 20, 0, cx + (j - 3) * rw * .35, cy + Math.sin(j) * 20, rw * .5); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H); } } x.globalAlpha = 1; };
  if (key === 'sunset') { lin('#3b2a63', '#c2457a', '#ff8a4c', '#ffd28a'); clouds(6, 'rgba(255,170,140,.8)', .35); }
  else if (key === 'blue') { lin('#2f6fd6', '#6aa8f0', '#cfe6ff'); clouds(9, 'rgba(255,255,255,.95)', .55); }
  else if (key === 'pink') { lin('#a78bfa', '#ffb3cf', '#ffe3ec'); clouds(8, 'rgba(255,255,255,.9)', .45); }
  else if (key === 'stars') { lin('#05060f', '#141c3d', '#2b2f5e'); x.fillStyle = '#fff'; for (let i = 0; i < 700; i++) { x.globalAlpha = .3 + R2() * .7; x.beginPath(); x.arc(R2() * W, R2() * H * .9, R2() * 1.6 + .3, 0, 7); x.fill(); } x.globalAlpha = 1; const g = x.createRadialGradient(W * .75, H * .2, 0, W * .75, H * .2, 60); g.addColorStop(0, '#fffbe8'); g.addColorStop(.6, '#fff3c4'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  else if (key === 'storm') { lin('#2a2d36', '#4a4f5c', '#7c808b'); clouds(12, 'rgba(40,42,50,.9)', .5); }
  else { lin('#ff9a3c', '#ffc46b', '#fff0c9'); clouds(5, 'rgba(255,230,180,.9)', .4); const g = x.createRadialGradient(W * .3, H * .85, 0, W * .3, H * .85, 260); g.addColorStop(0, '#fffbe0'); g.addColorStop(1, 'rgba(255,220,150,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  SKYC.set(key, c); return c;
}
function newBase(c) {
  const id = ++baseSeq, old = IMG(); BASES.set(id, c); const fd = FACES.get(S.base);
  // same size: faces still line up. New size: scale the face points
  if (fd && fd.faces) { const k = c.width / old.width; FACES.set(id, k === 1 ? { ...fd, fk: null } : fd.faces.length ? { faces: fd.faces.map((f) => f.map(([x, y]) => [x * k, y * k])), mask: fd.mask, rad: fd.rad * k } : { faces: [] }); }
  if (HAIR.has(S.base)) HAIR.set(id, HAIR.get(S.base)); if (SKY.has(S.base) && c.width / c.height === old.width / old.height) SKY.set(id, SKY.get(S.base));
  S.base = id; commit(true); draw(); trimBases();
}

// ---------------- editor ----------------
// tools in four groups so the bar stays tidy
const CATS = [['basic', 'Basics', 'adjust', ['looks', 'adjust', 'colour', 'curves', 'brush', 'crop']], ['face', 'Face', 'retouch', ['retouch', 'reshape']], ['ai', 'AI tools', 'enhance', ['enhance', 'erase', 'cutout', 'sky', 'blur', 'scan']], ['create', 'Create', 'text', ['text', 'sticker', 'draw', 'eff', 'fx', 'frame']]];
const catOf = (t) => (CATS.find((c) => c[3].includes(t)) || CATS[0])[0];
const toolName = (k) => (TOOLS.find((t) => t[0] === k) || [k, k])[1];
function navHTML() {
  const cat = CATS.find((c) => c[0] === catOf(tool));
  return `<div class="cats">${CATS.map(([k, n, icn]) => `<button data-cat="${k}" class="${k === cat[0] ? 'on' : ''}">${ic(icn)}<span>${n}</span></button>`).join('')}</div>
    <div class="trow" id="trow">${cat[3].map((k) => `<button data-tool="${k}" class="${k === tool ? 'on' : ''}">${ic(k)}<span>${toolName(k)}</span></button>`).join('')}</div>`;
}
function wireNav() {
  $$('[data-tool]', $('#tools')).forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
  $$('[data-cat]', $('#tools')).forEach((b) => (b.onclick = () => { const c = CATS.find((x) => x[0] === b.dataset.cat); if (catOf(tool) !== c[0]) setTool(c[3][0]); }));
}
const TOOLS = [['looks', 'Looks'], ['adjust', 'Adjust'], ['enhance', 'Enhance'], ['colour', 'Colour'], ['curves', 'Curves'], ['crop', 'Crop'], ['scan', 'Scan'], ['retouch', 'Retouch'], ['erase', 'Erase'], ['cutout', 'Cutout'], ['sky', 'Sky'], ['blur', 'Lens blur'], ['brush', 'Brush'], ['reshape', 'Reshape'], ['eff', 'Effects'], ['text', 'Text'], ['sticker', 'Stickers'], ['draw', 'Draw'], ['fx', 'Film fx'], ['frame', 'Frame']];
function editor() {
  app.innerHTML = `<section class="ed">
    <header class="top"><button class="ib" id="home" title="Home">${ic('back')}</button><button class="name" id="pname" title="Rename">${esc(NAME)}${ic('edit')}</button>
      <div class="tr"><button class="ib" id="undo" title="Undo">${ic('undo')}</button><button class="ib" id="redo" title="Redo">${ic('redo')}</button>
      <button class="ib" id="cmp" title="Tap: before / after slider. Hold: original">${ic('compare')}</button><button class="ib" id="histb" title="History">${ic('history')}</button><button class="ib" id="more" title="More">${ic('more')}</button><button class="btn primary sm" id="export">${ic('download')}<span>Export</span></button></div></header>
    <div class="body"><div class="stage" id="stage"><div class="fwrap" id="fwrap"><div class="frame" id="frame"><canvas id="cv"></canvas><canvas id="cvo" class="cvo" hidden></canvas><canvas id="blendc" class="fxl" hidden></canvas><canvas id="fxm" class="fxl mul" hidden></canvas><canvas id="fxs" class="fxl scr" hidden></canvas><canvas id="fxn" class="fxl" hidden></canvas><div class="items" id="items"></div><div class="split" id="split" hidden><i></i><em class="sb">Before</em><em class="sa">After</em></div><div class="brush" id="brush"><i class="ring" id="ring"></i><i class="focus" id="focus"></i></div><div class="cropbox" id="cropbox" hidden><i class="h tl"></i><i class="h tr"></i><i class="h bl"></i><i class="h br"></i><b></b><b></b><b></b><b></b><s class="guide"></s></div><div class="scanbox" id="scanbox" hidden><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon id="scanpoly"/></svg><i data-q="0"></i><i data-q="1"></i><i data-q="2"></i><i data-q="3"></i></div></div><canvas id="fover" class="fover" hidden></canvas></div>
      <div class="zoomui"><button id="zout" title="Zoom out">${ic('minus')}</button><button id="zfit" title="Fit">100%</button><button id="zin" title="Zoom in">${ic('plus')}</button></div></div>
      <aside class="side"><div class="panel" id="panel"></div><nav class="tools" id="tools">${navHTML()}</nav></aside></div>
  </section>`;
  E = new Engine($('#cv'), { lite: LITE }); frameKey = fxKey = topKey = blendKey = '';
  const b = IMG(), t = document.createElement('canvas'), k = 160 / Math.max(b.width, b.height); t.width = Math.max(1, Math.round(b.width * k)); t.height = Math.max(1, Math.round(b.height * k)); t.getContext('2d').drawImage(b, 0, 0, t.width, t.height);
  TH = new Engine(); TH.setImage(t);
  $('#home').onclick = () => { saveDraft(); home(); };
  loadFonts().then(() => { TCACHE.clear(); items(); });
  $('#undo').onclick = () => { if (!undo.length) return; redo.push(snap()); restore(undo.pop()); };
  $('#redo').onclick = () => { if (!redo.length) return; undo.push(snap()); restore(redo.pop()); };
  // tap = before/after slider, hold = whole original
  const cmp = $('#cmp'); let holdT = 0, held = false;
  cmp.addEventListener('pointerdown', () => { held = false; holdT = setTimeout(() => { held = true; comparing = true; cmp.classList.add('on'); draw(); }, 280); });
  cmp.addEventListener('pointerup', () => { clearTimeout(holdT); if (held) { comparing = false; held = false; cmp.classList.toggle('on', split); draw(); } else { split = !split; splitX = .5; cmp.classList.toggle('on', split); draw(); } });
  ['pointerleave', 'pointercancel'].forEach((ev) => cmp.addEventListener(ev, () => { clearTimeout(holdT); if (held) { comparing = false; held = false; cmp.classList.toggle('on', split); draw(); } }));
  bindSplit(); bindZoom();
  $('#pname').onclick = renameSheet;
  $('#export').onclick = exportSheet; $('#more').onclick = moreMenu; $('#histb').onclick = historySheet;
  bindScan(); bindEyedrop(); if (!store.get('tut', false)) setTimeout(tutorial, 400);
  wireNav();
  new ResizeObserver(() => draw()).observe($('#stage'));
  bindItems(); bindCrop(); bindBrush(); panel(); draw(); items(); topBtns();
  document.onkeydown = (e) => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); (e.shiftKey ? $('#redo') : $('#undo')).click(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && sel >= 0) { S.items.splice(sel, 1); sel = -1; items(); panel(); commit(true); }
    if (e.key === '+' || e.key === '=') zoomBy(1.25); if (e.key === '-') zoomBy(.8); if (e.key === '0') zoomTo(1);
    if (e.code === 'Space') { spaceDown = true; $('#stage').classList.add('grab'); e.preventDefault(); }
  };
  document.onkeyup = (e) => { if (e.code === 'Space') { spaceDown = false; $('#stage') && $('#stage').classList.remove('grab'); } };
}
function setTool(t) {
  if (tool === 'reshape' && t !== 'reshape' && LIQ && LIQ.used) { bakeLiquify(); }
  tool = t; const tb = $('#tools'); if (tb) { tb.innerHTML = navHTML(); wireNav(); }
  const nb = $(`#trow [data-tool="${t}"]`), tr = $('#trow'); if (nb && tr && tr.scrollWidth > tr.clientWidth) { const l = nb.offsetLeft - tr.offsetLeft, r = l + nb.offsetWidth; if (l < tr.scrollLeft) tr.scrollLeft = l - 8; else if (r > tr.scrollLeft + tr.clientWidth) tr.scrollLeft = r - tr.clientWidth + 8; }
  if (t !== 'text' && t !== 'sticker') sel = -1;
  if (t === 'erase' && (!ERASE || ERASE._base !== S.base)) { ERASE = blankPaint(); ERASE._base = S.base; }
  if (t === 'retouch' && !FACES.has(S.base)) findFaces();
  panel(); draw(); items();
}
function topBtns() { const u = $('#undo'), r = $('#redo'); if (u) u.disabled = !undo.length; if (r) r.disabled = !redo.length; }

// ---------------- zoom & pan ----------------
let spaceDown = false;
// weaker phones get a lighter preview; the saved photo is always full quality
const LITE = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || /lite=1/.test(location.search);
let interactive = false, interT = 0;
function quick() { interactive = true; clearTimeout(interT); interT = setTimeout(() => { interactive = false; draw(); }, 200); }
function clampView() {
  const st = $('#stage'), fw = $('#fwrap'); if (!st || !fw) return;
  if (VIEW.z <= 1.001) { VIEW = { z: 1, x: 0, y: 0 }; return; }
  const mx = Math.max(0, (fw.offsetWidth * VIEW.z - st.clientWidth) / 2 + 60), my = Math.max(0, (fw.offsetHeight * VIEW.z - st.clientHeight) / 2 + 60);
  VIEW.x = clamp(VIEW.x, -mx, mx); VIEW.y = clamp(VIEW.y, -my, my);
}
function applyView() {
  const fw = $('#fwrap'); if (!fw) return; clampView(); fw.style.transform = `translate(${VIEW.x}px, ${VIEW.y}px) scale(${VIEW.z})`;
  const z = $('#zfit'); if (z) z.textContent = Math.round(VIEW.z * 100) + '%'; $('#stage').classList.toggle('zoomed', VIEW.z > 1); ring();
}
let zoomT = 0;
function zoomAt(z2, cx, cy) {
  const r = $('#stage').getBoundingClientRect(), px = cx - (r.left + r.width / 2), py = cy - (r.top + r.height / 2);
  z2 = clamp(z2, 1, 8); const k = z2 / VIEW.z; VIEW.x = px - (px - VIEW.x) * k; VIEW.y = py - (py - VIEW.y) * k; VIEW.z = z2;
  applyView(); clearTimeout(zoomT); zoomT = setTimeout(() => { TCACHE.clear(); draw(); items(); }, 120);
}
function zoomBy(f) { const r = $('#stage').getBoundingClientRect(); zoomAt(VIEW.z * f, r.left + r.width / 2, r.top + r.height / 2); }
function zoomTo(z) { const r = $('#stage').getBoundingClientRect(); zoomAt(z, r.left + r.width / 2, r.top + r.height / 2); }
function bindZoom() {
  const st = $('#stage'), ptrs = new Map(); let pinch = null, pan = null;
  $('#zin').onclick = () => zoomBy(1.5); $('#zout').onclick = () => zoomBy(1 / 1.5); $('#zfit').onclick = () => zoomTo(1);
  st.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(VIEW.z * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0018)), e.clientX, e.clientY); }, { passive: false });
  st.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.zoomui')) return;
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) {
      GESTURE = true; cancelStroke(); cancelItem(); pan = null;
      const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, z: VIEW.z, x: VIEW.x, y: VIEW.y };
      e.stopPropagation(); return;
    }
    const free = !e.target.closest('.brush.on, .it, .cropbox, .split');
    if (VIEW.z > 1 && (spaceDown || e.button === 1 || free)) { pan = { x: e.clientX, y: e.clientY, vx: VIEW.x, vy: VIEW.y }; st.setPointerCapture(e.pointerId); e.stopPropagation(); e.preventDefault(); }
  }, true);
  st.addEventListener('pointermove', (e) => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && ptrs.size >= 2 && e.pointerType !== 'touch') {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      VIEW = { z: pinch.z, x: pinch.x + (mx - pinch.mx), y: pinch.y + (my - pinch.my) }; zoomAt(pinch.z * d / Math.max(10, pinch.d), mx, my); e.stopPropagation(); return;
    }
    if (pan) { VIEW.x = pan.vx + e.clientX - pan.x; VIEW.y = pan.vy + e.clientY - pan.y; applyView(); e.stopPropagation(); }
  }, true);
  const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!ptrs.size && !tp) { GESTURE = false; } if (pan) { pan = null; e.stopPropagation(); } };
  st.addEventListener('pointerup', up, true); st.addEventListener('pointercancel', up, true);
  // phones: pinch with touch events, so the browser never takes the gesture
  let tp = null; const two = (t) => [[t[0].clientX, t[0].clientY], [t[1].clientX, t[1].clientY]];
  st.addEventListener('touchstart', (e) => { if (e.touches.length >= 2) { e.preventDefault(); GESTURE = true; cancelStroke(); cancelItem(); const [a, b] = two(e.touches); tp = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, z: VIEW.z, x: VIEW.x, y: VIEW.y }; } }, { passive: false });
  st.addEventListener('touchmove', (e) => { if (!tp || e.touches.length < 2) return; e.preventDefault(); const [a, b] = two(e.touches), d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; VIEW = { z: tp.z, x: tp.x + (mx - tp.mx), y: tp.y + (my - tp.my) }; zoomAt(tp.z * d / Math.max(10, tp.d), mx, my); }, { passive: false });
  const tend = (e) => { if (e.touches.length < 2) tp = null; if (!e.touches.length) GESTURE = false; };
  st.addEventListener('touchend', tend); st.addEventListener('touchcancel', tend);
  st.addEventListener('dblclick', (e) => { if (e.target.closest('.it, .cropbox, .zoomui, .split') || (BRUSH_TOOLS.includes(tool) && tool !== 'blur')) return; zoomAt(VIEW.z > 1 ? 1 : 2.5, e.clientX, e.clientY); });
}
function bindSplit() {
  const sp = $('#split'); let d = false;
  sp.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); d = true; sp.setPointerCapture(e.pointerId); });
  sp.addEventListener('pointermove', (e) => { if (!d) return; const [fx] = frameXY(e); splitX = clamp(fx, 0, 1); placeSplit(); });
  const end = () => (d = false); sp.addEventListener('pointerup', end); sp.addEventListener('pointercancel', end);
}
function placeSplit() { const sp = $('#split'), o = $('#cvo'); sp.style.setProperty('--x', splitX * 100 + '%'); o.style.clipPath = `inset(0 ${(1 - splitX) * 100}% 0 0)`; }
let histoT = 0;
function histogram() {
  clearTimeout(histoT); histoT = setTimeout(() => {
    const h = $('#hist'); if (!h || !E) return; const c = document.createElement('canvas'), k = 160 / Math.max(E.cv.width, E.cv.height); c.width = Math.max(1, E.cv.width * k | 0); c.height = Math.max(1, E.cv.height * k | 0);
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(E.cv, 0, 0, c.width, c.height); const d = x.getImageData(0, 0, c.width, c.height).data, N = 64, bins = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 10) continue; for (let j = 0; j < 3; j++) bins[j][d[i + j] * N >> 8]++; }
    const W = h.width = h.clientWidth * 2 || 600, H = h.height = 120, mx = Math.max(1, ...bins.map((b) => Math.max(...b.slice(1, N - 1)))), hx = h.getContext('2d');
    hx.clearRect(0, 0, W, H); hx.globalCompositeOperation = 'lighter';
    ['rgba(255,70,100,.55)', 'rgba(70,220,120,.5)', 'rgba(90,150,255,.55)'].forEach((col, j) => { hx.fillStyle = col; hx.beginPath(); hx.moveTo(0, H); for (let i = 0; i < N; i++) hx.lineTo(i / (N - 1) * W, H - Math.min(1, bins[j][i] / mx) * H * .95); hx.lineTo(W, H); hx.fill(); });
  }, 120);
}

// render the preview to fit the stage
let raf = 0, frameKey = '', fxKey = '', topKey = '', blendKey = '', guides = 'thirds';
function draw() {
  if (!E) return; cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const st = $('#stage'); if (!st || !E) return;
    sync(E, { orig: comparing });
    const cropMode = tool === 'crop' || tool === 'scan';
    const s = tool === 'scan' ? { ...S, geo: fresh().geo } : cropMode ? { ...S, geo: { ...S.geo, crop: { x: 0, y: 0, w: 1, h: 1 } } } : S;
    const [ow, oh] = E.outSize(s), fr0 = cropMode || comparing ? { type: 'none' } : S.frame, g0 = frameGeom(fr0, ow, oh);
    const TW = ow + g0.l + g0.r, THh = oh + g0.t + g0.b, pad = 28, bw = st.clientWidth - pad * 2, bh = st.clientHeight - pad * 2, k = Math.min(bw / TW, bh / THh);
    const cw = Math.max(1, Math.round(ow * k)), ch = Math.max(1, Math.round(oh * k)), dpr = Math.min(2, window.devicePixelRatio || 1);
    const rk = Math.min(dpr * VIEW.z, (LITE ? 1600 : 3000) / Math.max(cw, ch)) * (interactive ? (LITE ? .45 : .6) : 1), RW = Math.round(cw * rk), RH = Math.round(ch * rk);
    const cvo = $('#cvo'), showSplit = split && !comparing && !cropMode; cvo.hidden = !showSplit; $('#split').hidden = !showSplit;
    if (showSplit) { sync(E, { orig: true }); E.render(s, RW, RH, { original: true, noDisp: true }); cvo.width = RW; cvo.height = RH; cvo.getContext('2d').drawImage(E.cv, 0, 0); sync(E); placeSplit(); }
    E.render(s, RW, RH, { original: comparing, noDisp: comparing, showPaint: tool === 'erase' || (tool === 'brush' && showArea), paintOnly: tool === 'erase' });
    const fr = $('#frame'), fw = $('#fwrap'); fr.style.width = cw + 'px'; fr.style.height = ch + 'px';
    const g = { l: g0.l * k, t: g0.t * k, r: g0.r * k, b: g0.b * k, radius: g0.radius * k };
    fw.style.padding = `${g.t}px ${g.r}px ${g.b}px ${g.l}px`; fr.style.borderRadius = fr.style.overflow = ''; fr.style.borderRadius = g.radius ? g.radius + 'px' : '';
    fr.style.overflow = g.radius ? 'hidden' : '';
    const fk = JSON.stringify([fr0, cw, ch]); if (fk !== frameKey) {
      frameKey = fk;
      if (fr0.type === 'none' || fr0.type === 'rounded') fw.style.backgroundImage = '';
      else { const c = document.createElement('canvas'), W = cw + g.l + g.r, H = ch + g.t + g.b; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); const x = c.getContext('2d'); x.scale(dpr, dpr); paintFrame(x, fr0, cw, ch, g, fr0.caption); fw.style.backgroundImage = `url(${c.toDataURL()})`; }
    }
    fr.classList.toggle('clear', S.bg.on && S.bg.mode === 'clear' && !comparing);
    // film overlays
    const fxs = $('#fxs'), fxn = $('#fxn'), fxm = $('#fxm'), fxv = fxOn(S.fx) && !comparing && !cropMode; fxs.hidden = fxn.hidden = fxm.hidden = !fxv;
    // double exposure photo on top
    const bc = $('#blendc'), bim = S.blend.key && IMGS.get(S.blend.key), bv = !!bim && !comparing && !cropMode; bc.hidden = !bv;
    if (bv) { const k4 = JSON.stringify([S.blend, cw, ch]); if (k4 !== blendKey) { blendKey = k4; blendCanvas(bc, cw * dpr, ch * dpr, S.blend); } bc.style.mixBlendMode = S.blend.mode; bc.style.opacity = S.blend.amt; }
    if (fxv) { const k2 = JSON.stringify([S.fx, S.seed, cw, ch]); if (k2 !== fxKey) { fxKey = k2; for (const [c, layer] of [[fxm, 'multiply'], [fxs, 'screen'], [fxn, 'normal']]) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); const x = c.getContext('2d'); x.scale(dpr, dpr); paintFx(x, cw, ch, S.fx, S.seed, layer); } } }
    // frame decorations that sit over the photo
    const fo = $('#fover'), tv = hasTop(fr0); fo.hidden = !tv;
    if (tv) { const k3 = JSON.stringify([fr0, cw, ch]); if (k3 !== topKey) { topKey = k3; const W = cw + g.l + g.r, H = ch + g.t + g.b; fo.width = Math.round(W * dpr); fo.height = Math.round(H * dpr); const x = fo.getContext('2d'); x.scale(dpr, dpr); paintFrameTop(x, fr0, cw, ch, g); } }
    applyView();
    if (tool === 'adjust' || tool === 'curves') histogram();
    $('#cropbox').hidden = tool !== 'crop'; if (tool === 'crop') placeCrop(); $('#cropbox').dataset.g = guides;
    $('#scanbox').hidden = tool !== 'scan'; if (tool === 'scan') placeScan();
    const br = $('#brush'); br.classList.toggle('on', BRUSH_TOOLS.includes(tool) || (tool === 'text' && pathMode)); br.dataset.t = pathMode && tool === 'text' ? 'draw' : tool;
    const fc = $('#focus'); fc.hidden = !(tool === 'blur' && S.blur.mode !== 'off');
    if (!fc.hidden) { Object.assign(fc.style, { left: S.blur.x * 100 + '%', top: S.blur.y * 100 + '%', width: S.blur.size * 2 * ch + 'px', height: S.blur.size * 2 * ch + 'px' }); fc.classList.toggle('lin', S.blur.mode === 'linear'); fc.style.transform = `translate(-50%,-50%) rotate(${S.blur.mode === 'linear' ? S.blur.angle : 0}deg)`; if (S.blur.mode === 'linear') { fc.style.width = cw * 3 + 'px'; } }
    if (items._w !== cw) items();
  });
}

// ---------------- panels ----------------
const pct = (v) => Math.round(v * 100);
function panel() {
  const p = $('#panel'); if (!p) return;
  const P = PANELS[tool]; p.innerHTML = ''; P(p);
  $$('.sl input', p).forEach((inp) => (inp.oninput = () => {
    const k = inp.closest('.sl').dataset.k, v = +inp.value; setVal(k, v);
    paintSlider(inp); inp.closest('.sl').querySelector('b').textContent = fmtVal(k, v);
    if (/^(tsize|ssize|trot|srot|tcurve|tspace|toutline|tdepth)$/.test(k)) items(); else if (k === 'bsize') ring(); else { quick(); draw(); }
    if (k !== 'bsize' && k !== 'pw') commit();
  }));
  $$('.sl', p).forEach((l) => l.addEventListener('dblclick', () => { const inp = $('input', l); inp.value = DEF[l.dataset.k] ?? 0; inp.oninput(); }));
}
const DEF = { lookAmt: 1, bAmt: .5, bSize: .16, bFeather: .5, frSize: .5, bsize: 46, pw: .012, artAmt: 1, texAmt: .5, blendAmt: .6, splashRange: .06 };
function fmtVal(k, v) {
  if (k === 'exposure' || k === 'lExpo') return (v > 0 ? '+' : '') + v.toFixed(2);
  if (/rot|straighten|bAngle/.test(k)) return Math.round(v) + '°';
  if (k === 'perspV' || k === 'perspH') return Math.round(v * 100);
  if (k === 'bsize') return Math.round(v) + 'px'; if (k === 'pw') return Math.round(v * 1000);
  return pct(v);
}
function setVal(k, v) {
  const it = S.items[sel], M = {
    lookAmt: () => (S.lookAmt = v), straighten: () => (S.geo.straighten = v), bgBlur: () => (S.bg.blur = v),
    hslH: () => (S.hsl.h[band] = v), hslS: () => (S.hsl.s[band] = v), hslL: () => (S.hsl.l[band] = v),
    tsize: () => (it.size = v), ssize: () => (it.size = v), trot: () => (it.rot = v), srot: () => (it.rot = v),
    fSmooth: () => (S.face.smooth = v), fBright: () => (S.face.bright = v), fSlim: () => (S.face.slim = v), fEyes: () => (S.face.eyes = v), fTeeth: () => (S.face.teeth = v), fEyeB: () => (S.face.eyeBright = v),
    lExpo: () => (S.local.expo = v), lCon: () => (S.local.contrast = v), lSat: () => (S.local.sat = v), lTemp: () => (S.local.temp = v),
    bAmt: () => (S.blur.amount = v), bSize: () => (S.blur.size = v), bFeather: () => (S.blur.feather = v), bAngle: () => (S.blur.angle = v),
    frSize: () => (S.frame.size = v), bsize: () => (brushSize = v), pw: () => (pen.w = v),
    tcurve: () => (it.curve = v), tspace: () => (it.spacing = v), toutline: () => (it.outline = v),
    fxLeak: () => (S.fx.leak = v), fxDust: () => (S.fx.dust = v), fxScratch: () => (S.fx.scratch = v), texAmt: () => (S.fx.texAmt = v), blendAmt: () => (S.blend.amt = v),
    perspV: () => (S.geo.persp = [v, (S.geo.persp || [0, 0])[1]]), perspH: () => (S.geo.persp = [(S.geo.persp || [0, 0])[0], v]),
    fShine: () => (S.face.shine = v), lip: () => (S.makeup.lip = v), blush: () => (S.makeup.blush = v), lid: () => (S.makeup.lid = v), hairAmt: () => (S.hair.amt = v),
    bodySlim: () => (S.body.slim = v), bodyLegs: () => (S.body.legs = v), skyAmt: () => (S.sky.amt = v), glitch: () => (S.eff.glitch = v), vhs: () => (S.eff.vhs = v), artAmt: () => (S.eff.artAmt = v), splashRange: () => (S.eff.splashRange = v),
    tdepth: () => (it.depth = v),
  };
  (M[k] || (() => (S.adj[k] = v)))();
}
const eyeBtn = (id) => `<button class="swc pickc eye" data-eye="${id}" title="Pick from photo">${ic('eyedrop')}</button>`;
const hdr = (title, extra = '') => `<div class="ph"><h3>${title}</h3>${extra}</div>`;
const rst = () => `<button class="chip" data-rst>${ic('reset')}Reset</button>`;
const busyBox = (msg) => `<div class="busy"><i class="spin"></i><span>${esc(msg)}</span></div>`;
const PANELS = {
  looks(p) {
    const mine = store.get('mylooks', []), groups = [...new Set(LOOKS.map((l) => l.group))];
    const cur = S.lookId.startsWith('my:') ? (mine.find((m) => 'my:' + m.id === S.lookId) || {}).name : S.lookId !== 'none' ? LOOKS.find((l) => l.id === S.lookId)?.name : '';
    p.innerHTML = hdr('Looks', `${cur ? `<span class="muted">${esc(cur)}</span>` : ''}<button class="chip" id="savelook">${ic('heart')}Save mine</button>`) +
      `<div class="chips"><button class="chip" id="lcode">${ic('paste')}Add from code</button>${S.lookId.startsWith('my:') ? `<button class="chip" id="lshare">${ic('share')}Share this look</button>` : ''}</div>
      <div class="looks"><div class="lg"><small>Suggested for this photo</small><div class="lrow">${suggested().map((id) => { const l = LOOKS.find((x) => x.id === id); return l ? `<button class="lk ${l.id === S.lookId ? 'on' : ''}" data-look="${l.id}"><img data-th="${l.id}" alt=""><span>${l.name}</span></button>` : ''; }).join('')}</div></div>${mine.length ? `<div class="lg"><small>My looks</small><div class="lrow">${mine.map((m) => `<button class="lk ${'my:' + m.id === S.lookId ? 'on' : ''}" data-my="${m.id}"><img data-thm="${m.id}" alt=""><span>${esc(m.name)}</span><i class="del" data-delmy="${m.id}" title="Delete">${ic('x')}</i></button>`).join('')}</div></div>` : ''}
      ${groups.map((g) => `<div class="lg"><small>${g}</small><div class="lrow">${LOOKS.filter((l) => l.group === g).map((l) => `<button class="lk ${l.id === S.lookId ? 'on' : ''}" data-look="${l.id}"><img data-th="${l.id}" alt=""><span>${l.name}</span></button>`).join('')}</div></div>`).join('')}</div>
      ${S.lookId !== 'none' && !S.lookId.startsWith('my:') ? slider('lookAmt', 'Strength', 0, 1, S.lookAmt) : ''}`;
    thumbs();
    $$('[data-look]', p).forEach((b) => (b.onclick = () => { const l = LOOKS.find((x) => x.id === b.dataset.look); S.lookId = l.id; S.look = l.look; S.lookAmt = 1; panel(); draw(); commit(true); }));
    $$('[data-my]', p).forEach((b) => (b.onclick = (e) => {
      const id = b.dataset.my;
      if (e.target.closest('[data-delmy]')) { store.set('mylooks', mine.filter((m) => m.id !== id)); if (S.lookId === 'my:' + id) S.lookId = 'none'; panel(); toast('Look deleted'); return; }
      const m = mine.find((x) => x.id === id); applyLookEntry(m); panel(); draw(); commit(true);
    }));
    $('#savelook', p).onclick = saveMyLook;
    $('#lcode', p).onclick = () => {
      const m = sheet(`<h3>Add a look from a code</h3><p class="muted small">Paste a code a friend shared with you. It starts with RG1.</p><textarea class="field" id="lc" rows="3" placeholder="RG1.…"></textarea><div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" id="lcgo">${ic('check')}<span>Add look</span></button></div>`);
      $('#lcgo', m).onclick = () => { const r = parseCode($('#lc', m).value); if (!r || !r.r) { toast('That code does not look right'); return; } const list = store.get('mylooks', []), id = Date.now().toString(36); list.unshift({ id, name: r.n || 'Shared look', r: r.r, full: r.full }); store.set('mylooks', list); applyLookEntry(list[0]); m.remove(); panel(); draw(); commit(true); toast('Look added to My looks'); };
    };
    const ls = $('#lshare', p); if (ls) ls.onclick = async () => { const m = mine.find((x) => 'my:' + x.id === S.lookId); if (!m) return; const code = lookCode({ n: m.name, r: m.r, full: m.full }); try { await navigator.clipboard.writeText(code); toast('Code copied. Send it to a friend'); } catch (e) { sheet(`<h3>Share this look</h3><p class="muted small">Copy this code and send it.</p><textarea class="field" rows="4" readonly>${esc(code)}</textarea><div class="row"><button class="btn ghost" data-x>Close</button></div>`); } };
  },
  adjust(p) {
    const [, list] = ADJUST[adjGroup];
    p.innerHTML = hdr('Adjust', `<button class="chip" id="auto">Auto</button>${rst()}`) +
      `<canvas class="hist" id="hist"></canvas><div class="seg">${ADJUST.map(([n], i) => `<button class="${i === adjGroup ? 'on' : ''}" data-ag="${i}">${n}</button>`).join('')}</div>
      <div class="sls">${list.map(([k, n, a, b]) => slider(k, n, a, b, S.adj[k] || 0, .01, (v) => fmtVal(k, v))).join('')}</div>`;
    $$('[data-ag]', p).forEach((b) => (b.onclick = () => { adjGroup = +b.dataset.ag; panel(); }));
    $('[data-rst]', p).onclick = () => { S.adj = {}; panel(); draw(); commit(true); };
    $('#auto', p).onclick = () => { S.adj = { ...S.adj, ...autoTone() }; panel(); draw(); commit(true); toast('Auto fix applied'); };
    histogram();
  },
  colour(p) {
    const H = S.hsl;
    p.innerHTML = hdr('Colour mix', rst()) + `<div class="bands">${HSL_BANDS.map(([n, c], i) => `<button class="band ${i === band ? 'on' : ''}" data-band="${i}" style="--c:${c}" title="${n}"></button>`).join('')}</div>
      <p class="muted center">${HSL_BANDS[band][0]}</p>
      <div class="sls">${slider('hslH', 'Hue', -1, 1, H.h[band])}${slider('hslS', 'Saturation', -1, 1, H.s[band])}${slider('hslL', 'Brightness', -1, 1, H.l[band])}</div>`;
    $$('[data-band]', p).forEach((b) => (b.onclick = () => { band = +b.dataset.band; panel(); }));
    $('[data-rst]', p).onclick = () => { S.hsl = blankHSL(); panel(); draw(); commit(true); };
  },
  curves(p) {
    p.innerHTML = hdr('Curves', rst()) + `<div class="seg">${[['m', 'RGB'], ['r', 'Red'], ['g', 'Green'], ['b', 'Blue']].map(([k, n]) => `<button class="${k === curveCh ? 'on' : ''} ch-${k}" data-ch="${k}">${n}</button>`).join('')}</div>
      <div class="curvebox"><canvas class="hist under" id="hist"></canvas><div id="cbox"></div></div><p class="muted small">Tap to add a point, drag to shape. Double-tap a point, or drag it out, to remove it.</p>
      <div class="pl">Presets</div><div class="chips">${CURVE_PRESETS.map(([n], i) => `<button class="chip" data-cp="${i}">${n}</button>`).join('')}</div>`;
    curveEditor($('#cbox', p), S.curve, curveCh, () => draw(), () => { draw(); commit(true); }); histogram();
    $$('[data-ch]', p).forEach((b) => (b.onclick = () => { curveCh = b.dataset.ch; panel(); }));
    $$('[data-cp]', p).forEach((b) => (b.onclick = () => { S.curve = { ...blankCurve(), ...JSON.parse(JSON.stringify(CURVE_PRESETS[+b.dataset.cp][1])) }; panel(); draw(); commit(true); }));
    $('[data-rst]', p).onclick = () => { S.curve = blankCurve(); panel(); draw(); commit(true); };
  },
  crop(p) {
    const g = S.geo, R = [['free', 'Free'], ['orig', 'Original'], ['1:1', '1:1'], ['4:5', '4:5'], ['3:4', '3:4'], ['9:16', '9:16'], ['16:9', '16:9']];
    p.innerHTML = hdr('Crop & rotate', rst()) + `<div class="chips">${R.map(([k, n]) => `<button class="chip ${g.ratio === k ? 'on' : ''}" data-ratio="${k}">${n}</button>`).join('')}</div>
      <div class="sls">${slider('straighten', 'Straighten', -45, 45, g.straighten || 0, .5, (v) => fmtVal('straighten', v))}${slider('perspV', 'Vertical tilt', -1, 1, (g.persp || [0, 0])[0], .01, (v) => fmtVal('perspV', v))}${slider('perspH', 'Horizontal tilt', -1, 1, (g.persp || [0, 0])[1], .01, (v) => fmtVal('perspH', v))}</div>
      <div class="chips"><button class="chip" id="autost">${ic('enhance')}Auto straighten</button></div>
      <div class="pl">Guides</div><div class="chips">${[['thirds', 'Thirds'], ['golden', 'Golden'], ['grid', 'Grid'], ['center', 'Centre'], ['none', 'None']].map(([k, n]) => `<button class="chip ${guides === k ? 'on' : ''}" data-gd="${k}">${n}</button>`).join('')}</div>
      <div class="acts"><button class="act" id="r90">${ic('rotate')}<span>Rotate</span></button><button class="act" id="fh">${ic('flipH')}<span>Flip</span></button><button class="act" id="fv">${ic('flipV')}<span>Flip up</span></button></div>
      <p class="muted small">Drag the corners or the box on the photo.</p>`;
    $$('[data-ratio]', p).forEach((b) => (b.onclick = () => { g.ratio = b.dataset.ratio; fitRatio(); panel(); draw(); commit(true); }));
    $('#autost', p).onclick = () => { const a = autoAngle(proxyOf(S.base, IMG())); g.straighten = Math.round(a * 2) / 2; panel(); draw(); commit(true); toast(a ? `Straightened by ${g.straighten}°` : 'Already straight'); };
    $$('[data-gd]', p).forEach((b) => (b.onclick = () => { guides = b.dataset.gd; panel(); draw(); }));
    $('#r90', p).onclick = () => { g.rot90 = (g.rot90 + 1) % 4; g.crop = { x: 0, y: 0, w: 1, h: 1 }; fitRatio(); draw(); commit(true); };
    $('#fh', p).onclick = () => { g.flipH = !g.flipH; draw(); commit(true); };
    $('#fv', p).onclick = () => { g.flipV = !g.flipV; draw(); commit(true); };
    $('[data-rst]', p).onclick = () => { S.geo = fresh().geo; panel(); draw(); commit(true); };
  },
  retouch(p) {
    const fd = FACES.get(S.base), F = S.face;
    p.innerHTML = hdr('Retouch', fd && fd.faces && fd.faces.length ? rst() : '') + (busy === 'faces' ? busyBox('Finding faces…')
      : !fd ? `<button class="btn primary block" id="find">${ic('retouch')}<span>Find faces</span></button>`
      : fd.error ? `<p class="muted">Could not load the face tools here. ${esc(fd.error)}</p><button class="btn ghost block" id="find">Try again</button>`
      : !fd.faces.length ? `<p class="muted">No face found in this photo. Retouch works on clear, front-facing faces.</p>`
      : `<p class="muted small">${fd.faces.length} face${fd.faces.length > 1 ? 's' : ''} found.</p>
        <div class="pl">Skin</div><div class="sls">${slider('fSmooth', 'Smooth skin', 0, 1, F.smooth)}${slider('fBright', 'Brighten face', 0, 1, F.bright)}</div>
        <div class="pl">Shape</div><div class="sls">${slider('fSlim', 'Slim face', 0, 1, F.slim)}${slider('fEyes', 'Bigger eyes', 0, 1, F.eyes)}</div>
        <div class="pl">Details</div><div class="sls">${slider('fEyeB', 'Brighten eyes', 0, 1, F.eyeBright)}${slider('fTeeth', 'Whiten teeth', 0, 1, F.teeth)}${slider('fShine', 'Reduce shine', 0, 1, F.shine || 0)}</div>
        <div class="pl">Makeup</div>
        <div class="mkrow"><span>Lipstick</span><div class="sw">${['#c2185b', '#e0143c', '#ff6f91', '#b5651d', '#8e2d4d', '#d4a5a5'].map((c) => `<button class="swc ${S.makeup.lipCol === c ? 'on' : ''}" data-mk="lipCol" data-c="${c}" style="background:${c}"></button>`).join('')}</div></div>${slider('lip', 'Lipstick', 0, 1, S.makeup.lip)}
        <div class="mkrow"><span>Blush</span><div class="sw">${['#ff8fa3', '#ff6f61', '#e8a0bf', '#f4a261'].map((c) => `<button class="swc ${S.makeup.blushCol === c ? 'on' : ''}" data-mk="blushCol" data-c="${c}" style="background:${c}"></button>`).join('')}</div></div>${slider('blush', 'Blush', 0, 1, S.makeup.blush)}
        <div class="mkrow"><span>Eyeshadow</span><div class="sw">${['#8b5a3c', '#c47a9b', '#6d4c8f', '#b08d57', '#3a2a2e'].map((c) => `<button class="swc ${S.makeup.lidCol === c ? 'on' : ''}" data-mk="lidCol" data-c="${c}" style="background:${c}"></button>`).join('')}</div></div>${slider('lid', 'Eyeshadow', 0, 1, S.makeup.lid)}`)
      + (busy === 'faces' ? '' : `<div class="pl">Hair colour</div>${busy === 'hair' ? busyBox('Finding the hair…') : HAIR.has(S.base) ? `<div class="sw">${['#7a2a3a', '#c2185b', '#ff6f91', '#a78bfa', '#3a6ea5', '#d4a373', '#f1d18a', '#2b2b2b'].map((c) => `<button class="swc ${S.hair.col === c ? 'on' : ''}" data-hc="${c}" style="background:${c}"></button>`).join('')}${eyeBtn('hair')}</div>${slider('hairAmt', 'Colour strength', 0, 1, S.hair.amt)}` : `<button class="btn ghost block" id="findhair">${ic('person')}<span>Find hair</span></button>`}
      <div class="pl">Body</div>${slider('bodySlim', 'Slim body', 0, 1, S.body.slim)}${slider('bodyLegs', 'Longer legs', 0, 1, S.body.legs)}<p class="muted small">Body works on full or half-body photos of one person.</p>`);
    const f = $('#find', p); if (f) f.onclick = () => { FACES.delete(S.base); findFaces(); };
    $$('[data-mk]', p).forEach((b) => (b.onclick = () => { S.makeup[b.dataset.mk] = b.dataset.c; const amt = { lipCol: 'lip', blushCol: 'blush', lidCol: 'lid' }[b.dataset.mk]; if (!S.makeup[amt]) S.makeup[amt] = .5; panel(); draw(); commit(true); }));
    $$('[data-hc]', p).forEach((b) => (b.onclick = () => { S.hair.col = b.dataset.hc; if (!S.hair.amt) S.hair.amt = .6; panel(); draw(); commit(true); }));
    wireEye(p, { hair: (h) => { S.hair.col = h; if (!S.hair.amt) S.hair.amt = .6; } });
    const fh = $('#findhair', p); if (fh) fh.onclick = async () => { busy = 'hair'; panel(); try { const r = await AI.partsMask(IMG(), () => {}); if (r.hair) HAIR.set(S.base, r.hair); if (!S.hair.amt) S.hair.amt = .6; } catch (e) { console.error(e); toast('Could not find the hair'); } busy = ''; panel(); draw(); commit(true); };
    $$('[data-k="bodySlim"] input, [data-k="bodyLegs"] input', p).forEach((inp) => inp.addEventListener('pointerdown', () => { if (!MASK && busy !== 'cut') runCut(false); }, { once: true }));
    const r = $('[data-rst]', p); if (r) r.onclick = () => { S.face = fresh().face; panel(); draw(); commit(true); };
  },
  erase(p) {
    p.innerHTML = hdr('Erase') + (busy === 'erase' ? busyBox(eraseMsg) : `<div class="seg"><button class="${eraseTap ? '' : 'on'}" data-et="0">${ic('brush')} Paint</button><button class="${eraseTap ? 'on' : ''}" data-et="1">${ic('heal')} Spot fix</button></div>
      <p class="muted small">${eraseTap ? 'Tap a spot, a pimple or a speck of dust and it is fixed straight away. Zoom in for small spots.' : 'Paint over what you want gone, then tap Erase.'} The first time, the eraser needs a moment to get ready.</p>
      <div class="sls">${slider('bsize', eraseTap ? 'Spot size' : 'Brush size', 8, 140, brushSize, 1, (v) => fmtVal('bsize', v))}</div>
      ${eraseTap ? '' : `<div class="row2"><button class="btn ghost" id="clr">Clear</button><button class="btn primary" id="go">${ic('erase')}<span>Erase</span></button></div>`}`);
    $$('[data-et]', p).forEach((b) => (b.onclick = () => { eraseTap = b.dataset.et === '1'; if (eraseTap) brushSize = Math.min(brushSize, 30); panel(); }));
    const c = $('#clr', p); if (c) c.onclick = () => { ERASE = blankPaint(); ERASE._base = S.base; draw(); };
    const g = $('#go', p); if (g) g.onclick = runErase;
  },
  cutout(p) {
    const b = S.bg;
    p.innerHTML = hdr('Cutout') + (busy === 'cut' ? busyBox('Finding the person and removing the background…')
      : !MASK ? `<button class="btn primary block" id="cut">${ic('cutout')}<span>Remove background</span></button><p class="muted small">Works best with people. Everything happens on your device.</p>`
      : `<div class="seg"><button class="${b.on ? 'on' : ''}" data-bgon="1">Background removed</button><button class="${b.on ? '' : 'on'}" data-bgon="0">Keep background</button></div>
        ${b.on ? `<div class="pl">New background</div><div class="chips">${[['clear', 'Transparent'], ['color', 'Colour'], ['photo', 'Photo'], ['blur', 'Blur'], ['mono', 'Black & white']].map(([k, n]) => `<button class="chip ${b.mode === k ? 'on' : ''}" data-bgm="${k}">${n}</button>`).join('')}</div>
        ${b.mode === 'color' ? `<div class="sw">${['#ffffff', '#111111', '#ff2d55', '#ffb3cf', '#f6e7d8', '#8b5a3c', '#7dd3fc', '#ffd34d'].map((c) => `<button class="swc ${b.color === c ? 'on' : ''}" data-bgc="${c}" style="background:${c}"></button>`).join('')}<label class="swc pickc" title="Any colour"><input type="color" id="bgpick" value="${b.color}"></label>${eyeBtn('bgc')}</div>` : ''}
        ${b.mode === 'blur' ? `<div class="sls">${slider('bgBlur', 'Blur', 0, 1, b.blur)}</div>` : ''}
        ${b.mode === 'photo' ? `<div class="bgp">${BG_PRESETS.map(([k, n]) => `<button class="bgt ${b.photo === k ? 'on' : ''}" data-bgp="${k}"><img src="${bgThumb(k)}" alt=""><span>${n}</span></button>`).join('')}${[...BGP.keys()].filter((k) => k.startsWith('u:')).map((k) => `<button class="bgt ${b.photo === k ? 'on' : ''}" data-bgp="${k}"><img src="${bgThumb(k)}" alt=""><span>Yours</span></button>`).join('')}<button class="bgt add" id="bgadd">${ic('plus')}<span>Your photo</span></button></div>` : ''}` : ''}
        <div class="pl">Sticker</div><button class="btn ghost block" id="mkst">${ic('sticker')}<span>Make a sticker of the person</span></button><p class="muted small">Cuts the person out with a white outline and a soft shadow, and puts it on your photo as a sticker.</p>`);
    $$('[data-bgp]', p).forEach((x) => (x.onclick = () => { b.photo = x.dataset.bgp; panel(); draw(); commit(true); }));
    const ba = $('#bgadd', p); if (ba) ba.onclick = async () => { const [f] = await pickFiles(); if (!f) return; const k = 'u:' + Date.now().toString(36); BGP.set(k, await loadImage(f, 2048)); b.photo = k; panel(); draw(); commit(true); };
    const mk = $('#mkst', p); if (mk) mk.onclick = makeSticker;
    const c = $('#cut', p); if (c) c.onclick = () => runCut(true);
    $$('[data-bgon]', p).forEach((x) => (x.onclick = () => { b.on = x.dataset.bgon === '1'; panel(); draw(); commit(true); }));
    $$('[data-bgm]', p).forEach((x) => (x.onclick = () => { b.mode = x.dataset.bgm; if (b.mode === 'photo' && !b.photo) b.photo = 'g:studio'; panel(); draw(); commit(true); }));
    $$('[data-bgc]', p).forEach((x) => (x.onclick = () => { b.color = x.dataset.bgc; panel(); draw(); commit(true); }));
    const bp = $('#bgpick', p); if (bp) bp.oninput = () => { b.color = bp.value; draw(); commit(); };
    wireEye(p, { bgc: (h) => (b.color = h) });
  },
  blur(p) {
    const B = S.blur;
    p.innerHTML = hdr('Lens blur') + `<div class="seg">${[['off', 'Off'], ['radial', 'Round'], ['linear', 'Line']].map(([k, n]) => `<button class="${B.mode === k ? 'on' : ''}" data-bm="${k}">${n}</button>`).join('')}</div>
      ${B.mode === 'off' ? '<p class="muted small">Blur the background like a big camera lens. Pick Round or Line, then drag on the photo to choose what stays sharp.</p>' : `
      <div class="sls">${slider('bAmt', 'Blur', 0, 1, B.amount)}${slider('bSize', 'Sharp area', .02, .6, B.size)}${slider('bFeather', 'Softness', 0, 1, B.feather)}${B.mode === 'linear' ? slider('bAngle', 'Angle', -90, 90, B.angle, 1, (v) => fmtVal('bAngle', v)) : ''}</div>
      <div class="chips"><button class="chip ${B.keep ? 'on' : ''}" id="keep">${busy === 'cut' ? '<i class="spin"></i>' : ic('cutout')}Keep person sharp</button></div>
      <p class="muted small">Drag on the photo to move the sharp area.</p>`}`;
    $$('[data-bm]', p).forEach((b) => (b.onclick = () => { B.mode = b.dataset.bm; panel(); draw(); commit(true); }));
    const k = $('#keep', p); if (k) k.onclick = async () => { if (!B.keep && !MASK) { await runCut(false); if (!MASK) return; } B.keep = !B.keep; panel(); draw(); commit(true); };
  },
  brush(p) {
    const L = S.local;
    p.innerHTML = hdr('Brush', `<button class="chip ${showArea ? 'on' : ''}" id="show">Show area</button>${rst()}`) + `<div class="seg"><button class="${brushErase ? '' : 'on'}" data-be="0">${ic('brush')} Paint</button><button class="${brushErase ? 'on' : ''}" data-be="1">${ic('erase')} Wipe</button></div>
      <div class="pl">Pick for me</div><div class="chips">${[['person', 'Person', 'person'], ['bg', 'Background', 'photo'], ['sky', 'Sky', 'sky']].map(([k, n, i]) => `<button class="chip ${L.auto === k ? 'on' : ''}" data-auto="${k}">${busy === 'auto:' + k ? '<i class="spin"></i>' : ic(i)}${n}</button>`).join('')}</div>
      <div class="sls">${slider('bsize', 'Brush size', 8, 140, brushSize, 1, (v) => fmtVal('bsize', v))}</div>
      <p class="muted small">${L.strokes.length || L.auto ? 'These changes only touch the chosen area. Paint or wipe to fix the edges:' : 'Pick an area above, or paint the area you want to change, then use the sliders.'}</p>
      <div class="sls">${slider('lExpo', 'Light', -1.5, 1.5, L.expo, .01, (v) => fmtVal('lExpo', v))}${slider('lCon', 'Contrast', -1, 1, L.contrast)}${slider('lSat', 'Saturation', -1, 1, L.sat)}${slider('lTemp', 'Warmth', -1, 1, L.temp)}</div>`;
    $$('[data-be]', p).forEach((b) => (b.onclick = () => { brushErase = b.dataset.be === '1'; panel(); }));
    $$('[data-auto]', p).forEach((b) => (b.onclick = async () => {
      const k = b.dataset.auto; if (busy) return;
      if (L.auto === k) { L.auto = null; panel(); draw(); commit(true); return; }
      busy = 'auto:' + k; panel();
      if (k === 'sky') await ensureSky(); else if (!MASK) { busy = ''; await runCut(false); }
      busy = ''; if (k !== 'sky' && !MASK) { panel(); return; }
      L.auto = k; if (!L.expo && !L.sat && !L.temp && !L.contrast) showArea = true;
      panel(); draw(); commit(true); setTimeout(() => { if (showArea && tool === 'brush') { showArea = false; panel(); draw(); } }, 1400);
    }));
    $('#show', p).onclick = () => { showArea = !showArea; panel(); draw(); };
    $('[data-rst]', p).onclick = () => { S.local = fresh().local; panel(); draw(); commit(true); };
  },
  reshape(p) {
    p.innerHTML = hdr('Reshape') + `<div class="acts four">${[['push', 'Push'], ['bloat', 'Grow'], ['pinch', 'Shrink'], ['restore', 'Undo area']].map(([k, n]) => `<button class="act ${liqMode === k ? 'on' : ''}" data-lm="${k}">${ic(k === 'restore' ? 'reset' : k)}<span>${n}</span></button>`).join('')}</div>
      <div class="sls">${slider('bsize', 'Brush size', 8, 160, brushSize, 1, (v) => fmtVal('bsize', v))}</div>
      <p class="muted small">Drag on the photo. Changes are kept when you pick another tool.</p>
      ${LIQ && LIQ.used ? `<div class="row2"><button class="btn ghost" id="lcancel">Cancel</button><button class="btn primary" id="lapply">${ic('check')}<span>Apply</span></button></div>` : ''}`;
    $$('[data-lm]', p).forEach((b) => (b.onclick = () => { liqMode = b.dataset.lm; panel(); }));
    const a = $('#lapply', p); if (a) a.onclick = () => { bakeLiquify(); panel(); };
    const c = $('#lcancel', p); if (c) c.onclick = () => { LIQ = null; panel(); draw(); };
  },
  text(p) {
    const it = sel >= 0 && S.items[sel] && S.items[sel].type === 'text' ? S.items[sel] : null;
    const sw = (attr, cur, list) => list.map((c) => `<button class="swc ${cur === c ? 'on' : ''}" ${attr}="${c}" style="background:${c}"></button>`).join('');
    const PAL = [...COLORS, '#ff4d8d', '#f6e7d8', '#4ade80', '#a78bfa'];
    p.innerHTML = hdr('Text', `<button class="chip" id="addt">${ic('plus')}Add text</button>`) +
      `<div class="pl">Styles</div><div class="tpre">${TEXT_PRESETS.map(([n, o], i) => `<button class="tp" data-tp="${i}" style="font:${fontSpec(o.font, 18).replace(/"/g, "'")};color:${o.color};${o.pill ? `background:${o.pillColor};` : ''}${o.glow ? `text-shadow:0 0 8px ${o.color};` : ''}${o.outline ? `-webkit-text-stroke:1px ${o.outlineColor};` : ''}">${o.upper ? n.toUpperCase() : n}</button>`).join('')}</div>` +
      (it ? `<textarea class="field" id="tv" rows="2" maxlength="120">${esc(it.text)}</textarea>
        <div class="pl">Font</div><div class="chips fonts">${FONTS.map(([n], i) => `<button class="chip ${it.font === i ? 'on' : ''}" data-font="${i}" style="font:${fontSpec(i, 15).replace(/"/g, "'")}">${n}</button>`).join('')}</div>
        <div class="pl">Colour</div><div class="sw">${sw('data-tc', it.color, PAL)}<label class="swc pickc"><input type="color" id="tcp" value="${it.color}"></label>${eyeBtn('tc')}</div>
        <div class="chips"><button class="chip ${it.grad ? 'on' : ''}" id="tgrad">Gradient</button></div>${it.grad ? `<div class="sw">${sw('data-tg', it.grad, ['#ff2d55', '#ffd34d', '#a78bfa', '#60a5fa', '#4ade80', '#ffffff', '#111111'])}${eyeBtn('tg')}</div>` : ''}
        <div class="chips"><button class="chip ${it.pill ? 'on' : ''}" id="pill">Label</button><button class="chip ${it.shadow ? 'on' : ''}" id="shd">Shadow</button><button class="chip ${it.glow ? 'on' : ''}" id="glw">Glow</button><button class="chip ${it.upper ? 'on' : ''}" id="upc">CAPS</button><button class="chip ${pathMode ? 'on' : ''}" id="tpath">${ic('draw')}${it.path ? 'Redraw path' : 'Text on a path'}</button>${it.path ? `<button class="chip" id="tpathx">${ic('x')}Straight</button>` : ''}<button class="chip" id="dup">${ic('copy')}Copy</button><button class="chip danger" id="del">${ic('trash')}Delete</button></div>
        ${it.pill ? `<div class="pl">Label colour</div><div class="sw">${sw('data-pc2', it.pillColor, ['#ffffff', '#111111', '#ff2d55', '#ffb3cf', '#ffd34d', '#f6e7d8', '#8b5a3c'])}</div>` : ''}
        <div class="sls">${slider('tsize', 'Size', .03, .3, it.size, .005)}${slider('trot', 'Rotate', -180, 180, it.rot, 1, (v) => fmtVal('trot', v))}${slider('tcurve', 'Curve', -1, 1, it.curve || 0)}${slider('tspace', 'Spacing', -.05, .5, it.spacing || 0, .005)}${slider('toutline', 'Outline', 0, 1, it.outline || 0)}${slider('tdepth', '3D depth', 0, 1, it.depth || 0)}</div>
        ${it.depth > 0 ? `<div class="pl">3D colour</div><div class="sw">${sw('data-dc2', it.depthColor, ['#8b1030', '#111111', '#c2185b', '#3a6ea5', '#8b5a3c', '#ffffff'])}</div>` : ''}
        ${it.outline > 0 ? `<div class="pl">Outline colour</div><div class="sw">${sw('data-oc', it.outlineColor, ['#111111', '#ffffff', '#ff2d55', '#8b2a1a', '#ffd34d', '#60a5fa'])}</div>` : ''}`
      : '<p class="muted">Pick a style or add text, then drag it on the photo. Tap text to edit it.</p>') + layersHTML();
    const add = (o = {}) => { S.items.push({ ...blankText(), ...o }); sel = S.items.length - 1; items(); panel(); commit(true); const tv = $('#tv'); if (tv && !o.text) { tv.focus(); tv.select(); } };
    $('#addt', p).onclick = () => add(); wireLayers(p);
    $$('[data-tp]', p).forEach((b) => (b.onclick = () => { const o = TEXT_PRESETS[+b.dataset.tp][1]; if (it) { Object.assign(it, { ...blankText(), ...o, text: it.text, x: it.x, y: it.y, size: it.size, rot: it.rot }); items(); panel(); commit(true); } else add(o); }));
    if (it) {
      const upd = (fn) => () => { fn(); items(); panel(); commit(true); };
      $('#tv', p).oninput = (e) => { it.text = e.target.value; items(); commit(); };
      $$('[data-font]', p).forEach((x) => (x.onclick = upd(() => (it.font = +x.dataset.font))));
      $$('[data-tc]', p).forEach((x) => (x.onclick = upd(() => (it.color = x.dataset.tc))));
      $('#tcp', p).oninput = (e) => { it.color = e.target.value; items(); commit(); };
      $('#tgrad', p).onclick = upd(() => (it.grad = it.grad ? '' : '#ff2d55'));
      $('#tpath', p).onclick = () => { pathMode = !pathMode; panel(); draw(); if (pathMode) toast('Draw a line on the photo for the text to follow'); };
      const tpx = $('#tpathx', p); if (tpx) tpx.onclick = upd(() => { delete it.path; pathMode = false; });
      $$('[data-tg]', p).forEach((x) => (x.onclick = upd(() => (it.grad = x.dataset.tg))));
      $$('[data-dc2]', p).forEach((x) => (x.onclick = upd(() => (it.depthColor = x.dataset.dc2))));
      wireEye(p, { tc: (h) => (it.color = h), tg: (h) => (it.grad = h) });
      $$('[data-pc2]', p).forEach((x) => (x.onclick = upd(() => (it.pillColor = x.dataset.pc2))));
      $$('[data-oc]', p).forEach((x) => (x.onclick = upd(() => (it.outlineColor = x.dataset.oc))));
      $('#pill', p).onclick = upd(() => { it.pill = !it.pill; if (it.pill && !it.pillColor) it.pillColor = it.color === '#ffffff' ? '#ff2d55' : '#ffffff'; });
      $('#shd', p).onclick = upd(() => (it.shadow = !it.shadow)); $('#glw', p).onclick = upd(() => (it.glow = !it.glow)); $('#upc', p).onclick = upd(() => (it.upper = !it.upper));
      $('#dup', p).onclick = () => { S.items.push({ ...JSON.parse(JSON.stringify(it)), x: clamp(it.x + .05, 0, 1), y: clamp(it.y + .05, 0, 1) }); sel = S.items.length - 1; items(); panel(); commit(true); };
      $('#del', p).onclick = () => { S.items.splice(sel, 1); sel = -1; items(); panel(); commit(true); };
    }
  },
  sticker(p) {
    const it = sel >= 0 && S.items[sel] && S.items[sel].type === 'sticker' ? S.items[sel] : null;
    const mine = [...IMGS.keys()];
    p.innerHTML = hdr('Stickers', `<button class="chip" id="mine">${ic('image')}Your own</button>`) + `${mine.length ? `<div class="pl">Yours</div><div class="stk">${mine.map((k) => `<button data-ref="${k}"><img src="${IMGS.get(k)}" alt=""></button>`).join('')}</div><div class="pl">Packs</div>` : ''}<div class="chips">${STICKER_PACKS.map(([n], i) => `<button class="chip ${stkPack === i ? 'on' : ''}" data-pack="${i}">${n}</button>`).join('')}</div><div class="stk">${STICKER_PACKS[stkPack][1].map((k) => `<button data-stk="${k}"><img src="${stickerSrc(k)}" alt=""></button>`).join('')}</div>
      ${it ? `<div class="sls">${slider('ssize', 'Size', .05, .9, it.size, .005)}${slider('srot', 'Rotate', -180, 180, it.rot, 1, (v) => fmtVal('srot', v))}</div><div class="chips"><button class="chip" id="sflip">Mirror</button>${it.src.startsWith('ref:') ? `<button class="chip" id="spng">${ic('download')}Save PNG</button>` : ''}<button class="chip danger" id="del">${ic('trash')}Delete</button></div>` : '<p class="muted small">Tap a sticker to add it, then drag it on the photo. Make your own in Cutout.</p>'}` + layersHTML();
    wireLayers(p);
    const add = (src) => { S.items.push({ type: 'sticker', src, x: .5, y: .5, size: .25, rot: 0, flip: false }); sel = S.items.length - 1; items(); panel(); commit(true); };
    $$('[data-stk]', p).forEach((x) => (x.onclick = () => add(stickerSrc(x.dataset.stk))));
    $$('[data-ref]', p).forEach((x) => (x.onclick = () => add('ref:' + x.dataset.ref)));
    $$('[data-pack]', p).forEach((x) => (x.onclick = () => { stkPack = +x.dataset.pack; panel(); }));
    $('#mine', p).onclick = async () => { const [f] = await pickFiles(); if (!f) return; const c = await loadImage(f, 800), k = 'up:' + Date.now().toString(36); IMGS.set(k, c.toDataURL('image/png')); add('ref:' + k); };
    if (it) {
      $('#sflip', p).onclick = () => { it.flip = !it.flip; items(); commit(true); }; $('#del', p).onclick = () => { S.items.splice(sel, 1); sel = -1; items(); panel(); commit(true); };
      const sp = $('#spng', p); if (sp) sp.onclick = async () => { const b = await (await fetch(srcOf(it))).blob(); if (await saveFiles([new File([b], 'darlia-sticker.png', { type: 'image/png' })])) toast('Sticker saved'); };
    }
  },
  draw(p) {
    const n = S.items.filter((i) => i.type === 'draw').length;
    p.innerHTML = hdr('Draw', n ? `<button class="chip" id="dundo">${ic('undo')}Undo line</button><button class="chip danger" id="dclr">${ic('trash')}Clear</button>` : '') +
      `<div class="pl">Colour</div><div class="sw">${['#ffffff', '#111111', '#ff2d55', '#ff4d8d', '#ffb3cf', '#ffd34d', '#4ade80', '#60a5fa', '#a78bfa', '#8b5a3c'].map((c) => `<button class="swc ${pen.color === c ? 'on' : ''}" data-pc="${c}" style="background:${c}"></button>`).join('')}<label class="swc pickc"><input type="color" id="ppick" value="${pen.color}"></label>${eyeBtn('pen')}</div>
      <div class="sls">${slider('pw', 'Size', .003, .05, pen.w, .001, (v) => fmtVal('pw', v))}</div>
      <div class="chips"><button class="chip ${pen.glow ? 'on' : ''}" id="glow">Neon glow</button></div><p class="muted small">Draw on the photo with your finger or mouse.</p>`;
    $$('[data-pc]', p).forEach((b) => (b.onclick = () => { pen.color = b.dataset.pc; panel(); }));
    $('#ppick', p).oninput = (e) => { pen.color = e.target.value; };
    $('#glow', p).onclick = () => { pen.glow = !pen.glow; panel(); };
    wireEye(p, { pen: (h) => (pen.color = h) });
    const u = $('#dundo', p); if (u) u.onclick = () => { for (let i = S.items.length - 1; i >= 0; i--) if (S.items[i].type === 'draw') { S.items.splice(i, 1); break; } items(); panel(); commit(true); };
    const c = $('#dclr', p); if (c) c.onclick = () => { S.items = S.items.filter((i) => i.type !== 'draw'); items(); panel(); commit(true); };
  },
  enhance(p) {
    const b = IMG(), big = Math.max(b.width, b.height), inS = Math.min(big, 1280), opts = [['1', 'Sharper, same size', Math.round(big)], ['2', '2× bigger', Math.round(inS * 2)], ['4', '4× bigger', Math.round(inS * 4)]].filter(([k, , out]) => out <= Math.min(E.maxTex, 4096) && (k === '1' || out > big));
    p.innerHTML = hdr('AI Enhance') + (busy === 'enhance' ? busyBox(enhMsg) : `<p class="muted small">Makes blurry, small or old photos sharper and cleaner with AI. Your photo is ${b.width}×${b.height}.</p>
      ${big > 2048 ? '<p class="muted small">This photo is already big. Enhance works best on photos under 2000 px, like screenshots, old photos or small downloads.</p>' : ''}
      <div class="menu">${opts.map(([k, n, out]) => `<button data-enh="${k}">${ic('enhance')}<span>${n}<small>Result about ${out} px on the long side</small></span></button>`).join('')}</div>
      <p class="muted small">The first time, the AI needs a moment to get ready. Bigger photos take longer.</p>`);
    $$('[data-enh]', p).forEach((x) => (x.onclick = () => runEnhance(+x.dataset.enh)));
  },
  scan(p) {
    p.innerHTML = hdr('Scan document') + `<p class="muted small">Turn a photo of a page, receipt or whiteboard into a flat, clean scan. Drag the corners onto the page.</p>
      <div class="chips"><button class="chip" id="sauto">${ic('scan')}Find page</button><button class="chip" id="sreset">${ic('reset')}Whole photo</button></div>
      <div class="pl">Clean up</div><div class="seg">${[['color', 'Colour'], ['bw', 'Black & white'], ['none', 'Original']].map(([k, n]) => `<button class="${scanMode === k ? 'on' : ''}" data-sm="${k}">${n}</button>`).join('')}</div>
      <button class="btn primary block" id="sgo">${ic('check')}<span>Make scan</span></button>`;
    $('#sauto', p).onclick = () => { SCANQ = detectQuad(proxyOf(S.base, IMG())); placeScan(); };
    $('#sreset', p).onclick = () => { SCANQ = [[0, 0], [1, 0], [1, 1], [0, 1]]; placeScan(); };
    $$('[data-sm]', p).forEach((b) => (b.onclick = () => { scanMode = b.dataset.sm; panel(); }));
    $('#sgo', p).onclick = () => { toast('Making scan…'); setTimeout(() => { let c = warpQuad(IMG(), SCANQ); if (scanMode !== 'none') c = cleanPage(c, scanMode); S.geo = fresh().geo; newBase(c); setTool('adjust'); toast('Scan ready'); }, 30); };
  },
  sky(p) {
    const K = S.sky, have = SKY.has(S.base);
    p.innerHTML = hdr('Sky', K.amt ? rst() : '') + (busy === 'sky' ? busyBox('Finding the sky…') : `<p class="muted small">Swap a dull sky for a new one. Works best on outdoor photos with open sky at the top.</p>
      <div class="bgp">${SKIES.map(([k, n]) => `<button class="bgt ${K.amt && K.key === k ? 'on' : ''}" data-sky="${k}"><img src="${thumbOf(skyCanvas(k), 'sky:' + k)}" alt=""><span>${n}</span></button>`).join('')}${[...BGP.keys()].filter((k) => k.startsWith('s:')).map((k) => `<button class="bgt ${K.amt && K.key === k ? 'on' : ''}" data-sky="${k}"><img src="${thumbOf(BGP.get(k), k)}" alt=""><span>Yours</span></button>`).join('')}<button class="bgt add" id="skyadd">${ic('plus')}<span>Your photo</span></button></div>
      ${K.amt ? `<div class="sls">${slider('skyAmt', 'Strength', 0, 1, K.amt)}</div><p class="muted small">Not perfect at the edges? Use Brush → Sky with a wipe to fix it.</p>` : ''}
      ${have ? '' : '<p class="muted small">Tap a sky to start.</p>'}`);
    const pick = async (k) => { if (!have) { busy = 'sky'; panel(); await ensureSky(); busy = ''; } K.key = k; if (!K.amt) K.amt = .9; K.tint = SKY_TINT[k] || '#ffffff'; panel(); draw(); commit(true); };
    $$('[data-sky]', p).forEach((b) => (b.onclick = () => pick(b.dataset.sky)));
    const a = $('#skyadd', p); if (a) a.onclick = async () => { const [f] = await pickFiles(); if (!f) return; const k = 's:' + Date.now().toString(36); BGP.set(k, await loadImage(f, 2048)); pick(k); };
    const r = $('[data-rst]', p); if (r) r.onclick = () => { K.amt = 0; panel(); draw(); commit(true); };
  },
  eff(p) {
    const X = S.eff, HUES = [['Red', 0], ['Orange', .07], ['Yellow', .15], ['Green', .33], ['Aqua', .5], ['Blue', .6], ['Purple', .75], ['Pink', .9]];
    p.innerHTML = hdr('Effects', `<button class="chip" data-rst>${ic('reset')}Reset</button>`) +
      `<div class="pl">Colour splash</div><div class="chips"><button class="chip ${X.splash ? 'on' : ''}" id="spl">${X.splash ? 'On' : 'Off'}</button>${X.splash ? `<button class="chip ${X.splashKeep ? 'on' : ''}" id="splk">${busy === 'cut' ? '<i class="spin"></i>' : ic('person')}Keep person in colour</button>` : ''}</div>
      ${X.splash ? `<p class="muted small">Everything turns black and white except the colour you pick.</p><div class="sw">${HUES.map(([n, h]) => `<button class="swc ${Math.abs(X.splashHue - h) < .01 ? 'on' : ''}" data-hue="${h}" title="${n}" style="background:hsl(${h * 360},85%,55%)"></button>`).join('')}</div><div class="sls">${slider('splashRange', 'Colour range', .02, .2, X.splashRange, .005)}</div>` : ''}
      <div class="pl">Glitch</div><div class="sls">${slider('glitch', 'RGB split', 0, 1, X.glitch)}${slider('vhs', 'VHS tape', 0, 1, X.vhs)}</div>
      <div class="pl">Art style</div><div class="chips">${[['none', 'None'], ['sketch', 'Pencil sketch'], ['water', 'Watercolour'], ['pop', 'Pop art'], ['cartoon', 'Cartoon']].map(([k, n]) => `<button class="chip ${X.art === k ? 'on' : ''}" data-art="${k}">${n}</button>`).join('')}</div>
      ${X.art !== 'none' ? `<div class="sls">${slider('artAmt', 'Strength', 0, 1, X.artAmt)}</div>` : ''}`;
    $('#spl', p).onclick = () => { X.splash = !X.splash; panel(); draw(); commit(true); };
    const k = $('#splk', p); if (k) k.onclick = async () => { if (!X.splashKeep && !MASK) { await runCut(false); if (!MASK) return; } X.splashKeep = !X.splashKeep; panel(); draw(); commit(true); };
    $$('[data-hue]', p).forEach((b) => (b.onclick = () => { X.splashHue = +b.dataset.hue; panel(); draw(); commit(true); }));
    $$('[data-art]', p).forEach((b) => (b.onclick = () => { X.art = b.dataset.art; panel(); draw(); commit(true); }));
    $('[data-rst]', p).onclick = () => { S.eff = fresh().eff; panel(); draw(); commit(true); };
  },
  fx(p) {
    const X = S.fx;
    const B = S.blend;
    p.innerHTML = hdr('Film fx', `<button class="chip" id="shuf">${ic('reset')}Shuffle</button><button class="chip" data-rst>${ic('reset')}Reset</button>`) +
      `<div class="pl">Texture</div><div class="chips">${TEXTURES.map(([k, n]) => `<button class="chip ${X.texture === k ? 'on' : ''}" data-tex="${k}">${n}</button>`).join('')}</div>${X.texture !== 'none' ? slider('texAmt', 'Texture strength', 0, 1, X.texAmt) : ''}
      <div class="pl">Double exposure</div>${B.key ? `<div class="chips">${[['screen', 'Light'], ['multiply', 'Dark'], ['overlay', 'Overlay'], ['soft-light', 'Soft'], ['difference', 'Invert']].map(([k, n]) => `<button class="chip ${B.mode === k ? 'on' : ''}" data-bm2="${k}">${n}</button>`).join('')}<button class="chip ${B.fade ? 'on' : ''}" id="blfade">Fade edges</button><button class="chip" id="bladd">${ic('image')}Change</button><button class="chip danger" id="bldel">${ic('trash')}</button></div>${slider('blendAmt', 'Mix', 0, 1, B.amt)}` : `<button class="btn ghost block" id="bladd">${ic('image')}<span>Add a second photo</span></button>`}
      <div class="pl">Light leak</div><div class="chips">${LEAKS.map(([k, n, c]) => `<button class="chip ${X.leakType === k && X.leak > 0 ? 'on' : ''}" data-lk="${k}"><i class="dot" style="background:linear-gradient(135deg,${c[0]},${c[1]})"></i>${n}</button>`).join('')}<button class="chip" id="lkmv" ${X.leak > 0 ? '' : 'disabled'}>Move</button></div>
      <div class="sls">${slider('fxLeak', 'Leak strength', 0, 1, X.leak)}${slider('fxDust', 'Dust', 0, 1, X.dust)}${slider('fxScratch', 'Scratches', 0, 1, X.scratch)}</div>
      <div class="pl">Date stamp</div><div class="chips"><button class="chip ${X.date ? 'on' : ''}" id="dton">${ic('clock')}${X.date ? 'On' : 'Off'}</button>${X.date ? [['ymd', 'YY MM DD'], ['dmy', 'DD MM YY'], ['mdy', 'MM DD YY']].map(([k, n]) => `<button class="chip ${X.dateFmt === k && !X.dateText ? 'on' : ''}" data-df="${k}">${n}</button>`).join('') : ''}</div>
      ${X.date ? `<input class="field" id="dtx" maxlength="14" placeholder="Or type your own, e.g. 98 08 24" value="${esc(X.dateText)}"><div class="sw">${['#ff8a1f', '#ff3b2f', '#ffd34d', '#ffffff', '#ff4d8d'].map((c) => `<button class="swc ${X.dateColor === c ? 'on' : ''}" data-dc="${c}" style="background:${c}"></button>`).join('')}</div>` : ''}`;
    $$('[data-lk]', p).forEach((b) => (b.onclick = () => { X.leakType = b.dataset.lk; if (!X.leak) X.leak = .6; panel(); draw(); commit(true); }));
    $$('[data-tex]', p).forEach((b) => (b.onclick = () => { X.texture = b.dataset.tex; panel(); draw(); commit(true); }));
    $$('[data-bm2]', p).forEach((b) => (b.onclick = () => { B.mode = b.dataset.bm2; panel(); draw(); commit(true); }));
    const ba = $('#bladd', p); if (ba) ba.onclick = async () => { const [f] = await pickFiles(); if (!f) return; const c = await loadImage(f, 1800), k = 'bl:' + Date.now().toString(36); IMGS.set(k, c.toDataURL('image/jpeg', .9)); B.key = k; panel(); draw(); commit(true); };
    const bf = $('#blfade', p); if (bf) bf.onclick = () => { B.fade = !B.fade; panel(); draw(); commit(true); };
    const bd = $('#bldel', p); if (bd) bd.onclick = () => { B.key = ''; panel(); draw(); commit(true); };
    $('#lkmv', p).onclick = () => { X.leakPos = (X.leakPos + 1) % 4; draw(); commit(true); };
    $('#shuf', p).onclick = () => { S.seed = (S.seed * 31 + 17) % 9973; draw(); commit(true); };
    $('[data-rst]', p).onclick = () => { S.fx = blankFx(); panel(); draw(); commit(true); };
    $('#dton', p).onclick = () => { X.date = !X.date; panel(); draw(); commit(true); };
    $$('[data-df]', p).forEach((b) => (b.onclick = () => { X.dateFmt = b.dataset.df; X.dateText = ''; panel(); draw(); commit(true); }));
    $$('[data-dc]', p).forEach((b) => (b.onclick = () => { X.dateColor = b.dataset.dc; panel(); draw(); commit(true); }));
    const dt = $('#dtx', p); if (dt) dt.oninput = () => { X.dateText = dt.value.replace(/[^0-9 .:-]/g, ''); draw(); commit(); };
  },
  frame(p) {
    const F = S.frame, colorable = COLORABLE.includes(F.type);
    p.innerHTML = hdr('Frame') + `<div class="frames">${FRAMES.map(([k, n]) => `<button class="frb ${F.type === k ? 'on' : ''}" data-fr="${k}"><i class="fp fp-${k}"></i><span>${n}</span></button>`).join('')}</div>
      ${F.type !== 'none' ? `<div class="sls">${slider('frSize', F.type === 'rounded' ? 'Roundness' : F.type === 'cinema' ? 'Bar size' : 'Border size', 0, 1, F.size)}</div>` : ''}
      ${colorable ? `<div class="pl">Border colour</div><div class="sw">${['', '#ffffff', '#111111', '#f6d5dc', '#ff2d55', '#f6e7d8', '#8b5a3c', '#1f171a'].map((c) => `<button class="swc ${F.color === c ? 'on' : ''}" data-frc="${c}" style="background:${c || 'conic-gradient(#fff 0 50%, #ddd 0)'}" title="${c ? '' : 'Default'}"></button>`).join('')}</div>` : ''}
      ${['polaroid', 'raya', 'merdeka', 'wedding', 'bday'].includes(F.type) ? `<div class="pl">Caption</div><input class="field" id="cap" maxlength="40" placeholder="${F.type === 'polaroid' ? 'Write something' : 'Leave empty for the default words'}" value="${esc(F.caption)}">` : ''}`;
    $$('[data-fr]', p).forEach((b) => (b.onclick = () => { F.type = b.dataset.fr; if (!COLORABLE.includes(F.type)) F.color = ''; panel(); draw(); commit(true); }));
    $$('[data-frc]', p).forEach((b) => (b.onclick = () => { F.color = b.dataset.frc; panel(); draw(); commit(true); }));
    const cp = $('#cap', p); if (cp) cp.oninput = () => { F.caption = cp.value; draw(); commit(); };
  },
};
let thT = 0;
function thumbs() {
  clearTimeout(thT); thT = setTimeout(() => {
    const ims = [...$$('[data-thm]'), ...$$('[data-th]')], mine = store.get('mylooks', []); let i = 0;
    const step = () => {
      if (i >= ims.length || !TH) { TH && TH.setCurve(null); return; } const im = ims[i++]; let s;
      if (im.dataset.thm) { const m = mine.find((x) => x.id === im.dataset.thm); if (!m) return step(); s = { ...fresh(), ...m.r }; TH.setCurve(isFlat(s.curve) ? null : curveLUT(s.curve)); }
      else { const l = LOOKS.find((x) => x.id === im.dataset.th); s = { ...fresh(), look: l.look, lookAmt: 1 }; TH.setCurve(null); }
      TH.render(s, TH.w, TH.h); im.src = TH.cv.toDataURL('image/jpeg', .8); requestAnimationFrame(step);
    };
    step();
  }, 30);
}
function autoTone() {
  const b = IMG(), c = document.createElement('canvas'), k = 64 / Math.max(b.width, b.height); c.width = Math.max(1, b.width * k | 0); c.height = Math.max(1, b.height * k | 0);
  const x = c.getContext('2d'); x.drawImage(b, 0, 0, c.width, c.height); const d = x.getImageData(0, 0, c.width, c.height).data; let sum = 0, n = 0, lo = 255, hi = 0, r = 0, bl = 0;
  for (let i = 0; i < d.length; i += 4) { const l = d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722; sum += l; n++; lo = Math.min(lo, l); hi = Math.max(hi, l); r += d[i]; bl += d[i + 2]; }
  const mean = sum / n / 255;
  return { exposure: clamp((0.46 - mean) * 1.6, -1, 1), contrast: clamp((200 - (hi - lo)) / 400, -.2, .3), shadows: mean < .4 ? .25 : .05, highlights: mean > .55 ? -.25 : -.05, vibrance: .2, temp: clamp((bl - r) / n / 255 * .8, -.3, .3) };
}

// ---------------- menu: copy / paste / my looks ----------------
function moreMenu() {
  const clip = store.get('clip', null);
  const m = sheet(`<h3>Edits</h3><div class="menu">
    <button data-a="copy">${ic('copy')}<span>Copy edits<small>Looks, adjust, colour and curves</small></span></button>
    <button data-a="paste" ${clip ? '' : 'disabled'}>${ic('paste')}<span>Paste edits<small>${clip ? 'Use the copied edits on this photo' : 'Copy edits from a photo first'}</small></span></button>
    <button data-a="save">${ic('heart')}<span>Save as my look<small>Use it again on any photo</small></span></button>
    <button data-a="reset">${ic('reset')}<span>Reset all edits<small>Back to the original photo</small></span></button>
    <button data-a="hist">${ic('history')}<span>History<small>See every step and jump back</small></span></button>
    <button data-a="pal">${ic('palette')}<span>Colour palette<small>The main colours of this photo</small></span></button>
    <button data-a="album">${ic('album')}<span>Album<small>${esc(PROJ && PROJ.album ? PROJ.album : 'Put this photo in an album')}</small></span></button>
    <button data-a="file">${ic('file')}<span>Send project file<small>Keep editing on another phone or computer</small></span></button>
    <button data-a="theme">${ic(store.get('theme', 'dark') === 'dark' ? 'sun' : 'moon')}<span>${store.get('theme', 'dark') === 'dark' ? 'Light mode' : 'Dark mode'}<small>Look of the app</small></span></button>
    <button data-a="lang">${ic('globe')}<span>${LANG === 'ms' ? 'English' : 'Bahasa Melayu'}<small>Language</small></span></button></div>
    <div class="row"><button class="btn ghost" data-x>Close</button></div>`);
  $$('[data-a]', m).forEach((b) => (b.onclick = () => {
    const a = b.dataset.a; m.remove();
    if (a === 'copy') { store.set('clip', recipe()); toast('Edits copied'); }
    if (a === 'paste' && clip) { applyRecipe(clip); panel(); draw(); commit(true); toast('Edits pasted'); }
    if (a === 'save') saveMyLook();
    if (a === 'lang') { setLang(LANG === 'ms' ? 'en' : 'ms'); panel(); }
    if (a === 'hist') historySheet();
    if (a === 'pal') paletteSheet();
    if (a === 'album') albumSheet();
    if (a === 'file') sendProjectFile();
    if (a === 'theme') { setTheme(store.get('theme', 'dark') === 'dark' ? 'light' : 'dark'); }
    if (a === 'reset') { S = fresh(); MASK = null; LIQ = null; panel(); draw(); items(); commit(true); toast('All edits reset'); }
  }));
}
// rename the photo: used for saved files and in Recent
const safeName = (n) => n.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
function setName(n) { n = safeName(n); if (!n) return false; NAME = n; const b = $('#pname'); if (b) b.innerHTML = esc(NAME) + ic('edit'); saveDraft(); return true; }
function renameSheet() {
  const m = sheet(`<h3>Rename</h3><p class="muted small">This name is used for your saved photos and in Recent.</p><input class="field" id="rn" maxlength="60" value="${esc(NAME)}"><div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" id="rngo">${ic('check')}<span>Save</span></button></div>`);
  const i = $('#rn', m); i.focus(); i.select();
  const go = () => { if (setName(i.value)) { m.remove(); toast('Renamed'); } else toast('Type a name first'); };
  $('#rngo', m).onclick = go; i.onkeydown = (e) => { if (e.key === 'Enter') go(); };
}
function setTheme(t) { store.set('theme', t); document.documentElement.dataset.theme = t; }
function paletteSheet() {
  const pal = palette(E.cv, 6);
  const m = sheet(`<h3>Colour palette</h3><p class="muted small">Tap a colour to copy its code.</p><div class="pal">${pal.map((c) => `<button data-hex="${c.hex}"><i style="background:${c.hex}"></i><b>${c.hex.toUpperCase()}</b><small>${Math.round(c.share * 100)}%</small></button>`).join('')}</div>
    <div class="row"><button class="btn ghost" data-x>Close</button><button class="btn primary" id="palsave">${ic('download')}<span>Save palette</span></button></div>`);
  $$('[data-hex]', m).forEach((b) => (b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.hex); toast('Copied ' + b.dataset.hex); } catch (e) { toast(b.dataset.hex); } }));
  $('#palsave', m).onclick = async () => { const b = await toBlob(paletteImage(pal), 'png'); if (await saveFiles([new File([b], `${NAME}-palette.png`, { type: 'image/png' })])) toast('Palette saved'); };
}
async function albumSheet() {
  const list = await listProjects(), names = [...new Set(list.map((p) => p.album).filter(Boolean))];
  const m = sheet(`<h3>Album</h3><p class="muted small">Group photos from one event, like a wedding or a trip.</p><div class="chips">${['', ...names].map((n) => `<button class="chip ${(PROJ.album || '') === n ? 'on' : ''}" data-alb="${esc(n)}">${n ? esc(n) : 'No album'}</button>`).join('')}</div>
    <input class="field" id="albnew" maxlength="24" placeholder="New album name"><div class="row"><button class="btn ghost" data-x>Close</button><button class="btn primary" id="albgo">${ic('check')}<span>Save</span></button></div>`);
  let pick = PROJ.album || '';
  $$('[data-alb]', m).forEach((b) => (b.onclick = () => { pick = b.dataset.alb; $$('[data-alb]', m).forEach((x) => x.classList.toggle('on', x === b)); }));
  $('#albgo', m).onclick = () => { const n = $('#albnew', m).value.trim(); PROJ.album = n || pick; m.remove(); saveDraft(); toast(PROJ.album ? 'Added to ' + PROJ.album : 'Removed from album'); };
}
const toDataURL = (b) => new Promise((r) => { if (!b) return r(null); const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
async function sendProjectFile() {
  await saveDraft(); const d = await loadProject(PROJ.id); if (!d) { toast('Could not make the file'); return; }
  const bgp = {}; for (const [k, v] of Object.entries(d.bgp || {})) bgp[k] = await toDataURL(v);
  const json = JSON.stringify({ darlia: 1, name: d.name, state: d.state, b0: await toDataURL(d.b0), cur: await toDataURL(d.cur), mask: await toDataURL(d.mask), imgs: d.imgs, bgp });
  if (await saveFiles([new File([json], `${NAME}.darlia`, { type: 'application/json' })])) toast('Project file saved. Open it in Darlia on the other device');
}
// layers list for text, stickers and drawings: pick, lock and reorder
function layersHTML() {
  if (!S.items.length) return '';
  const name = (it) => (it.type === 'text' ? esc((it.text || '').slice(0, 18) || 'Text') : it.type === 'draw' ? 'Drawing' : 'Sticker');
  return `<div class="pl">${ic('layers')} Layers</div><div class="layers">${S.items.map((it, i) => `<div class="lyr ${i === sel ? 'on' : ''}" data-ly="${i}"><span class="lt">${ic(it.type === 'text' ? 'text' : it.type === 'draw' ? 'draw' : 'sticker')}${name(it)}</span><button data-lyl="${i}" title="Lock">${ic(it.locked ? 'lock' : 'unlock')}</button><button data-lyu="${i}" title="Forward" ${i === S.items.length - 1 ? 'disabled' : ''}>${ic('up')}</button><button data-lyd="${i}" title="Backward" ${i === 0 ? 'disabled' : ''}>${ic('down')}</button></div>`).reverse().join('')}</div>`;
}
function wireLayers(p) {
  $$('[data-ly]', p).forEach((r) => (r.onclick = (e) => {
    const i = +r.dataset.ly, it = S.items[i];
    if (e.target.closest('[data-lyl]')) { it.locked = !it.locked; items(); panel(); commit(true); return; }
    const mv = e.target.closest('[data-lyu]') ? 1 : e.target.closest('[data-lyd]') ? -1 : 0;
    if (mv) { const j = i + mv; [S.items[i], S.items[j]] = [S.items[j], S.items[i]]; if (sel === i) sel = j; else if (sel === j) sel = i; items(); panel(); commit(true); return; }
    if (it.type === 'draw') return; sel = i; const t = it.type === 'text' ? 'text' : 'sticker'; if (tool !== t) setTool(t); else { items(); panel(); }
  }));
}
let SUGG = null;
function suggested() { if (!SUGG || SUGG.base !== S.base) { const fd = FACES.get(S.base); SUGG = { base: S.base, ids: suggestLooks(proxyOf(S.base, IMG()), !!(fd && fd.faces && fd.faces.length)) }; } return SUGG.ids; }
function applyLookEntry(m) { applyRecipe(m.r); if (m.full) { for (const k of ['fx', 'frame', 'eff', 'blur']) if (m.full[k]) S[k] = { ...fresh()[k], ...JSON.parse(JSON.stringify(m.full[k])) }; } S.lookId = 'my:' + m.id; }
function saveMyLook() {
  const m = sheet(`<h3>Save as my look</h3><p class="muted small">Saves your looks, adjust, colour and curves settings.</p><input class="field" id="lname" maxlength="20" placeholder="Name" value="My look ${store.get('mylooks', []).length + 1}">
    <label class="check"><input type="checkbox" id="lfull" checked><span>Also save film fx, frame, effects and lens blur</span></label>
    <div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" id="lsave">${ic('check')}<span>Save</span></button></div>`);
  const inp = $('#lname', m); inp.focus(); inp.select();
  const go = () => { const name = inp.value.trim() || 'My look', list = store.get('mylooks', []), id = Date.now().toString(36); list.unshift({ id, name, r: recipe(), full: $('#lfull', m).checked ? JSON.parse(JSON.stringify({ fx: S.fx, frame: S.frame, eff: S.eff, blur: S.blur })) : null }); if (!store.set('mylooks', list.slice(0, 40))) { toast('Could not save'); return; } S.lookId = 'my:' + id; m.remove(); commit(true); if (tool === 'looks') panel(); toast('Saved to My looks'); };
  $('#lsave', m).onclick = go; inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

// ---------------- crop box ----------------
function fitRatio() {
  const g = S.geo, [ow, oh] = E.outSize({ ...S, geo: { ...g, crop: { x: 0, y: 0, w: 1, h: 1 } } });
  const r = g.ratio === 'orig' ? ow / oh : g.ratio === 'free' ? null : (([a, b]) => a / b)(g.ratio.split(':').map(Number));
  if (!r) return;
  let w = 1, h = (ow / r) / oh; if (h > 1) { h = 1; w = (oh * r) / ow; }
  g.crop = { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}
function placeCrop() { const c = S.geo.crop, b = $('#cropbox'); Object.assign(b.style, { left: c.x * 100 + '%', top: c.y * 100 + '%', width: c.w * 100 + '%', height: c.h * 100 + '%' }); }
function bindCrop() {
  const box = $('#cropbox'); let d = null;
  box.addEventListener('pointerdown', (e) => {
    e.preventDefault(); box.setPointerCapture(e.pointerId); const fr = $('#frame').getBoundingClientRect();
    d = { h: e.target.classList.contains('h') ? [...e.target.classList].find((k) => k.length === 2) : 'move', x: e.clientX, y: e.clientY, c: { ...S.geo.crop }, fw: fr.width, fh: fr.height };
  });
  box.addEventListener('pointermove', (e) => {
    if (!d) return; const dx = (e.clientX - d.x) / d.fw, dy = (e.clientY - d.y) / d.fh, c = { ...d.c }, g = S.geo, min = .08;
    if (d.h === 'move') { c.x = clamp(c.x + dx, 0, 1 - c.w); c.y = clamp(c.y + dy, 0, 1 - c.h); }
    else {
      let x0 = c.x, y0 = c.y, x1 = c.x + c.w, y1 = c.y + c.h;
      if (d.h.includes('l')) x0 = clamp(x0 + dx, 0, x1 - min); if (d.h.includes('r')) x1 = clamp(x1 + dx, x0 + min, 1);
      if (d.h.includes('t')) y0 = clamp(y0 + dy, 0, y1 - min); if (d.h.includes('b')) y1 = clamp(y1 + dy, y0 + min, 1);
      if (g.ratio !== 'free') {
        const [ow, oh] = E.outSize({ ...S, geo: { ...g, crop: { x: 0, y: 0, w: 1, h: 1 } } }), r = g.ratio === 'orig' ? ow / oh : (([a, b]) => a / b)(g.ratio.split(':').map(Number));
        const w = x1 - x0, h = (w * ow / r) / oh; if (d.h.includes('t')) y0 = y1 - h; else y1 = y0 + h;
        if (y0 < 0 || y1 > 1) return;
      }
      c.x = x0; c.y = y0; c.w = x1 - x0; c.h = y1 - y0;
    }
    S.geo.crop = c; placeCrop();
  });
  const end = () => { if (d) { d = null; commit(true); } }; box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
}

// ---------------- brush tools: erase, brush, reshape, draw, lens-blur focus ----------------
function frameXY(e) { const r = $('#frame').getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, r]; }
// screen point -> picture point (0..1, y down) through crop and rotation
function toPic(e) {
  const [fx, fy] = frameXY(e), m = E.geoMatrix(S), P = S.geo.persp || [0, 0], pz = 1 / (1 + .6 * (Math.abs(P[0]) + Math.abs(P[1]))), qx = fx - .5, qy = (1 - fy) - .5;
  const x = qx * (1 + P[0] * qy * 2) * pz + .5, y = qy * (1 + P[1] * qx * 2) * pz + .5; return [m[0] * x + m[3] * y + m[6], 1 - (m[1] * x + m[4] * y + m[7])];
}
function picPxPerScreenPx() { const r = $('#frame').getBoundingClientRect(), m = E.geoMatrix(S); return Math.hypot(m[0] * E.w, m[1] * E.h) / r.width * (IMG().width / E.w); }
function ring(e) {
  const rg = $('#ring'); if (!rg) return; const size = tool === 'draw' ? pen.w * $('#frame').clientWidth * 2 : brushSize * 2 / VIEW.z;
  rg.style.width = rg.style.height = size + 'px'; if (e) { const [fx, fy] = frameXY(e); rg.style.left = fx * 100 + '%'; rg.style.top = fy * 100 + '%'; }
}
function bindBrush() {
  const el = $('#brush'); let d = null, timer = 0;
  el.addEventListener('pointermove', (e) => { ring(e); el.classList.add('hover'); if (d && !GESTURE) move(e); });
  // a second finger means zoom: undo the stroke that just started
  cancelStroke = () => {
    if (!d) return; clearInterval(timer);
    if (tool === 'draw' && d.item) { const i = S.items.indexOf(d.item); if (i >= 0) S.items.splice(i, 1); items(); }
    if (tool === 'brush') { LCkey = ''; draw(); }
    if (tool === 'erase' && d.snap) { const x = ERASE.getContext('2d'); x.clearRect(0, 0, ERASE.width, ERASE.height); x.drawImage(d.snap, 0, 0); ERASE._v++; draw(); }
    if (tool === 'reshape' && d.liq && LIQ) { LIQ.F.set(d.liq); LIQ.v++; draw(); }
    d = null;
  };
  el.addEventListener('pointerleave', () => el.classList.remove('hover'));
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); el.setPointerCapture(e.pointerId); ring(e); el.classList.add('hover');
    if (busy || GESTURE) return;
    const [fx, fy] = frameXY(e), p = toPic(e);
    if (tool === 'text' && pathMode) { d = { last: p, pts: [p], fpts: [[fx, fy]], tpath: true }; return; }
    if (tool === 'erase' && eraseTap) { ERASE = blankPaint(); ERASE._base = S.base; dab(ERASE, [p], brushSize * picPxPerScreenPx() / IMG().width, true, .15); draw(); runErase(); return; }
    d = { last: p, pts: [p], fpts: [[fx, fy]] };
    if (tool === 'erase') { d.snap = document.createElement('canvas'); d.snap.width = ERASE.width; d.snap.height = ERASE.height; d.snap.getContext('2d').drawImage(ERASE, 0, 0); }
    if (tool === 'reshape' && LIQ) d.liq = LIQ.F.slice();
    if (tool === 'blur') { if (S.blur.mode === 'off') { S.blur.mode = 'radial'; panel(); } S.blur.x = clamp(fx, 0, 1); S.blur.y = clamp(fy, 0, 1); draw(); }
    else if (tool === 'erase') { dab(ERASE, [p], brushSize * picPxPerScreenPx() / IMG().width, true, .15); draw(); }
    else if (tool === 'brush') { const c = localCanvas(); d.r = brushSize * picPxPerScreenPx() / IMG().width; dab(c, [p], d.r, !brushErase); draw(); }
    else if (tool === 'reshape') {
      const b = IMG(); if (!LIQ || LIQ.W !== b.width || LIQ.H !== b.height) { LIQ = new Liquify(b.width, b.height); LIQ.v = 0; }
      if (liqMode === 'bloat' || liqMode === 'pinch' || liqMode === 'restore') { const tick = () => { if (!d) return; LIQ.stroke(liqMode, d.last[0], d.last[1], 0, 0, brushSize * picPxPerScreenPx(), .5); LIQ.v++; draw(); }; tick(); timer = setInterval(tick, 40); }
    } else if (tool === 'draw') { d.item = { type: 'draw', pts: [[+fx.toFixed(4), +fy.toFixed(4)]], color: pen.color, w: pen.w, glow: pen.glow }; S.items.push(d.item); items(); }
  });
  const move = (e) => {
    const [fx, fy] = frameXY(e), p = toPic(e);
    if (d.tpath) { const q = d.fpts[d.fpts.length - 1]; if (Math.hypot(fx - q[0], fy - q[1]) > .006) d.fpts.push([fx, fy]); return; }
    if (tool === 'blur') { S.blur.x = clamp(fx, 0, 1); S.blur.y = clamp(fy, 0, 1); draw(); }
    else if (tool === 'erase') { dab(ERASE, [d.last, p], brushSize * picPxPerScreenPx() / IMG().width, true, .15); draw(); }
    else if (tool === 'brush') { dab(localCanvas(), [d.last, p], d.r, !brushErase); d.pts.push(p); draw(); }
    else if (tool === 'reshape') { if (liqMode === 'push') { LIQ.stroke('push', p[0], p[1], p[0] - d.last[0], p[1] - d.last[1], brushSize * picPxPerScreenPx(), 1); LIQ.v++; draw(); } }
    else if (tool === 'draw') { const q = d.item.pts[d.item.pts.length - 1]; if (Math.hypot(fx - q[0], fy - q[1]) > .002) { d.item.pts.push([+fx.toFixed(4), +fy.toFixed(4)]); items(); } }
    d.last = p;
  };
  const end = () => {
    if (!d) return; clearInterval(timer);
    if (d.tpath) {
      const it = S.items[sel], fr = $('#frame'), asp = fr.clientHeight / fr.clientWidth;
      if (it && d.fpts.length > 3) { const cx = d.fpts.reduce((a, q) => a + q[0], 0) / d.fpts.length, cy = d.fpts.reduce((a, q) => a + q[1], 0) / d.fpts.length; it.x = cx; it.y = cy; it.rot = 0; it.curve = 0; it.path = d.fpts.map(([x, y]) => [+(x - cx).toFixed(4), +((y - cy) * asp).toFixed(4)]); commit(true); }
      pathMode = false; d = null; items(); panel(); draw(); return;
    }
    if (tool === 'blur' || tool === 'draw') commit(true);
    if (tool === 'brush') { S.local.strokes.push({ pts: d.pts.map(([u, v]) => [+u.toFixed(4), +v.toFixed(4)]), r: +d.r.toFixed(5), erase: brushErase }); LCkey = S.base + ':' + JSON.stringify(S.local.strokes); commit(true); panel(); }
    if (tool === 'reshape' || tool === 'draw') panel();
    d = null;
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
function bakeLiquify() {
  if (!LIQ || !LIQ.used) { LIQ = null; return; }
  const b = IMG(), X = new Engine(); X.setImage(b); X.setDisp(LIQ.F, LIQ.gw, LIQ.gh);
  X.render(fresh(), b.width, b.height, { original: true });
  const c = document.createElement('canvas'); c.width = b.width; c.height = b.height; c.getContext('2d').drawImage(X.cv, 0, 0);
  X.gl.getExtension('WEBGL_lose_context')?.loseContext(); LIQ = null; newBase(c); toast('Reshape applied');
}
let eraseMsg = '';
async function runErase() {
  const b = IMG(), m = document.createElement('canvas'); m.width = b.width; m.height = b.height; const x = m.getContext('2d'); x.drawImage(ERASE, 0, 0, b.width, b.height);
  // anything painted counts
  const d = x.getImageData(0, 0, b.width, b.height); let any = false; for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i] > 20 ? 255 : 0; if (v) any = true; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; } x.putImageData(d, 0, 0);
  if (!any) { toast('Paint over something first'); return; }
  busy = 'erase'; eraseMsg = AI.lamaReady() ? 'Erasing…' : 'Getting the eraser ready…'; panel();
  try {
    const out = await AI.erase(b, m, (f) => { eraseMsg = `Getting the eraser ready… ${Math.round(f * 100)}%`; panel(); });
    busy = ''; ERASE = null; if (out) { newBase(out); ERASE = blankPaint(); ERASE._base = S.base; toast('Erased'); }
  } catch (e) { console.error(e); busy = ''; toast('The eraser could not run here'); }
  busy = ''; panel(); draw();
}
async function findFaces(quiet) {
  if (!quiet) { busy = 'faces'; panel(); } const id = S.base, b = IMG();
  try {
    const faces = await AI.faces(b);
    FACES.set(id, faces.length ? { faces, mask: faceMask(b.width, b.height, faces), rad: Math.max(2, Math.min(...faces.map(faceWidth)) * .022) } : { faces: [] });
  } catch (e) { console.error(e); FACES.set(id, { faces: [], error: 'The face model is missing.' }); }
  if (!quiet) busy = ''; if (tool === 'retouch') panel(); draw();
}
// sticker of the person: cut out, white outline, soft shadow
async function makeSticker() {
  if (!MASK) return; toast('Making your sticker…');
  const X = new Engine(); sync(X); const s2 = { ...S, bg: { ...S.bg, on: true, mode: 'clear' } }, [ow, oh] = X.outSize(S), k = Math.min(1, 900 / Math.max(ow, oh)), W = Math.round(ow * k), H = Math.round(oh * k);
  X.render(s2, W, H); const c = document.createElement('canvas'); c.width = W; c.height = H; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(X.cv, 0, 0); X.gl.getExtension('WEBGL_lose_context')?.loseContext();
  const d = cx.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0) { toast('No person found to make a sticker'); return; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, r = Math.max(3, Math.max(bw, bh) * .028), pad = Math.ceil(r * 3), cw = bw + pad * 2, ch = bh + pad * 2;
  const o = document.createElement('canvas'); o.width = cw; o.height = ch; const ox = o.getContext('2d');
  for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; ox.drawImage(c, x0, y0, bw, bh, pad + Math.cos(a) * r, pad + Math.sin(a) * r, bw, bh); }
  ox.globalCompositeOperation = 'source-in'; ox.fillStyle = '#fff'; ox.fillRect(0, 0, cw, ch);
  const f = document.createElement('canvas'); f.width = cw; f.height = ch; const fx = f.getContext('2d');
  fx.shadowColor = 'rgba(0,0,0,.35)'; fx.shadowBlur = r * 1.4; fx.shadowOffsetY = r * .5; fx.drawImage(o, 0, 0); fx.shadowColor = 'transparent'; fx.drawImage(c, x0, y0, bw, bh, pad, pad, bw, bh);
  const key = 'st:' + Date.now().toString(36); IMGS.set(key, f.toDataURL('image/png'));
  S.items.push({ type: 'sticker', src: 'ref:' + key, x: .5, y: .55, size: .5, rot: -4, flip: false }); sel = S.items.length - 1; commit(true); setTool('sticker'); toast('Sticker added. It is also saved under Stickers → Yours');
}
const BGTH = new Map();
function thumbOf(src, key) { if (BGTH.has(key)) return BGTH.get(key); if (!src) return ''; const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), s2 = Math.max(96 / src.width, 96 / src.height); x.drawImage(src, (96 - src.width * s2) / 2, (96 - src.height * s2) / 2, src.width * s2, src.height * s2); const u = c.toDataURL('image/jpeg', .8); BGTH.set(key, u); return u; }
const SKY_TINT = { sunset: '#ff8a6a', blue: '#9cc8ff', pink: '#ffb3cf', stars: '#3a4a8a', storm: '#8a909c', golden: '#ffb45a' };
// ---- AI enhance ----
let enhMsg = '';
async function runEnhance(scale) {
  const b = IMG(), big = Math.max(b.width, b.height), k = Math.min(1, 1280 / big); let inp = b;
  if (k < 1) { inp = document.createElement('canvas'); inp.width = Math.round(b.width * k); inp.height = Math.round(b.height * k); const x = inp.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(b, 0, 0, inp.width, inp.height); }
  const outScale = scale === 1 ? big / Math.max(inp.width, inp.height) : scale;
  busy = 'enhance'; enhMsg = 'Getting the AI ready…'; panel();
  try {
    const out = await AI.upscale(inp, Math.min(4, outScale), (f) => { enhMsg = `Enhancing… ${Math.round(f * 100)}%`; const sp = $('.busy span'); if (sp) sp.textContent = enhMsg; });
    busy = ''; newBase(out); toast('Enhanced'); const F = S.face; if (F.smooth || F.slim || F.eyes || S.makeup.lip) findFaces(true);
  } catch (e) { console.error(e); busy = ''; toast('Enhance could not run here'); }
  busy = ''; panel(); draw();
}
// ---- document scan corners ----
let SCANQ = [[.06, .06], [.94, .06], [.94, .94], [.06, .94]], scanMode = 'color';
function placeScan() {
  const box = $('#scanbox'); if (!box) return;
  $$('[data-q]', box).forEach((h) => { const q = SCANQ[+h.dataset.q]; h.style.left = q[0] * 100 + '%'; h.style.top = q[1] * 100 + '%'; });
  $('#scanpoly').setAttribute('points', SCANQ.map(([x, y]) => `${x * 100},${y * 100}`).join(' '));
}
function bindScan() {
  const box = $('#scanbox'); let d = -1;
  box.addEventListener('pointerdown', (e) => { const h = e.target.closest('[data-q]'); if (!h || GESTURE) return; e.preventDefault(); e.stopPropagation(); d = +h.dataset.q; box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', (e) => { if (d < 0 || GESTURE) return; const [fx, fy] = frameXY(e); SCANQ[d] = [clamp(fx, 0, 1), clamp(fy, 0, 1)]; placeScan(); });
  const up = () => (d = -1); box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
}
// ---- double exposure ----
function blendCanvas(c, W, H, B) {
  const im = IMGS.get(B.key); c.width = Math.round(W); c.height = Math.round(H); const x = c.getContext('2d'); if (!im) return Promise.resolve();
  return new Promise((done) => { const img = new Image(); img.onerror = done; img.onload = () => { const k = Math.max(c.width / img.width, c.height / img.height); x.clearRect(0, 0, c.width, c.height); x.drawImage(img, (c.width - img.width * k) / 2, (c.height - img.height * k) / 2, img.width * k, img.height * k);
    if (B.fade) { x.globalCompositeOperation = 'destination-in'; const g = x.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * .15, c.width / 2, c.height / 2, Math.max(c.width, c.height) * .6); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'source-over'; } done(); };
  img.src = im; });
}
// ---- eyedropper: tap the photo to pick a colour ----
let EYE = null;
function bindEyedrop() {
  $('#stage').addEventListener('pointerdown', (e) => {
    if (!EYE || !e.target.closest('#frame')) return; e.preventDefault(); e.stopPropagation();
    const [fx, fy] = frameXY(e), x = clamp(Math.round(fx * E.cv.width), 0, E.cv.width - 1), y = clamp(Math.round(fy * E.cv.height), 0, E.cv.height - 1);
    const t = document.createElement('canvas'); t.width = t.height = 1; const tx = t.getContext('2d'); tx.drawImage(E.cv, x, y, 1, 1, 0, 0, 1, 1); const d = tx.getImageData(0, 0, 1, 1).data;
    const hex = '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join(''); const cb = EYE; EYE = null; $('#stage').classList.remove('picking'); cb(hex);
  }, true);
}
function wireEye(p, setters) {
  $$('[data-eye]', p).forEach((b) => (b.onclick = () => { const fn = setters[b.dataset.eye]; if (!fn) return; EYE = (hex) => { fn(hex); panel(); draw(); items(); commit(true); toast('Colour picked ' + hex); }; $('#stage').classList.add('picking'); toast('Tap the photo to pick a colour'); }));
}
// ---- first-time tips ----
function tutorial() {
  const steps = [['looks', 'Pick a tool', 'All the tools are in the bar. Start with Looks for a quick style, or Adjust to fine-tune.'], ['plus', 'Zoom in', 'Pinch with two fingers, or scroll on a computer. Double-tap to jump in and out.'], ['compare', 'Before and after', 'Tap the compare button for a slider. Hold it to see the original.'], ['clock', 'Saved for you', 'Every edit is saved on this device. Find your photos under Recent on the home screen.']];
  let i = 0; const m = document.createElement('div'); m.className = 'sheet tut'; document.body.appendChild(m);
  const show = () => { const [icn, t, d] = steps[i]; m.innerHTML = `<div class="card"><div class="tut-ic">${ic(icn)}</div><h3>${t}</h3><p class="muted">${d}</p><div class="dots">${steps.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div><div class="row"><button class="btn ghost" data-skip>Skip</button><button class="btn primary" data-next>${i < steps.length - 1 ? 'Next' : 'Start editing'}</button></div></div>`;
    $('[data-skip]', m).onclick = done; $('[data-next]', m).onclick = () => { i++; if (i >= steps.length) done(); else show(); }; };
  const done = () => { store.set('tut', true); m.remove(); }; show();
}
// ---- history ----
const HKEYS = [['base', 'Erase / enhance / scan'], ['adj', 'Adjust'], ['look', 'Looks'], ['hsl', 'Colour'], ['curve', 'Curves'], ['geo', 'Crop & rotate'], ['face', 'Retouch'], ['makeup', 'Makeup'], ['hair', 'Hair colour'], ['body', 'Body'], ['bg', 'Cutout'], ['sky', 'Sky'], ['blur', 'Lens blur'], ['local', 'Brush'], ['eff', 'Effects'], ['items', 'Text & stickers'], ['fx', 'Film fx'], ['blend', 'Double exposure'], ['frame', 'Frame']];
function historySheet() {
  const steps = [...undo, snap(), ...redo.slice().reverse()], cur = undo.length, parsed = steps.map((x) => JSON.parse(x));
  const label = (i) => { if (!i) return 'Original'; const a = parsed[i - 1], b = parsed[i], k = HKEYS.find(([key]) => JSON.stringify(a[key]) !== JSON.stringify(b[key]) || (key === 'look' && a.lookId !== b.lookId)); return k ? k[1] : 'Edit'; };
  const m = sheet(`<h3>History</h3><p class="muted small">Tap a step to go back to it. You can still go forward again.</p><div class="hist-list">${steps.map((_, i) => `<button class="${i === cur ? 'on' : ''} ${i > cur ? 'future' : ''}" data-h="${i}"><b>${i}</b><span>${label(i)}</span></button>`).reverse().join('')}</div><div class="row"><button class="btn ghost" data-x>Close</button></div>`);
  $$('[data-h]', m).forEach((b) => (b.onclick = () => { const i = +b.dataset.h; undo = steps.slice(0, i); redo = steps.slice(i + 1).reverse(); restore(steps[i]); m.remove(); }));
}
function bgThumb(k) { if (BGTH.has(k)) return BGTH.get(k); const src = bgCanvas(k); if (!src) return ''; const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), s2 = Math.max(96 / src.width, 96 / src.height); x.drawImage(src, (96 - src.width * s2) / 2, (96 - src.height * s2) / 2, src.width * s2, src.height * s2); const u = c.toDataURL('image/jpeg', .8); BGTH.set(k, u); return u; }
async function runCut(show) {
  busy = 'cut'; panel();
  try { setMask(refineMask(await AI.cutoutMask(IMG()), proxyOf(S.base, IMG()), { lim: 1536 })); if (show) { S.bg.on = true; S.bg.mode = 'clear'; } commit(true); }
  catch (e) { console.error(e); toast('Could not find the person in this photo'); }
  busy = ''; panel(); draw();
}

// ---------------- text, stickers, drawings ----------------
const pathD = (pts, W, H) => { if (pts.length < 2) { const [x, y] = pts[0]; return `M${x * W} ${y * H}l.01 0`; } let s = `M${pts[0][0] * W} ${pts[0][1] * H}`; for (let i = 1; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; s += `Q${a[0] * W} ${a[1] * H} ${(a[0] + b[0]) / 2 * W} ${(a[1] + b[1]) / 2 * H}`; } const l = pts[pts.length - 1]; return s + `L${l[0] * W} ${l[1] * H}`; };
function items() {
  const L = $('#items'); if (!L) return; const fr = $('#frame'), W = fr.clientWidth, H = fr.clientHeight; items._w = W;
  L.innerHTML = S.items.map((it, i) => {
    if (it.type === 'draw') return `<svg class="drw" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><path d="${pathD(it.pts, W, H)}" stroke="${it.color}" stroke-width="${it.w * W}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${it.glow ? `style="filter:drop-shadow(0 0 ${it.w * W * .8}px ${it.color}) drop-shadow(0 0 ${it.w * W * 2}px ${it.color})"` : ''}/></svg>`;
    const st = `left:${it.x * 100}%;top:${it.y * 100}%;transform:translate(-50%,-50%) rotate(${it.rot}deg)`;
    if (it.type === 'text') return `<div class="it txt ${i === sel ? 'sel' : ''} ${it.locked ? 'locked' : ''}" data-i="${i}" style="${st}"><i class="tslot" data-ti="${i}"></i>${i === sel ? '<i class="rz"></i>' : ''}</div>`;
    return `<div class="it stkr ${i === sel ? 'sel' : ''} ${it.locked ? 'locked' : ''}" data-i="${i}" style="${st};width:${it.size * W}px"><img src="${srcOf(it)}" style="${it.flip ? 'transform:scaleX(-1)' : ''}" alt="" draggable="false">${i === sel ? '<i class="rz"></i>' : ''}</div>`;
  }).join('');
  const dpr = Math.min(4, (window.devicePixelRatio || 1) * VIEW.z);
  $$('.tslot', L).forEach((sl) => {
    const i = +sl.dataset.ti, it = S.items[i], key = JSON.stringify([i, it.text, it.font, it.color, it.size, it.pill, it.pillColor, it.shadow, it.outline, it.outlineColor, it.glow, it.curve, it.spacing, it.upper, it.depth, it.depthColor, it.grad, it.path, W, dpr]);
    let c = TCACHE.get(key); if (!c) { if (TCACHE.size > 60) TCACHE.clear(); c = textCanvas(it, W, dpr); TCACHE.set(key, c); }
    sl.replaceWith(c);
  });
  L.classList.toggle('live', tool === 'text' || tool === 'sticker');
}
const TCACHE = new Map();
function bindItems() {
  const L = $('#items'); let d = null;
  cancelItem = () => { if (d) { const it = S.items[d.i]; if (it) { it.x = d.ox; it.y = d.oy; it.size = d.os; it.rot = d.or; } d = null; items(); } };
  L.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.it'); if (!el || GESTURE) return; e.preventDefault();
    const i = +el.dataset.i, it = S.items[i], fr = $('#frame').getBoundingClientRect(); if (it.locked) return;
    if (sel !== i) { sel = i; if (tool !== (it.type === 'text' ? 'text' : 'sticker')) setTool(it.type === 'text' ? 'text' : 'sticker'); else { panel(); items(); } }
    const rz = e.target.classList.contains('rz');
    d = { i, rz, x: e.clientX, y: e.clientY, ox: it.x, oy: it.y, os: it.size, or: it.rot, fr, cx: fr.left + it.x * fr.width, cy: fr.top + it.y * fr.height };
    L.setPointerCapture(e.pointerId);
  });
  L.addEventListener('pointermove', (e) => {
    if (!d || GESTURE) return; const it = S.items[d.i];
    if (d.rz) { const a0 = Math.atan2(d.y - d.cy, d.x - d.cx), a1 = Math.atan2(e.clientY - d.cy, e.clientX - d.cx), r0 = Math.hypot(d.x - d.cx, d.y - d.cy), r1 = Math.hypot(e.clientX - d.cx, e.clientY - d.cy); it.size = clamp(d.os * r1 / Math.max(1, r0), .02, 1); it.rot = Math.round(d.or + (a1 - a0) * 180 / Math.PI); }
    else { it.x = clamp(d.ox + (e.clientX - d.x) / d.fr.width, 0, 1); it.y = clamp(d.oy + (e.clientY - d.y) / d.fr.height, 0, 1); }
    items();
  });
  const end = () => { if (d) { d = null; panel(); commit(true); } }; L.addEventListener('pointerup', end); L.addEventListener('pointercancel', end);
  $('#stage').addEventListener('pointerdown', (e) => { if (!e.target.closest('.it') && !e.target.closest('.cropbox') && !e.target.closest('.brush.on') && sel >= 0) { sel = -1; items(); panel(); } });
}

// ---------------- export ----------------
// print sizes in inches, saved at 300 DPI
const PRINTS = [['4r', '4R', 4, 6], ['5r', '5R', 5, 7], ['8r', '8R', 8, 10], ['a5', 'A5', 5.83, 8.27], ['a4', 'A4', 8.27, 11.69], ['sq5', 'Square 5×5', 5, 5]];
async function setDpi(blob, dpi) {
  const b = new Uint8Array(await blob.arrayBuffer());
  if (b[2] === 0xFF && b[3] === 0xE0 && b[6] === 0x4A && b[7] === 0x46) { b[13] = 1; b[14] = dpi >> 8; b[15] = dpi & 255; b[16] = dpi >> 8; b[17] = dpi & 255; }
  return new Blob([b], { type: blob.type });
}
const FITS = [['orig', 'Original', null], ['sq', 'Square', [1080, 1080]], ['post', 'Post 4:5', [1080, 1350]], ['story', 'Story 9:16', [1080, 1920]], ['wide', 'Wide 16:9', [1920, 1080]]];
function exportSheet() {
  if (LIQ && LIQ.used) bakeLiquify();
  const [ow, oh] = E.outSize(S), clear = (S.bg.on && S.bg.mode === 'clear') || S.frame.type === 'rounded' || S.frame.type === 'stamp';
  const sizes = [['Full', 1], ['Large', Math.min(1, 2048 / Math.max(ow, oh))], ['Small', Math.min(1, 1080 / Math.max(ow, oh))]], wm = store.get('wm', { on: false, type: 'text', text: '', pos: 'br', size: .2, opacity: .8, color: '#ffffff' });
  const canShare = canShareFiles();
  const m = sheet(`<h3>Export</h3>
    <div class="pl">File name</div><div class="fname"><input class="field" id="fname" maxlength="60" value="${esc(NAME)}"><span id="fext">.jpg</span></div>
    <div class="pl">Fit for</div><div class="chips">${FITS.map(([k, n, sz], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-fit="${k}">${n}${sz ? ` <small>${sz[0]}×${sz[1]}</small>` : ''}</button>`).join('')}</div>
    <div class="pl">Print</div><div class="chips"><button class="chip on" data-print="">Off</button>${PRINTS.map(([k, n, w, h]) => `<button class="chip" data-print="${k}">${n} <small>${w}×${h}"</small></button>`).join('')}<button class="chip" id="pborder">White border</button></div>
    <div id="fillrow" hidden><div class="pl">Empty space</div><div class="chips">${[['blur', 'Blurred photo'], ['crop', 'Crop to fill'], ['#ffffff', 'White'], ['#111111', 'Black'], ['#f6d5dc', 'Blush']].map(([k, n], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-fill="${k}">${n}</button>`).join('')}</div></div>
    <div id="sizerow"><div class="pl">Size</div><div class="chips">${sizes.map(([n, k], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-sz="${k}">${n} <small>${Math.round(ow * k)}×${Math.round(oh * k)}</small></button>`).join('')}</div></div>
    <div class="pl">Format</div><div class="chips"><button class="chip ${clear ? '' : 'on'}" data-fmt="jpeg">JPG</button><button class="chip ${clear ? 'on' : ''}" data-fmt="png">PNG${clear ? ' (transparent)' : ''}</button><button class="chip" data-fmt="gif">${ic('gif')}Moving GIF</button></div>
    <div id="qrow"><div class="sls">${slider('q', 'JPG quality', .6, 1, .92, .01)}</div><p class="muted small" id="qsize">About … MB</p></div>
    <div id="gifrow" hidden><div class="chips">${[['sparkle', 'Sparkles'], ['snow', 'Snow'], ['confetti', 'Confetti'], ['hearts', 'Hearts']].map(([k, n], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-anim="${k}">${n}</button>`).join('')}</div></div>
    <div class="pl">Instagram grid</div><div class="chips">${[['0', 'Off'], ['3x1', '3 posts'], ['3x2', '6 posts'], ['3x3', '9 posts']].map(([k, n], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-grid="${k}">${n}</button>`).join('')}</div>
    <div class="pl">Extras</div><div class="chips"><button class="chip ${wm.on ? 'on' : ''}" id="wmon">Watermark</button><button class="chip" id="wmedit">${ic('edit')}Edit watermark</button><button class="chip" id="exif">Keep camera info</button><button class="chip on" id="nogps">Remove location</button><button class="chip" id="mock">${ic('mockup')}Mockups</button></div>
    <div class="row"><button class="btn ghost" data-x>Cancel</button>${canShare ? `<button class="btn ghost" data-share>${ic('share')}<span>Share</span></button>` : ''}<button class="btn primary" data-go>${ic('download')}<span>Save photo</span></button></div>`);
  let sz = 1, fmt = clear ? 'png' : 'jpeg', fit = 'orig', fill = 'blur', q = .92, anim = 'sparkle', grid = '0', keepExif = false, noGps = true, print = '', pborder = false;
  const printPx = () => { const p = PRINTS.find((x) => x[0] === print); if (!p) return null; let [w, h] = [p[2] * 300, p[3] * 300].map(Math.round); if ((ow > oh) !== (w > h) && w !== h) [w, h] = [h, w]; return [w, h]; };
  const pick = (attr, fn) => $$(`[${attr}]`, m).forEach((b) => (b.onclick = () => { fn(b.getAttribute(attr)); $$(`[${attr}]`, m).forEach((x) => x.classList.toggle('on', x === b)); vis(); }));
  $('#fname', m).oninput = (e) => { const n = safeName(e.target.value); if (n) NAME = n; };
  $('#fname', m).onchange = (e) => setName(e.target.value || NAME);
  const vis = () => { $('#fext', m).textContent = '.' + (fmt === 'png' ? 'png' : fmt === 'gif' ? 'gif' : 'jpg') + (print ? ' · print' : ''); $('#fillrow', m).hidden = fit === 'orig' && !print; $('#sizerow', m).hidden = fit !== 'orig' || fmt === 'gif'; $('#qrow', m).hidden = fmt !== 'jpeg'; $('#gifrow', m).hidden = fmt !== 'gif'; estimate(); };
  let estT = 0; const estimate = () => { clearTimeout(estT); estT = setTimeout(() => { if (fmt !== 'jpeg') return; const t = FITS.find((f) => f[0] === fit)[2], px = t ? t[0] * t[1] : ow * oh * sz * sz; E.cv.toBlob((b) => { const el = $('#qsize', m); if (b && el) el.textContent = `About ${(b.size * px / (E.cv.width * E.cv.height) / 1e6).toFixed(1)} MB`; }, 'image/jpeg', q); }, 120); };
  pick('data-print', (v) => { print = v; if (v) { fit = 'orig'; $$('[data-fit]', m).forEach((x) => x.classList.toggle('on', x.dataset.fit === 'orig')); if (fill === 'blur') { fill = 'crop'; $$('[data-fill]', m).forEach((x) => x.classList.toggle('on', x.dataset.fill === 'crop')); } } });
  $('#pborder', m).onclick = (e) => { pborder = !pborder; e.currentTarget.classList.toggle('on', pborder); };
  pick('data-sz', (v) => (sz = +v)); pick('data-fmt', (v) => (fmt = v)); pick('data-fill', (v) => (fill = v)); pick('data-fit', (v) => (fit = v)); pick('data-anim', (v) => (anim = v)); pick('data-grid', (v) => (grid = v));
  const qi = $('[data-k="q"] input', m); qi.oninput = () => { q = +qi.value; paintSlider(qi); qi.closest('.sl').querySelector('b').textContent = Math.round(q * 100); estimate(); };
  $('#wmon', m).onclick = (e) => { const w = store.get('wm', wm); w.on = !w.on; store.set('wm', w); e.currentTarget.classList.toggle('on', w.on); if (w.on && !w.text && !w.logo) watermarkSheet(); };
  $('#wmedit', m).onclick = () => watermarkSheet();
  getExif(PROJ && PROJ.b0blob).then((x) => { const b = $('#exif', m); if (!b) return; if (!x) { b.disabled = true; b.title = 'This photo has no camera info'; } b.onclick = () => { keepExif = !keepExif; b.classList.toggle('on', keepExif); }; });
  $('#nogps', m).onclick = (e) => { noGps = !noGps; e.currentTarget.classList.toggle('on', noGps); };
  $('#mock', m).onclick = () => { m.remove(); mockupSheet(); };
  vis();
  const build = async () => {
    const target = printPx() || FITS.find((f) => f[0] === fit)[2], ext = fmt === 'png' ? 'png' : fmt === 'gif' ? 'gif' : 'jpg';
    let out = await renderFull(print ? Math.min(1, 4000 / Math.max(ow, oh)) : target || fmt === 'gif' || grid !== '0' ? Math.min(1, 2400 / Math.max(ow, oh)) : sz, fmt === 'gif' ? 'jpeg' : fmt);
    if (target) out = fitTo(out, target, fill, fmt);
    if (print && pborder) { const bd = Math.round(300 * .12), c = document.createElement('canvas'); c.width = out.width; c.height = out.height; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(out, bd, bd, c.width - bd * 2, c.height - bd * 2); out = c; }
    if (fmt === 'gif') { const b = $('[data-go]', m); const blob = await makeGif(out, anim, (f) => { b.innerHTML = `<i class="spin"></i> ${Math.round(f * 100)}%`; }); return [new File([blob], `${NAME}.gif`, { type: 'image/gif' })]; }
    const enc = async (c, name) => { let blob = await toBlob(c, fmt, q); if (fmt === 'jpeg' && print) blob = await setDpi(blob, 300); if (fmt === 'jpeg' && keepExif) blob = await withExif(blob, await getExif(PROJ.b0blob), noGps); return new File([blob], name, { type: blob.type }); };
    if (grid !== '0') { const [cols, rows] = grid.split('x').map(Number), tiles = gridTiles(out, cols, rows), files = []; for (const t of tiles.sort((a, b) => a.order - b.order)) files.push(await enc(t.c, `${NAME}-grid-${t.order}.${ext}`)); return files; }
    return [await enc(out, `${NAME}${print ? '-' + print : target ? '-' + fit : ''}.${ext}`)];
  };
  const run = async (btn, share) => {
    const b = $(btn, m), old = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="spin"></i>';
    try { const files = await build(); if (share) { await shareFiles(files); } else if (await saveFiles(files)) toast(files.length > 1 ? `${files.length} photos saved. Post number 1 first.` : 'Photo saved'); m.remove(); }
    catch (e) { console.error(e); toast('Could not save the photo'); b.disabled = false; b.innerHTML = old; }
  };
  $('[data-go]', m).onclick = () => run('[data-go]', false);
  const sh = $('[data-share]', m); if (sh) sh.onclick = () => run('[data-share]', true);
}
function watermarkSheet() {
  const w = store.get('wm', { on: true, type: 'text', text: '', pos: 'br', size: .2, opacity: .8, color: '#ffffff' });
  const m = sheet(`<h3>Watermark</h3><p class="muted small">Your name or logo, added to photos when you export.</p>
    <div class="seg"><button class="${w.type === 'text' ? 'on' : ''}" data-wt="text">Text</button><button class="${w.type === 'logo' ? 'on' : ''}" data-wt="logo">Logo</button></div>
    <input class="field" id="wmt" maxlength="40" placeholder="e.g. @yourname" value="${esc(w.text || '')}" ${w.type === 'logo' ? 'hidden' : ''}>
    <button class="btn ghost block" id="wml" ${w.type === 'text' ? 'hidden' : ''}>${ic('image')}<span>${w.logo ? 'Change logo' : 'Pick logo (PNG works best)'}</span></button>
    <div class="pl">Position</div><div class="posgrid">${['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'].map((k) => `<button class="${w.pos === k ? 'on' : ''}" data-wp="${k}"></button>`).join('')}</div>
    <div class="sls">${slider('wms', 'Size', .05, .5, w.size, .01)}${slider('wmo', 'Opacity', .1, 1, w.opacity, .01)}</div>
    <div class="sw">${['#ffffff', '#111111', '#ff2d55', '#ffd34d'].map((c) => `<button class="swc ${w.color === c ? 'on' : ''}" data-wc="${c}" style="background:${c}"></button>`).join('')}</div>
    <div class="row"><button class="btn ghost" data-x>Cancel</button><button class="btn primary" id="wmsave">${ic('check')}<span>Save</span></button></div>`);
  $$('[data-wt]', m).forEach((b) => (b.onclick = () => { w.type = b.dataset.wt; $$('[data-wt]', m).forEach((x) => x.classList.toggle('on', x === b)); $('#wmt', m).hidden = w.type !== 'text'; $('#wml', m).hidden = w.type !== 'logo'; }));
  $$('[data-wp]', m).forEach((b) => (b.onclick = () => { w.pos = b.dataset.wp; $$('[data-wp]', m).forEach((x) => x.classList.toggle('on', x === b)); }));
  $$('[data-wc]', m).forEach((b) => (b.onclick = () => { w.color = b.dataset.wc; $$('[data-wc]', m).forEach((x) => x.classList.toggle('on', x === b)); }));
  $$('.sl input', m).forEach((inp) => (inp.oninput = () => { const k = inp.closest('.sl').dataset.k; if (k === 'wms') w.size = +inp.value; else w.opacity = +inp.value; paintSlider(inp); inp.closest('.sl').querySelector('b').textContent = Math.round(+inp.value * 100); }));
  $('#wml', m).onclick = async () => { const [f] = await pickFiles(); if (!f) return; const c = await loadImage(f, 400); w.logo = c.toDataURL('image/png'); $('#wml span', m).textContent = 'Change logo'; };
  $('#wmsave', m).onclick = () => { w.text = $('#wmt', m).value.trim(); w.on = true; if (!store.set('wm', w)) { toast('Logo too big to save'); return; } m.remove(); toast('Watermark saved'); };
}
async function mockupSheet() {
  const m = sheet(`<h3>Mockups</h3><p class="muted small">See your photo on products. Tap one to save it.</p><div class="mock" id="mockg">${busyBox('Making mockups…')}</div><div class="chips"><button class="chip" id="mshirt">T-shirt: white</button></div><div class="row"><button class="btn ghost" data-x>Close</button></div>`);
  const { MOCKUPS, renderMockup } = await import('./mockup.js'); const img = await renderFull(Math.min(1, 1400 / Math.max(...E.outSize(S))), 'png'); let shirt = '#ffffff';
  const fill = () => { const g = $('#mockg', m); if (!g) return; g.innerHTML = ''; for (const [k, n] of MOCKUPS) { const c = renderMockup(k, img, { color: shirt }), b = document.createElement('button'); b.innerHTML = `<img src="${c.toDataURL('image/jpeg', .85)}" alt=""><span>${n}</span>`; b.onclick = async () => { const blob = await toBlob(c, 'jpeg', .92); if (await saveFiles([new File([blob], `${NAME}-${k}.jpg`, { type: 'image/jpeg' })])) toast('Mockup saved'); }; g.appendChild(b); } };
  fill(); $('#mshirt', m).onclick = (e) => { shirt = shirt === '#ffffff' ? '#111111' : '#ffffff'; e.currentTarget.textContent = 'T-shirt: ' + (shirt === '#ffffff' ? 'white' : 'black'); fill(); };
}
// put the photo on a social-media sized canvas
function fitTo(src, [TW, TH], fill, fmt) {
  const c = document.createElement('canvas'); c.width = TW; c.height = TH; const x = c.getContext('2d');
  const cover = Math.max(TW / src.width, TH / src.height), contain = Math.min(TW / src.width, TH / src.height);
  const put = (k) => x.drawImage(src, (TW - src.width * k) / 2, (TH - src.height * k) / 2, src.width * k, src.height * k);
  if (fill === 'crop') { put(cover); return c; }
  if (fill === 'blur') { x.filter = `blur(${Math.round(TW * .035)}px) brightness(.8) saturate(1.1)`; put(cover * 1.1); x.filter = 'none'; }
  else if (fill.startsWith('#')) { x.fillStyle = fill; x.fillRect(0, 0, TW, TH); }
  if (fmt === 'jpeg' && fill === 'blur') { /* already filled */ }
  put(contain); return c;
}
export async function renderFull(k = 1, fmt = 'jpeg') {
  const X = new Engine(); sync(X);
  const [ow, oh] = X.outSize(S), lim = Math.min(X.maxTex, 8192), kk = Math.min(k, lim / Math.max(ow, oh));
  const W = Math.round(ow * kk), H = Math.round(oh * kk); X.render(S, W, H);
  const g = frameGeom(S.frame, W, H), out = document.createElement('canvas'); out.width = Math.round(W + g.l + g.r); out.height = Math.round(H + g.t + g.b); const x = out.getContext('2d');
  if (fmt === 'jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, out.width, out.height); }
  const clip = () => { if (g.radius) { x.beginPath(); x.roundRect ? x.roundRect(0, 0, W, H, g.radius) : x.rect(0, 0, W, H); x.clip(); } };
  x.save(); x.translate(g.l, g.t); clip(); x.drawImage(X.cv, 0, 0);
  X.gl.getExtension('WEBGL_lose_context')?.loseContext();
  const B = S.blend; if (B.key && IMGS.get(B.key)) { const l = document.createElement('canvas'); await blendCanvas(l, W, H, B); x.globalCompositeOperation = B.mode; x.globalAlpha = B.amt; x.drawImage(l, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  if (fxOn(S.fx)) { for (const [layer, op] of [['multiply', 'multiply'], ['screen', 'screen']]) { const l = document.createElement('canvas'); l.width = W; l.height = H; paintFx(l.getContext('2d'), W, H, S.fx, S.seed, layer); x.globalCompositeOperation = op; x.drawImage(l, 0, 0); } x.globalCompositeOperation = 'source-over'; paintFx(x, W, H, S.fx, S.seed, 'normal'); }
  x.restore();
  paintFrame(x, S.frame, W, H, g, S.frame.caption);
  x.save(); x.translate(g.l, g.t); clip();
  for (const it of S.items) {
    x.save();
    if (it.type === 'draw') {
      x.strokeStyle = it.color; x.lineWidth = it.w * W; x.lineCap = x.lineJoin = 'round'; const p = new Path2D(pathD(it.pts, W, H));
      if (it.glow) { x.shadowColor = it.color; x.shadowBlur = it.w * W * 2.5; x.stroke(p); x.shadowBlur = it.w * W; } x.stroke(p); x.restore(); continue;
    }
    x.translate(it.x * W, it.y * H); x.rotate(it.rot * Math.PI / 180);
    if (it.type === 'text') drawText(x, it, W);
    else {
      const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = srcOf(it); });
      if (im) { const w = it.size * W, h = w * im.height / im.width; if (it.flip) x.scale(-1, 1); x.drawImage(im, -w / 2, -h / 2, w, h); }
    }
    x.restore();
  }
  x.restore();
  if (hasTop(S.frame)) paintFrameTop(x, S.frame, W, H, g);
  const wm = store.get('wm', null); if (wm && wm.on) { let logo = null; if (wm.type === 'logo' && wm.logo) logo = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = wm.logo; }); drawWatermark(x, out.width, out.height, wm, logo); }
  return out;
}
window.Rouge = { renderFull, saveDraft, zoomTo, get VIEW() { return VIEW; }, get S() { return S; }, set S(v) { S = v; }, draw, panel, setTool, get FACES() { return FACES; }, get BASES() { return BASES; }, commit };
document.documentElement.dataset.theme = store.get('theme', 'dark');
home();
startI18n();
