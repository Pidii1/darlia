// Edge-aware mask clean-up (guided filter): makes hair and fine edges follow the photo.
function box(src, w, h, r) {
  // running sums, rows then columns
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let s = 0; const o = y * w; for (let x = -r; x <= r; x++) s += src[o + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { tmp[o + x] = s; s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { out[y * w + x] = s; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; } }
  const n = (2 * r + 1) ** 2; for (let i = 0; i < out.length; i++) out[i] /= n; return out;
}
// mask, guide: canvases. Returns a new canvas the size of the mask (at most `lim` px)
export function refineMask(mask, guide, { lim = 1024, r = 0, eps = .0008, sharpen = 1.3 } = {}) {
  const k = Math.min(1, lim / Math.max(mask.width, mask.height)), w = Math.max(2, Math.round(mask.width * k)), h = Math.max(2, Math.round(mask.height * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(guide, 0, 0, w, h); const g = x.getImageData(0, 0, w, h).data; x.clearRect(0, 0, w, h); x.drawImage(mask, 0, 0, w, h); const m = x.getImageData(0, 0, w, h);
  const I = new Float32Array(w * h), p = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { I[i] = (g[i * 4] * .3 + g[i * 4 + 1] * .59 + g[i * 4 + 2] * .11) / 255; p[i] = m.data[i * 4] / 255; }
  const R = r || Math.max(2, Math.round(Math.max(w, h) / 160)), II = I.map((v) => v * v), Ip = I.map((v, i) => v * p[i]);
  const mI = box(I, w, h, R), mp = box(p, w, h, R), mII = box(II, w, h, R), mIp = box(Ip, w, h, R), a = new Float32Array(w * h), b = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { const v = mII[i] - mI[i] * mI[i], cv = mIp[i] - mI[i] * mp[i]; a[i] = cv / (v + eps); b[i] = mp[i] - a[i] * mI[i]; }
  const ma = box(a, w, h, R), mb = box(b, w, h, R);
  for (let i = 0; i < w * h; i++) { let q = ma[i] * I[i] + mb[i]; q = (q - .5) * sharpen + .5; const v = Math.max(0, Math.min(1, q)) * 255; m.data[i * 4] = m.data[i * 4 + 1] = m.data[i * 4 + 2] = v; m.data[i * 4 + 3] = 255; }
  x.putImageData(m, 0, 0); return c;
}
// sky: smooth, bright or blue areas joined to the top edge, then edge-aware clean-up
export function skyMask(img, outW, outH) {
  const k = 256 / Math.max(img.width, img.height), w = Math.max(2, img.width * k | 0), h = Math.max(2, img.height * k | 0);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data;
  const L = new Float32Array(w * h); for (let i = 0; i < w * h; i++) L[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255;
  // local texture: sky is smooth
  const mL = box(L, w, h, 2), mLL = box(L.map((v) => v * v), w, h, 2), ok = new Uint8Array(w * h), m = new Uint8Array(w * h), q = [];
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, bl = d[i * 4 + 2] / 255, mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), tex = Math.sqrt(Math.max(0, mLL[i] - mL[i] * mL[i])), y = (i / w) | 0;
    const blue = bl > r + .02 && bl >= g - .05 && L[i] > .25, white = L[i] > .72 && mx - mn < .2, warm = L[i] > .45 && r > bl && (mx - mn) < .45 && y < h * .6;
    ok[i] = (blue || white || warm) && tex < .05 ? 1 : 0;
  }
  for (let xx = 0; xx < w; xx++) if (ok[xx]) { m[xx] = 1; q.push(xx); }
  const diff = (a, b2) => Math.abs(d[a * 4] - d[b2 * 4]) + Math.abs(d[a * 4 + 1] - d[b2 * 4 + 1]) + Math.abs(d[a * 4 + 2] - d[b2 * 4 + 2]);
  while (q.length) { const i = q.pop(), px = i % w, py = (i / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const j = ny * w + nx; if (!m[j] && ok[j] && diff(i, j) < 48) { m[j] = 1; q.push(j); } } }
  // fill small holes (birds, wires)
  const mm = box(Float32Array.from(m), w, h, 2); const id = x.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = (m[i] || mm[i] > .7 ? 1 : 0) * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; } x.putImageData(id, 0, 0);
  const ref = refineMask(c, img, { lim: 768, r: 3, eps: .002, sharpen: 1.6 });
  const o = document.createElement('canvas'); o.width = outW; o.height = outH; const ox = o.getContext('2d'); ox.filter = `blur(${Math.max(1, outW / 500)}px)`; ox.drawImage(ref, 0, 0, outW, outH); return o;
}
