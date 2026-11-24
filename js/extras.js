// Helpers: colour palette, Instagram grid, animated GIF, watermark, auto straighten, look suggestions, look codes.
const vendor = (p) => new URL('vendor/' + p, location.href).href;
const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
function small(src, n) { const k = n / Math.max(src.width, src.height), c = document.createElement('canvas'); c.width = Math.max(1, src.width * k | 0); c.height = Math.max(1, src.height * k | 0); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c; }

// the main colours of a picture (k-means)
export function palette(src, k = 5) {
  const c = small(src, 96), d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data, px = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) px.push([d[i], d[i + 1], d[i + 2]]);
  if (!px.length) return [];
  let cen = Array.from({ length: k }, (_, i) => px[Math.floor((i + .5) / k * px.length)].slice());
  const lab = new Int32Array(px.length);
  for (let it = 0; it < 12; it++) {
    px.forEach((p, i) => { let b = 0, bd = 1e9; cen.forEach((q, j) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (dd < bd) { bd = dd; b = j; } }); lab[i] = b; });
    const s = cen.map(() => [0, 0, 0, 0]); px.forEach((p, i) => { const t = s[lab[i]]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++; });
    cen = s.map((t, j) => (t[3] ? [t[0] / t[3], t[1] / t[3], t[2] / t[3]] : cen[j]));
  }
  const cnt = cen.map(() => 0); lab.forEach((l) => cnt[l]++);
  return cen.map((q, j) => ({ hex: hex(...q), share: cnt[j] / px.length })).filter((q) => q.share > .01).sort((a, b) => b.share - a.share);
}
export function paletteImage(pal) {
  const c = document.createElement('canvas'); c.width = 1200; c.height = 700; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1200, 700);
  const w = 1200 / pal.length; pal.forEach((p, i) => { x.fillStyle = p.hex; x.fillRect(i * w, 0, w + 1, 540); x.fillStyle = '#222'; x.font = '600 34px Inter, sans-serif'; x.textAlign = 'center'; x.fillText(p.hex.toUpperCase(), i * w + w / 2, 625); });
  return c;
}
// cut one picture into Instagram grid tiles (posting order: last tile first)
export function gridTiles(src, cols, rows) {
  const tw = 1080, th = 1350, W = tw * cols, H = th * rows, k = Math.max(W / src.width, H / src.height), big = document.createElement('canvas'); big.width = W; big.height = H;
  const bx = big.getContext('2d'); bx.drawImage(src, (W - src.width * k) / 2, (H - src.height * k) / 2, src.width * k, src.height * k);
  const out = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const t = document.createElement('canvas'); t.width = tw; t.height = th; t.getContext('2d').drawImage(big, c * tw, r * th, tw, th, 0, 0, tw, th); out.push({ c: t, order: rows * cols - (r * cols + c) }); }
  return out;
}
// moving sparkles, snow, confetti or hearts over the picture, as a looping GIF
export async function makeGif(src, kind, onProgress) {
  const { GIFEncoder, quantize, applyPalette } = await import(vendor('gifenc.esm.js'));
  const b = small(src, 640), W = b.width, H = b.height, N = 24, gif = GIFEncoder(), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
  let s = 7; const R = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const parts = Array.from({ length: kind === 'sparkle' ? 26 : 60 }, () => ({ x: R(), y: R(), r: .5 + R(), p: R(), c: ['#ff4d8d', '#ffd34d', '#60a5fa', '#4ade80', '#ffffff', '#a78bfa'][Math.floor(R() * 6)], a: R() * 6.28 }));
  const m = Math.min(W, H);
  for (let f = 0; f < N; f++) {
    const t = f / N; x.drawImage(b, 0, 0);
    for (const q of parts) {
      x.save();
      if (kind === 'sparkle') { const tw = Math.max(0, Math.sin((t + q.p) * Math.PI * 2)); x.translate(q.x * W, q.y * H); x.scale(tw, tw); x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 8; const r = m * .025 * q.r; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * .25 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.fill(); }
      else if (kind === 'snow') { const y = ((q.y + t) % 1) * H, xx = q.x * W + Math.sin((t + q.p) * 6.28) * m * .02; x.fillStyle = 'rgba(255,255,255,.9)'; x.beginPath(); x.arc(xx, y, m * .006 * q.r + 1, 0, 7); x.fill(); }
      else if (kind === 'confetti') { const y = ((q.y + t) % 1) * H; x.translate(q.x * W, y); x.rotate(q.a + t * 12.6 * q.r); x.fillStyle = q.c; x.fillRect(-m * .008, -m * .004, m * .016, m * .008); }
      else { const y = H - ((q.y + t) % 1) * H, xx = q.x * W + Math.sin((t + q.p) * 6.28) * m * .02, r = m * .012 * q.r; x.translate(xx, y); x.fillStyle = '#ff4d8d'; x.globalAlpha = .85; x.beginPath(); x.moveTo(0, r * .9); x.bezierCurveTo(-r * 1.6, -r * .3, -r * .6, -r * 1.4, 0, -r * .5); x.bezierCurveTo(r * .6, -r * 1.4, r * 1.6, -r * .3, 0, r * .9); x.fill(); }
      x.restore();
    }
    const d = x.getImageData(0, 0, W, H).data, pal = quantize(d, 256), idx = applyPalette(d, pal);
    gif.writeFrame(idx, W, H, { palette: pal, delay: 80 }); onProgress && onProgress((f + 1) / N); await new Promise((r) => setTimeout(r, 0));
  }
  gif.finish(); return new Blob([gif.bytes()], { type: 'image/gif' });
}
// watermark: your name or logo in a corner
export function drawWatermark(x, W, H, wm, logo) {
  if (!wm || !wm.on) return; const m = Math.min(W, H), pad = m * .035, pos = wm.pos || 'br';
  x.save(); x.globalAlpha = wm.opacity ?? .8;
  let w, h;
  if (wm.type === 'logo' && logo) { w = m * (wm.size ?? .2); h = w * logo.height / logo.width; }
  else { x.font = `700 ${m * (wm.size ?? .2) * .22}px Inter, sans-serif`; w = x.measureText(wm.text || 'Darlia').width; h = m * (wm.size ?? .2) * .22; }
  const px = pos.includes('l') ? pad : pos.includes('r') ? W - pad - w : (W - w) / 2, py = pos.includes('t') ? pad : pos.includes('b') ? H - pad - h : (H - h) / 2;
  if (wm.type === 'logo' && logo) x.drawImage(logo, px, py, w, h);
  else { x.textBaseline = 'top'; x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = h * .2; x.fillStyle = wm.color || '#ffffff'; x.fillText(wm.text || 'Darlia', px, py); }
  x.restore();
}
// which way is level? look at strong edges near horizontal and vertical
export function autoAngle(src) {
  const c = small(src, 360), W = c.width, H = c.height, d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data, L = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) L[i] = d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11;
  const bins = new Float32Array(91); // -45..45 in 1°
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x, gx = L[i + 1] - L[i - 1], gy = L[i + W] - L[i - W], mag = Math.hypot(gx, gy); if (mag < 40) continue;
    let a = Math.atan2(gy, gx) * 180 / Math.PI; a = ((a % 90) + 135) % 90 - 45; // edge angle folded to -45..45
    bins[Math.round(a) + 45] += mag;
  }
  let best = 45, bv = 0; for (let i = 0; i < 91; i++) { const v = bins[i] + (bins[i - 1] || 0) * .5 + (bins[i + 1] || 0) * .5; if (v > bv) { bv = v; best = i; } }
  const ang = best - 45; return Math.abs(ang) > 20 ? 0 : -ang;
}
// suggest looks from simple facts about the picture
export function suggestLooks(src, hasFace) {
  const c = small(src, 64), d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data; let L = 0, r = 0, g = 0, b = 0, n = 0, sat = 0, topBlue = 0;
  for (let i = 0; i < d.length; i += 4) { const R = d[i], G = d[i + 1], B = d[i + 2]; L += R * .3 + G * .59 + B * .11; r += R; g += G; b += B; sat += Math.max(R, G, B) - Math.min(R, G, B); n++; if (i < d.length / 3 && B > R + 15) topBlue++; }
  L /= n * 255; r /= n; g /= n; b /= n; sat /= n * 255; const blueSky = topBlue / (n / 3) > .35, warm = r > b + 20, green = g > r && g > b;
  const out = [];
  if (hasFace) out.push('portra', 'rosy', 'rouge');
  if (L < .32) out.push('neon', 'midnight', 'glow');
  if (blueSky) out.push('beach', 'island', 'vivid');
  if (warm && !hasFace) out.push('brunch', 'latte', 'warm');
  if (green) out.push('kampung', 'matcha');
  if (sat < .12) out.push('noir', 'silver');
  out.push('vivid', 'teal', 'kodak');
  return [...new Set(out)].slice(0, 4);
}
// share looks as a short code
export const lookCode = (r) => 'RG1.' + btoa(unescape(encodeURIComponent(JSON.stringify(r)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function parseCode(s) { s = String(s || '').trim(); if (!s.startsWith('RG1.')) return null; try { const b = s.slice(4).replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(decodeURIComponent(escape(atob(b)))); } catch (e) { return null; } }
