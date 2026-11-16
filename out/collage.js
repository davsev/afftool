// Punk collage treatment. Loaded after clip.js; overrides render() and redirects puppets to a cut-out layer.
let MAIN, BGC, BGX, LAY, LAYX, SIL, SILX, BAYER;
const PAPER = [236, 230, 214], INKC = [20, 17, 16], MID = [150, 143, 130];
const ACC = [[212, 42, 30], [242, 201, 25], [31, 95, 191], [232, 74, 138], [214, 120, 40]];
const RFONTS = ['"DejaVu Serif"', '"FreeSans"', '"Liberation Serif"', '"FreeMono"', '"DejaVu Sans"', '"Liberation Sans"', '"FreeSerif"'];

function collageInit() {
  MAIN = ctx;
  const mk = () => { const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; return c2; };
  BGC = mk(); BGX = BGC.getContext('2d', { willReadFrequently: true });
  LAY = mk(); LAYX = LAY.getContext('2d');
  SIL = mk(); SILX = SIL.getContext('2d');
  BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
}

// redirect kit sprites (characters + drum kit) to the cut-out layer
const _puppet = puppet;
puppet = function (kind, x, y, h, o = {}) {
  const C = ctx; LAYX.setTransform(C.getTransform()); LAYX.globalAlpha = C.globalAlpha;
  ctx = LAYX; _puppet(kind, x, y, h, o); ctx = C;
};
const _drumKit = drumKit;
drumKit = function (x, y, s, t) {
  if (!SPR.drums) return _drumKit(x, y, s, t);
  const C = ctx; LAYX.setTransform(C.getTransform()); ctx = LAYX; _drumKit(x, y, s, t); ctx = C;
};
// drummer sits behind the kit: draw drummer first, then kit
bandAll = function (t, P) {
  bandPose('drummer', t, 640, 470, 1.0, {});
  drumKit(640, 520, 1.0, t);
  bandPose('bassist', t, 930, standY(660, 1.45), 1.45, {});
  line([[470, 660], [470, 420], [440, 400]], 5); circ(436, 398, 8, '#333', 3);
  bandPose('singer', t, 440, standY(680, 1.6), 1.6, {});
};

function xerox() {
  const id = BGX.getImageData(0, 0, W, H), d = id.data;
  for (let y = 0; y < H; y++) {
    const by = (y & 3) << 2;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) << 2;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
      const th = BAYER[by + (x & 3)];
      let o;
      if (mx - mn > 60) {
        // nearest accent, dithered against paper by lightness
        let best = 0, bd = 1e9;
        for (let k = 0; k < ACC.length; k++) { const a = ACC[k]; const dd = (a[0] - r) ** 2 + (a[1] - g) ** 2 + (a[2] - b) ** 2; if (dd < bd) { bd = dd; best = k; } }
        const a = ACC[best];
        o = l > 0.78 + th * 0.2 ? PAPER : (l < 0.16 + th * 0.12 ? INKC : a);
      } else {
        o = l < 0.25 + th * 0.18 ? INKC : (l < 0.55 + th * 0.22 ? (th > 0.5 ? MID : (l < 0.45 ? INKC : PAPER)) : PAPER);
      }
      d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
    }
  }
  BGX.putImageData(id, 0, 0);
}

function tornPoly(seed, m, jitter) {
  const pts = [];
  const edge = (x0, y0, x1, y1, n, sd) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([lerp(x0, x1, t) + (h1(sd + i * 1.7) - .5) * jitter, lerp(y0, y1, t) + (h1(sd + i * 2.3) - .5) * jitter]); } };
  edge(m, m, W - m, m, 40, seed); edge(W - m, m, W - m, H - m, 24, seed + 50); edge(W - m, H - m, m, H - m, 40, seed + 90); edge(m, H - m, m, m, 24, seed + 140);
  return pts;
}
function path(pts, C) { C.beginPath(); pts.forEach((p, i) => i ? C.lineTo(p[0], p[1]) : C.moveTo(p[0], p[1])); C.closePath(); }

