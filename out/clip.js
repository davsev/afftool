// Stickman comic-punk music video renderer. render(frame) draws one frame on #c.
const W = 1280, H = 720, FPS = 24;
const INK = '#16120f';
const FONT = '"DejaVu Sans", "FreeSans", sans-serif';
let c, ctx, F = 0, T = 0, BOIL = 0, K = 0, ENV = null, KD = [], SD = [], BP = 0;
let GRAIN, HALF;

// ---------- utils ----------
function h1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function jit(a = 2.2) { K++; return (h1(K * 7.13 + BOIL * 91.7) - 0.5) * a; }
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const kick = () => KD[F] || 0;
const snare = () => SD[F] || 0;
const rms = () => (ENV.rms[F] || 0);

function line(pts, w = 6, col = INK, j = 2.2) {
  ctx.beginPath();
  pts.forEach((p, i) => { const x = p[0] + jit(j), y = p[1] + jit(j); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function poly(pts, fill, lw = 4, stroke = INK, j = 2) {
  ctx.beginPath();
  pts.forEach((p, i) => { const x = p[0] + jit(j), y = p[1] + jit(j); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function rect(x, y, w, h, fill, lw = 4) { poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, lw); }
function circ(x, y, r, fill, lw = 5, stroke = INK) {
  ctx.beginPath(); ctx.arc(x + jit(1), y + jit(1), Math.max(0.1, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function ell(x, y, rx, ry, rot, fill, lw = 5) {
  ctx.beginPath(); ctx.ellipse(x + jit(1), y + jit(1), Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }
}
function text(s, x, y, size, col = INK, opts = {}) {
  ctx.save();
  ctx.font = `${opts.weight || 'bold'} ${size}px ${FONT}`;
  ctx.direction = opts.dir || 'rtl'; ctx.textAlign = opts.align || 'center'; ctx.textBaseline = 'middle';
  if (opts.rot) { ctx.translate(x, y); ctx.rotate(opts.rot); x = 0; y = 0; }
  if (opts.outline) { ctx.lineWidth = opts.outline; ctx.strokeStyle = opts.oc || INK; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
  ctx.restore();
}
function grad(y0, y1, cols) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  cols.forEach((cl, i) => g.addColorStop(i / (cols.length - 1), cl));
  return g;
}
function bg(fill) { ctx.fillStyle = fill; ctx.fillRect(-4000, -4000, 9000, 9000); }
function cam(z = 1, cx = W / 2, cy = H / 2, rot = 0, shake = 0) {
  ctx.translate(W / 2 + jit(shake * 2) * 3, H / 2 + jit(shake * 2) * 3);
  ctx.scale(z, z); ctx.rotate(rot); ctx.translate(-cx, -cy);
}
function burst(x, y, r, fill, n = 12) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * 0.6 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  poly(pts, fill, 5);
}
function bubble(x, y, w, h, tailX, tailY, fill = '#fff', jag = false) {
  if (jag) {
    const pts = []; const n = 18;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = i % 2 ? 0.78 : 1.05; pts.push([x + Math.cos(a) * w / 2 * k, y + Math.sin(a) * h / 2 * k]); }
    poly(pts, fill, 5);
  } else {
    poly([[x - 14, y + h / 2 - 8], [tailX, tailY], [x + 14, y + h / 2 - 8]], fill, 5);
    ell(x, y, w / 2, h / 2, 0, fill, 5);
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(x - 12, y + h / 2 - 10); ctx.lineTo(tailX, tailY - 6); ctx.lineTo(x + 12, y + h / 2 - 10); ctx.fill();
  }
}

// ---------- palettes ----------
const PV = { sky1: '#d9cfb4', sky2: '#c4b89a', b: ['#b9ae98', '#a69a83', '#c8bca2', '#9d917c', '#bfae8c'], win: '#6f6656', walk: '#9b9488', road: '#5f5b55', wall: '#a8a49b', acc: '#b8442f', yel: '#d8bf63' };
const PC = { sky1: '#2f7fe0', sky2: '#9fd2ff', b: ['#e8e2d2', '#f2d27a', '#e6b8a2', '#d9e4ea', '#f0efe8'], win: '#3b6ea8', walk: '#bdb7aa', road: '#55534f', wall: '#c9c6bd', acc: '#e0362b', yel: '#ffd43b' };
const PN = { sky1: '#0f1a36', sky2: '#2c4a86', b: ['#36405a', '#2c3550', '#414b66', '#30394f', '#3b4460'], win: '#f2d36b', walk: '#3f4252', road: '#23252e', wall: '#4b4e5c', acc: '#c4553f', yel: '#f2d36b' };
const PS = { sky1: '#2a5fc0', sky2: '#ff9a4a', b: ['#c98b6e', '#b77a62', '#d89a74', '#a86d58', '#c4856a'], win: '#ffd27a', walk: '#a8907e', road: '#5a4a44', wall: '#b59b8a', acc: '#e0362b', yel: '#ffcf4a' };

// ---------- kit puppets ----------
const SPR = {};
const RIG = { hero: { hx: [100, 267], ny: 150 }, singer: { hx: [116, 263], ny: 180 }, drummer: { hx: [105, 239], ny: 187 }, bassist: { hx: [84, 211], ny: 167 } };
function loadSprites() {
  if (window.NO_SPRITES) return Promise.resolve();
  const names = ['hero', 'singer', 'drummer', 'bassist', 'drums', 'poster0', 'poster1', 'poster2', 'logo'];
  return Promise.all(names.map(n => new Promise(r => { const i = new Image(); i.onload = () => { SPR[n] = i; r(); }; i.onerror = () => r(); i.src = (typeof SPRITE_DATA !== 'undefined' && SPRITE_DATA[n]) || ('kit/' + n + '.png'); })));
}
// draws sprite with its hip point (53% down) at (x, y)
function puppet(kind, x, y, h, o = {}) {
  const im = SPR[kind]; if (!im) return;
  const k = h / im.height, w = im.width * k, R = RIG[kind];
  const hip = h * 0.53;
  ctx.save(); ctx.translate(x, y + (o.bob || 0)); ctx.rotate(o.rot || 0); ctx.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
  if (o.clipHip) { ctx.beginPath(); ctx.rect(-w, -hip - 100, w * 2, hip + 100 + (o.clipHip || 0)); ctx.clip(); }
  const ox = -w / 2, oy = -hip;
  // shadow outline for comic pop
  const ny = R.ny * k, hx0 = R.hx[0] * k, hx1 = R.hx[1] * k;
  ctx.save(); ctx.beginPath();
  ctx.rect(ox - 60, oy + ny, w + 120, h + 60); ctx.rect(ox - 60, oy - 60, hx0 + 60, ny + 60); ctx.rect(ox + hx1, oy - 60, w - hx1 + 60, ny + 60);
  ctx.clip(); ctx.drawImage(im, ox, oy, w, h); ctx.restore();
  ctx.save(); const px = ox + (hx0 + hx1) / 2, py = oy + ny;
  ctx.translate(px, py); ctx.rotate(o.head || 0); ctx.translate(-px, -py);
  ctx.beginPath(); ctx.rect(ox + hx0, oy - 60, hx1 - hx0, ny + 60 + 10 * k); ctx.clip();
  ctx.drawImage(im, ox, oy, w, h); ctx.restore();
  ctx.restore();
}
function puppetFromMan(o) {
  const s = o.s || 1, h = 240 * s;
  const sitting = o.lL && o.lL[0] > 1.1;
  const yy = sitting || (o.tA || 0) < -0.6 ? o.y : o.y + 92 * s - 0.47 * h;
  const walk = o.lL && !sitting ? o.lL[0] : 0;
  const lying = (o.tA || 0) < -0.6;
  puppet(o.kind, o.x, yy, h, {
    flip: o.face === -1, bob: (o.bob || 0) * s * 1.6, rot: (o.tA || 0) * (lying ? 1 : 0.6) + walk * 0.09 * (o.face === -1 ? -1 : 1),
    head: clamp(o.hT || 0, -0.32, 0.4), sx: o.sx || 1, clipHip: sitting ? 6 : 0, sy: 1 - Math.abs(walk) * 0.03,
  });
  if (o.cup) { const hx = o.x + 40 * s * (o.face === -1 ? -1 : 1), hy = o.y - 40 * s; rect(hx - 8 * s, hy - 20 * s, 16 * s, 22 * s, '#f0ece2', 3); }
}

// ---------- stickman ----------
function ik(b, t, l1, l2, bend) {
  const dx = t[0] - b[0], dy = t[1] - b[1]; let d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 0.5); const a = Math.atan2(dy, dx);
  const ca = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1); const al = Math.acos(ca) * bend;
  const e = [b[0] + Math.cos(a + al) * l1, b[1] + Math.sin(a + al) * l1];
  const h = [b[0] + Math.cos(a) * d, b[1] + Math.sin(a) * d];
  return [b, e, h];
}
function limbA(b, a1, a2, l1, l2) {
  const k = [b[0] + Math.sin(a1) * l1, b[1] + Math.cos(a1) * l1];
  return [b, k, [k[0] + Math.sin(a1 + a2) * l2, k[1] + Math.cos(a1 + a2) * l2]];
}
function walkPose(ph, amp = 1) {
  const s = Math.sin(ph), cc = Math.cos(ph);
  return {
    lL: [0.45 * s * amp, -Math.max(0, -cc) * 0.8 * amp - 0.08], lR: [-0.45 * s * amp, -Math.max(0, cc) * 0.8 * amp - 0.08],
    aL: [-0.45 * s * amp, 0.35 + 0.3 * amp], aR: [0.45 * s * amp, 0.35 + 0.3 * amp], bob: -Math.abs(cc) * 5 * amp
  };
}
const HERO = { kind: 'hero', shirt: '#6b6a3a', pants: '#5d5c32', bag: true };
const UNI = { shirt: '#6b6a3a', pants: '#5d5c32' };

function head(kind, r, o) {
  // drawn at origin, already rotated. o.front: frontal view
  const fr = o.front;
  if (kind === 'singer') { // silver scruffy hair behind
    const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (1.05 + i / 14 * 0.95); const rr = r * (i % 2 ? 1.18 : 1.42); pts.push([Math.cos(a) * rr, Math.sin(a) * rr + 2]); }
    poly(pts, '#cdd2d6', 4);
  }
  circ(0, 0, r, o.skin || '#f3e2c7', 5);
  const ex = fr ? [-r * 0.36, r * 0.36] : [r * 0.15, r * 0.6];
  if (kind === 'hero') {
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.0 + i / 8 * 1.0) + (fr ? 0 : -0.15); circ(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, r * 0.32, '#2b1e15', 3); }
    // stubble
    ctx.fillStyle = 'rgba(40,30,25,.35)'; for (let i = 0; i < 10; i++) { ctx.fillRect((fr ? -r * .5 : -r * .1) + h1(i) * r * (fr ? 1 : .8), r * .45 + h1(i + 9) * r * .35, 2, 2); }
  }
  if (kind === 'singer') { ctx.fillStyle = 'rgba(120,120,120,.55)'; for (let i = 0; i < 16; i++) ctx.fillRect((fr ? -r * .55 : -r * .1) + h1(i * 3) * r * (fr ? 1.1 : .9), r * .4 + h1(i + 40) * r * .45, 2.5, 2.5); line([[-r * .5, -r * .62], [-r * .1, -r * .66]], 2); }
  if (kind === 'drummer') {
    poly([[-r, -r * .2], [-r * .9, -r * .8], [-r * .2, -r * 1.08], [r * .6, -r * .95], [r, -r * .3], [r * .7, -r * .55], [-r * .5, -r * .6]], '#5a3e2b', 3);
  }
  if (kind === 'bassist') {
    poly([[-r * .98, -r * .3], [-r * .95, -r * .75], [-r * .2, -r * 1.12], [r * .7, -r * .9], [r * 1.0, -r * .35], [r * .6, -r * .62], [-r * .6, -r * .6]], '#1e1916', 3);
    ctx.beginPath(); ctx.moveTo(-r * .97, r * .2); ctx.quadraticCurveTo(-r * .9, r * 1.35, 0, r * 1.38); ctx.quadraticCurveTo(r * .9, r * 1.35, r * .97, r * .2);
    ctx.quadraticCurveTo(r * .6, r * .78, 0, r * .72); ctx.quadraticCurveTo(-r * .6, r * .78, -r * .97, r * .2);
    ctx.fillStyle = '#2a201a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  if (o.hat === 'beret') poly([[-r * 1.05, -r * .35], [-r * .7, -r * 1.05], [r * .5, -r * 1.15], [r * 1.05, -r * .55]], '#7b2f8c', 4);
  if (o.hat === 'cap') { poly([[-r, -r * .3], [-r * .6, -r * 1.02], [r * .6, -r * 1.02], [r, -r * .3]], o.hatc || '#2f6db3', 4); line([[r * .6, -r * .32], [r * 1.6, -r * .3]], 6); }
  if (o.hat === 'hair') poly([[-r, -r * .2], [-r * .8, -r * 1.0], [r * .3, -r * 1.1], [r, -r * .4], [r * .2, -r * .7]], o.hatc || '#3b2a1e', 3);
  if (o.hat === 'long') poly([[-r * 1.1, r * .8], [-r * 1.05, -r * .5], [-r * .2, -r * 1.12], [r * .8, -r * .8], [r * 1.05, r * .1], [r * .5, -r * .5], [-r * .5, -r * .5], [-r * .6, r * .9]], o.hatc || '#6b3b1f', 3);
  if (o.hat === 'kova') poly([[-r * 1.15, -r * .35], [-r * .85, -r * .95], [r * .85, -r * .95], [r * 1.15, -r * .35]], '#e9e2c8', 4);
  // eyes
  const mood = o.mood || 'neutral';
  const ey = -r * 0.08;
  ex.forEach(x => {
    if (kind === 'drummer') { circ(x, ey, r * 0.27, 'rgba(255,255,255,.35)', 3); }
    if (mood === 'closed') { line([[x - 4, ey], [x + 4, ey]], 3); return; }
    circ(x + (o.look || 0), ey + (o.lookY || 0), 2.6, INK, 0);
    if (mood === 'tired') line([[x - 6, ey - 3], [x + 5, ey - 1]], 3);
    if (o.eye1 && x === ex[0]) line([[x - 6, ey - 1], [x + 5, ey - 1]], 4); // one eye shut
  });
  if (kind === 'drummer') line([[ex[0] + r * .27, ey], [ex[1] - r * .27, ey]], 3);
  // mouth
  const mx = fr ? 0 : r * 0.42, my = r * 0.48;
  if (mood === 'fake') { ctx.beginPath(); ctx.moveTo(mx - r * .6, my - 4); ctx.quadraticCurveTo(mx, my + r * .7, mx + r * .6, my - 4); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); line([[mx - r * .5, my + 2], [mx + r * .5, my + 2]], 2); }
  else if (o.mouth > 0.05) ell(mx, my, r * 0.18, r * 0.12 + r * 0.25 * o.mouth, 0, '#3a1010', 3);
  else if (mood === 'smile' || mood === 'calm') { ctx.beginPath(); ctx.arc(mx, my - r * .2, r * (mood === 'smile' ? .3 : .2), 0.35, Math.PI - 0.35); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  else if (mood === 'shout') ell(mx, my, r * .22, r * .3, 0, '#3a1010', 3);
  else if (mood === 'tired') line([[mx - r * .2, my + 2], [mx + r * .2, my - 1]], 3);
  else line([[mx - r * .2, my], [mx + r * .2, my]], 3);
}

function man(o) {
  if (RIG[o.kind] && SPR[o.kind]) { puppetFromMan(o); return; }
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
  const lw = 7, cl = o.shirt, pn = o.pants;
  const drawLimb = (L, col, full) => {
    if (col) { line(full ? L : L.slice(0, 2), 19, INK, 1.2); line(full ? L : L.slice(0, 2), 12, col, 0.8); }
    line(L, lw);
    if (col && !full) { } // forearm skin line already
    circ(L[2][0], L[2][1], 4, INK, 0);
  };
  // backpack
  if (o.bag && !fr) { ctx.save(); ctx.translate(up[0] * 30 - 14, up[1] * 30); ctx.rotate(tA); rect(-14, -24, 18, 44, '#3a5f7a', 4); ctx.restore(); }
  drawLimb(armL, cl, false); drawLimb(legL, pn, true);
  // torso
  if (cl) { line([[0, 0], neck], 26, INK, 1); line([[0, 0], [neck[0] * .97, neck[1] * .97]], 19, cl, 0.6); if (o.tie) line([[neck[0] * .9, neck[1] * .9], [neck[0] * .45, neck[1] * .45]], 5, o.tie); }
  else line([[0, 0], neck], lw);
  if (o.inst) instrument(o);
  drawLimb(legR, pn, true);
  if (o.sticks) [armL, armR].forEach((A, i) => { const e = A[1], h = A[2]; const dx = h[0] - e[0], dy = h[1] - e[1], d = Math.hypot(dx, dy) || 1; const sa = o.sticks[i] || 0; const ca = Math.cos(sa), sn = Math.sin(sa); const vx = (dx * ca - dy * sn) / d, vy = (dx * sn + dy * ca) / d; line([[h[0] - vx * 6, h[1] - vy * 6], [h[0] + vx * 48, h[1] + vy * 48]], 5, '#e8c98a'); line([[h[0] - vx * 6, h[1] - vy * 6], [h[0] + vx * 48, h[1] + vy * 48]], 1.5, INK); });
  drawLimb(armR, cl, false);
  if (o.cup) { const h = armR[2]; rect(h[0] - 6, h[1] - 16, 14, 18, '#f0ece2', 3); if (o.cupSpill) { ell(h[0] + 10, h[1] - 12, 8, 4, .3, '#6b3e1e', 2); } }
  if (o.spray) { const h = armR[2]; rect(h[0] - 5, h[1] - 18, 11, 22, '#e0362b', 3); }
  // head
  const ha = tA + (o.hT || 0);
  ctx.save(); ctx.translate(neck[0] + Math.sin(ha) * (HR + 2), neck[1] - Math.cos(ha) * (HR + 2)); ctx.rotate(ha);
  head(o.kind || 'extra', HR, o);
  ctx.restore();
  if (o.shrug) { line([shL, [shL[0] - 6, shL[1] - 10 * o.shrug]], 4); }
  ctx.restore();
}
function standY(g, s = 1) { return g - 92 * s; }

function instrument(o) {
  const bass = o.inst === 'bass';
  ctx.save(); ctx.translate(4, -14);
  const ang = -0.38, len = bass ? 120 : 92;
  const nx = -Math.cos(ang) * len, ny = Math.sin(ang) * len;
  // neck
  line([[0, 0], [nx, ny]], 9, '#4a2e1a', 0.5); line([[0, 0], [nx, ny]], 3, '#c9a46a', 0.3);
  rect(nx - 10, ny - 6, 12, 10, INK, 0);
  // body
  const col = bass ? '#1f3d5c' : '#c22a24';
  ctx.save(); ctx.rotate(-ang * 0.6);
  ell(10, 6, bass ? 26 : 24, bass ? 22 : 20, 0, col, 5); ell(-6, 4, bass ? 20 : 18, bass ? 18 : 16, 0, col, 5);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(10, 6, (bass ? 24 : 22), (bass ? 20 : 18), 0, 0, 7); ctx.fill();
  rect(-2, -1, 18, 12, bass ? '#d8d2c0' : '#f1e6c8', 2);
  ctx.restore();
  const n = bass ? 4 : 6; for (let i = 0; i < n; i++) line([[6, -4 + i * 1.6], [nx, ny - 2 + i * 1.2]], 0.8, '#ddd', 0);
  ctx.restore();
}
function bandPose(kind, t, x, y, s, extra = {}) {
  if (SPR[kind]) {
    const e = rms(), k = kick(), sn = snare();
    const sc = kind === 'drummer' ? 1.25 : 1.0;
    puppet(kind, x, y, 196 * s * sc, {
      bob: -k * 7 * s - (kind === 'drummer' ? sn * 5 * s : 0),
      rot: Math.sin(BP * Math.PI * (kind === 'bassist' ? 0.5 : 1)) * 0.035 * (0.5 + e),
      head: (extra.hT !== undefined ? extra.hT * 0.6 : 0) + Math.sin(BP * Math.PI) * 0.07 * (0.5 + e) + k * 0.08,
      sy: 1 - k * 0.025, flip: extra.face === -1,
    });
    return;
  }
  const e = rms(), k = kick(), sn = snare();
  const o = Object.assign({ kind, x, y, s, front: true, face: 1, mood: 'neutral' }, extra);
  if (kind === 'singer' || kind === 'bassist') {
    const bass = kind === 'bassist';
    const strum = Math.sin(BP * Math.PI * (bass ? 1 : 2)) * 8 * (0.4 + e);
    const ang = -0.38, len = bass ? 120 : 92;
    o.inst = bass ? 'bass' : 'guitar'; o.shirt = bass ? '#2b2b2b' : '#3d3d3d'; o.pants = '#2c3e5a';
    o.hL = [4 - Math.cos(ang) * len * (bass ? 0.62 : 0.68), -14 + Math.sin(ang) * len * 0.68 - 2]; o.bendL = -1;
    o.hR = [16 + strum * 0.3, -6 + strum]; o.bendR = -1;
    o.fL = [-26, 92]; o.fR = [26, 92];
    o.hT = Math.sin(BP * Math.PI) * 0.08 * (0.5 + e) + k * 0.12;
    o.bob = -k * 6;
    if (!bass) { o.mouth = clamp(e * 1.2 - 0.25); o.mood = 'neutral'; }
  }
  if (kind === 'drummer') {
    o.shirt = '#7a1f1f'; o.pants = '#2b2b2b';
    const L = Math.max(0, Math.sin(BP * Math.PI * 4)), R = sn;
    o.hL = [-34 + L * 4, 0 - 22 * (1 - k)]; o.hR = [34, 4 - 30 * (1 - Math.min(1, R * 1.5))]; o.bendL = 1; o.bendR = -1;
    o.sticks = [-0.6 - L * 0.4, 0.6 + (1 - R) * 0.5];
    o.lL = [0.9, -0.9]; o.lR = [-0.9, 0.9];
    o.hT = 0.1 * Math.sin(BP * Math.PI); o.bob = -k * 5;
  }
  man(o);
}
function drumKit(x, y, s, t) {
  const k = kick(), sn = snare();
  if (SPR.drums) { const im = SPR.drums, w = 330 * s * (1 + k * 0.03), h = w * im.height / im.width; ctx.drawImage(im, x - w / 2, y + 105 * s - h, w, h); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[-110, -40], [-110, 60]], 4); line([[115, -70], [115, 60]], 4);
  ell(-110, -42 - (sn > .5 ? 3 : 0), 34, 7, 0.1 + sn * .2, '#f2c418', 4); // hihat
  ell(115, -72, 44, 9, -0.2 - k * 0.25, '#f2c418', 4); // crash
  ell(-62, 8, 30, 14, 0, '#e8e2d2', 4); rect(-92, 8, 60, 22, '#c22a24', 4); // snare
  ell(-28, -26, 24, 12, 0, '#e8e2d2', 4); ell(30, -26, 24, 12, 0, '#e8e2d2', 4);
  circ(0, 40 + k * 2, 58 + k * 4, '#c22a24', 6); circ(0, 40 + k * 2, 44 + k * 3, '#efe7d6', 4);
  
  ell(70, 30, 30, 14, 0, '#e8e2d2', 4); rect(40, 30, 60, 40, '#c22a24', 4);
  ctx.restore();
}

// ---------- props ----------
function cloud(x, y, s, fill = '#fff') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  [[-50, 8, 30], [-18, -12, 38], [22, -8, 34], [52, 10, 26], [0, 14, 30]].forEach(p => circ(p[0], p[1], p[2], fill, 5));
  ctx.fillStyle = fill; [[-50, 8, 26], [-18, -12, 34], [22, -8, 30], [52, 10, 22], [0, 14, 26]].forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, 7); ctx.fill(); });
  ctx.fillRect(-60, 6, 120, 30); line([[-72, 34], [74, 34]], 5);
  ctx.restore();
}
function plane(x, y, s, rot = 0, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(-s, s); ctx.rotate(-rot);
  poly([[-10, -4], [-40, -70], [-26, -72], [22, -6]], '#e9edf2', 4); // far wing
  poly([[-10, 4], [-40, 70], [-26, 72], [22, 6]], '#e9edf2', 4);
  poly([[-78, 0], [-90, -26], [-82, -26], [-62, -2]], '#e9edf2', 4); poly([[-78, 0], [-90, 26], [-82, 26], [-62, 2]], '#e9edf2', 4);
  ell(0, 0, 92, 11, 0, '#f6f7f9', 5);
  ell(-14, -34, 13, 6, 0, '#b8c2cc', 3); ell(-14, 34, 13, 6, 0, '#b8c2cc', 3);
  line([[-86, 0], [-104, 0]], 6, '#c22a24');
  ctx.restore();
}
function building(x, y, w, h, col, P, seed, opt = {}) {
  rect(x, y - h, w, h, col, 4);
  const cols = Math.max(2, Math.floor(w / 46)), rows = Math.max(2, Math.floor(h / 58));
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const wx = x + 14 + q * ((w - 28) / cols), wy = y - h + 18 + r * ((h - 30) / rows);
    const ww = (w - 28) / cols - 12, wh = (h - 30) / rows - 22;
    if (wh < 6) continue;
    const lit = opt.night && h1(seed * 13 + r * 7 + q) > 0.45;
    rect(wx, wy, ww, wh, lit ? P.win : (h1(seed + r * 3 + q) > .7 ? '#5b5246' : P.win), 3);
    if (h1(seed * 3 + r + q * 5) > 0.72) { rect(wx + ww * 0.15, wy + wh + 2, ww * 0.6, 9, '#e8e4dc', 2); } // AC
    if (h1(seed * 5 + r * 11 + q) > 0.84) { line([[wx, wy + wh + 4], [wx + ww, wy + wh + 4]], 2); for (let i = 0; i < 3; i++) rect(wx + 4 + i * ww / 3.2, wy + wh + 4, ww / 5, 10, ['#d9534f', '#f0ad4e', '#5bc0de'][i], 1.5); }
  }
  // roof: solar heaters and dishes
  for (let i = 0; i < Math.floor(w / 60); i++) {
    const rx = x + 16 + i * 60 + h1(seed + i) * 20;
    if (h1(seed * 7 + i) > 0.4) { rect(rx, y - h - 20, 30, 14, '#d6d2c8', 3); poly([[rx - 4, y - h], [rx + 8, y - h - 14], [rx + 34, y - h - 14], [rx + 22, y - h]], '#2c3e5a', 3); }
    else { ell(rx + 10, y - h - 12, 10, 8, -0.5, '#eee', 3); line([[rx + 10, y - h - 6], [rx + 10, y - h]], 3); }
  }
}
function tree(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[0, 0], [0, -120], [-20, -150]], 10, '#5a3e2b'); line([[0, -110], [24, -140]], 7, '#5a3e2b');
  [[-36, -160, 36], [20, -175, 42], [42, -140, 30], [-10, -195, 34], [-44, -128, 26]].forEach(p => circ(p[0], p[1], p[2], '#6f8f3e', 4));
  ctx.restore();
}
function kiosk(x, y) {
  rect(x, y - 150, 170, 150, '#d9c79a', 4); rect(x - 10, y - 175, 190, 30, PV.acc, 4);
  text('קיוסק', x + 85, y - 160, 20, '#fff');
  rect(x + 20, y - 130, 130, 70, '#5b7d8f', 4);
  for (let i = 0; i < 5; i++) rect(x + 28 + i * 24, y - 52, 18, 26, ['#e0362b', '#2f6db3', '#f2c418', '#58a55c', '#fff'][i], 2);
}
function busStop(x, y, col = '#7b8b92') {
  line([[x, y], [x, y - 170]], 6); line([[x + 220, y], [x + 220, y - 170]], 6);
  poly([[x - 20, y - 170], [x + 240, y - 170], [x + 230, y - 186], [x - 10, y - 186]], col, 4);
  rect(x + 20, y - 150, 180, 90, 'rgba(200,225,235,.5)', 3);
  rect(x + 30, y - 52, 160, 10, '#6b5844', 3);
  line([[x + 250, y], [x + 250, y - 200]], 5); rect(x + 236, y - 236, 28, 36, '#2f6db3', 3); text('🚌', x + 250, y - 218, 16, '#fff');
}
function car(x, y, s, col, honk = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(-s, s);
  poly([[-120, -10], [-118, -48], [-70, -52], [-44, -92], [50, -92], [80, -54], [122, -46], [124, -10]], col, 5);
  rect(-34, -84, 40, 30, '#9cc3d5', 3); rect(12, -84, 36, 30, '#9cc3d5', 3);
  circ(-70, -8, 22, '#2a2a2a', 5); circ(-70, -8, 9, '#aaa', 3); circ(76, -8, 22, '#2a2a2a', 5); circ(76, -8, 9, '#aaa', 3);
  ctx.restore();
  if (honk > 0) { burst(x - 140 * s, y - 120 * s, 46 * honk, '#ffd43b', 10); text('טוּט!', x - 140 * s, y - 120 * s, 22 * honk, INK); }
}
function wires(scroll, y, n = 2) {
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(-200, y + i * 14); ctx.quadraticCurveTo(W / 2, y + 40 + i * 14, W + 200, y + i * 14 - 6); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
}

