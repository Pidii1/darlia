// Document scan: find the paper, straighten it to a flat page and clean the background.
function small(src, n) { const k = n / Math.max(src.width, src.height), c = document.createElement('canvas'); c.width = Math.max(1, src.width * k | 0); c.height = Math.max(1, src.height * k | 0); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c; }
// corners as [x,y] in 0..1, order: top-left, top-right, bottom-right, bottom-left
export function detectQuad(src) {
  const c = small(src, 256), W = c.width, H = c.height, d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data, L = new Uint8Array(W * H), hist = new Float64Array(256);
  // paper is bright and has little colour; smooth a little so text does not split the page
  const raw = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) { const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); raw[i] = Math.max(0, r * .3 + g * .59 + b * .11 - (mx - mn) * .7); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s2 = 0, n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; s2 += raw[yy * W + xx]; n++; } L[y * W + x] = Math.min(255, s2 / n); hist[L[y * W + x]]++; }
  // Otsu threshold
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i]; let sB = 0, wB = 0, best = 0, th = 128;
  for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = W * H - wB; if (!wF) break; sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; th = t; } }
  // biggest bright blob
  const lab = new Int32Array(W * H).fill(-1); let bestId = -1, bestN = 0;
  for (let s = 0; s < W * H; s++) {
    if (lab[s] !== -1 || L[s] <= th) continue; const q = [s]; lab[s] = s; let n = 0;
    while (q.length) { const i = q.pop(); n++; const x = i % W, y = (i / W) | 0; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && lab[j] === -1 && L[j] > th) { lab[j] = s; q.push(j); } }
    if (n > bestN) { bestN = n; bestId = s; }
  }
  if (bestN < W * H * .08) return [[.08, .08], [.92, .08], [.92, .92], [.08, .92]];
  let tl = [0, 0, 1e9], tr = [0, 0, -1e9], br = [0, 0, -1e9], bl = [0, 0, -1e9];
  for (let i = 0; i < W * H; i++) { if (lab[i] !== bestId) continue; const x = i % W, y = (i / W) | 0; if (x + y < tl[2]) tl = [x, y, x + y]; if (x - y > tr[2]) tr = [x, y, x - y]; if (x + y > br[2]) br = [x, y, x + y]; if (y - x > bl[2]) bl = [x, y, y - x]; }
  return [tl, tr, br, bl].map(([x, y]) => [(x + .5) / W, (y + .5) / H]);
}
// solve the 3x3 mapping from the output rectangle to the four corners
function homography(src, dst) {
  const A = [], B = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
  for (let i = 0; i < 8; i++) { let p = i; for (let r = i + 1; r < 8; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [B[i], B[p]] = [B[p], B[i]]; for (let r = 0; r < 8; r++) { if (r === i) continue; const f = A[r][i] / A[i][i]; for (let c = i; c < 8; c++) A[r][c] -= f * A[i][c]; B[r] -= f * B[i]; } }
  return B.map((b, i) => b / A[i][i]).concat(1);
}
export function warpQuad(img, quad) {
  const W = img.width, H = img.height, P = quad.map(([x, y]) => [x * W, y * H]), dd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  let ow = Math.max(dd(P[0], P[1]), dd(P[3], P[2])), oh = Math.max(dd(P[0], P[3]), dd(P[1], P[2])); const k = Math.min(1, 3000 / Math.max(ow, oh)); ow = Math.round(ow * k); oh = Math.round(oh * k);
  const h = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], P);
  const sd = img.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data, out = document.createElement('canvas'); out.width = ow; out.height = oh;
  const ox = out.getContext('2d'), od = ox.createImageData(ow, oh), o = od.data;
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const z = h[6] * x + h[7] * y + 1, u = (h[0] * x + h[1] * y + h[2]) / z, v = (h[3] * x + h[4] * y + h[5]) / z;
    const x0 = Math.max(0, Math.min(W - 2, u | 0)), y0 = Math.max(0, Math.min(H - 2, v | 0)), fx = Math.max(0, Math.min(1, u - x0)), fy = Math.max(0, Math.min(1, v - y0)), i = (y0 * W + x0) * 4, j = (y * ow + x) * 4;
    for (let c = 0; c < 3; c++) o[j + c] = (sd[i + c] * (1 - fx) + sd[i + 4 + c] * fx) * (1 - fy) + (sd[i + W * 4 + c] * (1 - fx) + sd[i + W * 4 + 4 + c] * fx) * fy;
    o[j + 3] = 255;
  }
  ox.putImageData(od, 0, 0); return out;
}
// even out shadows and make the paper white; mode 'color' or 'bw'
export function cleanPage(c, mode) {
  const W = c.width, H = c.height, bg = document.createElement('canvas'); bg.width = W; bg.height = H; const bx = bg.getContext('2d', { willReadFrequently: true });
  bx.filter = `blur(${Math.max(8, Math.min(W, H) / 25)}px)`; bx.drawImage(c, 0, 0);
  const x = c.getContext('2d', { willReadFrequently: true }), d = x.getImageData(0, 0, W, H), b = bx.getImageData(0, 0, W, H).data, p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    let r = Math.min(255, p[i] / Math.max(30, b[i]) * 240), g = Math.min(255, p[i + 1] / Math.max(30, b[i + 1]) * 240), bl = Math.min(255, p[i + 2] / Math.max(30, b[i + 2]) * 240);
    if (mode === 'bw') { const l = r * .3 + g * .59 + bl * .11, v = l > 170 ? 255 : Math.max(0, (l - 60) * 1.6); r = g = bl = v; }
    else { const f = (v) => Math.max(0, Math.min(255, (v - 128) * 1.25 + 140)); r = f(r); g = f(g); bl = f(bl); }
    p[i] = r; p[i + 1] = g; p[i + 2] = bl;
  }
  x.putImageData(d, 0, 0); return c;
}
