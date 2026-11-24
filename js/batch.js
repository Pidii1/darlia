// Batch edit: one look on many photos, saved together.
import { Engine } from './engine.js';
import { LOOKS } from './looks.js';
import { $, $$, esc, ic, toast, slider, paintSlider, pickFiles, loadImage, toBlob, saveFiles } from './ui.js';
import { blankCurve, isFlat, curveLUT } from './curves.js';

const base = () => ({ adj: {}, lookId: 'none', look: {}, lookAmt: 1, hsl: { h: Array(8).fill(0), s: Array(8).fill(0), l: Array(8).fill(0) }, curve: blankCurve(), geo: { crop: { x: 0, y: 0, w: 1, h: 1 }, rot90: 0, flipH: false, flipV: false, straighten: 0 }, bg: {}, seed: 7 });
export function openBatch({ back, myLooks }) {
  const B = { files: [], thumbs: [], pick: 'vivid', amt: 1, size: 2048, running: false };
  const mine = myLooks(), all = [...mine.map((m) => ({ id: 'my:' + m.id, name: m.name, r: m.r })), ...LOOKS.filter((l) => l.id !== 'none').map((l) => ({ id: l.id, name: l.name, r: { look: l.look, lookId: l.id } }))];
  const stateFor = (id, amt) => { const L = all.find((x) => x.id === id) || all[0], s = { ...base(), ...JSON.parse(JSON.stringify(L.r)) }; if (!id.startsWith('my:')) s.lookAmt = amt; return s; };
  const app = $('#app');
  app.innerHTML = `<section class="ed">
    <header class="top"><button class="ib" id="bback" title="Home">${ic('back')}</button><span class="name">Batch edit</span><div class="tr"><button class="btn primary sm" id="bgo" disabled>${ic('download')}<span>Save all</span></button></div></header>
    <div class="body"><div class="stage bstage" id="bstage"><div class="bgrid" id="bgrid"></div><div class="empty" id="bempty"><button class="btn primary big" id="badd0">${ic('stack')}<span>Pick photos</span></button><p class="muted small">Use one look on many photos at once.</p></div></div>
      <aside class="side"><div class="panel" id="bpanel"></div></aside></div></section>`;
  $('#bback').onclick = back;
  const E = new Engine();
  function renderThumbs() {
    $('#bempty').hidden = B.files.length > 0; $('#bgo').disabled = !B.files.length || B.running;
    $('#bgrid').innerHTML = B.thumbs.map((t, i) => `<figure><img data-bi="${i}" alt=""><button class="bx" data-bdel="${i}" title="Remove">${ic('x')}</button></figure>`).join('');
    const s = stateFor(B.pick, B.amt); E.setCurve(isFlat(s.curve) ? null : curveLUT(s.curve));
    B.thumbs.forEach((t, i) => { E.setImage(t); E.render(s, t.width, t.height); $(`[data-bi="${i}"]`).src = E.cv.toDataURL('image/jpeg', .85); });
    $$('[data-bdel]').forEach((b) => (b.onclick = () => { const i = +b.dataset.bdel; B.files.splice(i, 1); B.thumbs.splice(i, 1); renderThumbs(); panel(); }));
  }
  function panel() {
    const p = $('#bpanel');
    p.innerHTML = `<div class="ph"><h3>Look for all</h3><span class="muted">${B.files.length} photo${B.files.length === 1 ? '' : 's'}</span><button class="chip" id="badd">${ic('plus')}Add</button></div>
      <div class="chips blooks">${all.map((l) => `<button class="chip ${l.id === B.pick ? 'on' : ''}" data-bl="${esc(l.id)}">${l.id.startsWith('my:') ? ic('heart') : ''}${esc(l.name)}</button>`).join('')}</div>
      ${B.pick.startsWith('my:') ? '' : `<div class="sls">${slider('amt', 'Strength', 0, 1, B.amt)}</div>`}
      <div class="pl">Size</div><div class="chips">${[['Full', 0], ['Large', 2048], ['Small', 1080]].map(([n, v]) => `<button class="chip ${B.size === v ? 'on' : ''}" data-bs="${v}">${n}</button>`).join('')}</div>
      ${B.running ? `<div class="busy"><i class="spin"></i><span id="bprog">Working…</span></div>` : ''}`;
    $('#badd', p).onclick = add;
    $$('[data-bl]', p).forEach((b) => (b.onclick = () => { B.pick = b.dataset.bl; panel(); renderThumbs(); }));
    $$('[data-bs]', p).forEach((b) => (b.onclick = () => { B.size = +b.dataset.bs; panel(); }));
    const sl = $('.sl input', p); if (sl) { let t = 0; sl.oninput = () => { B.amt = +sl.value; paintSlider(sl); sl.closest('.sl').querySelector('b').textContent = Math.round(B.amt * 100); clearTimeout(t); t = setTimeout(renderThumbs, 60); }; }
  }
  async function add() {
    const fs = await pickFiles(true); if (!fs.length) return;
    for (const f of fs.slice(0, 60 - B.files.length)) { try { B.thumbs.push(await loadImage(f, 360)); B.files.push(f); } catch (e) { /* skip */ } }
    renderThumbs(); panel();
  }
  $('#badd0').onclick = add;
  $('#bgo').onclick = async () => {
    B.running = true; panel(); renderThumbs(); const out = [], s = stateFor(B.pick, B.amt);
    E.setCurve(isFlat(s.curve) ? null : curveLUT(s.curve));
    for (let i = 0; i < B.files.length; i++) {
      const pg = $('#bprog'); if (pg) pg.textContent = `Photo ${i + 1} of ${B.files.length}…`;
      try {
        const im = await loadImage(B.files[i], Math.min(E.maxTex, 4096)), k = B.size ? Math.min(1, B.size / Math.max(im.width, im.height)) : 1;
        E.setImage(im); E.render(s, Math.round(im.width * k), Math.round(im.height * k));
        const c = document.createElement('canvas'); c.width = E.cv.width; c.height = E.cv.height; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(E.cv, 0, 0);
        const b = await toBlob(c, 'jpeg', .93); out.push(new File([b], (B.files[i].name || 'photo').replace(/\.[^.]+$/, '') + '-darlia.jpg', { type: 'image/jpeg' }));
      } catch (e) { console.error(e); }
      await new Promise((r) => setTimeout(r, 0));
    }
    B.running = false; panel(); renderThumbs();
    if (out.length && await saveFiles(out)) toast(`${out.length} photo${out.length > 1 ? 's' : ''} saved`);
  };
  panel(); renderThumbs();
}