// posters
const SLOGANS = ['הפעם באמת', 'שינוי. עכשיו.', 'עתיד חדש'];
function poster(x, y, w, h, who, slogan, rot = 0, tornAmt = 0.2, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot);
  const x0 = -w / 2, y0 = -h / 2;
  // ragged edge
  const pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) pts.push([x0 + w * i / n, y0 + (h1(i + who * 9) - .5) * 4]);
  for (let i = 0; i <= n; i++) pts.push([x0 + w, y0 + h * i / n]);
  for (let i = n; i >= 0; i--) pts.push([x0 + w * i / n, y0 + h - (h1(i * 3 + who) < tornAmt ? 18 * h1(i + 4) : 0)]);
  poly(pts, '#f5f3ec', 3);
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  ctx.fillStyle = '#1f56b8'; ctx.fillRect(x0, y0, w, h * 0.1); ctx.fillRect(x0, y0 + h * 0.78, w, h * 0.22); ctx.fillStyle = '#c22a24'; ctx.fillRect(x0, y0 + h * 0.78, w, 5);
  ctx.fillStyle = '#e7eef9'; ctx.fillRect(x0, y0 + h * .1, w, h * .68);
  // star-ish stripe
  ctx.fillStyle = '#1f56b8'; ctx.fillRect(x0, y0 + h * .12, w, 3);
  if (SPR['poster' + who]) { ctx.drawImage(SPR['poster' + who], x0, y0, w, h * 0.8); }
  else {
  ctx.save(); ctx.translate(0, y0 + h * 0.46); const r = w * 0.26;
  line([[-r * 1.5, h * .3], [-r * .6, r * 1.2], [r * .6, r * 1.2], [r * 1.5, h * .3]], 4, INK);
  ctx.fillStyle = '#2c2c2c'; ctx.beginPath(); ctx.moveTo(-r * 1.5, h * .32); ctx.lineTo(-r * .6, r * 1.2); ctx.lineTo(r * .6, r * 1.2); ctx.lineTo(r * 1.5, h * .32); ctx.fill();
  poly([[-r * .25, r * 1.2], [0, r * 1.7], [r * .25, r * 1.2]], '#fff', 2);
  head(['singer', 'drummer', 'bassist'][who], r, { front: true, mood: 'smile' });
  ctx.restore();
  }
  text(slogan, 0, y0 + h * 0.89, Math.min(w * 0.15, 30), '#fff', { outline: 0 });
  ctx.restore();
  // graffiti scratch on poster
  ctx.restore();
}
function posterWall(x, y, w, h, P, variant = 0, opts = {}) {
  rect(x, y - h, w, h, P.wall, 5);
  for (let i = 1; i < 4; i++) line([[x + w * i / 4, y - h], [x + w * i / 4, y]], 2, 'rgba(0,0,0,.35)');
  ctx.fillStyle = 'rgba(80,70,60,.18)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x + h1(i + 3) * w, y - h1(i + 8) * h * .3 - 10, 30, 12, 0, 0, 7); ctx.fill(); }
  // old scraps
  for (let i = 0; i < 7; i++) { const sx = x + 20 + h1(i * 5 + variant) * (w - 80), sy = y - h + 20 + h1(i * 9) * (h - 80); poly([[sx, sy], [sx + 40, sy + 4], [sx + 34, sy + 30], [sx + 4, sy + 26]], ['#e9e4d6', '#d8c06a', '#b8d0e8'][i % 3], 2); }
  // graffiti tags
  ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = '#d23a7a'; ctx.beginPath();
  for (let i = 0; i < 18; i++) { const gx = x + 30 + i * 9, gy = y - 40 + Math.sin(i * 1.7) * 14; i ? ctx.lineTo(gx, gy) : ctx.moveTo(gx, gy); } ctx.stroke();
  ctx.strokeStyle = '#2a8a5c'; ctx.beginPath(); for (let i = 0; i < 14; i++) { const gx = x + w - 200 + i * 11, gy = y - 34 + Math.cos(i * 2.1) * 12; i ? ctx.lineTo(gx, gy) : ctx.moveTo(gx, gy); } ctx.stroke(); ctx.restore();
  const pw = Math.min(170, w / 3.8), ph = pw * 1.42, gap = (w - pw * 3) / 4;
  const sl = opts.slogans || SLOGANS;
  for (let i = 0; i < 3; i++) {
    const px = x + gap + i * (pw + gap), py = y - h + (h - ph) * 0.35;
    if (opts.skip && opts.skip(i, px, py, pw, ph)) continue;
    poster(px + 6, py + 4, pw, ph, i, sl[(i + 1) % 3], 0.03, .5, .5); // older layer underneath
    const fl = opts.flutter ? opts.flutter(i) : 0;
    poster(px, py, pw, ph, i, sl[i], (i - 1) * 0.02 + fl * 0.02, 0.25);
    if (fl) { poly([[px + pw, py], [px + pw - 30 * fl, py], [px + pw - 8, py + 30 * fl + 10]], '#f5f3ec', 3); }
  }
  if (opts.graffiti !== undefined) graffitiText(x + w / 2, y - 26, opts.graffiti);
}
function graffitiText(cx, cy, reveal) {
  if (reveal <= 0) return;
  const s = 'יהיה כאן טוב';
  ctx.save(); ctx.font = `bold 44px ${FONT}`; const tw = ctx.measureText(s).width + 20;
  ctx.beginPath(); ctx.rect(cx + tw / 2 - tw * reveal, cy - 40, tw * reveal, 80); ctx.clip();
  text(s, cx, cy, 44, '#ff5a3c', { outline: 9, rot: -0.03 });
  text(s, cx, cy, 44, '#ff5a3c', { outline: 0, rot: -0.03 });
  ctx.restore();
}

