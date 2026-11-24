// Text items: fonts, presets and one drawing routine used by both preview and export.
export const FONTS = [
  ['Inter', '700 {s}px Inter, system-ui, sans-serif'], ['Serif', 'italic 700 {s}px Fraunces, Georgia, serif'], ['Script', '700 {s}px "Dancing Script", cursive'],
  ['Mono', '700 {s}px "Space Mono", ui-monospace, monospace'], ['Anton', '400 {s}px Anton, Impact, sans-serif'], ['Bebas', '400 {s}px "Bebas Neue", Impact, sans-serif'],
  ['Pacifico', '400 {s}px Pacifico, cursive'], ['Caveat', '700 {s}px Caveat, cursive'], ['Playfair', 'italic 700 {s}px "Playfair Display", Georgia, serif'], ['Marker', '400 {s}px "Permanent Marker", cursive'],
];
export const fontSpec = (i, px) => (FONTS[i] || FONTS[0])[1].replace('{s}', Math.max(1, px));
export function loadFonts() { return Promise.all(FONTS.map((f) => document.fonts.load(fontSpec(FONTS.indexOf(f), 40), 'Ab1')).concat(document.fonts.load('italic 700 40px DSEG7', '0123'))).catch(() => {}); }
export const TEXT_PRESETS = [
  ['Classic', { font: 0, color: '#ffffff', shadow: true }],
  ['Neon', { font: 5, color: '#ff4d8d', glow: true, upper: true, spacing: .06 }],
  ['Label', { font: 0, color: '#ffffff', pill: true, pillColor: '#ff2d55' }],
  ['Outline', { font: 4, color: '#ff2d55', outline: .6, outlineColor: '#ffffff', upper: true }],
  ['Retro', { font: 6, color: '#ffd34d', shadow: true, outline: .35, outlineColor: '#8b2a1a' }],
  ['Diary', { font: 7, color: '#ffffff', shadow: true }],
  ['Type', { font: 3, color: '#111111', pill: true, pillColor: '#f6e7d8' }],
  ['Elegant', { font: 8, color: '#ffffff', shadow: true, spacing: .02 }],
  ['Rainbow', { font: 9, color: '#ffffff', curve: .45, outline: .4, outlineColor: '#ff2d55' }],
  ['3D', { font: 4, color: '#ffd34d', depth: .7, depthColor: '#c2185b', upper: true }],
  ['Sunset', { font: 5, color: '#ffd34d', grad: '#ff2d55', upper: true, spacing: .04, shadow: true }],
  ['Candy', { font: 6, color: '#ffb3cf', grad: '#a78bfa', outline: .35, outlineColor: '#ffffff' }],
];
export const blankText = () => ({ type: 'text', text: 'Your text', x: .5, y: .5, size: .09, rot: 0, font: 0, color: '#ffffff', pill: false, pillColor: '', shadow: true, outline: 0, outlineColor: '#111111', glow: false, curve: 0, spacing: 0, upper: false, depth: 0, depthColor: '#8b1030', grad: '' });

