// Tone curves: points per channel -> one 256x1 lookup (r, g, b, and master in alpha).
export const blankCurve = () => ({ m: [[0, 0], [1, 1]], r: [[0, 0], [1, 1]], g: [[0, 0], [1, 1]], b: [[0, 0], [1, 1]] });
export const isFlat = (c) => !c || ['m', 'r', 'g', 'b'].every((k) => c[k].length === 2 && c[k][0][0] === 0 && c[k][0][1] === 0 && c[k][1][0] === 1 && c[k][1][1] === 1);
// smooth curve through the points that never overshoots (monotone cubic)
export function evalCurve(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0]), n = p.length, out = new Float32Array(256);
  const dx = [], m = [], s = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = Math.max(1e-6, p[i + 1][0] - p[i][0]); s[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
  m[0] = s[0]; m[n - 1] = s[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = s[i - 1] * s[i] <= 0 ? 0 : (s[i - 1] + s[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (s[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / s[i], b = m[i + 1] / s[i], h = a * a + b * b; if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * s[i]; m[i + 1] = t * b * s[i]; } }
  for (let k = 0; k < 256; k++) {
    const x = k / 255; let i = 0; while (i < n - 2 && x > p[i + 1][0]) i++;
    let y;
    if (x <= p[0][0]) y = p[0][1]; else if (x >= p[n - 1][0]) y = p[n - 1][1];
    else { const h = dx[i], t = (x - p[i][0]) / h, t2 = t * t, t3 = t2 * t; y = (2 * t3 - 3 * t2 + 1) * p[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * p[i + 1][1] + (t3 - t2) * h * m[i + 1]; }
    out[k] = Math.max(0, Math.min(1, y));
  }
  return out;
}
export function curveLUT(c) {
  const L = new Uint8Array(256 * 4), ch = ['r', 'g', 'b', 'm'].map((k) => evalCurve(c[k]));
  for (let i = 0; i < 256; i++) for (let j = 0; j < 4; j++) L[i * 4 + j] = Math.round(ch[j][i] * 255);
  return L;
}
export const CURVE_PRESETS = [
  ['Soft S', { m: [[0, 0], [.25, .2], [.75, .8], [1, 1]] }], ['Strong S', { m: [[0, 0], [.25, .15], [.75, .87], [1, 1]] }],
  ['Matte', { m: [[0, .1], [.3, .3], [.75, .78], [1, .95]] }], ['Bright', { m: [[0, 0], [.4, .5], [1, 1]] }], ['Cross', { r: [[0, 0], [.3, .25], [.7, .78], [1, 1]], g: [[0, 0], [.3, .28], [.7, .76], [1, 1]], b: [[0, .12], [1, .86]] }],
];
const COL = { m: '#ffffff', r: '#ff4d6d', g: '#4ade80', b: '#60a5fa' };
// interactive editor; calls onChange while dragging and onDone after
export function curveEditor(host, curve, ch, onChange, onDone) {
  host.innerHTML = '<canvas class="cv-curve"></canvas>'; const cv = host.firstChild, dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { const w = host.clientWidth || 300; cv.width = w * dpr; cv.height = w * dpr; cv.style.height = w + 'px'; };
  const draw = () => {
    const x = cv.getContext('2d'), W = cv.width, H = cv.height; x.clearRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 1; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(i * W / 4, 0); x.lineTo(i * W / 4, H); x.moveTo(0, i * H / 4); x.lineTo(W, i * H / 4); x.stroke(); }
    x.beginPath(); x.moveTo(0, H); x.lineTo(W, 0); x.strokeStyle = 'rgba(255,255,255,.12)'; x.stroke();
    for (const k of ['r', 'g', 'b', 'm']) { if (k !== ch && (curve[k].length === 2)) continue; const y = evalCurve(curve[k]); x.beginPath(); for (let i = 0; i < 256; i++) { const px = i / 255 * W, py = (1 - y[i]) * H; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.strokeStyle = k === ch ? COL[k] : COL[k] + '55'; x.lineWidth = (k === ch ? 2.2 : 1.2) * dpr; x.stroke(); }
    for (const [px, py] of curve[ch]) { x.beginPath(); x.arc(px * W, (1 - py) * H, 6 * dpr, 0, 7); x.fillStyle = '#120a0c'; x.fill(); x.lineWidth = 2 * dpr; x.strokeStyle = COL[ch]; x.stroke(); }
  };
  size(); draw();
  let drag = -1;
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))]; };
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); cv.setPointerCapture(e.pointerId); const [x, y] = pos(e), P = curve[ch];
    let best = -1, bd = .06; P.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = i; } });
    if (best < 0 && P.length < 12) { P.push([x, y]); P.sort((a, b) => a[0] - b[0]); best = P.findIndex((p) => p[0] === x); }
    drag = best; draw(); onChange();
  });
  cv.addEventListener('pointermove', (e) => {
    if (drag < 0) return; const [x, y] = pos(e), P = curve[ch], first = drag === 0, last = drag === P.length - 1;
    const lo = first ? 0 : P[drag - 1][0] + .02, hi = last ? 1 : P[drag + 1][0] - .02;
    P[drag] = [first && P.length > 1 && !last ? Math.min(x, hi) : last ? Math.max(x, lo) : Math.max(lo, Math.min(hi, x)), y];
    draw(); onChange();
  });
  const up = (e) => {
    if (drag < 0) return; const P = curve[ch], r = cv.getBoundingClientRect();
    // drag a middle point off the box to remove it
    if (drag > 0 && drag < P.length - 1 && (e.clientY < r.top - 20 || e.clientY > r.bottom + 20 || e.clientX < r.left - 20 || e.clientX > r.right + 20)) P.splice(drag, 1);
    drag = -1; draw(); onDone();
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('dblclick', (e) => { const [x, y] = pos(e), P = curve[ch], i = P.findIndex((p, j) => j > 0 && j < P.length - 1 && Math.hypot(p[0] - x, p[1] - y) < .06); if (i > 0) { P.splice(i, 1); draw(); onDone(); } });
  return { draw };
}