// ---------- street world ----------
function street(scroll, P, opt = {}) {
  const G = opt.ground || 600; // hero feet line
  ctx.fillStyle = grad(0, 470, [P.sky1, P.sky2]); ctx.fillRect(-2000, -2000, W + 4000, 2470);
  if (opt.sun) circ(1000, 120, 46, '#ffe08a', 4);
  // far layer
  const fs = scroll * 0.35;
  for (let i = Math.floor((fs - 300) / 240); i < (fs + W + 300) / 240; i++) {
    const bx = i * 240 - fs, bh = 220 + h1(i * 1.3) * 140;
    building(bx, 470, 200, bh, P.b[(i + 7) % 5], P, i + 500, { night: opt.night });
  }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-2000, 0, W + 4000, 470);
  // near layer
  for (let i = Math.floor((scroll - 400) / 330); i < (scroll + W + 400) / 330; i++) {
    const bx = i * 330 - scroll, bh = 300 + h1(i * 2.7) * 100;
    if (opt.wallX !== undefined && i * 330 + 300 > opt.wallX - 40 && i * 330 < opt.wallX + 820) { building(bx + 20, 470, 260, bh + 40, P.b[(i + 3) % 5], P, i, { night: opt.night }); continue; }
    building(bx + 10, 470, 300, bh, P.b[(i + 10) % 5], P, i, { night: opt.night });
  }
  wires(scroll, 150);
  // sidewalk + road
  ctx.fillStyle = P.walk; ctx.fillRect(-2000, 470, W + 4000, 180);
  for (let i = Math.floor((scroll - 200) / 90); i < (scroll + W + 200) / 90; i++) line([[i * 90 - scroll, 470], [i * 90 - scroll - 60, 650]], 2, 'rgba(0,0,0,.18)', 0.5);
  ctx.fillStyle = '#d8d4cc'; ctx.fillRect(-2000, 640, W + 4000, 14);
  for (let i = Math.floor(scroll / 60) - 2; i < (scroll + W) / 60 + 2; i++) { ctx.fillStyle = i % 2 ? '#e8e2d2' : '#2a2a2a'; ctx.fillRect(i * 60 - scroll, 640, 60, 14); }
  line([[-100, 640], [W + 100, 640]], 4); line([[-100, 654], [W + 100, 654]], 4);
  ctx.fillStyle = P.road; ctx.fillRect(-2000, 654, W + 4000, 200);
  // props at world positions
  const at = (wx, fn) => { const sx = wx - scroll; if (sx > -700 && sx < W + 500) fn(sx); };
  if (!opt.noKiosk) at(560, sx => kiosk(sx, 500));
  at(1350, sx => busStop(sx, 505));
  for (let i = 0; i < 12; i++) at(200 + i * 820, sx => tree(sx, 520, 1));
  for (let i = 0; i < 16; i++) at(i * 600 + 40, sx => { line([[sx, 520], [sx, 130]], 7, '#5a4a3a'); line([[sx - 30, 150], [sx + 30, 150]], 5, '#5a4a3a'); });
  if (opt.wallX !== undefined) at(opt.wallX, sx => posterWall(sx, 540, 780, 340, P, opt.wallVariant || 0, opt.wallOpts || {}));
  // trash bits
  for (let i = Math.floor(scroll / 140) - 1; i < (scroll + W) / 140 + 1; i++) if (h1(i * 4.1) > 0.6) { const tx = i * 140 - scroll + h1(i) * 80, ty = 560 + h1(i * 2) * 60; poly([[tx, ty], [tx + 14, ty - 4], [tx + 10, ty + 8]], ['#e9e4d6', '#c94', '#7ab'][i % 3], 2); }
  if (opt.mid) opt.mid();
}

