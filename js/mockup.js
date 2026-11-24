// Product mockups drawn on the fly: your photo on a t-shirt, mug, wall poster, phone and tote bag.
export const MOCKUPS = [['poster', 'Wall poster'], ['tshirt', 'T-shirt'], ['mug', 'Mug'], ['phone', 'Phone'], ['tote', 'Tote bag'], ['canvas', 'Canvas print']];
const S = 1200;
function cover(x, img, X, Y, W, H) { const k = Math.max(W / img.width, H / img.height); x.drawImage(img, X + (W - img.width * k) / 2, Y + (H - img.height * k) / 2, img.width * k, img.height * k); }
function contain(img, W, H) { const k = Math.min(W / img.width, H / img.height); return [img.width * k, img.height * k]; }
function bg(x, a, b) { const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, S, S); }
function shadow(x, blur, oy, col = 'rgba(0,0,0,.35)') { x.shadowColor = col; x.shadowBlur = blur; x.shadowOffsetY = oy; }
export function renderMockup(kind, img, opt = {}) {
  const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  if (kind === 'poster' || kind === 'canvas') {
    bg(x, '#efe6dc', '#d9cbbb'); x.fillStyle = '#c9b8a5'; x.fillRect(0, S * .82, S, S * .18); x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(0, S * .82, S, 6);
    const [w, h] = contain(img, S * .5, S * .56), X = (S - w) / 2, Y = S * .42 - h / 2, fr = kind === 'poster' ? S * .022 : 0, mat = kind === 'poster' ? S * .03 : 0;
    x.save(); shadow(x, 40, 22); x.fillStyle = kind === 'poster' ? '#1b1416' : '#fff'; x.fillRect(X - fr - mat, Y - fr - mat, w + 2 * (fr + mat), h + 2 * (fr + mat)); x.restore();
    if (mat) { x.fillStyle = '#faf8f4'; x.fillRect(X - mat, Y - mat, w + mat * 2, h + mat * 2); }
    x.drawImage(img, X, Y, w, h);
    if (kind === 'canvas') { const g = x.createLinearGradient(X + w, 0, X + w + 14, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(X + w, Y, 14, h); }
    const gl = x.createLinearGradient(X, Y, X + w, Y + h); gl.addColorStop(0, 'rgba(255,255,255,.12)'); gl.addColorStop(.5, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(X, Y, w, h);
    // little plant for scale
    x.fillStyle = '#b86b4b'; x.beginPath(); x.moveTo(S * .8, S * .83); x.lineTo(S * .9, S * .83); x.lineTo(S * .885, S * .95); x.lineTo(S * .815, S * .95); x.fill();
    x.fillStyle = '#4f7a4a'; for (let i = 0; i < 7; i++) { x.save(); x.translate(S * .85, S * .83); x.rotate(-1.2 + i * .4); x.beginPath(); x.ellipse(0, -S * .07, S * .018, S * .075, 0, 0, 7); x.fill(); x.restore(); }
  } else if (kind === 'tshirt' || kind === 'tote') {
    bg(x, '#f3eef0', '#e2d8dc');
    const col = opt.color || (kind === 'tote' ? '#efe4d2' : '#ffffff'), dark = col === '#111111';
    x.save(); shadow(x, 50, 26, 'rgba(0,0,0,.25)'); x.fillStyle = col; x.beginPath();
    if (kind === 'tshirt') { x.moveTo(420, 170); x.quadraticCurveTo(600, 250, 780, 170); x.lineTo(1010, 280); x.lineTo(940, 470); x.lineTo(850, 430); x.lineTo(850, 1060); x.quadraticCurveTo(600, 1090, 350, 1060); x.lineTo(350, 430); x.lineTo(260, 470); x.lineTo(190, 280); x.closePath(); }
    else { x.rect(300, 380, 600, 680); }
    x.fill(); x.restore();
    if (kind === 'tote') { x.strokeStyle = col; x.lineWidth = 34; x.lineCap = 'round'; for (const sx of [420, 780]) { x.beginPath(); x.moveTo(sx - 40, 390); x.bezierCurveTo(sx - 40, 150, sx + 40, 150, sx + 40, 390); x.stroke(); } x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 3; x.strokeRect(300, 380, 600, 680); }
    else { x.fillStyle = 'rgba(0,0,0,.08)'; x.beginPath(); x.moveTo(470, 180); x.quadraticCurveTo(600, 240, 730, 180); x.quadraticCurveTo(600, 280, 470, 180); x.fill(); }
    const area = kind === 'tshirt' ? [450, 360, 300, 380] : [380, 520, 440, 440], [w, h] = contain(img, area[2], area[3]);
    x.save(); x.globalCompositeOperation = dark ? 'screen' : 'multiply'; x.drawImage(img, area[0] + (area[2] - w) / 2, area[1] + (area[3] - h) / 2, w, h); x.restore();
    // fabric folds
    const g = x.createLinearGradient(300, 0, 900, 0); g.addColorStop(0, 'rgba(0,0,0,.08)'); g.addColorStop(.3, 'rgba(255,255,255,.05)'); g.addColorStop(.7, 'rgba(0,0,0,.04)'); g.addColorStop(1, 'rgba(0,0,0,.1)');
    x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = g; x.fillRect(0, 0, S, S); x.restore();
  } else if (kind === 'mug') {
    bg(x, '#f6efe9', '#e4d6cc'); x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.ellipse(600, 960, 330, 50, 0, 0, 7); x.fill();
    const X = 330, Y = 330, W = 480, H = 600;
    x.strokeStyle = '#f4f1ee'; x.lineWidth = 60; x.beginPath(); x.ellipse(X + W + 20, Y + H * .45, 110, 170, 0, -1.4, 1.4); x.stroke();
    x.fillStyle = '#f7f5f2'; x.beginPath(); x.ellipse(X + W / 2, Y + H, W / 2, 46, 0, 0, Math.PI); x.lineTo(X, Y); x.lineTo(X + W, Y); x.fill(); x.fillRect(X, Y, W, H);
    // wrap the picture around the cylinder
    const [iw, ih] = contain(img, W * 1.2, H * .62), y0 = Y + H * .2, strips = 120;
    for (let i = 0; i < strips; i++) { const a0 = -1 + 2 * i / strips, a1 = -1 + 2 * (i + 1) / strips, sx0 = X + W / 2 + Math.sin(a0 * 1.1) / Math.sin(1.1) * W / 2, sx1 = X + W / 2 + Math.sin(a1 * 1.1) / Math.sin(1.1) * W / 2, u0 = (a0 + 1) / 2 * img.width; x.drawImage(img, u0, 0, img.width / strips, img.height, sx0, y0 + (H * .62 - ih) / 2, sx1 - sx0 + .6, ih); }
    const g = x.createLinearGradient(X, 0, X + W, 0); g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(.25, 'rgba(255,255,255,.18)'); g.addColorStop(.4, 'rgba(255,255,255,0)'); g.addColorStop(.8, 'rgba(0,0,0,.08)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
    x.fillStyle = g; x.fillRect(X, Y, W, H); x.fillStyle = '#e9e4df'; x.beginPath(); x.ellipse(X + W / 2, Y, W / 2, 46, 0, 0, 7); x.fill(); x.fillStyle = '#5a3b2a'; x.beginPath(); x.ellipse(X + W / 2, Y + 6, W / 2 - 18, 34, 0, 0, 7); x.fill();
  } else if (kind === 'phone') {
    bg(x, '#2a1f23', '#120c0e');
    const W = 430, H = 880, X = (S - W) / 2, Y = (S - H) / 2, r = 70;
    x.save(); shadow(x, 70, 30, 'rgba(0,0,0,.6)'); x.fillStyle = '#0c0a0b'; x.beginPath(); x.roundRect ? x.roundRect(X, Y, W, H, r) : x.rect(X, Y, W, H); x.fill(); x.restore();
    x.strokeStyle = '#3a3034'; x.lineWidth = 4; x.beginPath(); x.roundRect ? x.roundRect(X, Y, W, H, r) : x.rect(X, Y, W, H); x.stroke();
    x.save(); x.beginPath(); x.roundRect ? x.roundRect(X + 18, Y + 18, W - 36, H - 36, r - 18) : x.rect(X + 18, Y + 18, W - 36, H - 36); x.clip(); cover(x, img, X + 18, Y + 18, W - 36, H - 36);
    const g = x.createLinearGradient(X, Y, X + W, Y + H); g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(X, Y, W, H); x.restore();
    x.fillStyle = '#0c0a0b'; x.beginPath(); x.roundRect ? x.roundRect(S / 2 - 60, Y + 34, 120, 34, 17) : x.rect(S / 2 - 60, Y + 34, 120, 34); x.fill();
  }
  return c;
}
