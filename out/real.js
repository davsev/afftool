// Kit-based jointed cut-out puppets + painted kit backgrounds. Loaded after clip.js, vector.js, pro.js.
const IMG = {};
function loadImgs() {
  return Promise.all(Object.entries(SPR2_DATA).map(([k, v]) => new Promise(r => { const i = new Image(); i.onload = () => { IMG[k] = i; r(); }; i.onerror = r; i.src = v; })));
}
// rig table, in sprite pixels (sprites are 3x the kit sheet)
const RIG2 = {
  hero: { neckY: 168, headX: [96, 276], headCx: 186, headTop: 4, legs: { hipY: 540, crotchX: 205, pivL: [160, 548], pivR: [250, 548] }, heads: ['hero_h0', 'hero_h1', 'hero_h2', 'hero_h3'] },
  singer: { neckY: 168, headX: [118, 282], headCx: 200, headTop: 4, heads: ['singer_h0', 'singer_h1', 'singer_h2'] },
  drummer: { neckY: 178, headX: [40, 210], headCx: 124, headTop: 6, heads: ['drummer_h0', 'drummer_h1', 'drummer_h2', 'drummer_h3'] },
  bassist: { neckY: 178, headX: [40, 205], headCx: 122, headTop: 4, heads: ['bassist_h0', 'bassist_h1', 'bassist_h2', 'bassist_h3'] },
};
function img(name, x, y, w, h) { const i = IMG[name]; if (i) ctx.drawImage(i, x, y, w, h); }

// full-body puppet. (x, feetY) = bottom centre; H = on-screen height
function body(kind, x, feetY, H, o = {}) {
  const im = IMG[kind]; if (!im) return;
  const R = RIG2[kind], k = H / im.height, w = im.width * k, ox = -w / 2, oy = -H;
  ctx.save(); ctx.translate(x, feetY); if (o.flip) ctx.scale(-1, 1);
  ctx.rotate(o.rot || 0); ctx.translate(0, (o.bob || 0));
  if (o.clipY !== undefined) { ctx.beginPath(); ctx.rect(ox - 200, oy - 200, w + 400, o.clipY * k + 200); ctx.clip(); }
  const L = R.legs;
  // legs (hero only): rotate around hips, drawn behind the torso
  if (L && o.swing !== undefined) {
    for (const side of [0, 1]) {
      const sw = (side ? -1 : 1) * o.swing;
      const pv = side ? L.pivR : L.pivL;
      ctx.save();
      ctx.translate(ox + pv[0] * k, oy + pv[1] * k); ctx.rotate(sw); ctx.translate(-(ox + pv[0] * k), -(oy + pv[1] * k));
      ctx.beginPath();
      if (side) ctx.rect(ox + L.crotchX * k, oy + (L.hipY - 30) * k, w, H); else ctx.rect(ox - 10, oy + (L.hipY - 30) * k, L.crotchX * k + 10, H);
      ctx.clip(); ctx.drawImage(im, ox, oy, w, H); ctx.restore();
    }
    // torso + arms (above hips), slight bob
    ctx.save(); ctx.beginPath(); ctx.rect(ox - 50, oy - 50, w + 100, (L.hipY + 40) * k + 50);
    ctx.rect(ox + R.headX[0] * k, oy - 50, (R.headX[1] - R.headX[0]) * k, R.neckY * k + 50); // head hole (even-odd)
    ctx.clip('evenodd'); ctx.drawImage(im, ox, oy, w, H); ctx.restore();
  } else {
    ctx.save(); ctx.beginPath(); ctx.rect(ox - 50, oy - 50, w + 100, H + 100);
    ctx.rect(ox + R.headX[0] * k, oy - 50, (R.headX[1] - R.headX[0]) * k, R.neckY * k + 50);
    ctx.clip('evenodd'); ctx.drawImage(im, ox, oy, w, H); ctx.restore();
  }
  // head: swap-in part head (or body's own head), rotated at the neck
  const px = ox + R.headCx * k, py = oy + R.neckY * k;
  ctx.save(); ctx.translate(px, py); ctx.rotate(o.head || 0); ctx.translate(-px, -py);
  const hn = o.headImg;
  if (hn && IMG[hn]) {
    const hi = IMG[hn], hw = hi.width * k * (o.headScale || 1.0), hh = hi.height * k * (o.headScale || 1.0);
    ctx.drawImage(hi, px - hw / 2, py - hh * 0.86, hw, hh);
  } else {
    ctx.beginPath(); ctx.rect(ox + R.headX[0] * k, oy - 50, (R.headX[1] - R.headX[0]) * k, R.neckY * k + 50 + 6 * k); ctx.clip();
    ctx.drawImage(im, ox, oy, w, H);
  }
  ctx.restore();
  ctx.restore();
}

