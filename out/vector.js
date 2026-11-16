// Flat vector-art style. Loaded after clip.js (no sprites, no collage). Overrides drawing primitives and characters.
const OUT = '#26283b';
jit = function () { K++; return 0; };
const _mapCol = c => (c === INK ? OUT : c);
line = function (pts, w = 6, col = INK) {
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.lineWidth = w; ctx.strokeStyle = _mapCol(col); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
};
poly = function (pts, fill, lw = 4, stroke = INK) {
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  else if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = _mapCol(stroke); ctx.lineJoin = 'round'; ctx.stroke(); }
};
rect = function (x, y, w, h, fill, lw = 4) {
  if (fill) { ctx.fillStyle = fill; rr(x, y, w, h, Math.min(6, Math.abs(w) / 4, Math.abs(h) / 4)); ctx.fill(); }
  else if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OUT; rr(x, y, w, h, 4); ctx.stroke(); }
};
function rr(x, y, w, h, r) { if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; } r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
circ = function (x, y, r, fill, lw = 5, stroke = INK) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  else if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = _mapCol(stroke); ctx.stroke(); }
};
ell = function (x, y, rx, ry, rot, fill, lw = 5) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  else if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke(); }
};
// flat palettes, a little cleaner
Object.assign(PV, { sky1: '#e8d9b5', sky2: '#f3e6c8', b: ['#d9c7a5', '#c9b18c', '#e3d3b4', '#bfa680', '#d4bd94'], win: '#7d6a55', walk: '#b8ad9c', road: '#585661', wall: '#bdb6a8' });
Object.assign(PC, { sky1: '#3a8ee6', sky2: '#a8d8ff', b: ['#f4ead6', '#ffd166', '#f4a988', '#cfe3ef', '#fff6ea'], win: '#4d7fc0', walk: '#cfc6b6', road: '#4f5160' });

// ---------- vector characters ----------
const SKIN = { hero: '#e7b48c', singer: '#d9a07a', drummer: '#d69a72', bassist: '#c98f6a', extra: '#e3b08a' };
const KIT = {
  hero: { shirt: '#6f6a3c', shirt2: '#57532e', tee: '#f2efe8', pants: '#3d3546', shoe: '#1f1f24', sole: '#f1f1f1', sleeveLong: true },
  singer: { shirt: '#2f2b36', shirt2: '#24212a', pants: '#2a2730', shoe: '#7a5233', sole: '#4a3220', sleeveLong: true, hood: true },
  drummer: { shirt: '#4b4256', shirt2: '#3c3445', pants: '#a58e64', shoe: '#1f1f24', sole: '#f1f1f1', sleeveLong: true, hood: true, cargo: true },
  bassist: { shirt: '#1d1d22', shirt2: '#141418', pants: '#2e2b30', shoe: '#141416', sole: '#3a3a3a', sleeveLong: false, cargo: true },
};
function shade(col, k) { // k<0 darker
  const n = parseInt(col.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
}
function cap(a, b, w, col) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); }
function star6(x, y, r, col) {
  ctx.fillStyle = col;
  for (const off of [0, Math.PI / 3]) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = off - Math.PI / 2 + i * Math.PI * 2 / 3; i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
}