function backdrop(si) {
  const C = MAIN;
  C.fillStyle = '#1b1917'; C.fillRect(0, 0, W, H);
  // newspaper scraps around the edges
  for (let i = 0; i < 9; i++) {
    const sx = h1(si * 13 + i) * W, sy = h1(si * 7 + i * 3) * H, sw = 120 + h1(i + si) * 220, sh = 70 + h1(i * 5 + si) * 140, rot = (h1(i * 9 + si) - .5) * 0.5;
    C.save(); C.translate(sx, sy); C.rotate(rot);
    C.fillStyle = ['#e4ddcb', '#d9cfb8', '#efe9da', '#c9302a', '#e9c22a'][i % 5]; C.fillRect(-sw / 2, -sh / 2, sw, sh);
    C.fillStyle = 'rgba(30,25,20,.55)';
    if (i % 5 < 3) for (let l = 0; l < sh / 9 - 1; l++) C.fillRect(-sw / 2 + 8, -sh / 2 + 8 + l * 9, (sw - 16) * (0.6 + h1(l + i) * 0.4), 3);
    C.restore();
  }
}

function tape(x, y, w, rot) {
  const C = MAIN; C.save(); C.translate(x, y); C.rotate(rot);
  C.fillStyle = 'rgba(235,225,190,.78)'; C.beginPath();
  C.moveTo(-w / 2, -14); for (let i = 0; i <= 6; i++) C.lineTo(-w / 2 + 3 * (i % 2), -14 + i * 4.7); C.lineTo(w / 2, 14); for (let i = 0; i <= 6; i++) C.lineTo(w / 2 - 3 * (i % 2), 14 - i * 4.7); C.closePath(); C.fill();
  C.restore();
}

function compositeCutouts() {
  const C = MAIN;
  // white paper edge: silhouette of layer, stamped around
  SILX.setTransform(1, 0, 0, 1, 0, 0); SILX.globalCompositeOperation = 'source-over'; SILX.clearRect(0, 0, W, H);
  for (let a = 0; a < 12; a++) { const ang = a / 12 * Math.PI * 2; SILX.drawImage(LAY, Math.cos(ang) * 6, Math.sin(ang) * 6); }
  SILX.globalCompositeOperation = 'source-in'; SILX.fillStyle = '#f6f2e8'; SILX.fillRect(0, 0, W, H);
  SILX.globalCompositeOperation = 'source-over';
  C.save(); C.globalAlpha = 0.45; C.filter = 'brightness(0)'; C.drawImage(SIL, 7, 9); C.restore();
  C.drawImage(SIL, 0, 0);
  // riso-ish color crunch on characters
  C.save(); C.filter = 'contrast(1.25) saturate(1.3)'; C.drawImage(LAY, 0, 0); C.restore();
}