// map legacy man() calls for main characters onto kit puppets
const _pman = man;
man = function (o) {
  if (!RIG2[o.kind] || !IMG[o.kind]) {
    // background people: slightly soft, pushed back
    _pman(o); return;
  }
  const s = o.s || 1, H = 250 * s;
  const sitting = o.lL && o.lL[0] > 1.1, lying = (o.tA || 0) < -0.6;
  const walk = o.lL && !sitting && !lying ? o.lL[0] : 0;
  const lookUp = (o.hT || 0) < -0.4;
  let headImg = null;
  if (o.kind === 'hero') headImg = lookUp ? 'hero_h3' : null;
  if (!sitting && !lying) { ctx.save(); ctx.fillStyle = 'rgba(15,12,30,.28)'; ctx.beginPath(); ctx.ellipse(o.x, o.y + 92 * s + 2, 46 * s, 9 * s, 0, 0, 7); ctx.fill(); ctx.restore(); }
  const feetY = sitting || lying ? o.y + H * 0.48 : o.y + 92 * s;
  const opts = {
    flip: o.face === -1, swing: o.kind === 'hero' ? walk * 0.75 : undefined,
    bob: -Math.abs(walk) * 10 * s + (o.bob || 0) * s,
    rot: lying ? (o.tA || 0) : (o.tA || 0) * 0.5, head: clamp(o.hT || 0, -0.3, 0.35) * (lookUp ? 0.3 : 1), headImg,
    clipY: sitting ? 560 : undefined,
  };
  if (lying) { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.tA); body(o.kind, 0, H * 0.48, H, Object.assign(opts, { rot: 0 })); ctx.restore(); }
  else body(o.kind, o.x, feetY, H, opts);
  if (o.cup && IMG.cup) { const d = o.face === -1 ? -1 : 1; ctx.drawImage(IMG.cup, o.x + 52 * s * d - 14 * s, o.y - 40 * s, 30 * s, 38 * s); }
  if (o.spray && IMG.spray) { ctx.drawImage(IMG.spray, o.x - 70 * s, o.y - 70 * s, 16 * s, 34 * s); }
};

