/* ═══════════════════════════════════════════════════════════════
   Ambient brain — a gently rotating 3D neural point-cloud that lives
   fixed behind every page, so the whole site breathes and section
   backgrounds flow into one continuous field (no hard blocks).
   Lifted from the one-pager's Brain, stripped of scroll-coupling.
   Mounts to <canvas class="brain-bg"> (created if absent).
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;

  let cv = document.querySelector('.brain-bg');
  if (!cv) { cv = document.createElement('canvas'); cv.className = 'brain-bg'; cv.setAttribute('aria-hidden', 'true'); document.body.prepend(cv); }
  const cx = cv.getContext('2d');

  const N = touch ? 110 : 230;
  // theme-aware palette: light points on the dark ground, dark points on paper.
  const PALS = {
    dark:  { bone: '239,235,227', lime: '217,250,135', orange: '245,96,2' },
    light: { bone: '46,40,33',    lime: '92,125,30',    orange: '200,80,0' }
  };
  const KEYS = ['bone', 'lime', 'orange'];
  let PAL = PALS.dark;
  const readPalette = () => {
    const t = document.documentElement.dataset.theme
      || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    PAL = PALS[t] || PALS.dark;
  };
  readPalette();
  addEventListener('themechange', readPalette);
  const P = [], E = [];
  let W, H, DPR, R3, F = 2.1, VW, VH, T = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  for (let i = 0; i < N; i++) {
    let x = gauss(), y = gauss() * 0.9, z = gauss();
    const m = Math.hypot(x, y, z) || 1, r = Math.pow(Math.random(), 0.42);
    x = x / m * r; y = y / m * r; z = z / m * r;
    const c = Math.random();
    P.push({ bx: x, by: y, bz: z, ph: rnd(0, Math.PI * 2), sp: rnd(0.3, 0.9), sz: rnd(1, 2.5),
      t: c < 0.7 ? 0 : c < 0.89 ? 1 : 2, al: rnd(0.4, 1), x: 0, y: 0, s: 1 });
  }
  { const deg = new Array(N).fill(0), LINK = 0.34;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      if (deg[i] > 2 || deg[j] > 2) continue;
      const d = Math.hypot(P[i].bx - P[j].bx, P[i].by - P[j].by, P[i].bz - P[j].bz);
      if (d < LINK) { E.push({ i, j }); deg[i]++; deg[j]++; }
    } }

  function size() {
    VW = innerWidth; VH = innerHeight;
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.width = VW * DPR; H = cv.height = VH * DPR;
    cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
    R3 = Math.min(VW, VH) * 0.46 * DPR;
  }

  let mx = 0, my = 0;
  if (!touch) addEventListener('pointermove', e => { mx = e.clientX / VW - 0.5; my = e.clientY / VH - 0.5; }, { passive: true });

  const fires = [];
  const ALPHA = 0.46;                 // ambient — quiet enough to read over
  let last = performance.now(), hidden = false, offscreen = false, running = false;
  // the canvas is a fixed, faint backdrop; once the hero scrolls away the
  // content covers it, so stop animating (and resume on scroll-up / tab-focus).
  const visible = () => !hidden && !offscreen;
  function kick() {
    if (running || reduced || !visible()) return;
    running = true; last = performance.now(); requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; kick(); });
  addEventListener('scroll', () => {
    const off = scrollY > innerHeight * 0.9;
    if (off !== offscreen) { offscreen = off; kick(); }
  }, { passive: true });

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!reduced) {
      if (!visible()) { running = false; return; }   // pause; kick() restarts it
      requestAnimationFrame(frame);
    }
    T += dt;
    cx.clearRect(0, 0, W, H);
    const cxp = W / 2, cyp = H / 2;
    const rotY = T * 0.10 + mx * 0.45, rotX = 0.3 + Math.sin(T * 0.045) * 0.11 + my * 0.28;
    const cyv = Math.cos(rotY), syv = Math.sin(rotY), cxr = Math.cos(rotX), sxr = Math.sin(rotX);

    for (const p of P) {
      p.ph += p.sp * dt;
      const x = p.bx + Math.sin(p.ph) * 0.03, y = p.by + Math.cos(p.ph * 0.9) * 0.03, z = p.bz + Math.sin(p.ph * 0.7) * 0.03;
      const x1 = x * cyv + z * syv, z1 = -x * syv + z * cyv;
      const y1 = y * cxr - z1 * sxr, z2 = Math.max(y * sxr + z1 * cxr, -F * 0.75);
      const s = F / (F + z2);
      p.x = cxp + x1 * R3 * s; p.y = cyp + y1 * R3 * s; p.s = s;
    }
    cx.lineWidth = DPR * 0.7;
    for (const ed of E) {
      const a = P[ed.i], b = P[ed.j];
      const depth = ((a.s + b.s) / 2 - 0.6) * 1.6;
      const o = clamp(depth, 0.12, 1) * 0.3 * ALPHA;
      cx.strokeStyle = `rgba(${PAL.bone},${o.toFixed(3)})`;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
    }
    for (const p of P) {
      const depth = clamp((p.s - 0.6) * 1.6, 0.2, 1.15);
      cx.globalAlpha = clamp(p.al * ALPHA * depth, 0, 1);
      cx.fillStyle = `rgb(${PAL[KEYS[p.t]]})`;
      cx.beginPath(); cx.arc(p.x, p.y, Math.max(p.sz * DPR * p.s, 0.1), 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;
    /* occasional signal along a pathway — the thing "thinking" */
    if (fires.length < 3 && Math.random() < 0.02) fires.push({ e: E[Math.floor(Math.random() * E.length)], t: 0 });
    for (let i = fires.length - 1; i >= 0; i--) {
      const f = fires[i]; f.t += dt * 1.1;
      if (f.t >= 1) { fires.splice(i, 1); continue; }
      const a = P[f.e.i], b = P[f.e.j], glow = Math.sin(f.t * Math.PI) * ALPHA;
      cx.globalAlpha = glow; cx.fillStyle = `rgb(${PAL.lime})`;
      cx.beginPath(); cx.arc(lerp(a.x, b.x, f.t), lerp(a.y, b.y, f.t), DPR * 2.2, 0, 7); cx.fill();
      cx.globalAlpha = 1;
    }
  }

  size();
  addEventListener('resize', size, { passive: true });
  if (reduced) {                      // one static frame, no motion
    last = performance.now(); T = 4; frame(performance.now());
  } else {
    kick();
  }
})();
