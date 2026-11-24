// Opening iPhone HEIC and camera RAW files, and keeping camera info (EXIF) on export.
const vendor = (p) => new URL('vendor/' + p, location.href).href;
const isHeic = (f) => /\.(heic|heif)$/i.test(f.name || '') || /image\/hei[cf]/.test(f.type);
const isRaw = (f) => /\.(cr2|cr3|nef|arw|dng|raf|orf|rw2|pef|srw)$/i.test(f.name || '');
let heicP = null;
function loadHeicLib() { return (heicP ||= new Promise((res, rej) => { const s = document.createElement('script'); s.src = vendor('heic2any.min.js'); s.onload = () => res(window.heic2any); s.onerror = () => { heicP = null; rej(new Error('HEIC reader missing')); }; document.head.appendChild(s); })); }
// RAW files carry a full-size JPEG preview inside; take the biggest one
async function rawPreview(f) {
  const b = new Uint8Array(await f.arrayBuffer()); let best = null;
  for (let i = 0; i < b.length - 3; i++) {
    if (b[i] === 0xFF && b[i + 1] === 0xD8 && b[i + 2] === 0xFF) {
      let j = i + 2;
      // walk JPEG markers to find its end
      while (j < b.length - 1) {
        if (b[j] !== 0xFF) { j++; continue; } const m = b[j + 1];
        if (m === 0xD9) { j += 2; break; }
        if (m === 0xDA) { j += 2; while (j < b.length - 1 && !(b[j] === 0xFF && b[j + 1] === 0xD9)) j++; j += 2; break; }
        if (m === 0xFF) { j++; continue; } if ((m >= 0xD0 && m <= 0xD7) || m === 0x01) { j += 2; continue; }
        j += 2 + ((b[j + 2] << 8) | b[j + 3]);
      }
      if (!best || j - i > best[1] - best[0]) best = [i, j]; i = j - 1;
      if (best && best[1] - best[0] > 1e6 && b.length - j < 1e5) break;
    }
  }
  if (!best || best[1] - best[0] < 20000) throw new Error('No preview in this RAW file');
  return new Blob([b.slice(best[0], best[1])], { type: 'image/jpeg' });
}
// turn any supported file into something the browser can draw
export async function toDrawable(f) {
  if (isHeic(f)) { const h = await loadHeicLib(); const out = await h({ blob: f, toType: 'image/jpeg', quality: .95 }); return Array.isArray(out) ? out[0] : out; }
  if (isRaw(f)) return rawPreview(f);
  return f;
}
export const ACCEPT = 'image/*,.heic,.heif,.dng,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2';

// ---- EXIF: copy camera info from the original JPEG into the export ----
export async function getExif(blob) {
  if (!blob || !/jpe?g/i.test(blob.type || '')) return null;
  const b = new Uint8Array(await blob.slice(0, 256 * 1024).arrayBuffer()); if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i < b.length - 4) {
    if (b[i] !== 0xFF) return null; const m = b[i + 1], len = (b[i + 2] << 8) | b[i + 3];
    if (m === 0xE1 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66) return b.slice(i, i + 2 + len);
    if (m === 0xDA) return null; i += 2 + len;
  }
  return null;
}
// set orientation to normal (the pixels are already upright) and optionally wipe the GPS block
function patchExif(seg, dropGps) {
  const s = seg.slice(), t = 10, le = s[t] === 0x49; const u16 = (o) => (le ? s[o] | (s[o + 1] << 8) : (s[o] << 8) | s[o + 1]); const u32 = (o) => (le ? (s[o] | (s[o + 1] << 8) | (s[o + 2] << 16) | (s[o + 3] << 24)) >>> 0 : ((s[o] << 24) | (s[o + 1] << 16) | (s[o + 2] << 8) | s[o + 3]) >>> 0);
  const w16 = (o, v) => { if (le) { s[o] = v & 255; s[o + 1] = v >> 8; } else { s[o] = v >> 8; s[o + 1] = v & 255; } };
  try {
    const ifd = t + u32(t + 4), n = u16(ifd);
    for (let k = 0; k < n; k++) {
      const e = ifd + 2 + k * 12, tag = u16(e);
      if (tag === 0x0112) w16(e + 8, 1);
      if (tag === 0x8825 && dropGps) { const g = t + u32(e + 8), gn = u16(g); s.fill(0, g + 2, Math.min(s.length, g + 2 + gn * 12)); w16(g, 0); }
    }
  } catch (e) { /* keep what we have */ }
  return s;
}
export async function withExif(jpegBlob, exif, dropGps) {
  if (!exif) return jpegBlob; const b = new Uint8Array(await jpegBlob.arrayBuffer());
  // skip the encoder's own APP0/APP1 and put ours right after the start marker
  let i = 2; while (b[i] === 0xFF && (b[i + 1] === 0xE0 || b[i + 1] === 0xE1)) i += 2 + ((b[i + 2] << 8) | b[i + 3]);
  return new Blob([b.slice(0, 2), patchExif(exif, dropGps), b.slice(i)], { type: 'image/jpeg' });
}
