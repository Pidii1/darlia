// Small shared helpers: DOM, icons, toast, saving files.
import { toDrawable, ACCEPT } from './formats.js';
export const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ICON = {
  back: '<path d="M15 18l-6-6 6-6"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  compare: '<path d="M12 3v18"/><rect x="3" y="5" width="18" height="14" rx="2"/>', download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  looks: '<circle cx="9" cy="9" r="5"/><circle cx="15" cy="9" r="5"/><circle cx="12" cy="15" r="5"/>', adjust: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  colour: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 3 0 4-1 3-2 3-5a9 9 0 0 0-9-7z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  curves: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M6 18c4 0 4-12 12-12"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>', cutout: '<path d="M12 3l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/><path d="M4 20h16" stroke-dasharray="2 2"/>',
  retouch: '<circle cx="12" cy="11" r="7"/><path d="M9.5 10h.01M14.5 10h.01"/><path d="M9.5 13.5c1.4 1.2 3.6 1.2 5 0"/><path d="M19 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
  erase: '<path d="M20 20H9L4 15a2 2 0 0 1 0-3l8-8a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 8"/><path d="M8 11l6 6"/>',
  brush: '<path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>',
  blur: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="2 3"/><circle cx="12" cy="12" r="10.5" stroke-dasharray="1 4"/>',
  reshape: '<path d="M4 12c3-6 5 6 8 0s5 6 8 0"/><path d="M4 6c3-3 5 3 8 0s5 3 8 0" opacity=".5"/><path d="M4 18c3-3 5 3 8 0s5 3 8 0" opacity=".5"/>',
  draw: '<path d="M3 21c3-1 4-4 7-4s3 3 6 2 3-5 5-6"/><path d="M14 4l6 6-8 8H6v-6z"/>',
  frame: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="8"/>',
  text: '<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>', sticker: '<path d="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h7l8-8V6a3 3 0 0 0-3-3z"/><path d="M13 21v-5a3 3 0 0 1 3-3h5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>', rotate: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>',
  flipH: '<path d="M12 3v18"/><path d="M8 7l-5 5 5 5V7zM16 7l5 5-5 5V7z"/>', flipV: '<path d="M3 12h18"/><path d="M7 8l5-5 5 5H7zM7 16l5 5 5-5H7z"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', check: '<path d="M5 12l5 5 9-10"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  paste: '<path d="M9 4h6v3H9z"/><path d="M15 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>', heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  grid: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  stack: '<rect x="6" y="6" width="14" height="14" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>', swap: '<path d="M7 4L3 8l4 4"/><path d="M3 8h14"/><path d="M17 20l4-4-4-4"/><path d="M21 16H7"/>',
  push: '<path d="M5 12h12"/><path d="M13 7l5 5-5 5"/>', bloat: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', pinch: '<circle cx="12" cy="12" r="2"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  fx: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M3 15h18"/><path d="M7 5v4M12 5v4M17 5v4M7 15v4M12 15v4M17 15v4"/>',
  minus: '<path d="M5 12h14"/>', person: '<circle cx="12" cy="7" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  sky: '<path d="M7 18a4 4 0 0 1-.5-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18z"/>', heal: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M10.5 10.5h.01M13.5 13.5h.01M10.5 13.5h.01M13.5 10.5h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
  enhance: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M19 14l.9 2.1 2.1.9-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z"/><path d="M5 15l.6 1.4L7 17l-1.4.6L5 19l-.6-1.4L3 17l1.4-.6z"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 9h8M8 12h8M8 15h5"/>',
  eff: '<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M12.2 6.2l-1.4-1.4"/><path d="M3 21l9-9"/><circle cx="15" cy="9" r="3"/>',
  eyedrop: '<path d="M2 22l1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="M15 6l3-3 3 3-3 3"/><path d="M12 9l3 3"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>', layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  mockup: '<path d="M8 3l4 3 4-3 5 4-3 4-2-1v11H8V10l-2 1-3-4z"/>', palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 1 0 0 20c1 0 1.5-.8 1.5-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.9.7-1.6 1.6-1.6H16a6 6 0 0 0 6-6c0-4.9-4.5-8.6-10-8.6z"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>', album: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3"/>', gif: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M9 10H7v4h2v-1.5M12 10v4M15 14v-4h2.5M15 12h2"/>',
  splitgrid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 12h18"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
export const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ''}</svg>`;
export function toast(msg, ms = 2200) { let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); } t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), ms); }
export function logo() { return `<svg viewBox="0 0 64 64"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d8d"/><stop offset="1" stop-color="#d1102f"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#lg)"/><path d="M21 18h11a14 14 0 0 1 0 28H21zM27 24v16h5a8 8 0 0 0 0-16z" fill="#fff" fill-rule="evenodd"/></svg>`; }
export function slider(key, label, min, max, val, step = .01, fmt) {
  const pct = ((val - min) / (max - min)) * 100, zero = clamp(((0 - min) / (max - min)) * 100, 0, 100);
  return `<label class="sl" data-k="${key}"><span>${label}</span><b>${fmt ? fmt(val) : Math.round(val * 100)}</b><input type="range" min="${min}" max="${max}" step="${step}" value="${val}" style="--a:${Math.min(pct, zero)}%;--b:${Math.max(pct, zero)}%"></label>`;
}
export function paintSlider(inp) {
  const v = +inp.value, min = +inp.min, max = +inp.max, pct = ((v - min) / (max - min)) * 100, zero = clamp(((0 - min) / (max - min)) * 100, 0, 100);
  inp.style.setProperty('--a', Math.min(pct, zero) + '%'); inp.style.setProperty('--b', Math.max(pct, zero) + '%');
}
export function pickFiles(multiple) {
  return new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = ACCEPT; i.multiple = !!multiple; i.onchange = () => res([...i.files]); i.click(); });
}
export async function loadImage(src0, lim = 4096) {
  const src = src0 instanceof Blob && src0.name ? await toDrawable(src0) : src0;
  return new Promise((res, rej) => {
    const u = src instanceof Blob ? URL.createObjectURL(src) : src, im = new Image();
    im.onload = () => { const k = Math.min(1, lim / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); if (src instanceof Blob) URL.revokeObjectURL(u); res(c); };
    im.onerror = () => rej(new Error('Could not open that picture')); im.src = u;
  });
}
const isPhone = () => /Android|iPhone|iPad/i.test(navigator.userAgent);
export async function toBlob(canvas, fmt = 'jpeg', q = .95) { return new Promise((r) => canvas.toBlob(r, 'image/' + fmt, q)); }
// save one or many photos: share sheet on phones, downloads on computers
// ---- native apps (Android = Capacitor, Windows = Electron) ----
const CAP = (() => { try { return window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() ? window.Capacitor : null; } catch (e) { return null; } })();
export const NATIVE = CAP ? 'android' : (window.darliaNative ? 'windows' : '');
const P = (n) => CAP && CAP.Plugins && CAP.Plugins[n];
const b64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(blob); });
const isMedia = (f) => /^(image|video)\//.test(f.type || '');
async function nativeShare(files) {
  const uris = [];
  for (const f of files) { const r = await P('Filesystem').writeFile({ path: 'share/' + f.name, data: await b64(f), directory: 'CACHE', recursive: true }); uris.push(r.uri); }
  try { await P('Share').share({ files: uris }); return true; } catch (e) { return false; }
}
export async function shareFiles(files) {
  if (CAP) return nativeShare(files);
  if (navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files }); return true; } catch (e) { if (e.name === 'AbortError') return false; } }
  return saveFiles(files);
}
export const canShareFiles = () => !!CAP || !!(navigator.canShare && navigator.share);
export async function saveFiles(files) {
  if (CAP) {
    const media = files.filter(isMedia), other = files.filter((f) => !isMedia(f));
    try { for (const f of media) await P('Gallery').save({ data: await b64(f), name: f.name, mime: f.type }); }
    catch (e) { toast('Could not save: ' + (e.message || e)); return false; }
    if (other.length) return nativeShare(other);
    return true;
  }
  if (isPhone() && navigator.canShare && navigator.canShare({ files })) { try { await navigator.share({ files }); return true; } catch (e) { if (e.name === 'AbortError') return false; } }
  for (const f of files) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000); if (files.length > 1) await new Promise((r) => setTimeout(r, 350));
  }
  return true;
}
// Android back button: close the top sheet, then go back a screen, then leave the app
if (CAP && P('App')) {
  P('App').addListener('backButton', () => {
    const sh = [...document.querySelectorAll('.sheet')].pop(); if (sh) { sh.remove(); return; }
    const b = document.querySelector('#home, #cback, #bback, #vback'); if (b) { b.click(); return; }
    P('App').exitApp();
  });
}
export function sheet(html) {
  const m = document.createElement('div'); m.className = 'sheet'; m.innerHTML = `<div class="card">${html}</div>`; document.body.appendChild(m);
  m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-x]')) m.remove(); }); return m;
}
export const store = {
  get(k, d) { try { const v = localStorage.getItem('rouge_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rouge_' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
};
