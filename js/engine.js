// Darlia photo engine: one WebGL pass does warp, lens blur, retouch, every adjustment, curves,
// colour mix, looks, brush edits, crop/rotate and background replacement.
// The same engine renders the preview and the export.
const VS = `
attribute vec2 p; varying vec2 v;
void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const FS = `
precision highp float;
varying vec2 v;
uniform sampler2D img, mask, curve, paint, face, disp, bgimg, skyimg;
uniform vec2 bgScale, skyScale;
uniform float kv, kh, pz, denoise, fShine, lipAmt, blushAmt, lidAmt, hairAmt, skyAmt, glitch, vhs, artMode, artAmt, splash, splashHue, splashRange, splashKeep, nFaces;
uniform vec3 lipCol, blushCol, lidCol, hairCol, skyTint;
uniform vec4 cheeks[8], lids[8];
uniform vec2 texel, outRes, dispRes, bC;
uniform mat3 geo;
uniform float expo, contrast, highlights, shadows, whites, blacks, temp, tint, vibrance, saturation;
uniform float clarity, sharpen, fade, vignette, grain, seed, amount, hasMask, mk, bgMode, bgBlur;
uniform vec3 splitS, splitH, bgCol;
uniform float hslH[8], hslS[8], hslL[8];
uniform float mono, hasCurve, hasDisp;
uniform float lOn, lExpo, lSat, lTemp, lCon, showPaint;
uniform float fOn, fSmooth, fBright, fTeeth, fEyes, fRad;
uniform float bMode, bAmt, bSize, bFeather, bAng, bKeep;

