// Video: put a look on a short clip (up to 60 seconds) and save it, all on the device.
import { Engine } from './engine.js';
import { LOOKS } from './looks.js';
import { $, $$, esc, ic, toast, slider, paintSlider, saveFiles } from './ui.js';
import { blankCurve, isFlat, curveLUT } from './curves.js';

const base = () => ({ adj: {}, lookId: 'none', look: {}, lookAmt: 1, hsl: { h: Array(8).fill(0), s: Array(8).fill(0), l: Array(8).fill(0) }, curve: blankCurve(), geo: { crop: { x: 0, y: 0, w: 1, h: 1 }, rot90: 0, flipH: false, flipV: false, straighten: 0 }, bg: {}, seed: 7 });
export function openVideo({ back, myLooks }) {
  const V = { pick: 'kodak', amt: 1, grain: .25, fade: .1, vig: .2, busy: false };
  const all = [...myLooks().map((m) => ({ id: 'my:' + m.id, name: m.name, r: m.r })), ...LOOKS.map((l) => ({ id: l.id, name: l.name, r: { look: l.look, lookId: l.id } }))];
  const app = $('#app');
  app.innerHTML = `<section class="ed">
    <header class="top"><button class="ib" id="vback" title="Home">${ic('back')}</button><span class="name">Video</span><div class="tr"><button class="btn primary sm" id="vgo" disabled>${ic('download')}<span>Save video</span></button></div></header>
    <div class="body"><div class="stage" id="vstage"><canvas id="vcv" class="ccv" hidden></canvas><div class="empty" id="vempty"><button class="btn primary big" id="vpick">${ic('photo')}<span>Pick a video</span></button><p class="muted small">Up to 60 seconds. Everything happens on your device.</p></div><div class="vbar" id="vbar" hidden><button class="ib" id="vplay">${ic('check')}</button><input type="range" id="vseek" min="0" max="1" step=".001" value="0"></div></div>
      <aside class="side"><div class="panel" id="vpanel"></div></aside></div></section>`;
  $('#vback').onclick = () => { vid.pause(); back(); };
  const vid = document.createElement('video'); vid.playsInline = true; vid.muted = true; vid.loop = true; vid.crossOrigin = 'anonymous';
  const cv = $('#vcv'), E = new Engine(cv), st = $('#vstage'); let raf = 0, ready = false;
  const state = () => { const L = all.find((x) => x.id === V.pick) || all[0], s = { ...base(), ...JSON.parse(JSON.stringify(L.r)) }; if (!V.pick.startsWith('my:')) s.lookAmt = V.amt; s.adj = { ...(s.adj || {}), grain: (s.adj?.grain || 0) + V.grain, fade: (s.adj?.fade || 0) + V.fade, vignette: (s.adj?.vignette || 0) + V.vig }; s.seed = Math.random() * 100; return s; };
  const size = () => { const k = Math.min(1, 1080 / Math.max(vid.videoWidth, vid.videoHeight)); return [Math.round(vid.videoWidth * k / 2) * 2, Math.round(vid.videoHeight * k / 2) * 2]; };
  function frame() {
    if (!ready || !st.isConnected) return; const [W, H] = size(); E.setImage(vid); E.render(S0, W, H);
    const k = Math.min((st.clientWidth - 56) / W, (st.clientHeight - 100) / H); cv.style.width = W * k + 'px'; cv.style.height = H * k + 'px';
    $('#vseek').value = vid.currentTime / (vid.duration || 1); raf = requestAnimationFrame(frame);
  }
  let S0 = state(); const setS = () => { S0 = state(); E.setCurve(isFlat(S0.curve) ? null : curveLUT(S0.curve)); };
  function panel() {
    const p = $('#vpanel');
    p.innerHTML = `<div class="ph"><h3>Look</h3></div><div class="chips blooks">${all.filter((l) => l.id !== 'none').map((l) => `<button class="chip ${l.id === V.pick ? 'on' : ''}" data-vl="${esc(l.id)}">${l.id.startsWith('my:') ? ic('heart') : ''}${esc(l.name)}</button>`).join('')}</div>
      <div class="sls">${V.pick.startsWith('my:') ? '' : slider('amt', 'Strength', 0, 1, V.amt)}${slider('grain', 'Grain', 0, 1, V.grain)}${slider('fade', 'Fade', 0, 1, V.fade)}${slider('vig', 'Vignette', 0, 1, V.vig)}</div>
      ${V.busy ? `<div class="busy"><i class="spin"></i><span id="vprog">Saving…</span></div>` : '<p class="muted small">Saving plays the clip once through, so it takes as long as the video.</p>'}`;
    $$('[data-vl]', p).forEach((b) => (b.onclick = () => { V.pick = b.dataset.vl; setS(); panel(); }));
    $$('.sl input', p).forEach((inp) => (inp.oninput = () => { const k = inp.closest('.sl').dataset.k; V[k] = +inp.value; paintSlider(inp); inp.closest('.sl').querySelector('b').textContent = Math.round(V[k] * 100); setS(); }));
  }
  $('#vpick').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'video/*'; i.onchange = () => { const f = i.files[0]; if (!f) return; vid.src = URL.createObjectURL(f); vid.onloadeddata = () => { if (vid.duration > 61) toast('Only the first 60 seconds will be saved'); ready = true; $('#vempty').hidden = true; cv.hidden = false; $('#vbar').hidden = false; $('#vgo').disabled = false; vid.play(); cancelAnimationFrame(raf); frame(); }; }; i.click(); };
  $('#vplay').onclick = () => (vid.paused ? vid.play() : vid.pause());
  $('#vseek').oninput = (e) => { vid.currentTime = +e.target.value * (vid.duration || 0); };
  $('#vgo').onclick = async () => {
    if (!window.MediaRecorder || !cv.captureStream) { toast('This browser cannot save videos'); return; }
    V.busy = true; panel(); $('#vgo').disabled = true; vid.loop = false; vid.pause(); vid.currentTime = 0; await new Promise((r) => (vid.onseeked = r));
    const stream = cv.captureStream(30);
    try { const ac = new AudioContext(), srcN = ac.createMediaElementSource(vid), dst = ac.createMediaStreamDestination(); srcN.connect(dst); vid.muted = false; dst.stream.getAudioTracks().forEach((t) => stream.addTrack(t)); } catch (e) { /* no sound */ }
    const type = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 8e6 }), parts = []; rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    const stop = () => { if (rec.state !== 'inactive') rec.stop(); };
    vid.onended = stop; setTimeout(stop, 60500); const tick = setInterval(() => { const pg = $('#vprog'); if (pg) pg.textContent = `Saving… ${Math.round(vid.currentTime / Math.min(60, vid.duration || 1) * 100)}%`; }, 300);
    rec.onstop = async () => { clearInterval(tick); vid.muted = true; vid.loop = true; V.busy = false; panel(); $('#vgo').disabled = false; const blob = new Blob(parts, { type: type.split(';')[0] || 'video/webm' }), ext = blob.type.includes('mp4') ? 'mp4' : 'webm'; if (await saveFiles([new File([blob], 'darlia-video.' + ext, { type: blob.type })])) toast('Video saved'); vid.play(); };
    rec.start(250); await vid.play();
  };
  setS(); panel();
}
