// On-device AI: background cutout, face landmarks and object removal. Nothing leaves the device.
const base = (p) => new URL('vendor/' + p, location.href).href;
// file names can be remapped (and split into parts) by vendor/files.json
const DEF = { vision: 'mediapipe/vision_bundle.mjs', visionLoader: 'mediapipe/wasm/vision_wasm_internal.js', visionWasm: ['mediapipe/wasm/vision_wasm_internal.wasm'],
  seg: ['models/selfie_segmenter.tflite'], multi: ['models/multiclass.tflite'], sr: ['models/realesr.onnx'], face: ['models/face_landmarker.task'], ort: 'ort/ort.wasm.min.mjs', ortMjs: 'ort/ort-wasm-simd-threaded.mjs', ortWasm: ['ort/ort-wasm-simd-threaded.wasm'], lama: ['models/lama.onnx'] };
let filesP = null;
const files = () => (filesP ||= fetch(base('files.json')).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => ({ ...DEF, ...m })));
async function bytes(parts, onProgress) {
  const bufs = []; let done = 0;
  for (const p of parts) { const r = await fetch(base(p)); if (!r.ok) throw new Error('Missing ' + p); const b = new Uint8Array(await r.arrayBuffer()); bufs.push(b); done++; onProgress && onProgress(done / parts.length); }
  if (bufs.length === 1) return bufs[0];
  const out = new Uint8Array(bufs.reduce((n, b) => n + b.length, 0)); let o = 0; for (const b of bufs) { out.set(b, o); o += b.length; } return out;
}
const blobURL = (b, type) => URL.createObjectURL(new Blob([b], { type }));
let visionP = null, segP = null, faceP = null, lamaP = null, ortP = null, multiP = null, srP = null;
const vision = () => (visionP ||= (async () => {
  const F = await files(), m = await import(base(F.vision));
  const fs = { wasmLoaderPath: base(F.visionLoader), wasmBinaryPath: blobURL(await bytes(F.visionWasm), 'application/wasm') };
  return { m, fs, F };
})().catch((e) => { visionP = null; throw e; }));

export async function cutoutMask(img) {
  segP ||= vision().then(async ({ m, fs, F }) => m.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetBuffer: await bytes(F.seg), delegate: 'CPU' }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true })).catch((e) => { segP = null; throw e; });
  const seg = await segP, k = Math.min(1, 1024 / Math.max(img.width, img.height)), c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const res = seg.segment(c), m = res.confidenceMasks[res.confidenceMasks.length - 1], f = m.getAsFloat32Array();
  const mc = document.createElement('canvas'); mc.width = m.width; mc.height = m.height; const mx = mc.getContext('2d'), id = mx.createImageData(m.width, m.height);
  for (let i = 0; i < f.length; i++) { const a = Math.max(0, Math.min(1, (f[i] - .25) / .5)) * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = a; id.data[i * 4 + 3] = 255; }
  mx.putImageData(id, 0, 0); res.confidenceMasks.forEach((q) => q.close && q.close());
  const full = document.createElement('canvas'); full.width = img.width; full.height = img.height; const fx = full.getContext('2d'); fx.filter = `blur(${Math.max(1, img.width / 800)}px)`; fx.drawImage(mc, 0, 0, img.width, img.height);
  return full;
}

// hair (and skin/clothes) from the multi-class model: returns { hair, skin } canvases at image size
export async function partsMask(img, onProgress) {
  multiP ||= vision().then(async ({ m, fs, F }) => m.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetBuffer: await bytes(F.multi, onProgress), delegate: 'CPU' }, runningMode: 'IMAGE', outputCategoryMask: false, outputConfidenceMasks: true })).catch((e) => { multiP = null; throw e; });
  const seg = await multiP, k = Math.min(1, 1024 / Math.max(img.width, img.height)), c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const res = seg.segment(c), out = {};
  for (const [name, idx] of [['hair', 1], ['skin', 2]]) {
    const m = res.confidenceMasks[idx]; if (!m) continue; const f = m.getAsFloat32Array();
    const mc = document.createElement('canvas'); mc.width = m.width; mc.height = m.height; const mx = mc.getContext('2d'), id = mx.createImageData(m.width, m.height);
    for (let i = 0; i < f.length; i++) { const a = Math.max(0, Math.min(1, (f[i] - .3) / .45)) * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = a; id.data[i * 4 + 3] = 255; }
    mx.putImageData(id, 0, 0);
    const full = document.createElement('canvas'); full.width = Math.min(img.width, 2048); full.height = Math.round(full.width * img.height / img.width); const fx = full.getContext('2d'); fx.filter = 'blur(1.5px)'; fx.drawImage(mc, 0, 0, full.width, full.height); out[name] = full;
  }
  res.confidenceMasks.forEach((q) => q.close && q.close());
  return out;
}