// band on stage
function bandHead(kind) {
  const k = kick(), bar = Math.floor(BP / 4);
  if (kind === 'drummer') return k > 0.75 ? 'drummer_h3' : k > 0.45 ? 'drummer_h2' : ['drummer_h0', 'drummer_h1'][bar % 2];
  if (kind === 'bassist') return ['bassist_h0', 'bassist_h1', 'bassist_h2', 'bassist_h3'][bar % 4];
  if (kind === 'singer') return ['singer_h0', 'singer_h1', 'singer_h2', null][bar % 4];
  return null;
}
function drummerAtKit(x, y, s) {
  // y = hip line; torso + swinging stick arms + head, legs hidden behind the kit
  const k = kick(), sn = snare(), L = Math.max(0, Math.sin(BP * Math.PI * 4));
  const sc = s * 0.28;
  const T0 = IMG.drum_torso, A1 = IMG.drum_armL, A2 = IMG.drum_armR; if (!T0) return;
  ctx.save(); ctx.translate(x, y - k * 5 * s);
  const tw = T0.width * sc, th = T0.height * sc;
  // arms behind/in front: right arm (viewer left) uses armL image mirrored to reach in
  const hitA = 0.45 * (1 - L) - 0.15, hitB = 0.5 * (1 - Math.min(1, sn * 1.4)) - 0.2;
  ctx.save(); ctx.translate(-tw * 0.36, -th * 0.72); ctx.rotate(0.55 + hitA); ctx.drawImage(A1, -A1.width * sc * 0.12, -A1.height * sc * 0.25, A1.width * sc, A1.height * sc); ctx.restore();
  ctx.drawImage(T0, -tw / 2, -th, tw, th);
  ctx.save(); ctx.translate(tw * 0.36, -th * 0.72); ctx.scale(-1, 1); ctx.rotate(0.35 + hitB); ctx.drawImage(A2, -A2.width * sc * 0.1, -A2.height * sc * 0.6, A2.width * sc, A2.height * sc); ctx.restore();
  const hn = bandHead('drummer'), hi = IMG[hn];
  ctx.save(); ctx.translate(0, -th * 0.94); ctx.rotate(Math.sin(BP * Math.PI) * 0.08 + k * 0.06);
  ctx.drawImage(hi, -hi.width * sc / 2, -hi.height * sc * 0.88, hi.width * sc, hi.height * sc); ctx.restore();
  ctx.restore();
}
bandPose = function (kind, t, x, y, s, extra = {}) {
  const e = rms(), k = kick();
  if (kind === 'drummer') { drummerAtKit(x, y, s * 1.25); return; }
  const H = 250 * s;
  ctx.save(); ctx.fillStyle = 'rgba(10,8,20,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 92 * s + 2, 52 * s, 10 * s, 0, 0, 7); ctx.fill(); ctx.restore();
  body(kind, x, y + 92 * s, H, {
    bob: -k * 8 * s, rot: Math.sin(BP * Math.PI * (kind === 'bassist' ? 0.5 : 1)) * 0.03 * (0.5 + e),
    head: Math.sin(BP * Math.PI) * 0.06 * (0.5 + e) + k * 0.06 + (extra.hT || 0) * 0.4, headImg: bandHead(kind), flip: extra.face === -1,
  });
};
drumKit = function (x, y, s, t) {
  const im = IMG.drums; if (!im) return; const k = kick();
  const w = 360 * s * (1 + k * 0.02), h = w * im.height / im.width; ctx.drawImage(im, x - w / 2, y + 112 * s - h, w, h);
};
bandAll = function (t, P) {
  bandPose('drummer', t, 640, 455, 1.0, {});
  drumKit(640, 520, 1.0, t);
  bandPose('bassist', t, 940, standY(670, 1.4), 1.4, {});
  bandPose('singer', t, 420, standY(690, 1.5), 1.5, {});
};

