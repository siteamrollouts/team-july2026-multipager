/* ═══════════════════════════════════════════════════════════════
   About — the signature story visual. The same neural point-cloud
   the homepage uses, driven by scroll: the balls start disparate and
   spread out (the fragmented industry) and, as you reach "So we built
   Team", they pull together into the connected brain, synapses firing.
   Mounts to <canvas class="story-bg">.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const cv = document.querySelector('.story-bg'); if (!cv) return;
  const cx = cv.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;
  const N = touch ? 120 : 240;
  // theme-aware palette: light points on the dark ground, dark points on paper
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
  const ALPHA = 0.58;
  const P = [], E = [];
  let W, H, DPR, R3, F = 2.1, VW, VH, T = 0, prog = 0, hidden = false;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // brain positions (gaussian sphere) + a far scattered position for each point
  for (let i = 0; i < N; i++) {
    let x = gauss(), y = gauss() * 0.9, z = gauss();
    const m = Math.hypot(x, y, z) || 1, r = Math.pow(Math.random(), 0.42);
    x = x / m * r; y = y / m * r; z = z / m * r;
    const sr = rnd(1.7, 3.5);
    const c = Math.random();
    P.push({ bx: x, by: y, bz: z,
      ax: x * sr + gauss() * 1.1, ay: y * sr + gauss() * 1.1, az: z * sr + gauss() * 1.1,
      ph: rnd(0, Math.PI * 2), sp: rnd(0.3, 0.9), sz: rnd(1, 2.5),
      t: c < 0.7 ? 0 : c < 0.89 ? 1 : 2, al: rnd(0.4, 1), x: 0, y: 0, s: 1 });
  }
  { const deg = new Array(N).fill(0), LINK = 0.34;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      if (deg[i] > 2 || deg[j] > 2) continue;
      const d = Math.hypot(P[i].bx - P[j].bx, P[i].by - P[j].by, P[i].bz - P[j].bz);
      if (d < LINK) { E.push({ i, j }); deg[i]++; deg[j]++; }
    } }

  function size() {
    VW = innerWidth; VH = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = VW * DPR; H = cv.height = VH * DPR;
    cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
    R3 = Math.min(VW, VH) * 0.46 * DPR;
  }
  function computeProg() {
    const a = document.getElementById('form-anchor');
    if (!a) { prog = clamp(scrollY / (VH * 1.6)); return; }
    const top = a.getBoundingClientRect().top;
    prog = clamp((VH * .82 - top) / (VH * .82));
  }
  const fires = [];
  function frame(now) {
    requestAnimationFrame(frame); if (hidden) return;
    const dt = Math.min(now / 1000 - T, 0.05); T = now / 1000; computeProg();
    cx.clearRect(0, 0, W, H);
    const f = easeIO(prog), cxp = W / 2, cyp = H / 2;
    const rotY = T * 0.10, rotX = 0.3 + Math.sin(T * 0.045) * 0.11;
    const cyv = Math.cos(rotY), syv = Math.sin(rotY), cxr = Math.cos(rotX), sxr = Math.sin(rotX);
    for (const p of P) {
      p.ph += p.sp * dt;
      const jit = 0.03 + (1 - f) * 0.045;
      const bx = lerp(p.ax, p.bx, f) + Math.sin(p.ph) * jit;
      const by = lerp(p.ay, p.by, f) + Math.cos(p.ph * 0.9) * jit;
      const bz = lerp(p.az, p.bz, f) + Math.sin(p.ph * 0.7) * jit;
      const x1 = bx * cyv + bz * syv, z1 = -bx * syv + bz * cyv;
      const y1 = by * cxr - z1 * sxr, z2 = Math.max(by * sxr + z1 * cxr, -F * 0.75);
      const s = F / (F + z2);
      p.x = cxp + x1 * R3 * s; p.y = cyp + y1 * R3 * s; p.s = s;
    }
    // synapse links fade in as the cloud coheres
    if (f > 0.02) {
      cx.lineWidth = DPR * 0.7;
      for (const ed of E) {
        const a = P[ed.i], b = P[ed.j];
        const depth = ((a.s + b.s) / 2 - 0.6) * 1.6;
        const o = clamp(depth, 0.12, 1) * 0.3 * ALPHA * f;
        cx.strokeStyle = `rgba(${PAL.bone},${o.toFixed(3)})`;
        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
      }
    }
    for (const p of P) {
      const depth = clamp((p.s - 0.6) * 1.6, 0.2, 1.15);
      cx.globalAlpha = clamp(p.al * ALPHA * depth, 0, 1);
      cx.fillStyle = `rgb(${PAL[KEYS[p.t]]})`;
      cx.beginPath(); cx.arc(p.x, p.y, Math.max(p.sz * DPR * p.s, 0.1), 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;
    // occasional firing signal once cohered — the brain "thinking"
    if (f > 0.5 && fires.length < 3 && Math.random() < 0.02) fires.push({ e: E[Math.floor(Math.random() * E.length)], t: 0 });
    for (let i = fires.length - 1; i >= 0; i--) {
      const fr = fires[i]; fr.t += dt * 1.1;
      if (fr.t >= 1) { fires.splice(i, 1); continue; }
      const a = P[fr.e.i], b = P[fr.e.j], glow = Math.sin(fr.t * Math.PI) * ALPHA * f;
      cx.globalAlpha = glow; cx.fillStyle = `rgb(${PAL.lime})`;
      cx.beginPath(); cx.arc(lerp(a.x, b.x, fr.t), lerp(a.y, b.y, fr.t), DPR * 2.2, 0, 7); cx.fill();
      cx.globalAlpha = 1;
    }
  }

  size(); addEventListener('resize', size, { passive: true });
  document.addEventListener('visibilitychange', () => hidden = document.hidden);
  if (reduced) { T = performance.now() / 1000; computeProg(); hidden = false; frame(performance.now()); hidden = true; }
  else requestAnimationFrame(frame);
})();