// 478 face points per face, in image pixels
export async function faces(img) {
  faceP ||= vision().then(async ({ m, fs, F }) => m.FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetBuffer: await bytes(F.face), delegate: 'CPU' }, runningMode: 'IMAGE', numFaces: 4 })).catch((e) => { faceP = null; throw e; });
  const fl = await faceP, k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const r = fl.detect(c);
  return (r.faceLandmarks || []).map((pts) => pts.map((p) => [p.x * img.width, p.y * img.height]));
}

// LaMa: fill the painted area so the object disappears
async function lama(onProgress) {
  const F = await files();
  ortP ||= (async () => { const ort = await import(base(F.ort)); ort.env.wasm.wasmPaths = { mjs: base(F.ortMjs), wasm: blobURL(await bytes(F.ortWasm), 'application/wasm') }; ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1; return ort; })().catch((e) => { ortP = null; throw e; });
  const ort = await ortP;
  lamaP ||= (async () => ort.InferenceSession.create(await bytes(F.lama, onProgress), { executionProviders: ['wasm'], graphOptimizationLevel: 'all', extra: { session: { disable_quant_qdq: '1' } } }))().catch((e) => { lamaP = null; throw e; });
  return { ort, s: await lamaP };
}
export const lamaReady = () => !!lamaP;
async function ortReady() { const F = await files(); ortP ||= (async () => { const ort = await import(base(F.ort)); ort.env.wasm.wasmPaths = { mjs: base(F.ortMjs), wasm: blobURL(await bytes(F.ortWasm), 'application/wasm') }; ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 2) : 1; return ort; })().catch((e) => { ortP = null; throw e; }); return { ort: await ortP, F }; }
// AI enhance: Real-ESRGAN, 4x, in tiles. scale = output size / input size (1..4)
export async function upscale(img, scale, onProgress) {
  const { ort, F } = await ortReady();
  srP ||= (async () => ort.InferenceSession.create(await bytes(F.sr), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' }))().catch((e) => { srP = null; throw e; });
  const s = await srP, W = img.width, H = img.height, T = 128, O = 10;
  const src = img.getContext ? img : (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(img, 0, 0); return c; })();
  const sd = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const out = document.createElement('canvas'); out.width = W * 4; out.height = H * 4; const ox = out.getContext('2d');
  const tiles = []; for (let y = 0; y < H; y += T) for (let x = 0; x < W; x += T) tiles.push([x, y]);
  let done = 0;
  for (const [tx, ty] of tiles) {
    const x0 = Math.max(0, tx - O), y0 = Math.max(0, ty - O), x1 = Math.min(W, tx + T + O), y1 = Math.min(H, ty + T + O), w = x1 - x0, h = y1 - y0, P = w * h, inp = new Float32Array(3 * P);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y0 + y) * W + x0 + x) * 4, j = y * w + x; inp[j] = sd[i] / 255; inp[P + j] = sd[i + 1] / 255; inp[2 * P + j] = sd[i + 2] / 255; }
    const r = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', inp, [1, 3, h, w]) }), o = r[s.outputNames[0]].data, W4 = w * 4, H4 = h * 4, P4 = W4 * H4;
    const cx = (tx - x0) * 4, cy = (ty - y0) * 4, cw = Math.min(T, W - tx) * 4, ch = Math.min(T, H - ty) * 4, id = ox.createImageData(cw, ch);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const j = (cy + y) * W4 + cx + x, k = (y * cw + x) * 4; id.data[k] = o[j] * 255; id.data[k + 1] = o[P4 + j] * 255; id.data[k + 2] = o[2 * P4 + j] * 255; id.data[k + 3] = 255; }
    ox.putImageData(id, tx * 4, ty * 4); done++; onProgress && onProgress(done / tiles.length); await new Promise((r2) => setTimeout(r2, 0));
  }
  if (scale >= 4) return out;
  const f = document.createElement('canvas'); f.width = Math.round(W * scale); f.height = Math.round(H * scale); const fx = f.getContext('2d'); fx.imageSmoothingQuality = 'high'; fx.drawImage(out, 0, 0, f.width, f.height); return f;
}
export async function erase(img, mask, onProgress) {
  // mask: canvas same size as img, white = remove
  const W = img.width, H = img.height, mx = mask.getContext('2d').getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (mx[(y * W + x) * 4] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < x0) return null;
  // a square around the painted area with plenty of context
  const bw = x1 - x0, bh = y1 - y0, side = Math.min(Math.max(W, H), Math.max(bw, bh) * 2.4 + 64);
  let sx = Math.round((x0 + x1) / 2 - side / 2), sy = Math.round((y0 + y1) / 2 - side / 2), sw = Math.round(Math.min(side, W)), sh = Math.round(Math.min(side, H));
  sx = Math.max(0, Math.min(W - sw, sx)); sy = Math.max(0, Math.min(H - sh, sy));
  const N = 512, a = document.createElement('canvas'); a.width = a.height = N; const ax = a.getContext('2d', { willReadFrequently: true }); ax.drawImage(img, sx, sy, sw, sh, 0, 0, N, N);
  const b = document.createElement('canvas'); b.width = b.height = N; const bx = b.getContext('2d', { willReadFrequently: true }); bx.drawImage(mask, sx, sy, sw, sh, 0, 0, N, N);
  const ip = ax.getImageData(0, 0, N, N).data, mp = bx.getImageData(0, 0, N, N).data, P = N * N;
  const imgT = new Float32Array(3 * P), mT = new Float32Array(P);
  for (let i = 0; i < P; i++) { imgT[i] = ip[i * 4] / 255; imgT[P + i] = ip[i * 4 + 1] / 255; imgT[2 * P + i] = ip[i * 4 + 2] / 255; mT[i] = mp[i * 4] > 0 ? 1 : 0; }
  const { ort, s } = await lama(onProgress);
  const out = await s.run({ image: new ort.Tensor('float32', imgT, [1, 3, N, N]), mask: new ort.Tensor('float32', mT, [1, 1, N, N]) });
  const o = out[s.outputNames[0]].data, od = ax.createImageData(N, N);
  for (let i = 0; i < P; i++) { od.data[i * 4] = o[i]; od.data[i * 4 + 1] = o[P + i]; od.data[i * 4 + 2] = o[2 * P + i]; od.data[i * 4 + 3] = 255; }
  ax.putImageData(od, 0, 0);
  // paste back only inside the (slightly grown, soft) painted area
  const res = document.createElement('canvas'); res.width = W; res.height = H; const rx = res.getContext('2d'); rx.drawImage(img, 0, 0);
  const patch = document.createElement('canvas'); patch.width = sw; patch.height = sh; const px = patch.getContext('2d');
  px.drawImage(a, 0, 0, N, N, 0, 0, sw, sh); px.globalCompositeOperation = 'destination-in';
  const soft = document.createElement('canvas'); soft.width = sw; soft.height = sh; const sx2 = soft.getContext('2d'); sx2.filter = `blur(${Math.max(2, sw / 180)}px)`;
  const grow = document.createElement('canvas'); grow.width = sw; grow.height = sh; const gx = grow.getContext('2d'); gx.filter = `blur(${Math.max(2, sw / 120)}px)`; gx.drawImage(mask, sx, sy, sw, sh, 0, 0, sw, sh);
  const gd = gx.getImageData(0, 0, sw, sh); for (let i = 0; i < gd.data.length; i += 4) { const v = gd.data[i] > 4 ? 255 : 0; gd.data[i + 3] = v; } gx.filter = 'none'; gx.putImageData(gd, 0, 0);
  sx2.drawImage(grow, 0, 0); px.drawImage(soft, 0, 0);
  rx.drawImage(patch, sx, sy);
  return res;
}