// ---------- painted backgrounds ----------
function coverBG(name, pan = 0, zoom = 1, yAlign = 1) {
  const im = IMG[name]; if (!im) return;
  const h = H * 1.04 * zoom, w = im.width * h / im.height;
  let x = -((pan % (2 * w)) + 2 * w) % (2 * w);
  const y = (H - h) * yAlign;
  for (let i = 0; x + i * w < W + w; i++) {
    const xx = x + i * w;
    if (i % 2) { ctx.save(); ctx.translate(xx + w, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); ctx.restore(); }
    else ctx.drawImage(im, xx, y, w, h);
  }
}
function tint(P) {
  if (P === PN) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(60,80,170,.75)'; ctx.fillRect(-2000, -2000, 6000, 6000); ctx.restore(); }
  if (P === PS) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,120,40,.6)'; ctx.fillRect(-2000, -2000, 6000, 6000); ctx.restore(); }
}
const KIT_SLOGANS = SLOGANS;
street = function (scroll, P, opt = {}) {
  const wall = opt.wallX !== undefined && Math.abs(scroll - (opt.wallX - 200)) < 1400;
  if (wall) {
    // poster wall in focus; pan follows the walk, kit band posters pasted over the old ones
    const im = IMG.bg_posters_s; const h = H * 1.04, w = im.width * h / im.height;
    const pan = clamp((scroll - opt.wallX + 500) * 0.35, 0, w - W);
    ctx.drawImage(im, -pan, H - h, w, h);
    const sl = (opt.wallOpts && opt.wallOpts.slogans) || KIT_SLOGANS;
    const pw = w * 0.085, ph = pw * 1.48;
    for (let i = 0; i < 3; i++) {
      if (opt.wallOpts && opt.wallOpts.skip && opt.wallOpts.skip(i)) continue;
      const fl = opt.wallOpts && opt.wallOpts.flutter ? opt.wallOpts.flutter(i) : 0;
      poster(-pan + w * (0.215 + i * 0.105), H - h + h * 0.36, pw, ph, i, sl[i], (i - 1) * 0.02 + fl * 0.03, 0.2);
    }
    if (opt.wallOpts && opt.wallOpts.graffiti !== undefined) graffitiText(-pan + w * 0.36, H - h + h * 0.75, opt.wallOpts.graffiti);
  } else if (opt.night) {
    coverBG('bg_night', scroll * 0.3);
  } else {
    coverBG('bg_street', scroll * 0.55);
  }
  tint(P);
  if (opt.mid) opt.mid();
};
rooftop = function (t, P) { coverBG('bg_stage', 0, 1.0); tint(P); stageLights(t, 0.5); };
function stageLights(t, amt) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const cols = ['rgba(80,140,255,', 'rgba(255,60,90,', 'rgba(255,190,60,', 'rgba(120,255,200,'];
  for (let i = 0; i < 6; i++) {
    const x0 = 160 + i * 190, a = Math.sin(BP * Math.PI / 2 + i * 1.3) * 0.35;
    const al = amt * (0.25 + 0.35 * kick() * (i % 2));
    const g = ctx.createLinearGradient(x0, 0, x0, H); g.addColorStop(0, cols[i % 4] + al + ')'); g.addColorStop(1, cols[i % 4] + '0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 8, -10); ctx.lineTo(x0 + 8, -10); ctx.lineTo(x0 + Math.sin(a) * 700 + 120, H); ctx.lineTo(x0 + Math.sin(a) * 700 - 120, H); ctx.fill();
  }
  ctx.restore();
}
soloBg = function (t) {
  coverBG('bg_stage', 0, 1.1, 0.5);
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-2000, -2000, 6000, 6000); ctx.restore();
  stageLights(t, 1.2);
  if (kick() > 0.8) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-2000, -2000, 6000, 6000); ctx.restore(); }
};
// posters: kit art + slogan strip
poster = function (x, y, w, h, who, slogan, rot = 0, tornAmt = 0.2, alpha = 1) {
  const im = IMG['poster' + who];
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);
  if (im) ctx.drawImage(im, -w / 2, -h / 2, w, h * 0.84);
  ctx.fillStyle = '#f4f1ea'; ctx.fillRect(-w / 2, -h / 2 + h * 0.84, w, h * 0.16); ctx.fillStyle = '#1f56b8'; ctx.fillRect(-w / 2, -h / 2 + h * 0.84, w, Math.max(2, h * 0.012));
  ctx.fillStyle = '#1f56b8'; ctx.font = `800 ${Math.max(8, Math.min(w * 0.13, 28))}px ${window.VFONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
  ctx.fillText(slogan, 0, -h / 2 + h * 0.92);
  ctx.restore();
};
// soft focus on drawn interiors: draw to an offscreen layer, blur it once
let OFF = null, OFFX = null;
function blurLayer(fn, px) {
  if (!OFF) { OFF = document.createElement('canvas'); OFF.width = c.width; OFF.height = c.height; OFFX = OFF.getContext('2d');
    OFFX.setTransform = function (a, b, cc, d, e, f) { if (typeof a === 'object') return RAWST.call(this, a); return RAWST.call(this, a * PS_, b * PS_, cc * PS_, d * PS_, e * PS_, f * PS_); }; }
  RAWST.call(OFFX, 1, 0, 0, 1, 0, 0); OFFX.clearRect(0, 0, OFF.width, OFF.height);
  RAWST.call(OFFX, ctx.getTransform());
  const C = ctx; ctx = OFFX; try { fn(); } finally { ctx = C; }
  ctx.save(); RAWST.call(ctx, 1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px * PS_}px)`; ctx.drawImage(OFF, 0, 0); ctx.restore();
}
for (const fn of ['bedroom', 'busInterior']) {
  const orig = window[fn];
  window[fn] = function (...a) { blurLayer(() => orig(...a), 2.2); };
}
bedroom = window.bedroom; busInterior = window.busInterior;
// night ride home + window: kit night skyline
const _s24 = shot24, _s25 = shot25;
shot24 = function (t, d) {
  bg('#141a33');
  ctx.save(); ctx.beginPath(); ctx.rect(120, 140, 1040, 300); ctx.clip();
  ctx.save(); ctx.translate(0, 60); coverBG('bg_night', t * 160, 0.62, 0); ctx.restore();
  for (let i = 0; i < 6; i++) { const x = ((i * 300 - t * 700) % 1800 + 1800) % 1800 - 200; { const g = ctx.createRadialGradient(x, 200, 0, x, 200, 60); g.addColorStop(0, "rgba(255,220,140,.45)"); g.addColorStop(1, "rgba(255,220,140,0)"); ctx.fillStyle = g; ctx.fillRect(x - 60, 140, 120, 120); } }
  ctx.restore();
  ctx.save(); ctx.fillStyle = '#2b3150'; ctx.fillRect(0, 0, W, 140); ctx.fillRect(0, 440, W, 300); ctx.fillRect(0, 0, 120, H); ctx.fillRect(1160, 0, 200, H);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = '#2f5d9e'; rr(80 + i * 330, 420, 140, 200, 14); ctx.fill(); } ctx.restore();
  ctx.fillStyle = 'rgba(160,200,255,.06)'; ctx.fillRect(120, 140, 1040, 300);
  man(Object.assign({}, HERO, { x: 760, y: 560, s: 1.4, face: -1, tA: -0.05, lL: [1.5, -1.4], lR: [1.45, -1.4], mood: 'tired', hT: 0.25 + Math.sin(t * 1.5) * 0.05, bag: false }));
};
shot25 = function (t, d) {
  bg('#2a2840');
  const wx = 380, wy = 90, ww = 520, wh = 440;
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  ctx.save(); ctx.translate(wx - 200, wy); coverBG('bg_night', 0, 0.62, 0); ctx.restore();
  const strip = 20 + ease(seg(t, 5.8, d)) * 900;
  ctx.fillStyle = 'rgba(120,180,255,.55)'; ctx.fillRect(wx + ww / 2 - strip / 2, wy, strip, wh);
  ctx.restore();
  ctx.fillStyle = '#4a4560'; ctx.fillRect(wx - 30, wy - 30, ww + 60, 30); ctx.fillRect(wx - 30, wy + wh, ww + 60, 30); ctx.fillRect(wx - 30, wy, 30, wh); ctx.fillRect(wx + ww, wy, 30, wh); ctx.fillRect(wx + ww / 2 - 6, wy, 12, wh);
  const lift = ease(seg(t, 3.2, 5.0));
  man(Object.assign({}, HERO, { x: 560, y: standY(720, 2.0), s: 2.0, face: 1, tA: lerp(0.2, 0.0, lift), mood: 'tired', hT: lerp(0.3, -0.5, lift), bag: false }));
  if (t > 6.5) flash(ease(seg(t, 6.5, d)) * 0.7, '200,230,255');
};
SHOTS.forEach(x => { if (x[2] === _s24) x[2] = shot24; if (x[2] === _s25) x[2] = shot25; });
// end card: kit title art
const _shot32 = shot32;
shot32 = function (t, d) {
  _shot32(t, d);
  const fa = seg(t, 9.0, 11.0);
  if (fa > 0.6 && IMG.title) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = seg(t, 10.5, 12) * (1 - seg(t, d - 0.8, d - 0.1));
    const tw = 760, th = tw * IMG.title.height / IMG.title.width; ctx.drawImage(IMG.title, W / 2 - tw / 2, H / 2 - th / 2, tw, th);
    ctx.restore();
  }
};
// swap in new shot functions inside SHOTS table
SHOTS.forEach(s => { if (s[2] === _shot32) s[2] = shot32; });

const _pinit = init;
init = async function (env) { await _pinit(env); await loadImgs(); };
