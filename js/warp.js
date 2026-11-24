// Face masks, face reshaping and the liquify brush. All fields are grids of offsets in
// picture units (0..1, y down): the pixel shown at p comes from p + F(p).
export const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const EYE_L = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const EYE_R = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
const BROW_L = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46], BROW_R = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const MOUTH = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191];
const JAW_L = [234, 93, 132, 58, 172, 136, 150, 149, 176], JAW_R = [454, 323, 361, 288, 397, 365, 379, 378, 400];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const mid = (pts, ids) => ids.reduce((s, i) => [s[0] + pts[i][0] / ids.length, s[1] + pts[i][1] / ids.length], [0, 0]);
export const faceWidth = (f) => dist(f[234], f[454]);

// R = skin, G = teeth, B = eyes; drawn at most 1024 px on the long side
export function faceMask(W, H, faces) {
  const k = Math.min(1, 1024 / Math.max(W, H)), w = Math.round(W * k), h = Math.round(H * k);
  const layer = (draw, blur) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    const poly = (f, ids, col, grow = 1) => { const m = mid(f, ids); x.fillStyle = col; x.beginPath(); ids.forEach((i, j) => { const px = (m[0] + (f[i][0] - m[0]) * grow) * k, py = (m[1] + (f[i][1] - m[1]) * grow) * k; j ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); x.fill(); };
    faces.forEach((f) => draw(poly, f));
    if (!blur) return c;
    const o = document.createElement('canvas'); o.width = w; o.height = h; const ox = o.getContext('2d'); ox.filter = `blur(${blur}px)`; ox.drawImage(c, 0, 0); return o;
  };
  const fw = faces.length ? Math.min(...faces.map(faceWidth)) * k : 100;
  const skin = layer((poly, f) => { poly(f, OVAL, '#fff', .96); [EYE_L, EYE_R].forEach((e) => poly(f, e, '#000', 1.9)); [BROW_L, BROW_R].forEach((e) => poly(f, e, '#000', 1.3)); poly(f, LIPS, '#000', 1.15); }, fw * .035);
  const teeth = layer((poly, f) => poly(f, MOUTH, '#fff', .92), fw * .01);
  const eyes = layer((poly, f) => [EYE_L, EYE_R].forEach((e) => poly(f, e, '#fff', 1.05)), fw * .012);
  const lips = layer((poly, f) => { poly(f, LIPS, '#fff', 1); poly(f, MOUTH, '#000', 1.04); }, fw * .008);
  const out = document.createElement('canvas'); out.width = w; out.height = h; const ox = out.getContext('2d'), d = ox.createImageData(w, h);
  const a = skin.getContext('2d').getImageData(0, 0, w, h).data, b = teeth.getContext('2d').getImageData(0, 0, w, h).data, e = eyes.getContext('2d').getImageData(0, 0, w, h).data, l = lips.getContext('2d').getImageData(0, 0, w, h).data;
  // alpha holds the lips; drawn without premultiplying, so keep the canvas opaque and pack by ImageData
  for (let i = 0; i < d.data.length; i += 4) { d.data[i] = a[i]; d.data[i + 1] = b[i]; d.data[i + 2] = e[i]; d.data[i + 3] = l[i]; }
  return { width: w, height: h, data: new Uint8Array(d.data.buffer) };
}

export function gridSize(W, H, n = 256) { return W >= H ? [n, Math.max(8, Math.round(n * H / W))] : [Math.max(8, Math.round(n * W / H)), n]; }

// slimmer face + bigger eyes, as a field
export function faceField(W, H, faces, o, gw, gh) {
  const F = new Float32Array(gw * gh * 2); if (!faces.length || (!o.slim && !o.eyes)) return F;
  const ctl = faces.map((f) => {
    const fw = faceWidth(f), nose = f[1], jaws = [];
    if (o.slim) for (const i of [...JAW_L, ...JAW_R]) { const p = f[i], t = (nose[0] - p[0]) * o.slim * .09; jaws.push([p[0], p[1], t, fw * .38]); }
    const eyes = o.eyes ? [[f[468] ? f[468] : mid(f, EYE_L), dist(f[33], f[133])], [f[473] ? f[473] : mid(f, EYE_R), dist(f[263], f[362])]] : [];
    const xs = OVAL.map((i) => f[i][0]), ys = OVAL.map((i) => f[i][1]), ell = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2];
    return { jaws, eyes, ell, box: [Math.min(...OVAL.map((i) => f[i][0])) - fw * .5, Math.min(...OVAL.map((i) => f[i][1])) - fw * .5, Math.max(...OVAL.map((i) => f[i][0])) + fw * .5, Math.max(...OVAL.map((i) => f[i][1])) + fw * .5] };
  });
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const px = (gx + .5) / gw * W, py = (gy + .5) / gh * H; let ox = 0, oy = 0;
    for (const c of ctl) {
      if (px < c.box[0] || py < c.box[1] || px > c.box[2] || py > c.box[3]) continue;
      // fade the warp out just outside the face so the background stays straight
      const e = Math.hypot((px - c.ell[0]) / c.ell[2], (py - c.ell[1]) / c.ell[3]), att = e < 1.05 ? 1 : e > 1.5 ? 0 : (t => 1 - t * t * (3 - 2 * t))((e - 1.05) / .45);
      if (att <= 0) continue;
      let sx = 0, ws = 0;
      for (const [jx, jy, t, R] of c.jaws) { const d2 = ((px - jx) ** 2 + (py - jy) ** 2) / (R * R); if (d2 < 1) { const w = (1 - d2) ** 2; sx += t * w; ws += w; } }
      if (ws > 0) ox -= sx / Math.max(1, ws) * att;
      for (const [[ex, ey], ew] of c.eyes) { const R = ew * 1.25, dx = px - ex, dy = py - ey, d2 = (dx * dx + dy * dy) / (R * R); if (d2 < 1) { const s = o.eyes * .28 * (1 - d2) * att; ox -= dx * s; oy -= dy * s; } }
    }
    const i = (gy * gw + gx) * 2; F[i] = ox / W; F[i + 1] = oy / H;
  }
  return F;
}