// ---------- subtitles ----------
const LYR = [
  [0.8, 5.95, 'זהו סיפור פשוט על יום ראשון בבוקר'],
  [6.1, 11.95, 'עולה על מדים לפני שמתעורר'],
  [12.1, 14.85, 'חצי שעה של נסיעה'],
  [15.0, 18.05, 'ויום שלם של הצגה'],
  [18.2, 24.35, 'אך זה בסדר כי אני כבר מתרגל'],
  [24.5, 30.15, 'יצאתי מהבית וזה מה שראיתי'],
  [30.3, 35.95, 'עולם שלם פוליטיקאים וזונות'],
  [36.1, 38.95, 'יש חיילים בכל מקום'],
  [39.1, 42.05, 'ומדברים על השלום'],
  [42.2, 48.15, 'ואם אתה טיפה שונה אז אין לך מקום'],
  [48.3, 50.55, 'אבל הרמתי מבט וראיתי'],
  [50.7, 53.95, 'שמיים כחולים'],
  [54.1, 59.95, 'בשמיים ראיתי מטוס בין העננים'],
  [60.1, 61.55, 'הוא רחוק מאיתנו'],
  [61.7, 65.95, 'אותו כמעט לא רואים'],
  [66.1, 70.95, 'ואנחנו חולמים להיות שם בפנים'],
  [71.1, 78.0, 'וואו…'],
  [138.1, 143.95, 'שנים חולפות להן בדרך אל האושר'],
  [144.1, 149.95, 'הם מתחלפים ושום דבר לא משתנה'],
  [150.1, 152.85, 'חוזר הביתה מאוחר'],
  [153.0, 155.95, 'כי זה כל מה שלי נשאר'],
  [156.1, 160.65, 'לחשוב שיום אחד יהיה כאן טוב'],
  [160.8, 164.35, 'יהיה כאן טוב'],
  [164.5, 170.35, 'ולאהוב'],
  [170.5, 177.5, 'כן כן יהיה כאן טוב'],
  [183.2, 185.55, 'אבל הרמתי מבט וראיתי'],
  [185.7, 189.35, 'שמיים כחולים'],
  [189.5, 195.05, 'בשמיים ראיתי מטוס בין העננים'],
  [195.2, 201.35, 'הוא רחוק מאיתנו'],
  [201.5, 208.5, 'ואנחנו חולמים…'],
];
function subtitles() {
  for (const [a, b, s] of LYR) {
    if (T < a || T > b) continue;
    const pop = Math.min(ease(seg(T, a, a + 0.25)), ease(seg(T, b, b - 0.2)));
    ctx.save(); ctx.translate(W / 2, 664); ctx.rotate(-0.012); ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop); ctx.globalAlpha = pop;
    ctx.font = `bold 34px ${FONT}`; const tw = ctx.measureText(s).width;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(-tw / 2 - 22 + 6, -28 + 6, tw + 44, 56);
    rect(-tw / 2 - 22, -28, tw + 44, 56, '#f6e05e', 4);
    text(s, 0, 2, 34, INK);
    ctx.restore();
  }
}

// ---------- overlays ----------
function makeTextures() {
  GRAIN = document.createElement('canvas'); GRAIN.width = 512; GRAIN.height = 512;
  const g = GRAIN.getContext('2d'); const id = g.createImageData(512, 512);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  HALF = document.createElement('canvas'); HALF.width = 12; HALF.height = 12;
  const hctx = HALF.getContext('2d'); hctx.fillStyle = '#000'; hctx.beginPath(); hctx.arc(3, 3, 1.6, 0, 7); hctx.arc(9, 9, 1.6, 0, 7); hctx.fill();
}
function overlays() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.07; ctx.fillStyle = ctx.createPattern(HALF, 'repeat'); ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.22;
  const ox = Math.floor(h1(BOIL) * 512), oy = Math.floor(h1(BOIL + 5) * 512);
  ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, W + 512, H + 512);
  ctx.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,10,0,.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function panelBorder() { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.strokeRect(0, 0, W, H); ctx.restore(); }