function ransom(s, cx, cy, size, seed, alpha) {
  const C = MAIN; C.save(); C.globalAlpha = alpha; C.direction = 'ltr';
  const chars = [...s];
  const items = chars.map((ch, i) => {
    const f = RFONTS[Math.floor(h1(seed + i * 3.1) * RFONTS.length)];
    const sz = size * (0.82 + h1(seed + i * 5.7) * 0.4);
    C.font = `${h1(seed + i) > .5 ? 'bold ' : ''}${Math.round(sz)}px ${f}`;
    const w = ch === ' ' ? size * 0.45 : C.measureText(ch).width + 12;
    return { ch, f: C.font, sz, w };
  });
  const total = items.reduce((a, b) => a + b.w + 3, 0);
  let x = cx + total / 2; // RTL: first char on the right
  items.forEach((it, i) => {
    x -= it.w + 3; if (it.ch === ' ') return;
    const bx = x, bw = it.w, bh = it.sz * 1.25, rot = (h1(seed + i * 7.7) - .5) * 0.22, dy = (h1(seed + i * 4.4) - .5) * 8;
    const k = Math.floor(h1(seed + i * 9.1) * 6);
    const bgc = ['#f4efe2', '#f2c919', '#d42a1e', '#141110', '#e4ddcb', '#1f5fbf'][k];
    const fg = ['#141110', '#141110', '#f4efe2', '#f4efe2', '#d42a1e', '#f4efe2'][k];
    C.save(); C.translate(bx + bw / 2, cy + dy); C.rotate(rot);
    C.fillStyle = 'rgba(0,0,0,.45)'; C.fillRect(-bw / 2 + 4, -bh / 2 + 5, bw, bh);
    C.fillStyle = bgc; C.beginPath(); C.moveTo(-bw / 2, -bh / 2 + h1(i) * 3); C.lineTo(bw / 2, -bh / 2); C.lineTo(bw / 2 - h1(i + 2) * 3, bh / 2); C.lineTo(-bw / 2, bh / 2 - h1(i + 4) * 3); C.closePath(); C.fill();
    C.font = it.f; C.fillStyle = fg; C.textAlign = 'center'; C.textBaseline = 'middle'; C.fillText(it.ch, 0, 2);
    C.restore();
  });
  C.restore();
}
function ransomSubs() {
  LYR.forEach(([a, b, s], li) => {
    if (T < a || T > b) return;
    const pop = Math.min(ease(seg(T, a, a + 0.2)), ease(seg(T, b, b - 0.2)));
    // letters land one by one
    const n = [...s].length, shown = Math.ceil(n * clamp((T - a) / 0.45));
    ransom([...s].slice(0, shown).join('').padEnd(0), W / 2, 652, 36, li * 101 + 7, pop);
  });
}

let CUR_SHOT = -1;
render = function (f) {
  const fh = f - (f % 2); // stop-motion on twos
  F = fh; T = fh / FPS; BOIL = Math.floor(fh / 2); K = 0; BP = beatPhase(T);
  const si = SHOTS.findIndex(x => T >= x[0] && T < x[1]); const s = SHOTS[si < 0 ? SHOTS.length - 1 : si];
  // 1. scene sheet
  ctx = BGX; LAYX.setTransform(1, 0, 0, 1, 0, 0); LAYX.clearRect(0, 0, W, H);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const od = s[3] || (s[1] - s[0]); ctx.save(); s[2]((T - s[0]) * od / (s[1] - s[0]), od); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  xerox();
  // 2. compose
  ctx = MAIN; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  backdrop(si);
  const poly = tornPoly(si * 31 + 5, 20, 9);
  const rot = (h1(si * 3.3) - .5) * 0.025 + (h1(BOIL) - .5) * 0.002, jx = (h1(BOIL * 1.3) - .5) * 2, jy = (h1(BOIL * 2.1) - .5) * 2;
  ctx.save(); ctx.translate(W / 2 + jx, H / 2 + jy); ctx.rotate(rot); ctx.translate(-W / 2, -H / 2);
  ctx.save(); ctx.translate(6, 9); path(poly, ctx); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(-5, -4); ctx.scale(1.008, 1.012); path(poly, ctx); ctx.fillStyle = '#f6f2e8'; ctx.fill(); ctx.restore();
  ctx.save(); path(poly, ctx); ctx.clip(); ctx.drawImage(BGC, 0, 0); ctx.restore();
  compositeCutouts();
  ctx.restore();
  tape(70, 40, 120, -0.5); tape(W - 70, 44, 120, 0.45); tape(W - 90, H - 34, 110, -0.35);
  // grain
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.18;
  const ox = Math.floor(h1(BOIL) * 512), oy = Math.floor(h1(BOIL + 5) * 512);
  ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, W + 512, H + 512); ctx.restore();
  // shot-start punch in chorus/solo
  const lt = T - s[0]; if (lt < 0.09 && s[0] >= 60 && s[0] < 138) flash(0.3);
  ransomSubs();
  if (T > 219.0) fadeBlack(1);
};
const _init = init;
init = async function (env) { await _init(env); collageInit(); };