float luma(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }
vec3 rgb2hsl(vec3 c){
  float mx=max(c.r,max(c.g,c.b)), mn=min(c.r,min(c.g,c.b)), l=(mx+mn)*.5, h=0., s=0.;
  if(mx>mn){ float d=mx-mn; s = l>.5 ? d/(2.-mx-mn) : d/(mx+mn);
    if(mx==c.r) h=(c.g-c.b)/d+(c.g<c.b?6.:0.); else if(mx==c.g) h=(c.b-c.r)/d+2.; else h=(c.r-c.g)/d+4.; h/=6.; }
  return vec3(h,s,l);
}
float hue2(float p,float q,float t){ if(t<0.)t+=1.; if(t>1.)t-=1.; if(t<1./6.)return p+(q-p)*6.*t; if(t<.5)return q; if(t<2./3.)return p+(q-p)*(2./3.-t)*6.; return p; }
vec3 hsl2rgb(vec3 h){ if(h.y<=0.) return vec3(h.z); float q=h.z<.5?h.z*(1.+h.y):h.z+h.y-h.z*h.y, p=2.*h.z-q; return vec3(hue2(p,q,h.x+1./3.),hue2(p,q,h.x),hue2(p,q,h.x-1./3.)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }

vec3 src(vec2 uv){ return texture2D(img, uv).rgb; }
vec3 blurAt(vec2 uv, float r){
  vec3 s = vec3(0.); float n = 0.;
  for(int i=-3;i<=3;i++) for(int j=-3;j<=3;j++){ vec2 o = vec2(float(i),float(j)); s += src(uv + o*texel*r); n += 1.; }
  return s/n;
}
// lens blur: a disc of samples, bright spots weigh more so lights bloom into round bokeh
vec3 bokeh(vec2 uv, float r){
  vec3 s = vec3(0.); float n = 0.;
  for(int i=0;i<48;i++){ float a = float(i)*2.39996; float d = sqrt((float(i)+.5)/48.)*r; vec3 x = src(uv + vec2(cos(a),sin(a))*d*texel); float w = 1. + pow(luma(x), 4.)*6.; s += x*w; n += w; }
  return s/n;
}
// skin smoothing that keeps edges
vec3 smoothAt(vec2 uv, vec3 c0){
  vec3 s = c0; float n = 1.;
  for(int i=0;i<24;i++){ float a = float(i)*2.39996; float d = sqrt((float(i)+.5)/24.)*fRad; vec3 x = src(uv + vec2(cos(a),sin(a))*d*texel); vec3 e = x-c0; float w = exp(-dot(e,e)*80.); s += x*w; n += w; }
  return s/n;
}
vec3 smoothR(vec2 uv, vec3 c0, float r, float k){
  vec3 s = c0; float n = 1.;
  for(int i=0;i<16;i++){ float a = float(i)*2.39996; float d = sqrt((float(i)+.5)/16.)*r; vec3 x = src(uv + vec2(cos(a),sin(a))*d*texel); vec3 e = x-c0; float w = exp(-dot(e,e)*k); s += x*w; n += w; }
  return s/n;
}
float edgeAt(vec2 uv, float r){
  vec2 t = texel*r; float tl = luma(src(uv+vec2(-t.x,t.y))), tc = luma(src(uv+vec2(0.,t.y))), tr = luma(src(uv+t)), ml = luma(src(uv-vec2(t.x,0.))), mr = luma(src(uv+vec2(t.x,0.))), bl = luma(src(uv-t)), bc = luma(src(uv-vec2(0.,t.y))), br = luma(src(uv+vec2(t.x,-t.y)));
  float gx = tr+2.*mr+br-tl-2.*ml-bl, gy = tl+2.*tc+tr-bl-2.*bc-br; return sqrt(gx*gx+gy*gy);
}
vec3 colorize(vec3 c, vec3 col){ vec3 h = rgb2hsl(col); return hsl2rgb(vec3(h.x, h.y, clamp(luma(c)*(.6+h.z*.8), 0., 1.))); }
float ell(vec2 p, vec4 e){ vec2 d = (p - e.xy)/max(e.zw, vec2(1e-4)); return exp(-dot(d,d)*2.2); }
vec2 dec(vec2 t){ vec4 p = texture2D(disp, t); return vec2((p.r*65280.+p.g*255.)/65535.-.5, (p.b*65280.+p.a*255.)/65535.-.5)*.5; }
vec2 dispAt(vec2 uv){
  vec2 g = uv*dispRes - .5, i0 = floor(g), f = g - i0, d = 1./dispRes;
  vec2 a = dec((i0+.5)*d), b = dec((i0+vec2(1.5,.5))*d), c = dec((i0+vec2(.5,1.5))*d), e = dec((i0+1.5)*d);
  return mix(mix(a,b,f.x), mix(c,e,f.x), f.y);
}
float lut(float x, int ch){ vec4 t = texture2D(curve, vec2(clamp(x,0.,1.)*255./256.+.5/256., .5)); return ch==0?t.r:ch==1?t.g:ch==2?t.b:t.a; }

void main(){
  vec2 qv = v - .5, vp = vec2(qv.x*(1.+kv*qv.y*2.), qv.y*(1.+kh*qv.x*2.))*pz + .5;
  if(vhs>0.){ float row = floor(v.y*outRes.y/3.); vp.x += (hash(vec2(row, floor(seed*7.)))-.5)*vhs*.012*step(.93, hash(vec2(row*.37, 3.))); }
  vec2 uv = (geo * vec3(vp, 1.)).xy;
  if(hasDisp>.5) uv += dispAt(uv);
  if(uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.){ gl_FragColor = vec4(0.); return; }
  vec3 o = src(uv);
  if(glitch>0.){ vec2 off = vec2(texel.x*glitch*14., 0.); o = vec3(src(uv+off).r, o.g, src(uv-off).b); }
  if(vhs>0.){ vec3 b = (src(uv+vec2(texel.x*3.,0.))+src(uv-vec2(texel.x*3.,0.))+src(uv+vec2(texel.x*6.,0.)))/3.; float L = luma(o); o = mix(o, b - luma(b) + L, vhs*.8); }
  if(amount<.5){ gl_FragColor = vec4(o, 1.); return; }
  vec3 c = o;
  if(denoise>0.) c = mix(c, smoothR(uv, c, 2.5, 140.), denoise);
  // lens blur (focus measured on the final frame)
  if(bMode>.5 && bAmt>0.){
    vec2 q = (v - bC) * vec2(outRes.x/outRes.y, 1.); float d;
    if(bMode<1.5) d = length(q); else d = abs(dot(q, vec2(-sin(bAng), cos(bAng))));
    float f = smoothstep(bSize, bSize + bFeather, d);
    if(bKeep>.5 && mk>.5) f *= 1. - texture2D(mask, uv).r;
    if(f>.01) c = mix(c, bokeh(uv, bAmt*f), smoothstep(0., .25, f));
  }
  // face retouch
  if(fOn>.5){
    vec4 fm = texture2D(face, uv);
    if(fSmooth>0. && fm.r>.01){ vec3 sm = smoothAt(uv, c); c = mix(c, sm, fm.r*fSmooth*.9); }
    c += fm.r*fBright*.10*(1.-c);
    if(fTeeth>0. && fm.g>.01){ float L = luma(c), k = fm.g*fTeeth*smoothstep(.18,.45,L); c = mix(c, vec3(L), k*.75); c += k*.07; }
    if(fEyes>0. && fm.b>.01){ c = mix(c, c*1.25 + .02, fm.b*fEyes*.6); }
    if(fShine>0. && fm.r>.01){ float L = luma(c); c -= fm.r*fShine*smoothstep(.5,.95,L)*(L-.5)*.6; }
    // makeup
    if(lipAmt>0. && fm.a>.01) c = mix(c, colorize(c, lipCol)*1.05, fm.a*lipAmt*.85);
    if(blushAmt>0. || lidAmt>0.){
      vec2 p = vec2(uv.x, uv.y) * vec2(outRes.x/outRes.x, 1.); float bw = 0., lw = 0.;
      for(int i=0;i<8;i++){ if(float(i) < nFaces*2.){ bw += ell(uv, cheeks[i]); lw += ell(uv, lids[i]); } }
      bw = clamp(bw,0.,1.)*fm.r; lw = clamp(lw,0.,1.)*(1.-fm.b);
      c = mix(c, c*mix(vec3(1.), blushCol*1.35, .7), bw*blushAmt*.6);
      c = mix(c, colorize(c, lidCol), lw*lidAmt*.55);
    }
  }
  if(hairAmt>0. && mk>.5){ float hm = texture2D(mask, uv).b; if(hm>.01) c = mix(c, colorize(c, hairCol)*1.08, hm*hairAmt); }
  // detail
  if(sharpen>0.){ vec3 b = (src(uv+vec2(texel.x,0.))+src(uv-vec2(texel.x,0.))+src(uv+vec2(0.,texel.y))+src(uv-vec2(0.,texel.y)))*.25; c += (o-b)*sharpen*1.6; }
  if(clarity!=0.){ vec3 b = blurAt(uv, 6.); float d = luma(o)-luma(b); c += d*clarity*1.2*(1.-abs(luma(c)-.5)*1.2); }
  // white balance, exposure, tone
  c.r += temp*.12; c.b -= temp*.12; c.g += tint*.10;
  c *= pow(2., expo);
  float l = luma(c);
  c += shadows*.35*(1.-smoothstep(0.,.55,l));
  c += highlights*.35*smoothstep(.45,1.,l);
  c += blacks*.12*(1.-smoothstep(0.,.3,l)); c += whites*.18*smoothstep(.55,1.,l);
  c = (c - .5) * (1. + contrast) + .5;
  // brushed area
  if(lOn>.5){ float m = texture2D(paint, uv).r; if(m>.002){ c *= pow(2., lExpo*m); c.r += lTemp*.12*m; c.b -= lTemp*.12*m; c = (c-.5)*(1.+lCon*m)+.5; float L = luma(c); c = mix(vec3(L), c, 1.+lSat*m); } }
  // curves: master, then each channel
  if(hasCurve>.5){ c = clamp(c,0.,1.); c = vec3(lut(c.r,3), lut(c.g,3), lut(c.b,3)); c = vec3(lut(c.r,0), lut(c.g,1), lut(c.b,2)); }
  // colour mix (8 bands)
  vec3 h = rgb2hsl(clamp(c,0.,1.));
  float dh = 0., ds = 0., dl = 0., wsum = 0.;
  for(int k=0;k<8;k++){
    float centre = float(k)/8.; float d = abs(h.x-centre); d = min(d, 1.-d);
    float w = max(0., 1.-d*8.) * smoothstep(.02,.18,h.y);
    dh += hslH[k]*w; ds += hslS[k]*w; dl += hslL[k]*w; wsum += w;
  }
  if(wsum>0.){ h.x = fract(h.x + dh*.08); h.y = clamp(h.y*(1.+ds), 0., 1.); h.z = clamp(h.z + dl*.25*h.y, 0., 1.); c = hsl2rgb(h); }
  l = luma(c);
  float sat = max(c.r,max(c.g,c.b)) - min(c.r,min(c.g,c.b));
  c = mix(vec3(l), c, 1. + saturation + vibrance*(1.-sat)*1.2);
  if(mono>.5) c = vec3(luma(c));
  l = luma(c);
  c += splitS*(1.-smoothstep(0.,.5,l))*.25 + splitH*smoothstep(.5,1.,l)*.25;
  c = mix(c, vec3(.08)+c*.88, fade);
  c = clamp(c, 0., 1.);
  vec2 q = v - .5; float vg = 1. - dot(q,q)*1.6; c *= mix(1., clamp(vg,0.,1.), vignette>0.?vignette:0.); c = mix(c, c + (1.-clamp(vg,0.,1.))*.6, vignette<0.?-vignette:0.);
  if(grain>0.){ float g = hash(v*outRes) - .5; c += g*grain*.22; }
  // sky
  if(skyAmt>0. && mk>.5){ float sm = texture2D(mask, uv).g; vec3 sk = texture2D(skyimg, (vp-.5)*skyScale+.5).rgb; c = mix(c + skyTint*skyAmt*.12*(1.-sm), sk*(.85+.3*luma(c)), sm*skyAmt); }
  // colour splash
  if(splash>.5){ vec3 hh = rgb2hsl(c); float d = abs(hh.x-splashHue); d = min(d, 1.-d); float keep = (1.-smoothstep(splashRange, splashRange+.05, d))*smoothstep(.08,.2,hh.y); if(splashKeep>.5 && mk>.5) keep = max(keep, texture2D(mask, uv).r); c = mix(vec3(luma(c)), c, keep); }
  // art styles
  if(artMode>.5 && artAmt>0.){
    vec3 a0 = c; float e = edgeAt(uv, 1.5);
    if(artMode<1.5){ float pen = 1. - smoothstep(.08, .5, e); float L = luma(c); a0 = vec3(mix(.25, 1., pen) * mix(.82, 1., smoothstep(.2,.8,L))) * vec3(1., .985, .96); }
    else if(artMode<2.5){ vec3 b = blurAt(uv, 3.); a0 = mix(b, floor(b*6.+.5)/6., .5); a0 = a0*(1.-smoothstep(.15,.6,e)*.35) + (hash(floor(v*outRes/3.))-.5)*.04; a0 = mix(a0, vec3(1.,.98,.95), .08); }
    else if(artMode<3.5){ float L = luma(c); vec2 g = fract(v*outRes/7.)-.5; float dot0 = step(length(g), .5*sqrt(1.-L)); vec3 pal = L>.66 ? vec3(1.,.9,.2) : L>.4 ? vec3(1.,.3,.55) : L>.2 ? vec3(.15,.6,1.) : vec3(.08); a0 = mix(pal, pal*.6, dot0*.6); a0 = mix(a0, vec3(0.), smoothstep(.25,.6,e)); }
    else { vec3 b = smoothR(uv, c, 3., 40.); a0 = floor(b*5.+.5)/5.; a0 = mix(a0, vec3(.05), smoothstep(.2,.55,e)); }
    c = mix(c, clamp(a0,0.,1.), artAmt);
  }
  if(vhs>0.){ c *= 1. - vhs*.18*step(.5, fract(v.y*outRes.y/3.)); c += (hash(v*outRes+seed)-.5)*vhs*.1; c = mix(c, c*vec3(1.05,.98,1.08), vhs*.5); }
  if(showPaint>.5){ float m = texture2D(paint, uv).r; c = mix(c, vec3(1.,.18,.42), m*.55); }
  float a = 1.;
  if(hasMask>.5){
    float m = texture2D(mask, uv).r;
    vec3 bg = bgMode<.5 ? c : bgMode<1.5 ? bgCol : bgMode<2.5 ? blurAt(uv, bgBlur) : bgMode<3.5 ? vec3(luma(c)) : texture2D(bgimg, (v-.5)*bgScale+.5).rgb;
    if(bgMode<.5) a = m; else c = mix(bg, c, m);
  }
  gl_FragColor = vec4(clamp(c,0.,1.)*a, a);
}`;

export class Engine {
  constructor(canvas, opt = {}) {
    this.cv = canvas || document.createElement('canvas'); this.lite = !!opt.lite;
    const gl = this.cv.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, alpha: true });
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, this.lite && t === gl.FRAGMENT_SHADER ? liteFS(s) : s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr); this.pr = pr;
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {}; const n = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(pr, i), name = info.name.replace(/\[0\]$/, ''); this.u[name] = gl.getUniformLocation(pr, info.name); }
    this.t = { img: this.mkTex(0), mask: this.mkTex(1), curve: this.mkTex(2), paint: this.mkTex(3), face: this.mkTex(4), disp: this.mkTex(5, true), bgimg: this.mkTex(6), skyimg: this.mkTex(7) };
    ['img', 'mask', 'curve', 'paint', 'face', 'disp', 'bgimg', 'skyimg'].forEach((k, i) => this.u[k] && gl.uniform1i(this.u[k], i));
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.has = {};
    // safe 1x1 placeholders so every sampler is complete
    for (const k of ['mask', 'curve', 'paint', 'face', 'disp', 'bgimg', 'skyimg']) this.upload(k, new Uint8Array([0, 0, 0, 255]), 1, 1);
  }
  mkTex(unit, nearest) {
    const gl = this.gl, t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    const f = nearest ? gl.NEAREST : gl.LINEAR; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    t.unit = unit; return t;
  }
  upload(k, src, w, h, flip = true) {
    const gl = this.gl, t = this.t[k]; gl.activeTexture(gl.TEXTURE0 + t.unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
    if (src instanceof Uint8Array) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.activeTexture(gl.TEXTURE0);
  }
  setImage(src) { this.w = src.width; this.h = src.height; this.upload('img', src); }
  setMask(src) { this.setMasks(src, null, null); }
  // one texture for three masks: R = person, G = sky, B = hair
  setMasks(p, sky, hair) {
    const list = [p, sky, hair], any = list.filter(Boolean); this.has.person = !!p; this.has.skym = !!sky; this.has.hair = !!hair; this.has.mask = any.length > 0;
    if (!any.length) return;
    if (any.length === 1 && p) { this.upload('mask', p); return; }
    const W = Math.max(...any.map((c) => c.width)), H = Math.round(W * any[0].height / any[0].width), c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }), out = x.createImageData(W, H);
    list.forEach((m, ch) => { if (!m) return; x.clearRect(0, 0, W, H); x.drawImage(m, 0, 0, W, H); const d = x.getImageData(0, 0, W, H).data; for (let i = 0; i < d.length; i += 4) out.data[i + ch] = d[i]; });
    for (let i = 3; i < out.data.length; i += 4) out.data[i] = 255; x.putImageData(out, 0, 0); this.upload('mask', c);
  }
  setCurve(lut) { this.has.curve = !!lut; if (lut) this.upload('curve', lut, 256, 1, false); }
  setSky(src) { this.has.sky = !!src; if (src) { this.skyAsp = src.width / src.height; this.upload('skyimg', src); } }
  setMakeup(m) { this.mk = m; }
  setBg(src) { this.has.bg = !!src; if (src) { this.bgAsp = src.width / src.height; this.upload('bgimg', src); } }
  setPaint(src) { this.has.paint = !!src; if (src) this.upload('paint', src); }
  setFace(src, rad) { this.has.face = !!src; this.faceRad = rad || 8; if (src) { if (src.data) this.upload('face', src.data, src.width, src.height); else this.upload('face', src); } }
  // field: offsets in picture units with y down, rows from the top
  setDisp(F, gw, gh) {
    this.has.disp = !!F; if (!F) return; this.dispRes = [gw, gh];
    const D = new Uint8Array(gw * gh * 4);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = (y * gw + x) * 2, o = ((gh - 1 - y) * gw + x) * 4;
      const ex = Math.round(Math.max(0, Math.min(1, F[i] * 2 + .5)) * 65535), ey = Math.round(Math.max(0, Math.min(1, -F[i + 1] * 2 + .5)) * 65535);
      D[o] = ex >> 8; D[o + 1] = ex & 255; D[o + 2] = ey >> 8; D[o + 3] = ey & 255;
    }
    this.upload('disp', D, gw, gh, false);
  }
  outSize(s) { const g = s.geo, q = g.rot90 % 2 === 1, OW = q ? this.h : this.w, OH = q ? this.w : this.h; return [g.crop.w * OW, g.crop.h * OH]; }
  geoMatrix(s) {
    const g = s.geo, c = g.crop, k = ((g.rot90 % 4) + 4) % 4, q = k % 2 === 1, sw = this.w, sh = this.h, OW = q ? sh : sw, OH = q ? sw : sh;
    const CW = c.w * OW, CH = c.h * OH, ang = (g.straighten || 0) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
    const zoom = ang ? Math.abs(ca) + Math.abs(sa) * Math.max(CW / CH, CH / CW) : 1;
    const f = (x, y) => {
      let u = (x - .5) * CW, w = (y - .5) * CH;
      let rx = (u * ca - w * sa) / zoom, ry = (u * sa + w * ca) / zoom;
      let px = (c.x + c.w / 2) * OW - OW / 2 + rx, py = (OH / 2 - (c.y + c.h / 2) * OH) + ry;
      if (g.flipH) px = -px; if (g.flipV) py = -py;
      for (let i = 0; i < k; i++) { const t = px; px = -py; py = t; }
      return [px / sw + .5, py / sh + .5];
    };
    const [x0, y0] = f(0, 0), [x1, y1] = f(1, 0), [x2, y2] = f(0, 1);
    return [x1 - x0, y1 - y0, 0, x2 - x0, y2 - y0, 0, x0, y0, 1];
  }
  render(s, W, H, opts = {}) {
    const gl = this.gl; this.cv.width = W; this.cv.height = H; gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const a = s.adj || {}, f = opts.noFilter ? {} : (s.look || {}), k = s.lookAmt ?? 1, u = this.u, f1 = (n, x) => gl.uniform1f(u[n], x);
    const val = (name) => (a[name] || 0) + (f[name] || 0) * k;
    gl.uniformMatrix3fv(u.geo, false, this.geoMatrix(s));
    gl.uniform2f(u.texel, 1 / this.w, 1 / this.h); gl.uniform2f(u.outRes, W, H);
    f1('expo', val('exposure')); f1('contrast', val('contrast')); f1('highlights', val('highlights')); f1('shadows', val('shadows'));
    f1('whites', val('whites')); f1('blacks', val('blacks')); f1('temp', val('temp')); f1('tint', val('tint'));
    f1('vibrance', val('vibrance')); f1('saturation', val('saturation')); f1('clarity', val('clarity')); f1('sharpen', Math.max(0, val('sharpen')));
    f1('fade', Math.max(0, val('fade'))); f1('vignette', val('vignette')); f1('grain', Math.max(0, val('grain'))); f1('seed', (s.seed || 1) % 100);
    f1('amount', opts.original ? 0 : 1); f1('mono', f.mono && k > .5 ? 1 : 0);
    const sp = (c) => (c ? c.map((x) => x * k) : [0, 0, 0]);
    gl.uniform3fv(u.splitS, sp(f.splitS)); gl.uniform3fv(u.splitH, sp(f.splitH));
    const H8 = s.hsl || {}; gl.uniform1fv(u.hslH, H8.h || Array(8).fill(0)); gl.uniform1fv(u.hslS, H8.s || Array(8).fill(0)); gl.uniform1fv(u.hslL, H8.l || Array(8).fill(0));
    const bg = s.bg || {}, on = this.has.person && bg.on && !opts.original;
    f1('hasMask', on ? 1 : 0); f1('mk', this.has.mask ? 1 : 0); const bm = ({ clear: 0, color: 1, blur: 2, mono: 3, photo: 4 })[bg.mode] ?? 0; f1('bgMode', bm === 4 && !this.has.bg ? 0 : bm);
    { const A = W / H, B = this.bgAsp || 1; gl.uniform2f(u.bgScale, A > B ? 1 : A / B, A > B ? B / A : 1); }
    gl.uniform3fv(u.bgCol, hexRGB(bg.color || '#ffffff')); f1('bgBlur', 4 + (bg.blur ?? .6) * 16 * Math.max(1, Math.max(this.w, this.h) / 1600));
    f1('hasCurve', this.has.curve && !opts.noCurve ? 1 : 0);
    f1('hasDisp', this.has.disp && !opts.noDisp ? 1 : 0); if (this.has.disp) gl.uniform2f(u.dispRes, ...this.dispRes);
    const L = s.local || {}, lon = this.has.paint && !opts.noLocal;
    f1('lOn', lon && !opts.paintOnly ? 1 : 0); f1('lExpo', L.expo || 0); f1('lSat', L.sat || 0); f1('lTemp', L.temp || 0); f1('lCon', L.contrast || 0); f1('showPaint', this.has.paint && opts.showPaint ? 1 : 0);
    const F = s.face || {}; f1('fOn', this.has.face && !opts.noFace ? 1 : 0); f1('fSmooth', F.smooth || 0); f1('fBright', F.bright || 0); f1('fTeeth', F.teeth || 0); f1('fEyes', F.eyeBright || 0); f1('fRad', this.faceRad || 8);
    const B = s.blur || {}, big = Math.max(this.w, this.h);
    f1('bMode', ({ off: 0, radial: 1, linear: 2 })[B.mode] || 0); f1('bAmt', (B.amount || 0) * big / 90); f1('bSize', B.size ?? .2); f1('bFeather', .02 + (B.feather ?? .5) * .4);
    f1('bAng', (B.angle || 0) * Math.PI / 180); f1('bKeep', B.keep ? 1 : 0); gl.uniform2f(u.bC, B.x ?? .5, 1 - (B.y ?? .5));
    const P = s.geo.persp || [0, 0]; f1('kv', P[0] || 0); f1('kh', P[1] || 0); f1('pz', 1 / (1 + .6 * (Math.abs(P[0] || 0) + Math.abs(P[1] || 0))));
    f1('denoise', Math.max(0, val('denoise'))); f1('fShine', F.shine || 0);
    const MK = s.makeup || {}, M = this.mk || { n: 0, cheeks: [], lids: [] }, mon = this.has.face && !opts.noFace && !opts.original;
    f1('lipAmt', mon ? MK.lip || 0 : 0); f1('blushAmt', mon ? MK.blush || 0 : 0); f1('lidAmt', mon ? MK.lid || 0 : 0); f1('nFaces', mon ? M.n : 0);
    gl.uniform3fv(u.lipCol, hexRGB(MK.lipCol || '#c2185b')); gl.uniform3fv(u.blushCol, hexRGB(MK.blushCol || '#ff8fa3')); gl.uniform3fv(u.lidCol, hexRGB(MK.lidCol || '#8b5a3c'));
    const pad = (a) => { const o = new Float32Array(32); a.slice(0, 8).forEach((e, i) => o.set(e, i * 4)); return o; }; gl.uniform4fv(u.cheeks, pad(M.cheeks)); gl.uniform4fv(u.lids, pad(M.lids));
    f1('hairAmt', this.has.mask && this.has.hair ? (s.hair || {}).amt || 0 : 0); gl.uniform3fv(u.hairCol, hexRGB((s.hair || {}).col || '#7a2a3a'));
    const SK = s.sky || {}; f1('skyAmt', this.has.sky && this.has.skym ? SK.amt ?? 0 : 0); gl.uniform3fv(u.skyTint, hexRGB(SK.tint || '#ff9a6a'));
    { const A = W / H, B = this.skyAsp || 1; gl.uniform2f(u.skyScale, A > B ? 1 : A / B, A > B ? B / A : 1); }
    const X = s.eff || {}; f1('glitch', X.glitch || 0); f1('vhs', X.vhs || 0); f1('artMode', ({ none: 0, sketch: 1, water: 2, pop: 3, cartoon: 4 })[X.art] || 0); f1('artAmt', X.artAmt ?? 1);
    f1('splash', X.splash ? 1 : 0); f1('splashHue', X.splashHue || 0); f1('splashRange', X.splashRange ?? .06); f1('splashKeep', X.splashKeep ? 1 : 0);
    if (opts.original) { for (const n of ['kv', 'kh', 'denoise', 'glitch', 'vhs', 'artMode', 'splash', 'skyAmt', 'hairAmt']) f1(n, 0); f1('pz', 1); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.cv;
  }
}
// fewer samples on weaker phones
function liteFS(s) { return s.replace(/i<48/g, 'i<20').replace('(float(i)+.5)/48.', '(float(i)+.5)/20.').replace(/i<24/g, 'i<12').replace('(float(i)+.5)/24.', '(float(i)+.5)/12.').replace(/int i=-3;i<=3;i\+\+\) for\(int j=-3;j<=3;j\+\+\)/, 'int i=-2;i<=2;i++) for(int j=-2;j<=2;j++)'); }
export function hexRGB(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