function fadeBlack(a) { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${clamp(a)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function flash(a, col = '255,255,255') { if (a <= 0) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(${col},${clamp(a)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function curtains(closed) { // 0 open .. 1 closed
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const cw = W / 2 * closed + 60;
  for (const side of [0, 1]) {
    ctx.save(); if (side) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    poly([[-20, -20], [cw, -20], [cw - 20 + Math.sin(T * 3) * 6, H + 20], [-20, H + 20]], '#a3161a', 6);
    for (let i = 1; i < 6; i++) line([[cw * i / 6, 0], [cw * i / 6 - 10, H]], 4, '#6e0c10');
    ctx.restore();
  }
  poly([[-20, -20], [W + 20, -20], [W + 20, 60], [W * .75, 80], [W / 2, 62], [W * .25, 80], [-20, 60]], '#8a1014', 6);
  ctx.restore();
}
function inkSplat(x, y, r, col) {
  const pts = []; for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; const rr = r * (0.75 + h1(i * 3.3) * 0.4 + (i % 4 === 0 ? 0.25 : 0)); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  poly(pts, col, 0);
}

// ---------- shots ----------
function bedroom(P = PV) {
  bg('#c9b99a');
  rect(0, 0, W, 560, '#c9b99a', 0);
  for (let i = 0; i < 8; i++) line([[i * 170 + 40, 0], [i * 170 + 20, 560]], 2, 'rgba(0,0,0,.08)');
  // window with half-broken blinds
  rect(820, 80, 300, 240, '#f7e7a8', 6);
  for (let i = 0; i < 11; i++) { const broken = i === 4 || i === 7; line([[825, 92 + i * 21], [1115 - (broken ? 120 : 0), 92 + i * 21 + (broken ? 18 : 0)]], 8, '#8e7d5f', 1); }
  // sun stripes
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#fff2b0';
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(830, 120 + i * 36); ctx.lineTo(830, 132 + i * 36); ctx.lineTo(150, 520 + i * 40); ctx.lineTo(150, 500 + i * 40); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = '#8a7356'; ctx.fillRect(0, 560, W, 200); line([[0, 560], [W, 560]], 5);
  // poster on wall, laundry chair
  rect(120, 120, 140, 190, '#e0362b', 5); text('PUNK', 190, 215, 34, '#fff', { dir: 'ltr', rot: -0.1 });
}
function clock(x, y, s, ring) {
  ctx.save(); ctx.translate(x + (ring ? jit(10) : 0), y); ctx.scale(s, s); ctx.rotate(ring ? jit(0.05) : 0);
  rect(-150, -70, 300, 140, '#222', 8);
  rect(-130, -52, 260, 104, '#120806', 4);
  text('06:30', 0, 2, 82, '#ff3b2a', { dir: 'ltr', weight: 'bold' });
  if (ring) { [[-190, -90, -0.5], [190, -90, 0.5], [-210, 10, -1.4], [210, 10, 1.4]].forEach(([a, b, r]) => { line([[a, b], [a + Math.sin(r) * 40 * 0.0 + (a > 0 ? 30 : -30), b - 14]], 6); }); }
  ctx.restore();
}
function shot01(t, d) {
  bedroom();
  cam(1.9 + t * 0.03, 360, 470);
  // nightstand
  rect(160, 470, 420, 120, '#7a5a3a', 5);
  const ring = t > 0.9 && t < 3.7;
  clock(370, 410, 0.9, ring);
  if (ring) { burst(560, 300, 60 + Math.sin(t * 40) * 6, '#ffd43b', 12); text('טררר!', 560, 300, 30, INK); }
  // hand slams
  const hx = lerp(900, 420, ease(seg(t, 3.2, 3.7))), hy = lerp(200, 330, ease(seg(t, 3.2, 3.7)));
  if (t > 3.2) { line([[1100, 120], [hx, hy]], 30, INK, 1); line([[1100, 120], [hx, hy]], 22, '#f3e2c7', 1); circ(hx, hy, 26, '#f3e2c7', 6); }
  if (t > 3.7 && t < 4.2) { burst(420, 360, 120, '#fff', 14); text('בּוּם', 420, 360, 36, INK); }
}
function shot02(t, d) {
  bedroom();
  cam(1.05, 640, 380);
  // bed
  rect(260, 440, 700, 80, '#d9d2bf', 5); rect(250, 380, 40, 200, '#6b4a2e', 5); rect(950, 420, 30, 160, '#6b4a2e', 5);
  rect(280, 400, 140, 50, '#fff', 4); // pillow
  const sit = ease(seg(t, 1.6, 3.8)), droop = t > 3.8 ? 0.5 * Math.abs(Math.sin((t - 3.8) * 2.2)) : 0;
  // blanket under hero legs
  man(Object.assign({}, { kind: 'hero', x: 470, y: 440, s: 1.25, face: 1, tA: lerp(-1.5, 0.08, sit), lL: [1.55, 0], lR: [1.5, 0.05], aL: [lerp(-1.4, 0.4, sit), 0.3], aR: [lerp(-1.6, 0.6, sit), 0.6], hT: droop + (1 - sit) * 0.1, mood: t < 1 ? 'closed' : 'tired', eye1: t >= 1 && t < 1.6, lookY: -2, shirt: '#c8c2b5' }));
  poly([[520, 445], [960, 440], [960, 490], [520, 500]], '#6a86a8', 5);
  if (t > 4.4) text('…z', 540, 250, 36, INK, { dir: 'ltr' });
}
function shot03(t, d) {
  const i = Math.min(3, Math.floor(t / 1.15)), lt = t - i * 1.15;
  const cols = ['#e2d4b6', '#d8c4a2', '#cdbb98', '#e2d4b6'];
  bg(cols[i]);
  for (let k = 0; k < 10; k++) line([[k * 140, 0], [k * 140 - 200, H]], 30, 'rgba(255,255,255,.12)', 0);
  const base = { kind: 'hero', x: 640, y: 420, s: 2.6, face: 1, mood: 'tired', shirt: '#6b6a3a', pants: '#5d5c32' };
  if (i === 0) { ctx.save(); cam(1, 640, 300); const p = ease(seg(lt, 0, 0.8)); man(Object.assign(base, { y: 260, tA: 0.4, aL: [0.9, 0.2], aR: [0.8, 0.3], pants: null, shirt: null })); rect(560, 330 + (1 - p) * 160, 160, 120 - (1 - p) * 40, '#5d5c32', 6); text('זפּ!', 900, 200, 40, INK); ctx.restore(); }
  if (i === 1) { cam(1, 640, 300); const p = ease(seg(lt, 0, 0.9)); man(Object.assign(base, { y: 500, tA: 0.05, pants: null, shirt: p > 0.5 ? '#6b6a3a' : '#c8c2b5', aL: [lerp(-2.5, 0.3, p), 0.4], hR: [70, -90], cup: true, cupSpill: lt > 0.6 })); line([[460, 220], [560, 260]], 24, '#6b6a3a'); }
  if (i === 2) { cam(1, 640, 560); for (const [x, ph] of [[520, 0], [760, 1]]) { const lift = Math.max(0, Math.sin(lt * 6 + ph * 3)) * 40; poly([[x - 90, 640 - lift], [x + 90, 640 - lift], [x + 100, 600 - lift], [x - 40, 560 - lift], [x - 90, 560 - lift]], '#4a3a24', 6); line([[x - 60, 575 - lift], [x + 20, 590 - lift]], 3, '#ddd'); } text('טוּק טוּק', 640, 380, 40, INK); }
  if (i === 3) { cam(1.2, 640, 320); man(Object.assign(base, { y: 470, s: 2.2, tA: 0.1, hR: [60, -70], cup: true, cupSpill: true, aL: [0.4, 0.6] })); }
  // coffee stain fills screen at end
  const sp = seg(t, d - 0.75, d);
  if (sp > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); inkSplat(800, 330, 30 + sp * sp * 1100, '#5e3618'); }
}
function bus(x, y, s, door = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rect(0, -230, 700, 210, '#f1efe6', 6); rect(0, -80, 700, 30, '#2f8a5c', 4); rect(0, -230, 700, 20, '#2f8a5c', 4);
  for (let i = 0; i < 6; i++) rect(150 + i * 88, -196, 76, 90, '#9cc3d5', 4);
  rect(30, -200, 90 - door * 40, 180, '#7aa7bd', 4); if (door) rect(120 - door * 40, -200, door * 40, 180, '#2a2a2a', 3);
  rect(620, -200, 70, 30, INK, 0); text('ראשון', 655, -185, 16, '#ffb000');
  circ(150, -20, 34, '#2a2a2a', 6); circ(560, -20, 34, '#2a2a2a', 6); circ(150, -20, 13, '#aaa', 3); circ(560, -20, 13, '#aaa', 3);
  ctx.restore();
}
function shot04(t, d) {
  const scroll = 900 + t * 120;
  street(scroll, PV, { noKiosk: true });
  const bx = 1500 - scroll + Math.max(0, (seg(t, 0, 2.8) - 0.4)) * 80; // bus creeping then stops
  const door = ease(seg(t, 2.9, 3.4));
  bus(bx, 640, 0.95, door, t);
  // hero running
  const hx = lerp(80, 480, ease(seg(t, 0, 3.6)) * 0 + seg(t, 0, 3.6)) + (t > 3.6 ? 0 : 0);
  const squeeze = seg(t, 4.0, 5.0);
  if (t < 4.9) {
    const wp = walkPose(BP * Math.PI, 1.6);
    man(Object.assign({}, HERO, wp, { x: hx + squeeze * 90, y: standY(600, 1.2), s: 1.2, tA: 0.3, mood: 'shout', sx: 1 - squeeze * 0.6 }));
  }
  // crowd blobs in door
  if (door > 0.5) for (let i = 0; i < 3; i++) circ(bx + 70 * 0.95 + i * 14, 640 - 190 * 0.95 + i * 5, 14, '#f3e2c7', 4);
  if (t > 3.0 && t < 3.6) text('פְּשְׁשְׁ', bx + 100, 380, 26, INK);
}
function passenger(i, x, y, s, turn, t) {
  const hats = ['cap', 'hair', 'long', 'kippa', 'hair', 'cap', 'long', 'hair'];
  const sw = Math.sin(t * 2.2 + i) * 0.06;
  man({ kind: 'extra', x, y, s, face: i % 2 ? 1 : -1, front: turn > 0.5, tA: sw, hT: -sw, mood: turn > 0.5 ? 'fake' : 'tired', hat: hats[i % 8] === 'kippa' ? 'hair' : hats[i % 8], hatc: ['#3b2a1e', '#2f6db3', '#6b3b1f', '#888'][i % 4], shirt: ['#8f6f4f', '#4f6f8f', '#9a4f4f', '#6f8f5f', '#777'][i % 5], pants: '#3f3f4f', aL: [-2.9, 0.1], aR: [0.1, 0.2] });
}
function busInterior(t, P = PV, crowd = true) {
  bg('#cfc6ae');
  rect(-10, 120, W + 20, 300, '#e9e3d0', 5);
  for (let i = 0; i < 4; i++) { rect(60 + i * 310, 150, 260, 170, P === PN ? '#1d2c4f' : '#b8d3df', 6); }
  line([[0, 110], [W, 110]], 8, '#999'); for (let i = 0; i < 12; i++) { line([[60 + i * 105, 110], [60 + i * 105, 160]], 3); circ(60 + i * 105, 168, 9, null, 4); }
  ctx.fillStyle = '#7d7466'; ctx.fillRect(0, 600, W, 200); line([[0, 600], [W, 600]], 5);
}
function shot05(t, d) {
  const turn = seg(t, 1.6, 2.2);
  busInterior(t);
  cam(1.22 + 0.02 * Math.sin(t * 3), 640, 400, Math.sin(t * 2.5) * 0.008);
  const xs = [90, 230, 380, 860, 1010, 1160];
  xs.forEach((x, i) => passenger(i, x, standY(640, 1.25), 1.25, turn, t));
  const sh = t > 3.0 ? ease(seg(t, 3.0, 3.4)) - ease(seg(t, 4.2, 4.6)) : 0;
  man(Object.assign({}, HERO, { x: 640, y: standY(640, 1.3), s: 1.3, front: true, mood: 'tired', aL: [-0.9 * sh - 0.1, 1.2 * sh + 0.1], aR: [0.9 * sh + 0.1, -1.2 * sh - 0.1], hT: sh * 0.15, bag: false }));
  if (t > 1.0) curtains(clamp(ease(seg(t, 1.0, 1.6)) * 0.12 + ease(seg(t, d - 0.8, d))));
  if (t > 1.6 && t < d - 0.8) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); for (let i = 0; i < 3; i++) { const a = seg(t, 1.6 + i * .2, 2.3 + i * .2); if (a > 0) text('✦', 300 + i * 340, 90 + Math.sin(t * 5 + i) * 6, 40, '#ffd43b'); } ctx.restore(); }
}
function heroWalk(t, scroll, sx, s = 1.15, extra = {}) {
  const wp = walkPose(BP * Math.PI / 2, 1);
  man(Object.assign({}, HERO, wp, { x: sx, y: standY(600, s), s, mood: 'tired', hT: 0.05 }, extra));
}
function shot06(t, d) {
  const scroll = 200 + t * 140;
  street(scroll, PV, { wallX: 2600 });
  const cx = lerp(1700, -600, seg(t, 1.5, 5.0));
  car(cx, 720, 1.1, '#2f6db3', t > 2.4 && t < 3.6 ? 1 : 0);
  heroWalk(t, scroll, 400);
  if (t < 0.6) curtains(1 - ease(seg(t, 0, 0.6)));
}
function shot07(t, d) {
  const scroll = 1750 + ease(seg(t, 0, d)) * 1100;
  street(scroll, PV, { wallX: 2600 });
  heroWalk(t, scroll, 400 + t * 10);
}
function shot08(t, d) {
  // close-up peel
  const zo = ease(seg(t, d - 1.6, d));
  bg('#a8a49b');
  cam(lerp(2.6, 1.0, zo), lerp(450, 640, zo), lerp(330, 380, zo));
  street(2600 - 250, PV, { wallX: 2600, wallOpts: { skip: (i, px, py, pw, ph) => i === 0, flutter: i => 0 } });
  // the peeling stack on poster 0
  const px = 250 + (780 - 170 * 3) / 4, pw = 170, ph = pw * 1.42, py = 540 - 340 + (340 - ph) * 0.35;
  const layers = ['הפעם באמת', 'הפעם באמת!', 'הפעם באמת באמת', 'באמת הפעם'];
  const per = 1.25; const k = Math.min(3, Math.floor(t / per)); const lt = (t - k * per) / per;
  for (let L = 3; L >= k; L--) {
    if (L === k && k < 3) {
      // peeling top
      const p = ease(seg(lt, 0.25, 1));
      if (p >= 0.98) continue;
      poster(px + 3 * (L + 1), py + 2 * (L + 1), pw, ph, 0, layers[L + 1] || layers[3], 0.01, 0.2);
      ctx.save(); ctx.beginPath(); const cut = p * (pw + ph) * 1.1;
      ctx.moveTo(px - 10, py - 10); ctx.lineTo(px + pw + 10 - cut, py - 10); ctx.lineTo(px + pw + 10, py - 10 + cut); ctx.lineTo(px + pw + 10, py + ph + 20); ctx.lineTo(px - 10, py + ph + 20); ctx.closePath();
      if (p < 0.02) { ctx.restore(); poster(px, py, pw, ph, 0, layers[L], 0, 0.15); }
      else {
        ctx.clip(); poster(px, py, pw, ph, 0, layers[L], 0, 0.15); ctx.restore();
        const fx = px + pw - cut, fy = py + cut;
        poly([[Math.max(px, fx), py], [px + pw, Math.min(py + ph, fy)], [Math.max(px, fx) + cut * 0.25, Math.min(py + ph, fy) - cut * 0.5]], '#e9e5d8', 4);
      }
      for (let w = 0; w < 3; w++) line([[px + pw + 40 + w * 10, py + 30 + w * 40 + Math.sin(t * 9 + w) * 6], [px + pw + 140 + w * 10, py + 20 + w * 40]], 3, 'rgba(0,0,0,.5)');
      break;
    } else if (L === k) poster(px + 3 * L, py + 2 * L, pw, ph, 0, layers[L], 0, 0.15);
  }
  if (zo > 0) heroWalk(t, 2350 + t * 40, lerp(-200, 520, zo), 1.15);
}
function shot09(t, d) {
  const scroll = 1000 + t * 60;
  street(scroll, PV, {});
  // soldiers at bus stop (1350 world)
  const bx = 1350 - scroll;
  for (let i = 0; i < 3; i++) man(Object.assign({}, UNI, { kind: 'extra', x: bx + 50 + i * 60, y: standY(580, 1), s: 1, face: i === 1 ? -1 : 1, hat: 'beret', bag: true, mood: 'neutral', aL: [0.1, 0.3 + 0.2 * Math.sin(t * 2 + i)], aR: [-0.1 + (i === 2 ? 2.4 : 0), i === 2 ? 0.7 : 0.2], hT: Math.sin(t + i) * 0.05 }));
  // arguing pair
  const ax = 900 - t * 40;
  const g1 = Math.sin(t * 7), g2 = Math.sin(t * 7 + 2);
  man({ kind: 'extra', x: ax, y: standY(590, 1.05), s: 1.05, face: 1, mood: 'shout', hat: 'hair', shirt: '#9a4f4f', pants: '#333', aL: [1.7 + g1 * .5, 0.6], aR: [1.2 - g1 * .5, 0.9], tA: 0.1 });
  man({ kind: 'extra', x: ax + 110, y: standY(590, 1.05), s: 1.05, face: -1, mood: 'shout', hat: 'cap', hatc: '#2f6db3', shirt: '#4f6f8f', pants: '#333', aL: [1.6 + g2 * .5, 0.6], aR: [2.2 - g2 * .4, 0.5], tA: 0.1 });
  bubble(ax + 55, 330, 150, 70, ax + 55, 380, '#fff', true); text('!!?#!', ax + 55, 330, 26, INK, { dir: 'ltr' });
  // newspaper stand
  const nx = 620 - t * 60; rect(nx, 470, 120, 130, '#7a5a3a', 4); for (let i = 0; i < 3; i++) { rect(nx + 8 + i * 38, 480, 34, 46, '#f0ede4', 2); for (let l = 0; l < 4; l++) line([[nx + 12 + i * 38, 492 + l * 8], [nx + 38 + i * 38, 492 + l * 8]], 1.5); }
  heroWalk(t, scroll + t * 80, lerp(-60, 700, t / d));
}
function suit(x, y, s, side, talk, t) {
  man({ kind: 'extra', x, y, s, front: true, face: side, mood: talk > 0.5 ? 'shout' : 'neutral', hat: side > 0 ? 'hair' : 'cap', hatc: '#555', shirt: '#2a2f3a', pants: '#2a2f3a', tie: side > 0 ? '#c22a24' : '#2f6db3', aL: [-1.3 - talk * Math.sin(t * 12) * 0.5, -0.8], aR: [0.3, 0.4] });
}
function shot10(t, d) {
  bg('#4b4e5c');
  // shop window frame
  rect(40, 40, 1200, 640, '#3a3a40', 8);
  rect(140, 110, 1000, 520, '#222', 10);
  // studio inside tv
  ctx.save(); ctx.beginPath(); ctx.rect(160, 130, 960, 480); ctx.clip();
  ctx.fillStyle = grad(130, 610, ['#1f3a7a', '#5a7fc6']); ctx.fillRect(160, 130, 960, 480);
  for (let i = 0; i < 9; i++) line([[160 + i * 120, 130], [160 + i * 120, 610]], 2, 'rgba(255,255,255,.15)');
  rect(160, 500, 960, 110, '#c22a24', 4); text('פאנל חם', 640, 556, 34, '#fff');
  const talkA = Math.sin(t * 3) > 0 ? 1 : 0;
  suit(420, 430, 1.6, 1, talkA, t); suit(860, 430, 1.6, -1, 1 - talkA, t);
  rect(300, 470, 680, 40, '#8a6a4a', 4);
  // bubbles growing over faces
  const b1 = ease(seg(t, 0.6, 2.2)), b2 = ease(seg(t, 1.6, 3.2));
  const bl = Math.min(1, 0.5 + kick() * 0.2);
  if (b1 > 0) { bubble(430, 230, 360 * b1 * (0.95 + bl * 0.1), 220 * b1, 470, 330, '#fff', false); text('#@!%&!', 430, 230, 48 * b1, INK, { dir: 'ltr' }); }
  if (b2 > 0) { bubble(860, 220, 380 * b2, 230 * b2, 820, 330, '#ffeb6b', true); text('בלה בלה!!', 860, 220, 44 * b2, INK); }
  const b3 = ease(seg(t, 3.2, 4.4)); if (b3 > 0) { bubble(640, 380, 700 * b3, 300 * b3, 640, 600, '#fff', true); text('שָׁלוֹם?!  #@%!', 640, 380, 54 * b3, INK); }
  ctx.restore();
  // window glare
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(200 + t * 40, 40); ctx.lineTo(320 + t * 40, 40); ctx.lineTo(120 + t * 40, 680); ctx.lineTo(0 + t * 40, 680); ctx.fill(); ctx.restore();
  // hero reflection silhouette passing
  ctx.save(); ctx.globalAlpha = 0.14; heroWalk(t, t * 120, lerp(1300, -100, t / d), 2.4, { mood: 'tired', face: -1 }); ctx.restore();
}
function shot11(t, d) {
  const z = lerp(1.5, 0.75, ease(t / d));
  bg(PV.sky1);
  cam(z, 640, 480);
  street(900, PV, {});
  // bench
  const shrink = ease(seg(t, 1.5, 3.0));
  const bw = lerp(420, 250, shrink), bx = 520;
  rect(bx, 540, bw, 16, '#8a6a4a', 4); rect(bx, 500, bw, 14, '#8a6a4a', 4);
  line([[bx + 20, 556], [bx + 20, 600]], 6); line([[bx + bw - 20, 556], [bx + bw - 20, 600]], 6);
  const sitters = [0, 1, 2];
  sitters.forEach(i => {
    const x = bx + 50 + i * lerp(110, 75, shrink) + shrink * 10;
    man({ kind: 'extra', x, y: 538, s: 0.95, face: 1, lL: [1.4, -1.4], lR: [1.35, -1.35], tA: -0.05 + Math.sin(t * 2 + i) * .03, hat: ['cap', 'long', 'hair'][i], hatc: ['#c22a24', '#6b3b1f', '#444'][i], shirt: ['#8f6f4f', '#4f6f8f', '#9a4f4f'][i], pants: '#334', aL: [0.6, 0.4], aR: [0.5, 0.5], mood: 'neutral' });
  });
  const hx = lerp(150, 420, ease(seg(t, 0, 1.6)));
  const wp = t < 1.6 ? walkPose(BP * Math.PI / 2, 1) : {};
  man(Object.assign({}, HERO, wp, { x: hx, y: standY(600, 1.15), s: 1.15, face: 1, mood: 'tired', tA: t > 1.6 && t < 2.6 ? -0.2 * (1 - seg(t, 2.2, 2.6)) : 0 }));
}
function shot12(t, d) {
  // crowd moves, hero still; tilt up
  const tilt = ease(seg(t, 2.6, d));
  bg(PV.sky1);
  cam(lerp(2.2, 1.3, tilt), 420, lerp(370, -260, tilt));
  street(1200, { ...PV, sky1: '#7fb2e6', sky2: '#c9ddea' }, {});
  ctx.save(); ctx.globalAlpha = 0.35;
  for (let i = 0; i < 6; i++) { const x = ((i * 260 + t * (i % 2 ? 260 : -220)) % 1600 + 1600) % 1600 - 200; man({ kind: 'extra', x, y: standY(610, 1.1), s: 1.1, face: i % 2 ? 1 : -1, ...walkPose(t * 10 + i, 1), shirt: '#888', pants: '#666', hat: 'hair', hatc: '#555' }); }
  ctx.restore();
  const look = ease(seg(t, 1.2, 2.6));
  man(Object.assign({}, HERO, { x: 420, y: standY(600, 1.2), s: 1.2, face: 1, mood: 'neutral', hT: -0.9 * look, lookY: -3 * look }));
}
function skyScene(t, opts = {}) {
  ctx.fillStyle = grad(0, H, opts.cols || ['#1f6fd6', '#7fc2ff', '#d8efff']); ctx.fillRect(-500, -500, W + 1000, H + 1000);
  circ(1080, 120, 60, '#fff3a8', 0); ctx.globalAlpha = 0.3; circ(1080, 120, 90, '#fff3a8', 0); ctx.globalAlpha = 1;
  const cl = opts.clouds || [[100, 200, 1.1], [520, 120, 0.8], [880, 300, 1.3], [300, 520, 1.5], [1100, 560, 1.0]];
  cl.forEach(([x, y, s], i) => cloud(((x + t * (10 + i * 4)) % 1600 + 1600) % 1600 - 160, y, s));
}
function shot13(t, d) { cam(1 + t * 0.01, 640, 360); skyScene(t); if (t < 0.3) flash(1 - t / 0.3); }
function shot14(t, d) {
  skyScene(t + 5);
  const px = lerp(1400, 240, t / d), py = lerp(330, 250, t / d);
  plane(px, py, 0.9, -0.06);
  // contrail
  line([[px + 90, py + 4], [px + 600, py + 40]], 3, 'rgba(255,255,255,.8)', 0.4);
  // morph wing line -> guitar neck
  const m = ease(seg(t, d - 0.6, d));
  if (m > 0) { flash(m * 0.8); line([[lerp(px - 40, 200, m), lerp(py - 70, 600, m)], [lerp(px + 22, 1100, m), lerp(py - 6, 140, m)]], lerp(6, 40, m), INK, 0); }
}
function rooftop(t, P, z = 1, cy = 400) {
  ctx.fillStyle = grad(0, H, [P.sky1, P.sky2]); ctx.fillRect(-1000, -1000, W + 2000, H + 2000);
  if (P === PS) { circ(640, 560, 120, '#ffcf6a', 0); }
  for (let i = -2; i < 9; i++) { const bh = 80 + h1(i + 40) * 140; building(i * 180, 600, 160, bh, P.b[(i + 12) % 5], P, i + 90); }
  ctx.fillStyle = '#8e8a82'; ctx.fillRect(-1000, 600, W + 2000, 400); line([[-1000, 600], [W + 1000, 600]], 6);
  rect(-100, 640, W + 200, 30, '#a39e94', 5);
  rect(60, 520, 70, 40, '#d6d2c8', 4); poly([[40, 600], [70, 560], [140, 560], [150, 600]], '#2c3e5a', 4);
  line([[1180, 600], [1180, 380], [1150, 400]], 5); line([[1180, 420], [1220, 400]], 4);
}
function bandAll(t, P) {
  drumKit(640, 520, 1.0, t);
  bandPose('drummer', t, 640, 470, 1.0, {});
  drumKit(640, 520, 1.0, t); // kit front again over legs (cheap layering)
  // re-draw drummer upper body above kit
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 470); ctx.clip(); bandPose('drummer', t, 640, 470, 1.0, {}); ctx.restore();
  bandPose('bassist', t, 930, standY(660, 1.45), 1.45, {});
  // mic stand
  line([[470, 660], [470, 420], [440, 400]], 5); circ(436, 398, 8, '#333', 3);
  bandPose('singer', t, 440, standY(680, 1.6), 1.6, {});
}
function shot15(t, d) { rooftop(t, PC); cam(1 + t * 0.02, 640, 420, Math.sin(t * 1.4) * 0.01, kick() * 0.6); bandAll(t, PC); }
function shot16(t, d) {
  const dream = Math.min(ease(seg(t, 1.6, 2.4)), 1 - ease(seg(t, 6.2, 7.0)));
  if (dream < 1) {
    ctx.save(); cam(1.6, 420, 120);
    street(1200, { ...PC, sky1: '#2f7fe0', sky2: '#9fd2ff' }, {});
    ctx.restore(); ctx.save(); cam(1.6, 420, 120);
    man(Object.assign({}, HERO, { x: 420, y: standY(600, 1.2), s: 1.2, face: 1, mood: 'neutral', hT: -0.9, lookY: -3 }));
    plane(820 - t * 20, -120, 0.3, -0.05);
    ctx.restore();
  }
  if (dream > 0) {
    ctx.save(); ctx.globalAlpha = dream; ctx.setTransform(1, 0, 0, 1, 0, 0);
    bg('#d8d4cc');
    // window view
    ctx.save(); ctx.beginPath(); ctx.ellipse(820, 330, 200, 250, 0, 0, 7); ctx.clip();
    ctx.fillStyle = grad(80, 600, ['#4a9cf0', '#bfe2ff']); ctx.fillRect(600, 60, 440, 560);
    // city from above
    for (let i = 0; i < 40; i++) { const gx = 620 + (i % 8) * 52 + ((t * 20) % 52), gy = 420 + Math.floor(i / 8) * 40; rect(gx, gy, 36, 26, ['#e8e2d2', '#c9bca2', '#d6a58e'][i % 3], 2); }
    cloud(780 - t * 30, 360, 0.6); cloud(960 - t * 20, 300, 0.5);
    ctx.restore();
    ell(820, 330, 200, 250, 0, null, 14);
    ell(820, 330, 222, 272, 0, null, 6);
    // seat + hero sitting looking out
    rect(170, 220, 160, 420, '#2f6db3', 6);
    man(Object.assign({}, HERO, { x: 380, y: 520, s: 2.1, face: 1, tA: 0.1, lL: [1.5, -1.4], lR: [1.45, -1.4], mood: 'calm', hT: 0.05, aL: [0.4, 1.1], aR: [0.6, 1.0], bag: false }));
    ctx.restore();
  }
}
function shot17(t, d) {
  rooftop(t, PC);
  const split = ease(seg(t, 3.5, d));
  if (split > 0) {
    // ink line slicing frame diagonally
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-50, 720); ctx.lineTo(-50 + 1400 * split, 720 - 800 * split); ctx.lineTo(-30 + 1400 * split, 740 - 800 * split); ctx.lineTo(-30, 740); ctx.fill();
    ctx.restore();
  }
  cam(2.2, 470, 420, -0.04 + Math.sin(t * 2) * 0.02, kick() * 0.8);
  bandPose('singer', t, 440, standY(680, 1.6), 1.6, {});
  // strum ink trail
  const st = Math.sin(BP * Math.PI * 2);
  line([[470, 440 + st * 30], [530, 420 + st * 40]], 4 + rms() * 6, INK);
  if (split > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); const L = 1400 * split; line([[-40, 730], [-40 + L, 730 - L * 0.57]], 18, INK, 1); }
}
function soloBg(t, a = '#e23b2e', b = '#f4c21b', c2 = '#2b5cd6') {
  bg(a);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.3);
  for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? b : c2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1600, i / 16 * Math.PI * 2, (i + 0.5) / 16 * Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = ctx.createPattern(HALF, 'repeat'); ctx.scale(3, 3); ctx.fillRect(0, 0, W, H); ctx.restore();
}
function shot18(t, d) {
  soloBg(t);
  // peeling poster in bg, wind
  const px = 900, py = 120;
  ctx.save(); ctx.translate(Math.sin(t * Math.PI * 2) * 20, 0);
  rect(760, 80, 500, 520, PV.wall, 5);
  poster(px, py, 200, 284, 2, 'הפעם באמת', 0.05 + Math.sin(t * 6) * 0.04, 0.4);
  poly([[px + 200, py], [px + 200 - 60 - Math.sin(t * 8) * 20, py], [px + 200, py + 60 + Math.sin(t * 8) * 20]], '#e9e5d8', 4);
  ctx.restore();
  const sway = Math.sin(BP * Math.PI / 2) * 60;
  cam(1.9, 900 + sway, 420, Math.sin(BP * Math.PI / 2) * 0.05, kick() * 0.7);
  bandPose('bassist', t, 900, standY(660, 1.45), 1.45, { hT: Math.sin(BP * Math.PI) * 0.15 });
}
function shot19(t, d) {
  soloBg(t, '#2b5cd6', '#e23b2e', '#f4c21b');
  const k = kick(), sn = snare();
  // ink rings and yellow rings
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let j = 0; j < 6; j++) { const f = F - j * 4; const kk = KD[f] || 0, ss = SD[f] || 0; const r = j * 90 + ((T * 24) % 4) * 22; if (kk > 0.5) { ctx.globalAlpha = 0.6 * (1 - j / 6); circ(640, 420, r + 60, null, 18 * kk, INK); } if (ss > 0.5) { ctx.globalAlpha = 0.7 * (1 - j / 6); circ(640, 300, r + 40, null, 14, '#ffd43b'); } }
  ctx.restore();
  const close = Math.floor(BP / 4) % 2;
  cam(close ? 2.1 : 1.45, 640, close ? 420 : 470, 0, k * 0.9);
  drumKit(640, 520, 1.0, t);
  bandPose('drummer', t, 640, 470, 1.0, {});
  ctx.save(); ctx.beginPath(); ctx.rect(400, 470, 500, 200); ctx.clip(); drumKit(640, 520, 1.0, t); ctx.restore();
  if (k > 0.8) burst(560 + h1(F) * 160, 340, 50, '#fff', 9);
}
function shot20(t, d) {
  const fold = Math.sin(t * 1.3) * 0.25 + 0.15;
  const corner = t > 5;
  const scroll = corner ? 2350 + (t - 5) * 70 : 300 + t * 220;
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.transform(1, Math.sin(t * 2.2) * 0.12, fold * 0.6, 1, 0, 0); ctx.scale(1 + 0.1 * Math.sin(t * 3), 1 - 0.08 * Math.sin(t * 3)); ctx.translate(-W / 2, -H / 2);
  street(scroll, { ...PV, sky1: '#e23b2e', sky2: '#f4c21b' }, { wallX: corner ? 2600 : 99999, wallOpts: { flutter: i => 0.6 + Math.sin(t * 9 + i) * 0.4 } });
  ctx.restore();
  // comic page gutters tearing
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = 0.5 + 0.5 * Math.sin(t * 2);
  ctx.fillStyle = '#f5f3ec'; ctx.fillRect(W * 0.38 + g * 30, 0, 18 + g * 30, H); ctx.fillRect(0, H * 0.45 - g * 20, W, 14 + g * 18);
  line([[W * 0.38 + g * 30, 0], [W * 0.38 + g * 30, H]], 5); line([[W * 0.38 + g * 60 + 18, 0], [W * 0.38 + g * 60 + 18, H]], 5);
  // flying posters
  for (let i = 0; i < 6; i++) { const ft = (t * 0.7 + i * 0.17) % 1; poster(lerp(-100, W + 50, ft) + i * 40, 600 - ft * 700 + Math.sin(t * 4 + i) * 40, 80, 112, i % 3, SLOGANS[i % 3], t * 3 + i, 0.3); }
  ctx.restore();
  const hx = corner ? lerp(-80, 500, ease(seg(t, 5, 7.8))) : 420;
  const run = !(corner && t > 7.8);
  man(Object.assign({}, HERO, run ? walkPose(BP * Math.PI, 1.6) : {}, { x: hx, y: standY(610, 1.2), s: 1.2, tA: run ? 0.3 : 0, mood: run ? 'shout' : 'neutral', face: 1, hT: run ? 0 : Math.sin(t * 6) * 0.2 }));
  if (t > 4.8 && t < 5.2) flash(1 - Math.abs(t - 5) / 0.2, '0,0,0');
  if (!run) text('?!', hx + 60, 330, 60, INK, { dir: 'ltr', outline: 6, oc: '#fff' });
}
function shot21(t, d) {
  const r = 1 - ease(seg(t, 0, 5));
  const z = lerp(1.4, 1.0, ease(seg(t, 3, d)));
  ctx.save();
  cam(z, 640, 400);
  ctx.translate(W / 2, H / 2); ctx.transform(1, Math.sin(t * 2.2) * 0.12 * r, 0.3 * r, 1, 0, 0); ctx.translate(-W / 2, -H / 2);
  const P = { ...PV, sky1: lerp(0, 1, r) > 0.5 ? '#e7a34a' : PV.sky1 };
  street(2380, P, { wallX: 2600, wallOpts: { flutter: i => r * (0.6 + Math.sin(t * 9 + i) * .4) } });
  // flying papers returning
  for (let i = 0; i < 6; i++) { if (r <= 0.02) break; poster(lerp(330 + (i % 3) * 230, -200 + i * 260, r), lerp(240, -150 + i * 30, r), 80 + 90 * (1 - r), 112 + 127 * (1 - r), i % 3, SLOGANS[i % 3], r * 4 + i, 0.3, r); }
  // people walk by
  for (let i = 0; i < 3; i++) { const x = ((i * 520 + t * 90) % 1600) - 200; man({ kind: 'extra', x, y: standY(620, 1.1), s: 1.1, face: 1, ...walkPose(t * 9 + i, 1), hat: ['cap', 'long', 'hair'][i], hatc: '#555', shirt: ['#8f6f4f', '#4f6f8f', '#9a4f4f'][i], pants: '#333' }); }
  man(Object.assign({}, HERO, { x: 620, y: standY(605, 1.15), s: 1.15, face: -1, mood: 'neutral', hT: Math.sin(t * 1.3) * 0.1 }));
  ctx.restore();
}
function season(i) { return [{ ...PV, sky1: '#e9c46a', sky2: '#f4e1a8' }, { ...PV, sky1: '#8a96a6', sky2: '#b8c2cc' }, { ...PV, sky1: '#cfa76a', sky2: '#e6cf9c' }, { ...PV, sky1: '#9fbad6', sky2: '#d8e4ea' }][i % 4]; }
function shot22(t, d) {
  const loop = 1.6, k = Math.floor(t / loop), lt = (t - k * loop) / loop;
  const P = season(k);
  const scroll = 300;
  street(scroll, P, { mid: () => {
    // calendar on kiosk wall
    const cx = 560 - scroll + 30, cy = 260;
    rect(cx - 10, cy - 10, 120, 110, '#fff', 4); rect(cx - 10, cy - 10, 120, 26, PV.acc, 4);
    const pg = Math.floor(t * 6);
    text(String(1 + (pg % 12)), cx + 50, cy + 52, 40, INK, { dir: 'ltr' });
    if (pg % 1 === 0) { const fp = (t * 6) % 1; poly([[cx - 10, cy + 16], [cx + 110, cy + 16], [cx + 110, cy + 16 + 84 * (1 - fp)], [cx - 10, cy + 16 + 84 * (1 - fp)]], '#f0ede4', 3); }
  } });
  // weather
  if (k % 4 === 1) for (let i = 0; i < 60; i++) { const x = (h1(i) * W + T * 400) % W, y = (h1(i + 9) * H + T * 900) % H; line([[x, y], [x - 6, y + 22]], 2, 'rgba(40,60,90,.5)', 0); }
  if (k % 4 === 2) for (let i = 0; i < 18; i++) { const x = (h1(i) * W + T * 80) % W, y = (h1(i + 9) * H + T * 120) % H; ell(x, y, 8, 4, T * 3 + i, '#c96a2a', 2); }
  car(lerp(1500, -300, lt), 720, 1.0, ['#2f6db3', '#c22a24', '#f2c418', '#58a55c', '#eee'][k % 5]);
  heroWalk(t, lt * 900, lerp(-80, 1360, lt), 1.15);
}
const SLOG2 = [['עכשיו!', 'ביחד!', 'מבטיחים!'], ['הפעם באמת', 'שינוי אמיתי', 'עתיד חדש'], ['נקי. חדש.', 'רק אנחנו', 'בלי תירוצים'], ['כבר מחר', 'לגמרי', 'סמכו עלינו']];
function shot23(t, d) {
  const i = Math.floor(t / 2) % 4;
  const scroll = 2470;
  street(scroll, PV, { wallX: 2600, wallOpts: { slogans: SLOG2[i] } });
  if ((t % 2) < 0.15) flash(0.5);
  heroWalk(t, t * 140, lerp(-80, 1360, t / d), 1.15);
}
function shot24(t, d) {
  bg(PN.sky1);
  // outside scroll lights
  ctx.save(); ctx.beginPath(); ctx.rect(120, 140, 1040, 300); ctx.clip();
  ctx.fillStyle = grad(140, 440, ['#0f1a36', '#2c4a86']); ctx.fillRect(120, 140, 1040, 300);
  for (let i = -1; i < 8; i++) { const x = ((i * 220 - t * 420) % 1760 + 1760) % 1760 - 200; building(x, 460, 180, 220 + h1(i + 3) * 60, PN.b[(i + 5) % 5], PN, i + 70, { night: true }); }
  for (let i = 0; i < 6; i++) { const x = ((i * 300 - t * 700) % 1800 + 1800) % 1800 - 200; line([[x, 440], [x, 200], [x + 30, 200]], 6, '#222'); circ(x + 34, 206, 12, '#ffe08a', 3); ctx.globalAlpha = 0.25; circ(x + 34, 206, 46, '#ffe08a', 0); ctx.globalAlpha = 1; }
  ctx.restore();
  rect(120, 140, 1040, 300, null, 12);
  bg2();
  function bg2() { ctx.fillStyle = '#39405a'; ctx.fillRect(0, 440, W, 300); ctx.fillRect(0, 0, W, 140); }
  rect(120, 140, 1040, 300, null, 12);
  // seats
  for (let i = 0; i < 4; i++) rect(80 + i * 330, 420, 140, 200, '#2f6db3', 5);
  man(Object.assign({}, HERO, { x: 760, y: 560, s: 1.4, face: -1, tA: -0.05, lL: [1.5, -1.4], lR: [1.45, -1.4], mood: 'tired', hT: 0.35 + Math.sin(t * 1.5) * 0.05, aL: [0.4, 1.1], aR: [0.6, 1.0], bag: false }));
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#5a8fd6'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function shot25(t, d) {
  bg('#3b4460');
  // room interior dusk
  rect(0, 0, W, H, '#5a5470', 0);
  const wx = 380, wy = 90, ww = 520, wh = 440;
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  ctx.fillStyle = '#1d2a4a'; ctx.fillRect(wx, wy, ww, wh);
  const strip = 20 + ease(seg(t, 5.8, d)) * 900;
  ctx.fillStyle = grad(wy, wy + wh, ['#3d8fe0', '#bfe2ff']); ctx.fillRect(wx + ww / 2 - strip / 2, wy, strip, wh);
  building(wx - 10, wy + wh, 240 - strip * 0.3, 380, '#2c3550', PN, 3, { night: true });
  building(wx + ww / 2 + strip / 2, wy + wh, 260, 400, '#36405a', PN, 7, { night: true });
  ctx.restore();
  rect(wx, wy, ww, wh, null, 12); line([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 0.1);
  rect(wx - 20, wy + wh, ww + 40, 24, '#8a7356', 5);
  const lift = ease(seg(t, 3.2, 5.0));
  man(Object.assign({}, HERO, { x: 520, y: standY(720, 2.0), s: 2.0, face: 1, tA: lerp(0.25, 0.02, lift), mood: lift > 0.5 ? 'neutral' : 'tired', hT: lerp(0.5, -0.35, lift), aL: [0.1, 0.1], aR: [0.15, 0.05], bag: false }));
  if (t > 6.5) flash(ease(seg(t, 6.5, d)) * 0.7, '200,230,255');
}
function shot26(t, d) {
  const scroll = 2520;
  const rev = ease(seg(t, 0.5, 5.5));
  street(scroll, PC, { wallX: 2600, wallOpts: { graffiti: rev } });
  // painter
  const ptx = 640 + 380 - 780 * 0.5 + 200 - rev * 330;
  man({ kind: 'extra', x: ptx, y: standY(560, 1.05), s: 1.05, face: -1, hat: 'cap', hatc: '#222', shirt: '#2a2a2a', pants: '#445', hR: [-50, -55 + Math.sin(t * 10) * 6], spray: true, mood: 'neutral', hT: -0.1 });
  if (rev < 1) for (let i = 0; i < 8; i++) circ(ptx - 70 + h1(F + i) * 16, 516 + h1(F * 3 + i) * 14, 2, '#ff5a3c', 0);
  heroWalk(t, t * 100, lerp(-80, 260, ease(seg(t, 0, 5))), 1.15, { mood: 'neutral' });
}
function shot27(t, d) {
  const i = Math.min(2, Math.floor(t / (d / 3))), lt = t - i * d / 3;
  ctx.save(); cam(1.6, [420, 640, 860][i], 470);
  street(600 + i * 400, PC, {});
  if (i === 0) {
    const x = 420 + lt * 30;
    man({ kind: 'extra', x: x - 90, y: standY(600, 1.1), s: 1.1, face: 1, hat: 'hair', hatc: '#999', shirt: '#9a4f4f', pants: '#333', hR: [50, -60], aL: [0.6, 0.4], tA: 0.1, ...walkPose(BP * Math.PI / 2, 0.4) });
    rect(x - 60, 420, 140, 60, '#8a6a4a', 5); rect(x - 60, 400, 140, 24, '#a07a54', 5); // couch
    man(Object.assign({}, HERO, { x: x + 130, y: standY(600, 1.1), s: 1.1, face: -1, hR: [50, -60], aL: [0.6, 0.4], tA: 0.1, mood: 'calm', ...walkPose(BP * Math.PI / 2 + Math.PI, 0.4) }));
  } else if (i === 1) {
    const hug = ease(seg(lt, 0.2, 1.0));
    man({ kind: 'extra', x: 600 + 30 * (1 - hug), y: standY(600, 1.1), s: 1.1, face: 1, hat: 'long', hatc: '#6b3b1f', shirt: '#58a55c', pants: '#334', aL: [lerp(0.1, 1.5, hug), lerp(0.1, 0.9, hug)], aR: [lerp(0.1, 1.3, hug), lerp(0.1, 1.1, hug)], mood: 'smile' });
    man({ kind: 'extra', x: 690 - 30 * (1 - hug), y: standY(600, 1.1), s: 1.1, face: -1, hat: 'hair', hatc: '#222', shirt: '#2f6db3', pants: '#334', aL: [lerp(0.1, 1.5, hug), lerp(0.1, 0.9, hug)], aR: [lerp(0.1, 1.3, hug), lerp(0.1, 1.1, hug)], mood: 'smile' });
    if (hug > 0.9) text('♥', 645, 330, 40, '#e0362b');
  } else {
    const kk = seg(lt, 0.6, 0.9);
    man({ kind: 'extra', x: 780, y: standY(600, 0.75), s: 0.75, face: 1, hat: 'cap', hatc: '#e0362b', shirt: '#f2c418', pants: '#2f6db3', lR: [lerp(-0.4, 1.1, kk), 0], lL: [-0.1, 0], aL: [-0.6, 0.3], aR: [0.6, 0.3], mood: 'smile' });
    const bt = seg(lt, 0.85, 2.3); circ(lerp(830, 1100, bt), 585 - Math.sin(bt * Math.PI) * 160, 16, '#fff', 4);
  }
  ctx.restore();
}
function shot28(t, d) {
  const i = Math.floor(t / (d / 3)) % 3;
  rooftop(t, PS);
  const fr = [[2.0, 440, 400], [1.9, 640, 430], [1.9, 930, 400]][i];
  cam(fr[0] + 0.03 * Math.sin(t * 4), fr[1], fr[2], Math.sin(t * 3) * 0.03, kick() * 0.8);
  bandAll(t, PS);
}
function shot29(t, d) {
  const look = ease(seg(t, 2.2, 3.6)), tilt = ease(seg(t, 3.6, d));
  bg(PC.sky1);
  cam(lerp(1.5, 1.2, tilt), lerp(520, 520, tilt), lerp(380, -200, tilt));
  street(2380, PC, { wallX: 2600, wallOpts: { graffiti: 1 } });
  const walking = t < 2.2;
  const hx = walking ? lerp(250, 520, t / 2.2) : 520;
  man(Object.assign({}, HERO, walking ? walkPose(BP * Math.PI / 2, 1) : {}, { x: hx, y: standY(600, 1.15), s: 1.15, face: 1, mood: look > 0.5 ? 'calm' : 'neutral', hT: -0.85 * look, lookY: -3 * look }));
}
function shot30(t, d) {
  skyScene(t + 20, { cols: ['#2a78d8', '#8ccaff', '#fff4d8'] });
  const px = lerp(1350, 400, t / d), py = lerp(260, 200, t / d);
  plane(px, py, 0.5, -0.05, 1 - seg(t, 5, d) * 0.6);
  ctx.save(); ctx.globalAlpha = 0.5 * seg(t, 3, d); circ(1080, 120, 220, '#fff7d0', 0); ctx.restore();
}
function shot31(t, d) {
  const down = ease(seg(t, 0, 5));
  ctx.save();
  cam(lerp(1.0, 0.9, down), 640, lerp(-420, 400, down));
  ctx.save(); ctx.translate(0, -800); skyScene(t + 30, { cols: ['#2a78d8', '#8ccaff', '#d8efff'] }); plane(700 - t * 20, 200, 0.3, -0.05, 0.6); ctx.restore();
  ctx.fillStyle = grad(-200, 470, ['#d8efff', '#9fd2ff']); ctx.fillRect(-500, -200, W + 1000, 680); ctx.fillStyle = PC.walk; ctx.fillRect(-500, 470, W + 1000, 900); line([[-500, 470], [W + 500, 470]], 5);
  // distant rooftop with tiny band
  for (let i = -2; i < 9; i++) building(i * 200 + 20, 470, 170, 200 + h1(i + 77) * 120, PC.b[(i + 15) % 5], PC, i + 300);
  const rx = 880, ry = 470 - 200 - h1(5 + 77) * 120;
  ctx.save(); ctx.translate(rx + 30, ry - 2); ctx.scale(0.22, 0.22);
  drumKit(150, -40, 1, t); bandPose('drummer', t, 150, -90, 1); bandPose('singer', t, 30, standY(0, 1.6), 1.6); bandPose('bassist', t, 300, standY(0, 1.45), 1.45);
  ctx.restore();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = seg(t, 4, d); ctx.restore();
  if (t > 5) {
    ctx.save(); ctx.globalAlpha = ease(seg(t, 5, 6.5));
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
    ctx.translate(0, 0); cam(0.9, 640, 400);
    street(2380, PC, { wallX: 2600, wallOpts: { graffiti: 1 } });
    man(Object.assign({}, HERO, { x: 520, y: standY(600, 1.15), s: 1.15, face: 1, mood: 'calm', hT: -0.4 }));
    ctx.restore();
  }
}
function shot32(t, d) {
  street(2380, { ...PC, sky1: '#2f7fe0', sky2: '#ffd9a0' }, { wallX: 2600, wallOpts: { graffiti: 1 } });
  plane(900 - t * 20, 90 - t * 4, 0.25, -0.05, 1 - seg(t, 0, 6));
  const w0 = 3.0, w1 = 9.5;
  if (t < w0) man(Object.assign({}, HERO, { x: 520, y: standY(600, 1.15), s: 1.15, face: 1, mood: t > 1.0 ? 'calm' : 'neutral', hT: -0.6 * (1 - seg(t, 2.2, w0)) }));
  else {
    const p = seg(t, w0, w1); const s = lerp(1.15, 0.4, p);
    man(Object.assign({}, HERO, walkPose(BP * Math.PI / 2, 0.8), { x: lerp(520, 920, p), y: standY(lerp(600, 515, p), s), s, face: 1, mood: 'calm' }));
  }
  const fa = seg(t, 9.0, 11.0);
  fadeBlack(fa);
  if (fa > 0.6) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = seg(t, 10.5, 12) * (1 - seg(t, d - 0.8, d - 0.1)); if (SPR.logo) { const lw = 620, lh = lw * SPR.logo.height / SPR.logo.width; ctx.drawImage(SPR.logo, W / 2 - lw / 2, H / 2 - lh / 2 - 40, lw, lh); } else text('קורקומיין', W / 2, H / 2 - 30, 64, '#f6e05e'); text('ראשון בבוקר', W / 2, H / 2 + 90, 40, '#fff'); ctx.restore(); }
}
function shotSoloBand(t, d) {
  soloBg(t, '#f4c21b', '#e23b2e', '#2b5cd6');
  const i = Math.floor(BP / 8) % 4;
  const fr = [[1.15, 640, 420], [2.0, 440, 400], [1.9, 640, 430], [1.9, 930, 400]][i];
  cam(fr[0] + 0.03 * Math.sin(BP * Math.PI / 2), fr[1], fr[2], Math.sin(BP * Math.PI / 4) * 0.04, kick() * 0.9);
  ctx.fillStyle = '#8e8a82'; ctx.fillRect(-1000, 600, W + 2000, 400); line([[-1000, 600], [W + 1000, 600]], 6);
  bandAll(t, PC);
  if (t > d - 0.6) flash(seg(t, d - 0.6, d) * 0.6);
}

