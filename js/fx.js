// Film overlays: light leaks, dust, scratches and a date stamp. Seeded so preview and export match.
export const LEAKS = [['warm', 'Warm', ['#ff7a18', '#ffcf5a']], ['rose', 'Rose', ['#ff2d6f', '#ff9ac0']], ['sun', 'Sun', ['#ffd34d', '#fff3c4']], ['cool', 'Cool', ['#3aa0ff', '#b48cff']]];
export const TEXTURES = [['none', 'None'], ['paper', 'Paper'], ['fabric', 'Fabric'], ['bokeh', 'Bokeh'], ['sparkle', 'Sparkle']];
export const blankFx = () => ({ texture: 'none', texAmt: .5, leak: 0, leakType: 'warm', leakPos: 0, dust: 0, scratch: 0, date: false, dateFmt: 'ymd', dateText: '', dateColor: '#ff8a1f' });
export const fxOn = (f) => f && (f.leak > 0 || f.dust > 0 || f.scratch > 0 || f.date || (f.texture && f.texture !== 'none' && f.texAmt > 0));
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
export function dateString(f) {
  if (f.dateText) return f.dateText;
  const d = new Date(), y = String(d.getFullYear()).slice(2), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return f.dateFmt === 'dmy' ? `${dd} ${m} ${y}` : f.dateFmt === 'mdy' ? `${m} ${dd} ${y}` : `${y} ${m} ${dd}`;
}
// layer 'screen' = lights (blend with screen), 'normal' = dark specks and the date
export function paintFx(x, W, H, f, seed, layer) {
  if (!fxOn(f)) return; const m = Math.min(W, H), R = rng(seed * 7919 + 13);
  x.save();
  const T = f.texture, ta = f.texAmt ?? .5;
  if (layer === 'multiply') {
    if (T === 'paper') {
      x.fillStyle = '#ecdcc4'; x.globalAlpha = ta * .8; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 2600 * ta; i++) { x.globalAlpha = (.08 + R() * .12) * (.5 + ta); x.fillStyle = R() > .5 ? '#8f7f69' : '#c9b89f'; x.fillRect(R() * W, R() * H, m * .003 * (1 + R()), m * .003 * (1 + R())); }
      x.strokeStyle = '#9d8f7b'; for (let i = 0; i < 120 * ta; i++) { x.globalAlpha = .06 + R() * .06; x.lineWidth = m * .0008; const px = R() * W, py = R() * H, l = m * (.01 + R() * .03), a = R() * 6.28; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
      const g = x.createRadialGradient(W / 2, H / 2, m * .3, W / 2, H / 2, Math.max(W, H) * .75); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(130,100,70,.7)'); x.globalAlpha = ta; x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    if (T === 'fabric') {
      const st = Math.max(2, m * .006); x.globalAlpha = ta * .35; x.fillStyle = '#7d7268';
      for (let y = 0; y < H; y += st * 2) x.fillRect(0, y, W, st * .6);
      for (let xx = 0; xx < W; xx += st * 2) x.fillRect(xx, 0, st * .6, H);
      x.globalAlpha = ta * .15; for (let i = 0; i < 900 * ta; i++) { x.fillStyle = R() > .5 ? '#5f554c' : '#ffffff'; x.fillRect(R() * W, R() * H, st, st); }
    }
  }
  if (layer === 'screen' && T === 'bokeh') { const cols = ['#ffd38a', '#ff9ac0', '#ffffff', '#a8d4ff']; for (let i = 0; i < 26; i++) { const r = m * (.02 + R() * .07), cx = R() * W, cy = R() * H, g = x.createRadialGradient(cx, cy, r * .6, cx, cy, r); const c = cols[(R() * 4) | 0]; g.addColorStop(0, c); g.addColorStop(.85, c); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = (.15 + R() * .3) * ta * 1.6; x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } x.globalAlpha = 1; }
  if (layer === 'screen' && T === 'sparkle') { x.fillStyle = '#fff'; for (let i = 0; i < 60 * ta + 8; i++) { const cx = R() * W, cy = R() * H, r = m * (.006 + R() * .025); x.globalAlpha = .5 + R() * .5; x.save(); x.translate(cx, cy); x.shadowColor = '#fff'; x.shadowBlur = r; x.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * .18 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.fill(); x.restore(); } x.globalAlpha = 1; }
  if (layer === 'screen') {
    if (f.leak > 0) {
      const [, , cols] = LEAKS.find((l) => l[0] === f.leakType) || LEAKS[0], pos = [[0, .2], [1, .1], [0, 1], [1, .9]][f.leakPos % 4];
      const cx = pos[0] * W, cy = pos[1] * H, r = Math.max(W, H) * (.55 + f.leak * .35);
      let g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, cols[1]); g.addColorStop(.25, cols[0]); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = .35 + f.leak * .6; x.fillStyle = g; x.fillRect(0, 0, W, H);
      const cx2 = cx + (pos[0] ? -1 : 1) * W * .25, g2 = x.createRadialGradient(cx2, cy, 0, cx2, cy, r * .5); g2.addColorStop(0, cols[0]); g2.addColorStop(1, 'rgba(0,0,0,0)');
      x.globalAlpha = f.leak * .45; x.fillStyle = g2; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    }
    if (f.dust > 0) { const n = Math.round(f.dust * 260); x.fillStyle = '#fff'; for (let i = 0; i < n; i++) { x.globalAlpha = .25 + R() * .5; x.beginPath(); x.arc(R() * W, R() * H, m * (.0006 + R() * .0022), 0, 7); x.fill(); } x.globalAlpha = 1; }
    if (f.scratch > 0) {
      const n = Math.round(f.scratch * 10); x.strokeStyle = '#fff'; x.lineCap = 'round';
      for (let i = 0; i < n; i++) { const sx = R() * W, y0 = R() * H * .5, y1 = y0 + H * (.3 + R() * .7); x.globalAlpha = .18 + R() * .35; x.lineWidth = m * (.0008 + R() * .0012); x.beginPath(); x.moveTo(sx, y0); x.bezierCurveTo(sx + (R() - .5) * m * .02, y0 + (y1 - y0) / 3, sx + (R() - .5) * m * .02, y0 + (y1 - y0) * 2 / 3, sx + (R() - .5) * m * .01, y1); x.stroke(); }
      x.globalAlpha = 1;
    }
  } else if (layer === 'normal') {
    if (f.dust > 0) {
      const n = Math.round(f.dust * 180); x.fillStyle = '#000'; x.strokeStyle = '#000'; x.lineCap = 'round';
      for (let i = 0; i < n; i++) { x.globalAlpha = .2 + R() * .45; x.beginPath(); x.arc(R() * W, R() * H, m * (.0006 + R() * .002), 0, 7); x.fill(); }
      for (let i = 0; i < Math.round(f.dust * 7); i++) { const hx = R() * W, hy = R() * H, l = m * (.02 + R() * .04); x.globalAlpha = .3 + R() * .3; x.lineWidth = m * .0012; x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo(hx + (R() - .5) * l, hy + (R() - .5) * l, hx + (R() - .5) * l * 1.5, hy + (R() - .5) * l * 1.5); x.stroke(); }
      x.globalAlpha = 1;
    }
    if (f.date) {
      const s = m * .05, t = dateString(f); x.font = `italic 700 ${s}px DSEG7, "Courier New", monospace`; x.textAlign = 'right'; x.textBaseline = 'alphabetic';
      const px = W - m * .06, py = H - m * .06; x.shadowColor = f.dateColor; x.shadowBlur = s * .5; x.fillStyle = f.dateColor; x.globalAlpha = .9; x.fillText(t, px, py); x.shadowBlur = s * .15; x.fillText(t, px, py);
    }
  }
  x.restore();
}