// work out where every letter goes; (0,0) is the centre of the text
function layout(x, it, W) {
  const px = it.size * W, ls = (it.spacing || 0) * px, raw = it.upper ? String(it.text || '').toUpperCase() : String(it.text || '');
  x.font = fontSpec(it.font, px); if ('letterSpacing' in x) x.letterSpacing = '0px';
  const cw = (ch) => x.measureText(ch).width + ls;
  const glyphs = []; let box;
  if (it.path && it.path.length > 1) {
    // letters follow a line the user drew (points in frame widths, around the text centre)
    const P = it.path.map(([x, y]) => [x * W, y * W]), seg = []; let total = 0;
    for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(l); total += l; }
    const chars = [...raw.replace(/\n+/g, ' ')], widths = chars.map(cw), tw = widths.reduce((a, b) => a + b, 0);
    let d = Math.max(0, (total - tw) / 2); const at = (dist) => { let i = 0; while (i < seg.length - 1 && dist > seg[i]) { dist -= seg[i]; i++; } const t = Math.min(1, dist / (seg[i] || 1)), a = P[i], b = P[i + 1]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])]; };
    chars.forEach((ch, i) => { const [x0, y0, r] = at(d + widths[i] / 2); glyphs.push({ ch, x: x0, y: y0, r }); d += widths[i]; });
    const xs = glyphs.map((g) => g.x), ys = glyphs.map((g) => g.y); box = { w: Math.max(Math.abs(Math.min(...xs)), Math.abs(Math.max(...xs))) * 2 + px * 1.2, h: Math.max(Math.abs(Math.min(...ys)), Math.abs(Math.max(...ys))) * 2 + px * 1.4 };
    return { px, glyphs, box, curved: true };
  }
  if (Math.abs(it.curve || 0) > .02) {
    const line = raw.replace(/\n+/g, ' '), chars = [...line], widths = chars.map(cw), w = widths.reduce((a, b) => a + b, 0) - ls;
    const th = (it.curve || 0) * Math.PI, R = Math.max(w / Math.abs(th), px), s = Math.sign(th);
    let d = -w / 2, ys = [];
    chars.forEach((ch, i) => { const c = d + widths[i] / 2 - ls / 2, a = c / R; glyphs.push({ ch, x: R * Math.sin(a), y: s * (R - R * Math.cos(a)), r: s * a }); ys.push(glyphs[i].y); d += widths[i]; });
    const mid = (Math.min(...ys) + Math.max(...ys)) / 2; glyphs.forEach((g) => (g.y -= mid));
    const xs = glyphs.map((g) => g.x); box = { w: (Math.max(...xs, 0) - Math.min(...xs, 0)) + px, h: (Math.max(...ys) - Math.min(...ys)) + px * 1.2 };
  } else {
    const lines = raw.split('\n'), lh = px * 1.15; let mw = 0;
    lines.forEach((l, j) => {
      const chars = [...l], widths = chars.map(cw), w = widths.reduce((a, b) => a + b, 0) - (chars.length ? ls : 0); mw = Math.max(mw, w);
      let d = -w / 2; const y = (j - (lines.length - 1) / 2) * lh;
      chars.forEach((ch, i) => { glyphs.push({ ch, x: d + (widths[i] - ls) / 2, y, r: 0 }); d += widths[i]; });
    });
    box = { w: mw, h: lines.length * lh };
  }
  return { px, glyphs, box, curved: Math.abs(it.curve || 0) > .02 };
}
export function textBox(it, W) { const c = document.createElement('canvas').getContext('2d'), L = layout(c, it, W), pad = L.px * .7; return { w: L.box.w + pad * 2, h: L.box.h + pad * 2 }; }
// draw centred at the current origin
export function drawText(x, it, W) {
  const L = layout(x, it, W), { px, glyphs, box } = L;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  if (it.pill && !L.curved) { x.save(); x.fillStyle = it.pillColor || (it.color === '#ffffff' ? '#ff2d55' : '#ffffff'); const pw = box.w + px * .9, ph = box.h + px * .3; x.beginPath(); x.roundRect ? x.roundRect(-pw / 2, -ph / 2, pw, ph, px * .35) : x.rect(-pw / 2, -ph / 2, pw, ph); x.fill(); x.restore(); }
  const each = (fn) => glyphs.forEach((g) => { x.save(); x.translate(g.x, g.y); if (g.r) x.rotate(g.r); fn(g.ch); x.restore(); });
  if (it.shadow) { x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = px * .25; x.shadowOffsetY = px * .06; x.fillStyle = it.color; each((c) => x.fillText(c, 0, 0)); x.restore(); }
  if (it.glow) { x.save(); x.shadowColor = it.color; x.fillStyle = it.color; for (const b of [px * .6, px * .25]) { x.shadowBlur = b; each((c) => x.fillText(c, 0, 0)); } x.restore(); }
  if (it.depth > 0) { x.save(); const n = Math.max(1, Math.round(it.depth * px * .12)); x.fillStyle = it.depthColor || '#8b1030'; for (let i = n; i >= 1; i--) { x.save(); x.translate(i * .7, i * .7); each((c) => x.fillText(c, 0, 0)); x.restore(); } x.restore(); }
  if (it.outline > 0) { x.save(); x.strokeStyle = it.outlineColor || '#111'; x.lineWidth = it.outline * px * .2; each((c) => x.strokeText(c, 0, 0)); x.restore(); }
  if (it.grad) { const g = x.createLinearGradient(0, -box.h / 2, 0, box.h / 2); g.addColorStop(0, it.color); g.addColorStop(1, it.grad); x.fillStyle = g; } else x.fillStyle = it.color;
  each((c) => x.fillText(c, 0, 0));
}
// a canvas of the text for the preview (sized in CSS pixels, drawn at dpr)
export function textCanvas(it, W, dpr) {
  const b = textBox(it, W), c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(b.w * dpr)); c.height = Math.max(1, Math.ceil(b.h * dpr));
  const x = c.getContext('2d'); x.scale(dpr, dpr); x.translate(b.w / 2, b.h / 2); drawText(x, it, W); c.style.width = b.w + 'px'; c.style.height = b.h + 'px'; return c;
}