const SHOTS = [
  [0, 3.994, shot01, 5],
  [3.994, 8.173, shot02, 5],
  [8.173, 12.283, shot03, 5],
  [12.283, 14.907, shot04, 5.5],
  [14.907, 24.636, shot05, 5.5],
  [24.636, 27.26, shot06, 6],
  [27.26, 30.279, shot07, 5.5],
  [30.279, 35.921, shot08, 5.5],
  [35.921, 38.917, shot09, 5],
  [38.917, 42.284, shot10, 5],
  [42.284, 48.274, shot11, 4.5],
  [48.274, 50.527, shot12, 5.5],
  [50.527, 53.917, shot13, 5],
  [53.917, 60.279, shot14, 5],
  [60.279, 61.788, shot15, 6],
  [61.788, 71.146, shot16, 8],
  [71.146, 81.665, shot17, 8],
  [81.665, 92.16, shot18, 9],
  [92.16, 103.398, shot19, 10],
  [103.398, 116.146, shot20, 10],
  [116.146, 128.151, shot21, 11],
  [128.151, 137.927, shotSoloBand, 0],
  [137.927, 143.917, shot22, 8],
  [143.917, 150.28, shot23, 8],
  [150.28, 155.922, shot24, 8],
  [155.922, 160.798, shot25, 8],
  [160.798, 164.537, shot26, 7],
  [164.537, 170.551, shot27, 7],
  [170.551, 183.252, shot28, 8],
  [183.252, 185.504, shot29, 7],
  [185.504, 195.303, shot30, 8],
  [195.303, 201.665, shot31, 8],
  [201.665, 219.6, shot32, 0],
];

