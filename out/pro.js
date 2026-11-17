// "Pro" finishing layer over clip.js + vector.js: 1080p, real fonts, kinetic lyrics, grading, light, shadows, transitions.
const PS_ = 1.5; // 1280x720 logical -> 1920x1080 output
window.VFONT = '"Heebo", "DejaVu Sans", sans-serif';
const DISP = '"Karantina", "Heebo", sans-serif';
let RAWST, TMP, TMPX;

async function loadFonts() {
  if (typeof FONT_DATA === 'undefined') return;
  for (const [fam, w, b64] of FONT_DATA) {
    const bin = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
    const ff = new FontFace(fam, bin.buffer, { weight: w });
    await ff.load(); document.fonts.add(ff);
  }
}
// text: display sizes use Karantina (condensed, punk), small sizes Heebo
text = function (s, x, y, size, col = INK, opts = {}) {
  ctx.save();
  const disp = size >= 40;
  const sz = disp ? size * 1.35 : size;
  ctx.font = `${disp ? 700 : 800} ${sz}px ${disp ? DISP : window.VFONT}`;
  ctx.direction = opts.dir || 'rtl'; ctx.textAlign = opts.align || 'center'; ctx.textBaseline = 'middle';
  if (opts.rot) { ctx.translate(x, y); ctx.rotate(opts.rot); x = 0; y = 0; }
  if (opts.outline) { ctx.lineWidth = opts.outline; ctx.strokeStyle = opts.oc || OUT; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col === INK ? OUT : col; ctx.fillText(s, x, y);
  ctx.restore();
};

// characters: contact shadow, blink, breathing
const _vman = man;
man = function (o) {
  const s = o.s || 1;
  const sitting = o.lL && o.lL[0] > 1.1, lying = (o.tA || 0) < -0.6;
  if (!sitting && !lying && !o.noShadow) {
    ctx.save(); ctx.fillStyle = 'rgba(20,18,40,.22)'; ctx.beginPath(); ctx.ellipse(o.x + 4 * s, o.y + 94 * s, 36 * s, 7 * s, 0, 0, 7); ctx.fill(); ctx.restore();
  }
  const id = ((o.kind || 'x').length * 7 + (o.shirt || '').length * 3 + (o.hat || '').length) * 0.37;
  const o2 = Object.assign({}, o);
  if (!['fake', 'shout', 'closed'].includes(o.mood) && ((T + id) % 3.3) < 0.11) o2.mood = 'closed';
  o2.sy = (o.sy || 1) * (1 + 0.012 * Math.sin(T * 2.3 + id));
  _vman(o2);
};

// ---------- kinetic lyrics ----------
const HOT = ['טוב', 'שמיים', 'כחולים', 'מטוס', 'מקום', 'חולמים', 'וואו…', 'הצגה', 'השלום', 'האושר', 'משתנה', 'ולאהוב'];
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
function kinetic() {
  LYR.forEach(([a, b, s], li) => {
    if (T < a - 0.05 || T > b) return;
    const words = s.split(' ');
    const dur = b - a, step = Math.min(0.3, dur * 0.5 / words.length);
    const big = words.length === 1;
    const size = big ? 120 : 78;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `700 ${size}px ${DISP}`; ctx.direction = 'rtl'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const sp = size * 0.28;
    const ws = words.map(w => ctx.measureText(w).width);
    // wrap into rows of max 1050px
    const rows = [[]]; let acc = 0;
    words.forEach((w, i) => { if (acc + ws[i] > 1050 && rows[rows.length - 1].length) { rows.push([]); acc = 0; } rows[rows.length - 1].push(i); acc += ws[i] + sp; });
    const exit = seg(T, b - 0.22, b);
    const accent = ['#ffd166', '#ef476f', '#06d6a0', '#4cc9f0'][li % 4];
    rows.forEach((row, r) => {
      const rowW = row.reduce((q, i) => q + ws[i] + sp, -sp);
      let x = W / 2 + rowW / 2; // RTL: start at right edge
      const y = 640 - (rows.length - 1 - r) * size * 0.95;
      row.forEach(i => {
        const tw = T - (a + i * step);
        x -= ws[i];
        if (tw >= 0) {
          const p = clamp(tw / 0.28), sc = easeOutBack(p);
          ctx.save(); ctx.globalAlpha = clamp(p * 3) * (1 - exit);
          ctx.translate(x + ws[i] / 2, y + exit * 26 - (1 - p) * 30); ctx.rotate((h1(li * 17 + i) - .5) * 0.06 * (1 - p * 0.5)); ctx.scale(sc, sc);
          const hot = HOT.includes(words[i]);
          ctx.lineJoin = 'round';
          ctx.fillStyle = 'rgba(15,12,30,.45)'; ctx.fillText(words[i], -ws[i] / 2 + 6, 8);
          ctx.lineWidth = 12; ctx.strokeStyle = '#1b1830'; ctx.strokeText(words[i], -ws[i] / 2, 0);
          ctx.fillStyle = hot ? accent : '#ffffff'; ctx.fillText(words[i], -ws[i] / 2, 0);
          ctx.restore();
        }
        x -= sp;
      });
    });
    ctx.restore();
  });
}

// ---------- credits ----------
function creditCard() {
  const a = 1.6, b = 7.2; if (T < a || T > b) return;
  const p = ease(seg(T, a, a + 0.6)), q = ease(seg(T, b - 0.6, b));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = p * (1 - q);
  const x = W - 60 + (1 - p) * 40;
  ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 4, 46, 4, 92);
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8;
  ctx.font = `800 34px ${window.VFONT}`; ctx.fillText('קורקומיין', x - 16, 80);
  ctx.font = `400 26px ${window.VFONT}`; ctx.fillText('ראשון בבוקר', x - 16, 114);
  ctx.font = `400 15px ${window.VFONT}`; ctx.globalAlpha *= 0.8; ctx.fillText('קליפ רשמי', x - 16, 136);
  ctx.restore();
}