// liquify brush working on a field
export class Liquify {
  constructor(W, H) { this.W = W; this.H = H; [this.gw, this.gh] = gridSize(W, H, 200); this.F = new Float32Array(this.gw * this.gh * 2); this.used = false; }
  sample(F, u, v) {
    const { gw, gh } = this, x = Math.max(0, Math.min(gw - 1.001, u * gw - .5)), y = Math.max(0, Math.min(gh - 1.001, v * gh - .5)), x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
    const g = (xx, yy, k) => F[(yy * gw + xx) * 2 + k];
    return [0, 1].map((k) => (g(x0, y0, k) * (1 - fx) + g(x0 + 1, y0, k) * fx) * (1 - fy) + (g(x0, y0 + 1, k) * (1 - fx) + g(x0 + 1, y0 + 1, k) * fx) * fy);
  }
  // cx, cy in picture units; dx, dy the pointer move (picture units); R in pixels
  stroke(mode, cx, cy, dx, dy, R, power) {
    const { gw, gh, W, H } = this, F = this.F, src = mode === 'push' ? F.slice() : null;
    const x0 = Math.max(0, Math.floor((cx - R / W) * gw)), x1 = Math.min(gw - 1, Math.ceil((cx + R / W) * gw)), y0 = Math.max(0, Math.floor((cy - R / H) * gh)), y1 = Math.min(gh - 1, Math.ceil((cy + R / H) * gh));
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
      const u = (gx + .5) / gw, v = (gy + .5) / gh, ddx = (u - cx) * W, ddy = (v - cy) * H, d2 = (ddx * ddx + ddy * ddy) / (R * R); if (d2 >= 1) continue;
      const w = (1 - d2) ** 2 * power, i = (gy * gw + gx) * 2;
      if (mode === 'push') { const s = this.sample(src, u - dx * w, v - dy * w); F[i] = s[0] - dx * w; F[i + 1] = s[1] - dy * w; }
      else if (mode === 'bloat' || mode === 'pinch') { const s = (mode === 'bloat' ? -1 : 1) * .06 * w; F[i] += (u - cx) * s; F[i + 1] += (v - cy) * s; }
      else if (mode === 'restore') { F[i] *= 1 - w * .3; F[i + 1] *= 1 - w * .3; }
    }
    this.used = true;
  }
}
// add b (resampled) on top of a field of size gw x gh
export function addField(a, gw, gh, b, bw, bh) {
  const out = a.slice(); if (!b) return out;
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const bx = Math.min(bw - 1, Math.floor((gx + .5) / gw * bw)), by = Math.min(bh - 1, Math.floor((gy + .5) / gh * bh)), i = (gy * gw + gx) * 2, j = (by * bw + bx) * 2;
    out[i] += b[j]; out[i + 1] += b[j + 1];
  }
  return out;
}

// cheeks and eyelids for makeup, in texture space (0..1, y up)
export function makeupGeo(W, H, faces) {
  const cheeks = [], lids = [];
  for (const f of faces.slice(0, 4)) {
    const fw = faceWidth(f), r = fw * .12;
    for (const i of [205, 425]) cheeks.push([f[i][0] / W, 1 - f[i][1] / H, r / W, r * .8 / H]);
    for (const [top, a, b] of [[159, 33, 133], [386, 263, 362]]) { const ew = dist(f[a], f[b]); lids.push([f[top][0] / W, 1 - (f[top][1] - ew * .18) / H, ew * .62 / W, ew * .3 / H]); }
  }
  return { n: Math.min(4, faces.length), cheeks, lids };
}
// slimmer body and longer legs from the person mask
export function bodyField(W, H, mask, o, gw, gh) {
  const F = new Float32Array(gw * gh * 2); if (!mask || (!o.slim && !o.legs)) return F;
  const k = 160 / Math.max(mask.width, mask.height), mw = Math.max(2, mask.width * k | 0), mh = Math.max(2, mask.height * k | 0), c = document.createElement('canvas'); c.width = mw; c.height = mh;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(mask, 0, 0, mw, mh); const d = x.getImageData(0, 0, mw, mh).data;
  let x0 = mw, x1 = 0, y0 = mh, y1 = 0, sx = 0, n = 0;
  for (let y = 0; y < mh; y++) for (let xx = 0; xx < mw; xx++) if (d[(y * mw + xx) * 4] > 128) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); sx += xx; n++; }
  if (!n) return F;
  const bx0 = x0 / mw, bx1 = (x1 + 1) / mw, by0 = y0 / mh, by1 = (y1 + 1) / mh, cx = sx / n / mw, bw = bx1 - bx0, hip = by0 + (by1 - by0) * .55;
  const sm = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const u = (gx + .5) / gw, v = (gy + .5) / gh, i = (gy * gw + gx) * 2; let ox = 0, oy = 0;
    if (o.slim) { const att = (1 - sm(bw * .6, bw * 1.1, Math.abs(u - cx))) * sm(by0 - .05, by0 + .1, v) * (1 - sm(by1, by1 + .05, v)); ox += (u - cx) * o.slim * .14 * att; }
    if (o.legs && v > hip) { const s2 = 1 + o.legs * .18; oy += (hip + (v - hip) / s2) - v; }
    F[i] = ox; F[i + 1] = oy;
  }
  return F;
}