function init(env) {
  ENV = env; c = document.getElementById('c'); ctx = c.getContext('2d');
  KD = []; SD = []; let a = 0, b = 0;
  for (let i = 0; i < env.kick.length; i++) { a = Math.max(env.kick[i] > 0.35 ? env.kick[i] : 0, a * 0.8); b = Math.max(env.snare[i] > 0.35 ? env.snare[i] : 0, b * 0.75); KD[i] = Math.min(1, a); SD[i] = Math.min(1, b); }
  makeTextures();
  return loadSprites();
}
function beatPhase(t) { const b = ENV.beats; let lo = 0, hi = b.length - 1; if (t <= b[0]) return (t - b[0]) / 0.3715; if (t >= b[hi]) return hi + (t - b[hi]) / 0.3715; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (b[m] <= t) lo = m; else hi = m; } return lo + (t - b[lo]) / (b[lo + 1] - b[lo]); }
function render(f) {
  F = f; T = f / FPS; BOIL = Math.floor(f / 3); K = 0; BP = beatPhase(T);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let s = SHOTS.find(x => T >= x[0] && T < x[1]) || SHOTS[SHOTS.length - 1];
  const od = s[3] || (s[1] - s[0]); ctx.save(); s[2]((T - s[0]) * od / (s[1] - s[0]), od); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  overlays();
  // hard-cut punch: tiny white flash on shot start during chorus/solo
  const lt = T - s[0]; if (lt < 0.08 && s[0] >= 60 && s[0] < 138) flash(0.35);
  subtitles();
  panelBorder();
  if (T > 219.0) fadeBlack(1);
}