// ---------- grade, light, particles ----------
function section(t) {
  if (t < 48.3) return 'verse';
  if (t < 60.3) return 'sky';
  if (t < 81.6) return 'chorus';
  if (t < 137.9) return 'solo';
  if (t < 150.3) return 'verse';
  if (t < 160.8) return 'night';
  if (t < 170.5) return 'chorus';
  if (t < 183.2) return 'sunset';
  if (t < 211) return 'sky';
  return 'end';
}
function grade() {
  const sec = section(T);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // light leak / rays
  if (sec === 'sky' || sec === 'chorus' || sec === 'sunset') {
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(W * 0.88, -40, 10, W * 0.88, -40, 760);
    g.addColorStop(0, sec === 'sunset' ? 'rgba(255,170,90,.55)' : 'rgba(255,240,200,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 6; i++) {
      const a0 = 1.75 + i * 0.16 + Math.sin(T * 0.3 + i) * 0.03;
      ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.moveTo(W * 0.88, -40); ctx.lineTo(W * 0.88 + Math.cos(a0) * 1800, -40 + Math.sin(a0) * 1800); ctx.lineTo(W * 0.88 + Math.cos(a0 + 0.06) * 1800, -40 + Math.sin(a0 + 0.06) * 1800); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // color grade
  ctx.globalCompositeOperation = 'soft-light';
  if (sec === 'end') { ctx.restore(); return; }
  const gr = { verse: ['#ffb46b', '#2a6f8f'], sky: ['#ffe6b0', '#5aa0ff'], chorus: ['#ffd27a', '#3d6bff'], solo: ['#ff4d4d', '#2b2bff'], night: ['#3a5bd9', '#0b1030'], sunset: ['#ff8a3d', '#5a2a8f'] }[sec];
  const lg = ctx.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, gr[0]); lg.addColorStop(1, gr[1]);
  ctx.globalAlpha = sec === 'solo' ? 0.35 : 0.28; ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // dust motes
  if (sec !== 'solo') {
    const n = sec === 'night' ? 12 : 28;
    for (let i = 0; i < n; i++) {
      const sp = 6 + h1(i * 3) * 14, x = ((h1(i) * (W + 100) + T * sp) % (W + 100)) - 50, y = ((h1(i + 40) * H - T * sp * 0.4) % H + H) % H + Math.sin(T * 0.8 + i) * 6;
      ctx.fillStyle = `rgba(255,248,230,${0.12 + h1(i + 9) * 0.2})`; ctx.beginPath(); ctx.arc(x, y, 1 + h1(i + 7) * 2.2, 0, 7); ctx.fill();
    }
  }
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, sec === 'night' ? 'rgba(0,0,20,.5)' : 'rgba(10,8,30,.32)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // fine grain
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  const ox = Math.floor(h1(F) * 512), oy = Math.floor(h1(F + 5) * 512);
  ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, W + 512, H + 512);
  ctx.restore();
}
function birds(t0, t1) {
  if (T < t0 || T > t1) return;
  const u = (T - t0) / (t1 - t0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = '#2b2d45'; ctx.lineCap = 'round'; ctx.lineWidth = 2.6;
  for (let i = 0; i < 6; i++) {
    const x = lerp(-80, W + 80, u) - i * 34 - (i % 2) * 20, y = 230 + i * 14 + Math.sin(T * 2 + i) * 8, f = Math.sin(T * 12 + i * 1.3) * 7;
    ctx.beginPath(); ctx.moveTo(x - 10, y - f); ctx.quadraticCurveTo(x - 4, y - 4, x, y); ctx.quadraticCurveTo(x + 4, y - 4, x + 10, y - f); ctx.stroke();
  }
  ctx.restore();
}

// ---------- transitions ----------
const NO_WHIP = new Set([3, 5, 13]); // cuts that already have their own transition (coffee stain, curtain, wing->neck)
function smear(amount, dir) {
  if (amount <= 0.02) return;
  TMPX.setTransform(1, 0, 0, 1, 0, 0); TMPX.clearRect(0, 0, TMP.width, TMP.height); TMPX.drawImage(c, 0, 0);
  RAWST.call(ctx, 1, 0, 0, 1, 0, 0);
  const n = 7, dist = amount * 260 * PS_;
  for (let i = 1; i <= n; i++) { ctx.globalAlpha = 0.22; ctx.drawImage(TMP, dir * dist * i / n, 0); }
  ctx.globalAlpha = 1;
}

render = function (f) {
  F = f; T = f / FPS; BOIL = Math.floor(f / 3); K = 0; BP = beatPhase(T);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const si = SHOTS.findIndex(x => T >= x[0] && T < x[1]); const s = SHOTS[si < 0 ? SHOTS.length - 1 : si];
  const od = s[3] || (s[1] - s[0]); const u = (T - s[0]) / (s[1] - s[0]);
  // gentle camera push + beat punch (chorus/solo)
  const sec = section(T);
  const punch = (sec === 'chorus' || sec === 'solo') ? kick() * 0.018 : 0;
  const tIn = T - s[0];
  const cutPunch = (T >= 12 && si > 0 && !NO_WHIP.has(si - 1)) ? 0.07 * (1 - ease(clamp(tIn / 0.25))) : 0;
  const z = 1.0 + 0.035 * ease(u) + punch + cutPunch;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.rotate(Math.sin(T * 0.4) * 0.004); ctx.translate(-W / 2, -H / 2);
  ctx.save(); s[2]((T - s[0]) * od / (s[1] - s[0]), od); ctx.restore();
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  birds(50.6, 53.9); birds(186.0, 194.0);
  grade();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  creditCard();
  kinetic();
  if (T > 219.0) fadeBlack(1);
};

const _vinit = init;
init = async function (env) {
  c = document.getElementById('c'); c.width = W * PS_; c.height = H * PS_;
  await _vinit(env);
  RAWST = CanvasRenderingContext2D.prototype.setTransform;
  ctx.setTransform = function (a, b, cc, d, e, f) { if (typeof a === 'object') return RAWST.call(this, a); return RAWST.call(this, a * PS_, b * PS_, cc * PS_, d * PS_, e * PS_, f * PS_); };
  TMP = document.createElement('canvas'); TMP.width = c.width; TMP.height = c.height; TMPX = TMP.getContext('2d');
  await loadFonts();
};
