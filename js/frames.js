// Photo frames. Borders are worked out from the picture size so preview and export match.
// paintFrame draws the border (under/around the photo); paintFrameTop draws anything over the photo.
export const FRAMES = [['none', 'None'], ['white', 'White'], ['black', 'Black'], ['blush', 'Blush'], ['polaroid', 'Instant'], ['film', 'Film'], ['rounded', 'Rounded'],
  ['gradient', 'Darlia'], ['shadow', 'Float'], ['tape', 'Taped'], ['cinema', 'Cinema'], ['stamp', 'Stamp'], ['raya', 'Raya'], ['merdeka', 'Merdeka'], ['wedding', 'Wedding'], ['bday', 'Birthday']];
export const COLORABLE = ['white', 'black', 'blush', 'polaroid', 'shadow', 'tape', 'stamp'];
export function frameGeom(f, w, h) {
  const t = f && f.type || 'none', m = Math.min(w, h), k = .4 + (f.size ?? .5) * 1.2;
  if (t === 'none' || t === 'cinema') return { l: 0, t: 0, r: 0, b: 0, radius: 0 };
  if (t === 'rounded') return { l: 0, t: 0, r: 0, b: 0, radius: m * .07 * k };
  if (t === 'polaroid') { const b = m * .05 * k; return { l: b, t: b, r: b, b: b * 4.2, radius: 0 }; }
  if (t === 'film') { const b = m * .03 * k; return { l: b * 1.3, t: b * 4.2, r: b * 1.3, b: b * 4.2, radius: 0 }; }
  if (t === 'shadow') { const b = m * .09 * k; return { l: b, t: b, r: b, b: b, radius: 0 }; }
  if (t === 'tape') { const b = m * .06 * k; return { l: b, t: b * 1.4, r: b, b: b, radius: 0 }; }
  if (t === 'stamp') { const b = m * .06 * k; return { l: b, t: b, r: b, b: b, radius: 0 }; }
  if (['raya', 'merdeka', 'wedding', 'bday'].includes(t)) { const b = m * .075 * k; return { l: b, t: b, r: b, b: b * 1.25, radius: 0 }; }
  const b = m * .045 * k; return { l: b, t: b, r: b, b, radius: 0 };
}
const COL = { raya: '#0f5132', merdeka: '#ffffff', wedding: '#fbf7ef', bday: '#ffb3cf', white: '#ffffff', black: '#0d0d0d', blush: '#f6d5dc', polaroid: '#fbf9f4', film: '#111010', shadow: '#f6d5dc', tape: '#fbf9f4', stamp: '#fbf9f4' };
export function paintFrame(x, f, w, h, g, caption) {
  const t = f.type, W = w + g.l + g.r, H = h + g.t + g.b;
  if (t === 'none' || t === 'rounded' || t === 'cinema') return;
  x.save();
  const hole = () => { x.beginPath(); x.rect(0, 0, W, H); x.rect(g.l, g.t, w, h); };
  if (t === 'gradient') { const gr = x.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#ff4d8d'); gr.addColorStop(.55, '#e0143c'); gr.addColorStop(1, '#5a2a1c'); x.fillStyle = gr; }
  else x.fillStyle = f.color || COL[t];
  hole(); x.fill('evenodd');
  if (t === 'shadow') { x.save(); hole(); x.clip('evenodd'); x.shadowColor = 'rgba(40,10,20,.4)'; x.shadowBlur = g.l * .5; x.shadowOffsetY = g.l * .18; x.fillStyle = '#000'; x.fillRect(g.l, g.t, w, h); x.restore(); }
  if (t === 'stamp') {
    // perforated edge: bite circles out of the border
    const r = g.l * .22, step = r * 2.6; x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    for (let px = step / 2; px < W; px += step) for (const py of [0, H]) { x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
    for (let py = step / 2; py < H; py += step) for (const px of [0, W]) { x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
    x.globalCompositeOperation = 'source-over'; x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = Math.max(1, g.l * .03); x.strokeRect(g.l - g.l * .25, g.t - g.t * .25, w + g.l * .5, h + g.t * .5);
  }
  if (t === 'film') {
    const hw = g.t * .32, hh = g.t * .42, gap = hw * 1.6, y1 = (g.t - hh) / 2, y2 = H - g.b + (g.b - hh) / 2;
    x.fillStyle = '#e9e2d6';
    for (let px = gap / 2; px < W; px += hw + gap) { for (const y of [y1, y2]) { x.beginPath(); x.roundRect ? x.roundRect(px, y, hw, hh, hw * .2) : x.rect(px, y, hw, hh); x.fill(); } }
  }
  if (t === 'raya') {
    // ketupat diamonds in gold along the border, with a crescent and star at the top
    const s = g.l * .42; x.fillStyle = '#d4af37'; x.strokeStyle = '#f4dd8a'; x.lineWidth = Math.max(1, s * .08);
    const dia = (cx, cy) => { x.beginPath(); x.moveTo(cx, cy - s / 2); x.lineTo(cx + s / 2, cy); x.lineTo(cx, cy + s / 2); x.lineTo(cx - s / 2, cy); x.closePath(); x.fill(); x.beginPath(); x.moveTo(cx - s / 4, cy - s / 4); x.lineTo(cx + s / 4, cy + s / 4); x.moveTo(cx + s / 4, cy - s / 4); x.lineTo(cx - s / 4, cy + s / 4); x.stroke(); };
    for (let px = g.l / 2; px < W; px += s * 1.6) { dia(px, g.t / 2); dia(px, H - g.b / 2); }
    for (let py = g.t / 2 + s * 1.6; py < H - g.b; py += s * 1.6) { dia(g.l / 2, py); dia(W - g.r / 2, py); }
    x.strokeStyle = '#d4af37'; x.lineWidth = Math.max(1, g.l * .05); x.strokeRect(g.l * .82, g.t * .82, W - g.l * 1.64, H - g.t * .82 - g.b * .82);
    x.fillStyle = '#f4dd8a'; x.font = `italic 700 ${g.b * .38}px Fraunces, Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#0f5132'; x.fillRect(W / 2 - g.b * 2.6, H - g.b, g.b * 5.2, g.b); x.fillStyle = '#f4dd8a'; x.fillText(caption || 'Selamat Hari Raya', W / 2, H - g.b / 2);
  }
  if (t === 'merdeka') {
    const st = g.l / 3; for (let i = 0; i < 3; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#cc0001'; x.beginPath(); x.rect(i * st, i * st, W - i * st * 2, H - i * st * 2); x.rect(g.l, g.t, w, h); x.fill('evenodd'); }
    x.fillStyle = '#010066'; x.fillRect(0, 0, g.l * 2.6, g.t * 2.2); x.fillStyle = '#ffcc00';
    const star = (cx, cy, r) => { x.beginPath(); for (let i = 0; i < 28; i++) { const a = i * Math.PI / 14 - Math.PI / 2, rr = i % 2 ? r * .45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.fill(); };
    x.beginPath(); x.arc(g.l * 1.05, g.t * 1.1, g.t * .7, 0, 7); x.fill(); x.fillStyle = '#010066'; x.beginPath(); x.arc(g.l * 1.25, g.t * 1.1, g.t * .6, 0, 7); x.fill(); x.fillStyle = '#ffcc00'; star(g.l * 2, g.t * 1.1, g.t * .42);
    x.fillStyle = '#cc0001'; x.font = `800 ${g.b * .42}px Inter, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.fillRect(W / 2 - g.b * 2.4, H - g.b, g.b * 4.8, g.b); x.fillStyle = '#cc0001'; x.fillText(caption || 'MERDEKA!', W / 2, H - g.b / 2);
  }
  if (t === 'wedding') {
    x.strokeStyle = '#c9a96e'; x.lineWidth = Math.max(1, g.l * .04); x.strokeRect(g.l * .35, g.t * .35, W - g.l * .7, H - g.t * .35 - g.b * .35); x.lineWidth = Math.max(1, g.l * .02); x.strokeRect(g.l * .55, g.t * .55, W - g.l * 1.1, H - g.t * .55 - g.b * .55);
    const leaf = (cx, cy, a, r) => { x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = '#c9a96e'; for (let i = 0; i < 5; i++) { x.save(); x.rotate(i * .5 - 1); x.beginPath(); x.ellipse(r * .9, 0, r * .55, r * .18, 0, 0, 7); x.fill(); x.restore(); } x.fillStyle = '#e8c9c9'; x.beginPath(); x.arc(0, 0, r * .32, 0, 7); x.fill(); x.restore(); };
    const r = g.l * .7; leaf(g.l * .55, g.t * .55, Math.PI / 4, r); leaf(W - g.r * .55, g.t * .55, Math.PI * 3 / 4, r); leaf(g.l * .55, H - g.b * .55, -Math.PI / 4, r); leaf(W - g.r * .55, H - g.b * .55, -Math.PI * 3 / 4, r);
    x.fillStyle = '#9a7b4f'; x.font = `italic 700 ${g.b * .4}px "Playfair Display", Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(caption || 'Happily ever after', W / 2, H - g.b / 2);
  }
  if (t === 'bday') {
    let sd = 3; const R2 = () => { sd ^= sd << 13; sd ^= sd >>> 17; sd ^= sd << 5; return (sd >>> 0) / 4294967296; };
    x.save(); x.beginPath(); x.rect(0, 0, W, H); x.rect(g.l, g.t, w, h); x.clip('evenodd');
    for (let i = 0; i < 160; i++) { x.save(); x.translate(R2() * W, R2() * H); x.rotate(R2() * 6); x.fillStyle = ['#ffd34d', '#ffffff', '#60a5fa', '#4ade80', '#a78bfa', '#e0143c'][(R2() * 6) | 0]; x.fillRect(-g.l * .1, -g.l * .04, g.l * .2, g.l * .08); x.restore(); }
    const ball = (cx, cy, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, g.l * .32, g.l * .4, 0, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = Math.max(1, g.l * .03); x.beginPath(); x.moveTo(cx, cy + g.l * .4); x.quadraticCurveTo(cx + g.l * .1, cy + g.l * .6, cx, cy + g.l * .8); x.stroke(); };
    ball(g.l * .5, g.t * .45, '#e0143c'); ball(W - g.r * .5, g.t * .45, '#60a5fa'); x.restore();
    x.fillStyle = '#ffffff'; x.font = `400 ${g.b * .45}px Pacifico, cursive`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = 'rgba(160,20,60,.4)'; x.shadowBlur = g.b * .1; x.fillText(caption || 'Happy Birthday', W / 2, H - g.b / 2);
  }
  if (t === 'polaroid' && caption) { x.fillStyle = '#3a3034'; x.font = `italic 700 ${g.b * .26}px Fraunces, Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(caption, W / 2, H - g.b / 2); }
  x.restore();
}
export const hasTop = (f) => f && (f.type === 'tape' || f.type === 'cinema');
export function paintFrameTop(x, f, w, h, g) {
  const t = f.type, W = w + g.l + g.r, m = Math.min(w, h); x.save();
  if (t === 'tape') {
    const tw = m * .26, th = m * .07;
    for (const [cx, cy, a] of [[g.l + tw * .25, g.t, -.6], [W - g.r - tw * .25, g.t, .6]]) {
      x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = 'rgba(240,226,196,.82)'; x.shadowColor = 'rgba(0,0,0,.15)'; x.shadowBlur = th * .2;
      x.beginPath(); const z = th * .12; x.moveTo(-tw / 2, -th / 2); for (let i = 0; i <= 6; i++) x.lineTo(-tw / 2 + (i % 2 ? z : 0), -th / 2 + th * i / 6); x.lineTo(tw / 2, th / 2); for (let i = 6; i >= 0; i--) x.lineTo(tw / 2 - (i % 2 ? z : 0), -th / 2 + th * i / 6); x.closePath(); x.fill(); x.restore();
    }
  }
  if (t === 'cinema') { const bar = Math.min(h * .3, Math.max(h * .06, (h - w / 2.39) / 2) * (.4 + (f.size ?? .5) * 1.2)); x.fillStyle = '#000'; x.fillRect(g.l, g.t, w, bar); x.fillRect(g.l, g.t + h - bar, w, bar); }
  x.restore();
}