head = function (kind, r, o) {
  const fr = !!o.front, sk = o.skin || SKIN[kind] || SKIN.extra, dk = shade(sk, -0.18);
  // hair behind
  if (kind === 'singer') { ctx.fillStyle = '#aeb4bb'; ctx.beginPath(); ctx.ellipse(fr ? 0 : -r * .15, -r * .25, r * 1.12, r * .95, 0, Math.PI, 0); ctx.fill(); }
  if (o.hat === 'long') { ctx.fillStyle = o.hatc || '#6b3b1f'; rr(-r * 1.05, -r * .9, r * 2.1, r * 2.0, r * .8); ctx.fill(); }
  if (kind === 'singer' || kind === 'drummer' || kind === 'bassist' || kind === 'hero') {
    // neck
    ctx.fillStyle = dk; ctx.fillRect(-r * .32, r * .5, r * .64, r * .7);
  }
  // ear (profile)
  if (!fr) { ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(-r * .18, r * .05, r * .2, r * .26, 0, 0, 7); ctx.fill(); }
  // face
  ctx.fillStyle = sk; ctx.beginPath(); ctx.ellipse(0, 0, r * .92, r, 0, 0, 7); ctx.fill();
  if (!fr) { ctx.beginPath(); ctx.moveTo(r * .75, -r * .1); ctx.lineTo(r * 1.05, r * .2); ctx.lineTo(r * .78, r * .32); ctx.fill(); } // nose
  // cheek shade
  ctx.fillStyle = 'rgba(120,60,40,.12)'; ctx.beginPath(); ctx.ellipse(fr ? -r * .45 : -r * .35, r * .25, r * .45, r * .55, 0, 0, 7); ctx.fill();
  // beards / stubble
  const beard = (col, top) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-r * .92, top * r); ctx.quadraticCurveTo(-r * .85, r * 1.25, fr ? 0 : r * .3, r * 1.18); ctx.quadraticCurveTo(r * .95, r * 1.1, r * .92, top * r); ctx.quadraticCurveTo(r * .5, r * .55, fr ? 0 : r * .45, r * .5); ctx.quadraticCurveTo(-r * .3, r * .45, -r * .92, top * r); ctx.fill(); };
  if (kind === 'drummer') beard('#3b2b20', 0.05);
  if (kind === 'bassist') beard('#262022', 0.15);
  if (kind === 'singer') beard('rgba(90,90,95,.45)', 0.25);
  if (kind === 'hero') beard('rgba(60,40,30,.22)', 0.3);
  // hair
  if (kind === 'hero') {
    ctx.fillStyle = '#3a2618';
    for (let i = 0; i < 11; i++) { const a = Math.PI * (0.95 + i / 10 * 1.1) + (fr ? 0 : -0.12); ctx.beginPath(); ctx.arc(Math.cos(a) * r * .9, Math.sin(a) * r * .88 - r * .05, r * .34, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(0, -r * .6, r * .85, r * .45, 0, 0, 7); ctx.fill();
  }
  if (kind === 'singer') {
    ctx.fillStyle = '#c4c9cf'; ctx.beginPath(); ctx.moveTo(-r * 1.0, r * .05); ctx.quadraticCurveTo(-r * 1.15, -r * 1.2, r * .2, -r * 1.12); ctx.quadraticCurveTo(r * 1.05, -r * 1.0, r * .98, -r * .3); ctx.quadraticCurveTo(r * .4, -r * .75, -r * .45, -r * .5); ctx.quadraticCurveTo(-r * .7, -r * .2, -r * 1.0, r * .05); ctx.fill();
    ctx.strokeStyle = '#8e959c'; ctx.lineWidth = r * .08; ctx.beginPath(); ctx.moveTo(-r * .6, -r * .75); ctx.quadraticCurveTo(0, -r * 1.0, r * .6, -r * .8); ctx.stroke();
  }
  if (kind === 'drummer') {
    ctx.fillStyle = '#3b2b20'; ctx.beginPath(); ctx.ellipse(0, -r * .55, r * .9, r * .5, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#16161a'; rr(-r * .85, -r * 1.0, r * .78, r * .3, r * .12); ctx.fill(); rr(r * .07, -r * 1.0, r * .78, r * .3, r * .12); ctx.fill(); // sunglasses on head
  }
  if (kind === 'bassist') {
    ctx.fillStyle = 'rgba(38,32,34,.55)'; ctx.beginPath(); ctx.ellipse(0, -r * .5, r * .93, r * .55, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#262022'; ctx.beginPath(); ctx.ellipse(fr ? 0 : r * .1, -r * .82, r * .42, r * .3, 0, 0, 7); ctx.fill();
  }
  if (o.hat === 'beret') { ctx.fillStyle = '#7b2f8c'; ctx.beginPath(); ctx.ellipse(r * .1, -r * .78, r * 1.05, r * .38, -0.2, 0, 7); ctx.fill(); }
  if (o.hat === 'cap') { ctx.fillStyle = o.hatc || '#2f6db3'; ctx.beginPath(); ctx.ellipse(0, -r * .55, r * .95, r * .55, 0, Math.PI, 0); ctx.fill(); rr(r * .3, -r * .62, r * 1.1, r * .2, r * .1); ctx.fill(); }
  if (o.hat === 'hair') { ctx.fillStyle = o.hatc || '#3b2a1e'; ctx.beginPath(); ctx.ellipse(0, -r * .5, r * .95, r * .6, 0, Math.PI, 0); ctx.fill(); }
  if (o.hat === 'long') { ctx.fillStyle = o.hatc || '#6b3b1f'; ctx.beginPath(); ctx.ellipse(0, -r * .5, r * 1.0, r * .62, 0, Math.PI, 0); ctx.fill(); }
  // eyes
  const mood = o.mood || 'neutral';
  const ex = fr ? [-r * .36, r * .36] : [r * .25, r * .62], ey = -r * .08;
  ex.forEach((x, i) => {
    ctx.fillStyle = '#1e1b22';
    if (mood === 'closed' || (o.eye1 && i === 0)) { cap([x - r * .14, ey], [x + r * .14, ey], r * .08, '#1e1b22'); }
    else { ctx.beginPath(); ctx.ellipse(x + (o.look || 0), ey + (o.lookY || 0), r * .09, r * .13, 0, 0, 7); ctx.fill(); }
    if (mood === 'tired') { ctx.fillStyle = sk; ctx.fillRect(x - r * .15, ey - r * .2, r * .3, r * .13); }
    // brows
    const by = ey - r * .3 + (mood === 'shout' ? -r * .06 : 0);
    cap([x - r * .16, by + (i ? -1 : 1) * (mood === 'shout' ? r * .05 : 0)], [x + r * .16, by], r * .09, kind === 'singer' ? '#7b7f86' : '#2a1d16');
  });
  // mouth
  const mx = fr ? 0 : r * .55, my = r * .5;
  ctx.fillStyle = '#5a1f1f';
  if (mood === 'fake') { ctx.beginPath(); ctx.moveTo(mx - r * .55, my - r * .1); ctx.quadraticCurveTo(mx, my + r * .65, mx + r * .55, my - r * .1); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(mx - r * .45, my - r * .08, r * .9, r * .14); }
  else if (o.mouth > 0.05 || mood === 'shout') { ctx.beginPath(); ctx.ellipse(mx, my, r * .2, r * .1 + r * .25 * (o.mouth || 0.8), 0, 0, 7); ctx.fill(); }
  else if (mood === 'smile' || mood === 'calm' || kind === 'drummer') { ctx.beginPath(); ctx.arc(mx, my - r * .2, r * (mood === 'calm' ? .2 : .32), 0.3, Math.PI - 0.3); ctx.lineWidth = r * .1; ctx.strokeStyle = '#5a1f1f'; ctx.lineCap = 'round'; ctx.stroke(); }
  else cap([mx - r * .18, my], [mx + r * .18, my + (mood === 'tired' ? r * .04 : 0)], r * .08, '#5a1f1f');
};

man = function (o) {
  const s = o.s || 1;
  ctx.save(); ctx.translate(o.x, o.y + (o.bob || 0) * s); ctx.scale(s * (o.face || 1) * (o.sx || 1), s * (o.sy || 1));
  const tA = o.tA || 0, TL = 60, UA = 33, LA = 33, TH = 46, SH = 46, HR = 20;
  const up = [Math.sin(tA), -Math.cos(tA)];
  const fr = o.front ? 1 : 0;
  const neck = [up[0] * TL, up[1] * TL];
  const shL = [up[0] * (TL - 8) - 14 * fr, up[1] * (TL - 8)], shR = [up[0] * (TL - 8) + 14 * fr, up[1] * (TL - 8)];
  const hpL = [-8 * fr, 0], hpR = [8 * fr, 0];
  const legL = o.fL ? ik(hpL, o.fL, TH, SH, 1) : limbA(hpL, ...(o.lL || [0.08, -0.05]), TH, SH);
  const legR = o.fR ? ik(hpR, o.fR, TH, SH, -1) : limbA(hpR, ...(o.lR || [-0.08, -0.05]), TH, SH);
  const armL = o.hL ? ik(shL, o.hL, UA, LA, o.bendL || 1) : limbA(shL, ...(o.aL || [0.15, 0.1]), UA, LA);
  const armR = o.hR ? ik(shR, o.hR, UA, LA, o.bendR || (fr ? -1 : 1)) : limbA(shR, ...(o.aR || [-0.15, 0.1]), UA, LA);
  const kit = KIT[o.kind];
  const sk = SKIN[o.kind] || SKIN.extra;
  let shirt = o.shirt === null ? '#eeeae2' : (o.shirt || '#8f8a80'), pants = o.pants === null ? '#dcd6cc' : (o.pants || '#40404a');
  let shoe = '#2a2a30', sole = '#e9e9e9', sleeveLong = !!o.shirt, hood = false, cargo = false;
  if (kit) {
    const forced = o.kind !== 'hero' || o.shirt === '#6b6a3a' || o.shirt === undefined;
    if (forced) { shirt = kit.shirt; sleeveLong = kit.sleeveLong; hood = kit.hood; }
    if (o.kind !== 'hero' || o.pants === '#5d5c32' || o.pants === undefined) { pants = kit.pants; cargo = !!kit.cargo; }
    shoe = kit.shoe; sole = kit.sole;
  }
  const shirt2 = shade(shirt, -0.2), pants2 = shade(pants, -0.22);
  const leg = (L, back) => {
    const c1 = back ? pants2 : pants;
    cap(L[0], L[1], 19, c1); cap(L[1], L[2], 16, c1);
    if (cargo) { const m = [(L[0][0] + L[1][0]) / 2, (L[0][1] + L[1][1]) / 2]; ctx.fillStyle = shade(c1, -0.15); rr(m[0] - 7, m[1] - 4, 14, 12, 3); ctx.fill(); }
    // shoe
    const f = L[2]; ctx.fillStyle = back ? shade(shoe, -0.2) : shoe; rr(f[0] - 7, f[1] - 4, 22, 11, 5); ctx.fill(); ctx.fillStyle = sole; ctx.fillRect(f[0] - 7, f[1] + 5, 22, 3);
  };
  const arm = (A, back) => {
    const sc = back ? shirt2 : shirt;
    cap(A[0], A[1], 15, sc);
    cap(A[1], A[2], 12, sleeveLong ? sc : (back ? shade(sk, -0.1) : sk));
    ctx.fillStyle = back ? shade(sk, -0.1) : sk; ctx.beginPath(); ctx.arc(A[2][0], A[2][1], 6.5, 0, 7); ctx.fill();
  };
  // backpack
  if ((o.bag || o.kind === 'hero') && !fr && o.bag !== false) { ctx.save(); ctx.translate(up[0] * 32 - 13, up[1] * 32); ctx.rotate(tA); ctx.fillStyle = o.kind === 'hero' ? '#b07a2e' : '#3f5f78'; rr(-15, -26, 20, 46, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.15)'; rr(-15, 4, 20, 16, 5); ctx.fill(); ctx.restore(); }
  if (hood) { ctx.save(); ctx.translate(neck[0], neck[1]); ctx.rotate(tA); ctx.fillStyle = shirt2; ctx.beginPath(); ctx.ellipse(fr ? 0 : -8, 2, 18, 10, 0, 0, 7); ctx.fill(); ctx.restore(); }
  arm(armL, true); leg(legL, true);
  // torso
  ctx.save(); ctx.rotate(tA);
  const tw = fr ? 36 : 28, bw = fr ? 30 : 26;
  ctx.fillStyle = shirt; ctx.beginPath(); ctx.moveTo(-bw / 2, 6); ctx.lineTo(-tw / 2, -TL + 10); ctx.quadraticCurveTo(0, -TL - 2, tw / 2, -TL + 10); ctx.lineTo(bw / 2, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.moveTo(-bw / 2, 6); ctx.lineTo(-tw / 2, -TL + 10); ctx.lineTo(-tw / 2 + 8, -TL + 10); ctx.lineTo(-bw / 2 + 7, 6); ctx.closePath(); ctx.fill();
  if (o.kind === 'hero' && shirt === kit.shirt) { // open jacket, white tee with red star
    ctx.fillStyle = kit.tee; if (fr) { ctx.fillRect(-7, -TL + 8, 14, TL - 6); star6(0, -TL / 2 - 4, 7, '#d6302a'); } else { ctx.fillRect(tw / 2 - 9, -TL + 9, 7, TL - 8); }
  }
  if (o.kind === 'bassist') { cap([-tw / 2 + 2, -TL + 10], [bw / 2, 0], 4, '#6b4a2e'); }
  if (o.tie) { ctx.fillStyle = o.tie; ctx.beginPath(); ctx.moveTo(-3, -TL + 8); ctx.lineTo(3, -TL + 8); ctx.lineTo(5, -TL + 34); ctx.lineTo(0, -TL + 40); ctx.lineTo(-5, -TL + 34); ctx.fill(); }
  ctx.fillStyle = pants; rr(-bw / 2, -4, bw, 12, 3); ctx.fill(); // belt line
  ctx.restore();
  if (o.inst) vInstrument(o);
  leg(legR, false);
  if (o.sticks) [armL, armR].forEach((A, i) => { const e = A[1], h = A[2]; const dx = h[0] - e[0], dy = h[1] - e[1], d = Math.hypot(dx, dy) || 1; const sa = o.sticks[i] || 0; const ca = Math.cos(sa), sn = Math.sin(sa); const vx = (dx * ca - dy * sn) / d, vy = (dx * sn + dy * ca) / d; cap([h[0] - vx * 6, h[1] - vy * 6], [h[0] + vx * 50, h[1] + vy * 50], 5, '#e3c184'); });
  arm(armR, false);
  if (o.cup) { const h = armR[2]; ctx.fillStyle = '#f4f1ea'; rr(h[0] - 7, h[1] - 18, 15, 20, 3); ctx.fill(); ctx.fillStyle = '#c8452f'; ctx.fillRect(h[0] - 7, h[1] - 12, 15, 5); }
  if (o.spray) { const h = armR[2]; ctx.fillStyle = '#e0362b'; rr(h[0] - 5, h[1] - 20, 11, 24, 3); ctx.fill(); }
  const ha = tA + (o.hT || 0);
  ctx.save(); ctx.translate(neck[0] + Math.sin(ha) * (HR + 2), neck[1] - Math.cos(ha) * (HR + 2)); ctx.rotate(ha);
  head(o.kind || 'extra', HR, o);
  ctx.restore();
  ctx.restore();
};
function vInstrument(o) {
  const bass = o.inst === 'bass';
  ctx.save(); ctx.translate(4, -14);
  const ang = -0.38, len = bass ? 120 : 92;
  const nx = -Math.cos(ang) * len, ny = Math.sin(ang) * len;
  cap([0, 0], [nx, ny], 8, '#5a3a22'); cap([0, 0], [nx, ny], 3, '#d8b47a');
  ctx.fillStyle = bass ? '#f0c23a' : '#2b2b2b'; ctx.save(); ctx.translate(nx, ny); ctx.rotate(-ang + Math.PI); rr(-4, -6, 16, 12, 3); ctx.fill(); ctx.restore();
  const col = bass ? '#f0c23a' : '#c8261f';
  ctx.save(); ctx.rotate(-ang * 0.6);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(12, 6, bass ? 26 : 24, bass ? 21 : 19, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-6, 3, bass ? 19 : 17, bass ? 17 : 15, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(14, 12, bass ? 22 : 20, bass ? 13 : 11, 0, 0, 7); ctx.fill();
  ctx.fillStyle = bass ? '#1d1d22' : '#f3efe4'; ctx.beginPath(); ctx.ellipse(6, 4, 14, 10, 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = '#9aa0a8'; ctx.fillRect(0, -2, 3, 12); ctx.fillRect(8, -2, 3, 12);
  ctx.restore();
  ctx.restore();
}
// drum kit in flat colors
drumKit = function (x, y, s, t) {
  const k = kick(), sn = snare();
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  cap([-110, -40], [-110, 60], 4, '#8b9098'); cap([115, -70], [115, 60], 4, '#8b9098');
  ell(-110, -42 - (sn > .5 ? 3 : 0), 34, 7, 0.1 + sn * .2, '#f2c418'); ell(115, -72, 44, 9, -0.2 - k * 0.25, '#f2c418');
  ctx.fillStyle = '#b81f22'; rr(-92, 8, 60, 22, 4); ctx.fill(); ell(-62, 8, 30, 10, 0, '#f1ece2');
  ell(-28, -26, 24, 11, 0, '#f1ece2'); ell(30, -26, 24, 11, 0, '#f1ece2');
  ctx.fillStyle = '#b81f22'; rr(40, 30, 60, 40, 4); ctx.fill(); ell(70, 30, 30, 11, 0, '#f1ece2');
  circ(0, 40 + k * 2, 58 + k * 4, '#c8261f'); circ(0, 40 + k * 2, 46 + k * 3, '#f4efe5');
  ctx.fillStyle = '#26283b'; ctx.font = `bold 15px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('קורקומיין', 0, 40 + k * 2);
  ctx.restore();
};
soloBg = function (t, a = '#e23b2e', b = '#f4c21b', c2 = '#2b5cd6') {
  bg(a);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.3);
  for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? b : c2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1600, i / 16 * Math.PI * 2, (i + 0.5) / 16 * Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 260 + kick() * 40, 0, 7); ctx.fill(); ctx.restore();
};
// clean overlays
overlays = function () {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, H * 1.0);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,10,30,.22)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
};
panelBorder = function () { };
subtitles = function () {
  for (const [a, b, s] of LYR) {
    if (T < a || T > b) continue;
    const pop = Math.min(ease(seg(T, a, a + 0.22)), ease(seg(T, b, b - 0.2)));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(W / 2, 660 + (1 - pop) * 14); ctx.globalAlpha = pop;
    ctx.font = `bold 34px ${FONT}`; ctx.direction = 'rtl'; const tw = ctx.measureText(s).width;
    ctx.fillStyle = 'rgba(20,22,40,.82)'; rr(-tw / 2 - 26, -30, tw + 52, 60, 30); ctx.fill();
    ctx.fillStyle = '#ffd166'; rr(-tw / 2 - 26, -30, 10, 60, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, 0, 2);
    ctx.restore();
  }
};
// vector posters: no torn raster, flat print
const _poster = poster;
poster = function (x, y, w, h, who, slogan, rot = 0, tornAmt = 0.2, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
  const x0 = -w / 2, y0 = -h / 2;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x0 + 5, y0 + 6, w, h);
  ctx.fillStyle = ['#1f56b8', '#e4572e', '#f2b134'][who]; ctx.fillRect(x0, y0, w, h);
  // sunburst
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h * .8); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.14)';
  for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, y0 + h * .42); ctx.arc(0, y0 + h * .42, h, i / 12 * Math.PI * 2, (i + .5) / 12 * Math.PI * 2); ctx.fill(); }
  const r = w * 0.26;
  ctx.translate(0, y0 + h * 0.44);
  ctx.fillStyle = ['#2f2b36', '#4b4256', '#1d1d22'][who]; ctx.beginPath(); ctx.moveTo(-r * 1.7, h * .45); ctx.quadraticCurveTo(-r * 1.6, r * 1.1, 0, r * 1.05); ctx.quadraticCurveTo(r * 1.6, r * 1.1, r * 1.7, h * .45); ctx.fill();
  head(['singer', 'drummer', 'bassist'][who], r, { front: true, mood: 'smile' });
  ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, y0 + h * .8, w, h * .2); ctx.fillStyle = '#1f56b8'; ctx.fillRect(x0, y0 + h * .8, w, 4);
  ctx.fillStyle = '#1f56b8'; ctx.font = `bold ${Math.min(w * 0.14, 28)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText(slogan, 0, y0 + h * 0.9);
  ctx.restore();
};
cloud = function (x, y, s, fill = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = fill;
  [[-50, 8, 30], [-18, -12, 38], [22, -8, 34], [52, 10, 26], [0, 14, 30]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, 7); ctx.fill(); });
  rr(-76, 6, 152, 30, 15); ctx.fill();
  ctx.fillStyle = 'rgba(80,120,170,.12)'; rr(-70, 22, 140, 14, 7); ctx.fill();
  ctx.restore();
};
