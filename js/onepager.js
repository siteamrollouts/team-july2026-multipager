/* ═══════════════════════════════════════════════════════════════
   team — "Behind the Glass" v2.2 · the memory-graph brain
   A 3D point-cloud brain (white/lime/orange neurons, fixed synaptic
   pathways) that rotates in space, breaks apart in the scatter, and
   reassembles at the turn. No frameworks. One rAF loop.
   ═══════════════════════════════════════════════════════════════ */
(() => {
'use strict';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch   = matchMedia('(pointer: coarse)').matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const smooth = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ── loader ── */
addEventListener('load', () => setTimeout(() => {
  document.body.removeAttribute('data-loading');
  if (!reduced) document.body.classList.add('field-on');
}, 950));
setTimeout(() => document.body.removeAttribute('data-loading'), 3200);

/* ── debug/QA: ?noloader kills intro · ?y=N jumps scroll ── */
const q = new URLSearchParams(location.search);
/* the intro plays once per session — returning visits skip straight in */
const seenIntro = (() => {
  try { const s = sessionStorage.getItem('tm-intro'); sessionStorage.setItem('tm-intro', '1'); return !!s; }
  catch { return false; }
})();
if (q.has('noloader') || seenIntro) {
  const l = $('#loader'); l.style.transition = 'none'; l.style.display = 'none';
  document.body.removeAttribute('data-loading');
  document.body.classList.add('field-on');
}
if (q.has('y')) addEventListener('load', () => {
  document.documentElement.style.scrollBehavior = 'auto';
  scrollTo(0, +q.get('y'));
});

/* ── marquee ── */
const APPS = [
  ['SHEETS','googlesheets'],['NOTION','notion'],['DROPBOX','dropbox'],['GMAIL','gmail'],
  ['CALENDAR','googlecalendar'],['DRIVE','googledrive'],['SLACK','slack'],['TEAMS','microsoftteams'],
  ['ZOOM','zoom'],['ASANA','asana'],['MONDAY','monday'],['TRELLO','trello'],['DOCS','googledocs'],
];
const mq = $('#mq');
if (mq) mq.innerHTML = (APPS.map(([n, f]) =>
  `<span class="mqi"><img src="assets/logos/${f}.svg" alt="">${n}<i>✳</i></span>`).join('')).repeat(2);

/* ── menu ── */
const burger = $('#burger');
burger.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', open);
  $('#menu').setAttribute('aria-hidden', !open);
});
$$('#menu a').forEach(a => a.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', false);
}));

/* ── beta form → CRM (public website-leads endpoint, source_form='beta').
   Creates/updates the contact at admin.getteamnow.com; the endpoint is
   upgrade-only and dedupes on email. Runs in reduced-motion mode too. ── */
const betaForm = $('#betaForm');
if (betaForm) betaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (betaForm.classList.contains('busy') || betaForm.classList.contains('sent')) return;
  const qs = new URLSearchParams(location.search);
  const payload = {
    source_form: 'beta',
    first_name: betaForm.first_name.value.trim(),
    last_name: betaForm.last_name.value.trim() || undefined,
    email: betaForm.email.value.trim(),
    website: betaForm.website.value,           // honeypot — humans leave it empty
    page_url: location.href,
    utm_source: qs.get('utm_source') || undefined,
    utm_medium: qs.get('utm_medium') || undefined,
    utm_campaign: qs.get('utm_campaign') || undefined,
  };
  betaForm.classList.add('busy');
  betaForm.classList.remove('failed');
  try {
    const r = await fetch('https://admin.getteamnow.com/api/v1/website-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`website-leads responded ${r.status}`);
    betaForm.classList.add('sent');
  } catch {
    betaForm.classList.add('failed');
  } finally {
    betaForm.classList.remove('busy');
  }
});

/* ── intersection reveals ── */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target;
  el.style.transitionDelay = el.style.transitionDelay || `${el.dataset.delay || 0}ms`;
  el.classList.add('in');
  io.unobserve(el);
}), { threshold: 0.18 });
$$('[data-reveal]').forEach(el => io.observe(el));

/* ── ledger: scroll-scrubbed both ways (see ledgerScrub in the frame loop).
   reduced-motion renders it complete via CSS. ── */
const ledger = $('[data-ledger]');
const ledgerLines = ledger ? $$('[data-line]', ledger) : [];

/* ── credo strikes ── */
const strikes = $$('[data-strike]');
if (strikes.length) new IntersectionObserver((es, o) => es.forEach(e => {
  if (!e.isIntersecting) return; o.disconnect();
  strikes.forEach((li, i) => setTimeout(() => li.classList.add('struck'), 400 + i * 380));
}), { threshold: 0.5 }).observe(strikes[0]);

/* ── counter ── */
const counter = $('[data-count]');
if (counter) new IntersectionObserver((es, o) => es.forEach(e => {
  if (!e.isIntersecting) return; o.disconnect();
  const end = +counter.dataset.count, t0 = performance.now();
  (function tick(t) {
    const p = clamp((t - t0) / 1600), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
    counter.textContent = v.toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}), { threshold: 0.6 }).observe(counter);

/* ── the narrating capsule ── */
const ACTS = [
  ['act-hero',   '00', 'Intro'],
  ['act-scatter','01', 'The problem'],
  ['act-turn',   '02', 'Meet Team'],
  ['devband',    '02', 'The product'],
  ['act-connect','03', 'How it works'],
  ['act-chat',   '03', 'The difference'],
  ['act-reason', '04', 'The whole picture'],
  ['act-act',    '05', 'Team at work'],
  ['act-catch',  '06', 'While you slept'],
  ['act-who',    '07', 'Who it’s for'],
  ['act-credo',  '08', 'The credo'],
  ['act-access', '09', 'Join the beta'],
].map(([id, num, name]) => ({ el: document.getElementById(id), num, name, top: 0 }));
const actName = $('#actName'), orbProg = $('#orbProg');
const RING = 2 * Math.PI * 19;
let actIdx = -1, docH = 1;

function narrate(y, vh) {
  orbProg.style.strokeDashoffset = RING * (1 - clamp(y / (docH - vh)));
  let i = 0;
  for (let k = 0; k < ACTS.length; k++)
    if (ACTS[k].el.offsetParent !== null && y >= ACTS[k].top - vh * 0.5) i = k;
  if (i !== actIdx) {
    actIdx = i;
    actName.textContent = ACTS[i].name;
    actName.classList.remove('swap'); void actName.offsetWidth; actName.classList.add('swap');
  }
}

/* — the difference: shared copy for both motion paths — */
const CHAT_Q = "Where's the final master?";
const CHAT_BOT = "I don't have access to your files, but here are some best practices for organizing masters: use clear naming conventions, keep a single source of truth, and archive old versions…";

if (reduced) {
  // chat panes render complete — no typing
  const bq = $('#botQ'), tq = $('#teamQ'), ba = $('#botA'), ta = $('#teamA');
  if (bq) {
    bq.textContent = CHAT_Q; tq.textContent = CHAT_Q; ba.textContent = CHAT_BOT;
    ta.classList.add('on');
    $$('[data-stratum]').forEach(el => el.classList.add('lit'));
  }
  const mA = () => { ACTS.forEach(a => a.top = a.el.offsetTop); docH = document.body.scrollHeight; };
  mA(); addEventListener('resize', mA);
  addEventListener('scroll', () => narrate(scrollY, innerHeight), { passive: true });
  return;
}

/* ═══ scroll state — smoothed SY chases Y ═══ */
let Y = scrollY, SY = scrollY, VW = innerWidth, VH = innerHeight, T = 0;
let MOBILE = innerWidth <= 900;

let pins = {};
let marks = {};

function measure() {
  VW = innerWidth; VH = innerHeight;
  MOBILE = VW <= 900;
  pins = {};
  $$('[data-scrub]').forEach(el => {
    if (el.offsetParent === null) return;   // hidden section — no pin
    const stage = el.querySelector('.pin__stage');
    if (stage && getComputedStyle(stage).position !== 'sticky') {
      // un-pinned (mobile): scrub runs while the section travels through
      // the viewport — starts as it peeks in, completes as its bottom nears
      pins[el.dataset.scrub] = { el, top: el.offsetTop - VH * 0.82, range: Math.max(el.offsetHeight, VH * 0.9) };
    } else {
      pins[el.dataset.scrub] = { el, top: el.offsetTop, range: Math.max(el.offsetHeight - VH, 1) };
    }
  });
  ACTS.forEach(a => a.top = a.el.offsetTop);
  docH = document.body.scrollHeight;
  marks = {
    hero:     $('#act-hero').offsetTop,
    turnEnd:  pins.turn ? pins.turn.top + pins.turn.range : 0,
    connect:  $('#act-connect').offsetTop,
    catch:    $('#act-catch').offsetParent === null ? 1e9 : $('#act-catch').offsetTop,   // finite: Infinity NaNs the smooth() math
    who:      $('#act-who').offsetTop,
    finale:   $('#act-access').offsetTop,
  };
  Brain.resize();
}

/* ═══ THE BRAIN — 3D memory graph (ref: teamrollouts.com brain)
   white/lime/orange neurons on fixed synaptic pathways, rotating.
   calm → breaks apart (scatter) → reassembles dense (turn) → quiet
   presence behind content → gathers again for the finale.        ═══ */
const Brain = (() => {
  const cv = $('#field'), cx = cv.getContext('2d');
  const N = touch ? 120 : 250;
  const BONE = '239,235,227', LIME = '217,250,135', ORANGE = '245,96,2';
  const P = [], E = []; let W, H, DPR, R3, F;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  /* seed once in unit space; scale at draw time */
  for (let i = 0; i < N; i++) {
    // organic cloud: gaussian ball, denser core, ragged edge
    let x = gauss(), y = gauss() * 0.88, z = gauss();
    const m = Math.sqrt(x * x + y * y + z * z) || 1;
    const r = Math.pow(Math.random(), 0.42);              // bias outward-ish, dense middle
    x = x / m * r; y = y / m * r; z = z / m * r;
    const c = Math.random();
    P.push({
      bx: x, by: y, bz: z,
      dx: rnd(-1, 1), dy: rnd(-1, 1), dz: rnd(-1, 1),     // scatter direction
      ph: rnd(0, Math.PI * 2), sp: rnd(0.3, 0.9),
      sz: rnd(1, 2.6),
      col: c < 0.68 ? BONE : c < 0.88 ? LIME : ORANGE,
      al: rnd(0.45, 1),
      x: 0, y: 0, s: 1,
    });
  }
  /* fixed synaptic pathways — nearest neighbours in base space */
  {
    const deg = new Array(N).fill(0), LINK = 0.34;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      if (deg[i] > 2 || deg[j] > 2) continue;
      const a = P[i], b = P[j];
      const d = Math.hypot(a.bx - b.bx, a.by - b.by, a.bz - b.bz);
      if (d < LINK) { E.push({ i, j, d0: d }); deg[i]++; deg[j]++; }
    }
  }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = VW * DPR; H = cv.height = VH * DPR;
    cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
    R3 = Math.min(VW, VH) * 0.40 * DPR;
    F = 2.1; // perspective (in R3 units)
  }

  let mx = 0, my = 0;
  if (!touch) addEventListener('pointermove', e => {
    mx = (e.clientX / VW - 0.5); my = (e.clientY / VH - 0.5);
  }, { passive: true });

  const fires = [];
  function maybeFire(alpha) {
    if (fires.length >= 3 || Math.random() > 0.025 || alpha < 0.12) return;
    fires.push({ e: E[Math.floor(Math.random() * E.length)], t: 0 });
  }

  function draw(agit, conv, gather, alpha, dt) {
    cx.clearRect(0, 0, W, H);
    if (alpha <= 0.01) return;
    const cxp = W / 2, cyp = H / 2;
    const e = 1 - Math.pow(1 - conv, 3);
    const scale = R3 * (1 - e * 0.28) * (1 - gather * 0.42);
    const rotY = T * 0.12 + e * 0.6 + mx * 0.5;
    const rotX = 0.32 + Math.sin(T * 0.05) * 0.12 + my * 0.3;
    const cy = Math.cos(rotY), sy = Math.sin(rotY);
    const cxr = Math.cos(rotX), sxr = Math.sin(rotX);
    const burst = agit * (1 - e);                        // the scatter blows it apart

    for (const p of P) {
      p.ph += p.sp * dt;
      let x = p.bx + Math.sin(p.ph) * 0.03, y = p.by + Math.cos(p.ph * 0.9) * 0.03, z = p.bz + Math.sin(p.ph * 0.7) * 0.03;
      if (burst > 0) { x += p.dx * burst * 1.7; y += p.dy * burst * 1.4; z += p.dz * burst * 1.7; }
      // rotate Y then X
      let x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      let y1 = y * cxr - z1 * sxr, z2 = Math.max(y * sxr + z1 * cxr, -F * 0.75); // never cross the camera plane
      const s = F / (F + z2);                            // perspective
      p.x = cxp + x1 * scale * s;
      p.y = cyp + y1 * scale * s;
      p.s = s;
    }

    /* pathways */
    cx.lineWidth = DPR * 0.7;
    for (const ed of E) {
      const a = P[ed.i], b = P[ed.j];
      const stretch = burst > 0 ? clamp(1 - burst * 1.6) : 1;   // fraying breaks the links
      if (stretch <= 0.02) continue;
      const depth = ((a.s + b.s) / 2 - 0.6) * 1.6;
      const o = clamp(depth, 0.15, 1) * 0.34 * alpha * stretch * (0.75 + e * 0.5);
      cx.strokeStyle = `rgba(${BONE},${o.toFixed(3)})`;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
    }

    /* neurons */
    hiV += (hiT - hiV) * Math.min(1, dt * 4);
    for (let i = 0; i < N; i++) {
      const p = P[i];
      const depth = clamp((p.s - 0.6) * 1.6, 0.2, 1.15);
      const hot = i === hiIdx ? hiV : 0;
      cx.globalAlpha = clamp(p.al * alpha * depth + hot * 0.5, 0, 1);
      cx.fillStyle = hot > 0.05 ? `rgb(${LIME})` : `rgb(${p.col})`;
      const r = Math.max(p.sz * DPR * p.s * (1 + e * 0.15) * (1 + hot * 1.4), 0.1);
      if (hot > 0.05) {           // halo glow
        cx.globalAlpha = clamp(0.25 * hot * alpha, 0, 1);
        cx.beginPath(); cx.arc(p.x, p.y, r * 3.2, 0, 7); cx.fill();
        cx.globalAlpha = clamp(p.al * alpha * depth + hot * 0.5, 0, 1);
      }
      cx.beginPath(); cx.arc(p.x, p.y, r, 0, 7); cx.fill();
    }
    cx.globalAlpha = 1;

    /* signals along pathways */
    maybeFire(alpha);
    for (let i = fires.length - 1; i >= 0; i--) {
      const f = fires[i]; f.t += dt * 1.2;
      if (f.t >= 1) { fires.splice(i, 1); continue; }
      const a = P[f.e.i], b = P[f.e.j];
      const x = lerp(a.x, b.x, f.t), y = lerp(a.y, b.y, f.t);
      const glow = Math.sin(f.t * Math.PI) * alpha;
      cx.strokeStyle = `rgba(${LIME},${(0.5 * glow).toFixed(3)})`;
      cx.lineWidth = DPR * 1.1;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
      cx.globalAlpha = glow;
      cx.fillStyle = `rgb(${LIME})`;
      cx.beginPath(); cx.arc(x, y, DPR * 2.4, 0, 7); cx.fill();
      cx.globalAlpha = 1;
    }
  }
  let hiIdx = -1, hiV = 0, hiT = 0;
  function highlight(i) { hiIdx = i; hiT = 1; }
  function unhighlight() { hiT = 0; }
  function nodeAt(i) { const p = P[i]; return { x: p.x / DPR, y: p.y / DPR, s: p.s }; }
  function pickFront(fn) {
    const c = [];
    for (let i = 0; i < N; i++) { const p = P[i];
      if (p.s > 0.88 && fn(p.x / DPR, p.y / DPR)) c.push(i); }
    return c.length ? c[Math.floor(Math.random() * c.length)] : -1;
  }
  return { resize, draw, highlight, unhighlight, nodeAt, pickFront };
})();

/* ═══ the teammate whisper — a node lights up, teammate reports in ═══ */
const tmate = $('#tmate'), tmateMsg = $('#tmateMsg'), tmateTime = $('#tmateTime');
const TMSGS = [
  ["The video budget moved to $3,100 in Sheets — I've updated the one-sheet and the Notion plan to match.", 'just now'],
  ["Pre-save velocity doubled overnight. I've moved the playlist pitch up a week.", '2m ago'],
  ["A new master just landed in Dropbox — v10 now replaces v9 everywhere it's referenced.", 'just now'],
  ["Vinyl lead time is 11 weeks; street date is 9 out. I flagged it before the PO was placed.", '8m ago'],
  ["Press embargo confirmed for Friday. I've re-briefed the whole list.", 'just now'],
];
const Whisper = {
  state: 'idle', t: 0.6, idx: -1, msg: 0, cx: 0, cy: 0, side: 1, lastY: -1,
  place(nx) {   // card hugs the brain's column on its node's side — never touches the copy,
                // and never drifts to the screen edge on ultrawide
    const R = Math.min(VW, VH) * 0.4;
    const L = Math.max(24, VW / 2 - R - 310);
    return nx < VW / 2 ? L : VW - L - 272;
  },
  update(dt, active) {
    if (!active) {
      if (this.state !== 'idle') { tmate.classList.remove('show'); Brain.unhighlight(); this.state = 'idle'; this.t = 1.4; }
      return;
    }
    this.t -= dt;
    if (this.state === 'idle' && this.t <= 0) {
      // alternate sides each cycle, and prefer a clearly different height to the last card
      const R = Math.min(VW, VH) * 0.4;   // brain radius — bands track it, not the viewport
      const inSide = this.side < 0
        ? x => x > VW / 2 - R && x < VW / 2 - R * 0.3
        : x => x > VW / 2 + R * 0.3 && x < VW / 2 + R;
      const inY = y => y > VH * 0.22 && y < VH * 0.8;
      const farY = y => this.lastY < 0 || Math.abs(y - this.lastY) > VH * 0.16;
      this.idx = Brain.pickFront((x, y) => inSide(x) && inY(y) && farY(y));
      if (this.idx < 0) this.idx = Brain.pickFront((x, y) => inSide(x) && inY(y));
      if (this.idx < 0) { this.t = 0.2; return; }   // nothing on that side yet — retry almost immediately
      this.side = -this.side;
      const [m, tm] = TMSGS[this.msg % TMSGS.length]; this.msg++;
      tmateMsg.textContent = m; tmateTime.textContent = tm;
      Brain.highlight(this.idx);
      const n = Brain.nodeAt(this.idx);
      this.lastY = n.y;
      this.cx = this.place(n.x);
      this.cy = clamp(n.y - 44, 80, VH - 260);
      tmate.classList.add('show');
      this.state = 'show'; this.t = 4;
    } else if (this.state === 'show') {
      const n = Brain.nodeAt(this.idx);   // drift with the neuron
      const txp = this.place(n.x);
      this.cx = lerp(this.cx, txp, dt * 2);
      this.cy = lerp(this.cy, clamp(n.y - 44, 80, VH - 260), dt * 2);
      tmate.style.left = this.cx + 'px'; tmate.style.top = this.cy + 'px';
      if (this.t <= 0) { tmate.classList.remove('show'); Brain.unhighlight(); this.state = 'idle'; this.t = 0.65; }
    }
  }
};

/* ═══ scene handles ═══ */
const heroCenter = $('.hero__center');
const trows = $$('[data-trow]'), truth = $('[data-truth]'), track = $('.track');
const memoryLn = $('[data-memory]');
const GROUPS = ['master', 'artwork', 'budget', 'plan', 'convo'];
const giCount = {};
const tiles = $$('[data-tile]').map(el => {
  const g = el.dataset.group;
  const gi = giCount[g] = (giCount[g] ?? -1) + 1;   // index within its group — mobile column slot
  el.style.setProperty('--gi', gi);
  return { el, d: +el.style.getPropertyValue('--d') || 1, g: GROUPS.indexOf(g) };
});
const until = $('.turn__until'), revealT = $('.turn__reveal'), turnMark = $('#turnMark');
const orbit = $('.orbit'), orbitCore = $('#orbitCore'), packetsG = $('#packets');
const olines = $$('.oline').map(p => { const L = p.getTotalLength();
  p.style.strokeDasharray = L; p.style.strokeDashoffset = L; return { p, L }; });
const onodes = $$('.onode');
const NODE_XY = onodes.map(n => [+n.dataset.x, +n.dataset.y]);
const packets = NODE_XY.map(() => {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('r', '3.5'); c.style.opacity = 0; packetsG.append(c); return c;
});
/* phantom spokes — connections beyond the six we name; they reach out from
   the core and fade before they resolve. plus a few unlabelled node outlines
   on the far ring, out of focus. */
const ghostG = $('#oghosts');
const ghosts = [];
const gpax = [];   // grey packets riding the phantom spokes
if (ghostG) {
  const NODE_ANG = NODE_XY.map(([x, y]) => Math.atan2(y - 320, x - 320));
  const GN = 26;
  for (let i = 0; i < GN; i++) {
    let a = (i / GN) * Math.PI * 2 + 0.19 + (i % 3) * 0.07;
    for (const na of NODE_ANG) {
      const d = Math.atan2(Math.sin(a - na), Math.cos(a - na));
      if (Math.abs(d) < 0.13) a += 0.17;
    }
    const r = [205, 248, 285, 302, 226, 264, 292, 238][i % 8] + (i % 5) * 5;
    const x = 320 + Math.cos(a) * r, y = 320 + Math.sin(a) * r;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M320 320 L${x.toFixed(1)} ${y.toFixed(1)}`);
    p.setAttribute('stroke', 'url(#ofade)');
    p.setAttribute('stroke-width', (0.7 + (i % 4) * 0.22).toFixed(2));
    ghostG.append(p);
    const L = p.getTotalLength();
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.style.opacity = 0;
    ghosts.push({ p, L, base: 0.3 + ((i * 0.618 + 0.21) % 1) * 0.7, sp: 0.5 + (i % 5) * 0.17, ph: i * 1.31 });
    /* a grey packet per phantom spoke — it dims with the line's radial
       fade on the way out and re-emerges as it returns to the core */
    const gc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    gc.setAttribute('r', '2.5'); gc.style.fill = '#8f8b82'; gc.style.opacity = 0;
    packetsG.append(gc);
    gpax.push({ c: gc, a, r, sp: 0.13 + (i % 5) * 0.032, ph: (i * 0.417 + 0.09) % 1 });
  }
  /* faded, unlabelled connection points — solid ink fill so the ring
     lines never read through them; only the outline is ghosted.
     One in each angular gap between the labelled nodes (22.5° offsets),
     plus two inner-ring strays. */
  [[-1.9635, 295], [-1.1781, 150], [-0.3927, 295], [0.3927, 225], [1.1781, 295],
   [1.9635, 225], [2.7489, 295], [-2.7489, 225], [1.1781, 150], [-0.3927, 150]].forEach(([a, rr], k) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', (320 + Math.cos(a) * rr).toFixed(1));
    c.setAttribute('cy', (320 + Math.sin(a) * rr).toFixed(1));
    c.setAttribute('r', 34);
    c.setAttribute('fill', '#0d0c0b');
    c.setAttribute('stroke', '#efebe3');
    c.setAttribute('stroke-opacity', '0.1');
    c.style.opacity = 0;
    ghostG.append(c);
    ghosts.push({ ring: c, ph: k * 1.7, w: k });
  });
}
const connectCopy = $('#act-connect .split__copy');
const reasonStage = $('#act-reason .stage--split'), reasonCopy = $('#act-reason .split__copy');
const insights = $$('[data-insight]');
const klines = $$('[data-k]'), slept = $('[data-slept]'), catchImg = $('.catch__bg img');
const traveler = $('#traveler');
const finaleBg = $('.finale__bg');

function windowFade(p, a, b, feather = 0.35) {
  const w = b - a, f = w * feather;
  return smooth(p, a, a + f) * (1 - smooth(p, b - f, b));
}

/* — hero exit — */
function hero(p) {
  heroCenter.style.transform = `translateY(${p * -9}vh) scale(${1 - p * 0.04})`;
  heroCenter.style.opacity = 1 - smooth(p, 0.35, 0.85);
  heroCenter.style.filter = p > 0.02 ? `blur(${(smooth(p, 0.3, 0.9) * 7).toFixed(2)}px)` : '';
}

/* — scatter: each track row lights its app tiles — */
const ROW_W = trows.map((_, i) => [0.05 + i * 0.13, 0.18 + i * 0.13]); // 5 windows, .05 → .70
function scatter(p) {
  const exit = smooth(p, 0.71, 0.79);
  track.style.opacity = 1 - exit;
  trows.forEach((r, i) => {
    const [a, b] = ROW_W[i];
    const f = windowFade(p, a, b + 0.02, 0.25);
    const seen = smooth(p, a - 0.03, a);
    r.classList.toggle('on', f > 0.5);
    if (MOBILE) {
      // rows stack in one spot — full cross-fade, one visible at a time
      r.style.opacity = f;
      r.style.transform = `translateY(${(1 - f) * 10}px)`;
    } else {
      r.style.opacity = 0.22 + f * 0.78;
      r.style.transform = `translateX(${(1 - seen) * -14}px)`;
    }
  });
  const rowFades = ROW_W.map(([a, b]) => windowFade(p, a, b + 0.02, 0.25));
  tiles.forEach(({ el, d, g }, i) => {
    const f = rowFades[g] ?? 0;
    if (f <= 0.005) { el.style.opacity = 0; return; }
    const drift = (0.5 - p) * (MOBILE ? 16 : 80) * d;
    const jx = Math.sin(T * (1.1 + i * 0.13) + i * 9) * 6;
    const jy = Math.cos(T * (1.3 + i * 0.11) + i * 5) * 6;
    el.style.opacity = f;
    el.style.transform = `translate(${jx}px,${drift + jy + (1 - f) * 22}px) scale(${0.96 + f * 0.04})`;
  });
  /* the "one person remembers everything" beat lands first, then the truth
     line takes the stage and holds to the pin boundary */
  if (memoryLn) {
    const mem = windowFade(p, 0.7, 0.87, 0.22);
    memoryLn.style.opacity = mem;
    memoryLn.style.transform = `scale(${0.985 + mem * 0.015})`;
  }
  const tr = windowFade(p, 0.87, 1.0, 0.28);   // holds to the pin boundary — no dead scroll after it
  truth.style.opacity = tr;
  truth.style.transform = `scale(${0.985 + tr * 0.015})`;
}

/* — the turn — */
function turn(p) {
  const u = smooth(p, 0, 0.05) * (1 - smooth(p, 0.14, 0.22));   // snaps in right after the truth line
  until.style.opacity = u;
  until.style.transform = `scale(${0.97 + u * 0.03})`;
  const rv = smooth(p, 0.46, 0.66);                            // in a touch earlier…
  const out = smooth(p, 0.9, 0.965);                           // …out later = longer hold
  revealT.style.opacity = rv * (1 - out);
  revealT.style.transform = `translateY(${(1 - rv) * 46}px) scale(${0.985 + rv * 0.015})`;
  if (turnMark) {
    // logomark rides above the headline, then drops to centre and darkens as the green circle wraps it
    const rr = revealT.getBoundingClientRect();
    const drop = smooth(p, 0.9, 0.96);
    const y = lerp(rr.top - 72, VH / 2 - 28, drop);
    turnMark.style.opacity = rv * (1 - smooth(p, 0.955, 0.995));
    turnMark.style.transform = `translate(${VW / 2 - 28}px, ${y}px)`;
    turnMark.style.filter = `brightness(${(1.25 * (1 - drop)).toFixed(3)})`;
  }
  return smooth(p, 0.1, 0.62);
}

/* — traveler: the core morphs from the brain into the orbit. With the
     product band between the turn and the orbit, it rides BENEATH the
     page (z-index under main) — ducking under the device on its way — */
const hasDev = !!$('#devband');
function travel(pT, pC) {
  orbitCore.style.opacity = smooth(pC, 0.2, 0.28);
  const born = smooth(pT, 0.93, 1);
  const hand = smooth(pC, 0.02, 0.24);
  if (born <= 0 || hand >= 1) { traveler.style.opacity = 0; return; }
  const or = orbit.getBoundingClientRect();
  const unit = or.width / 640;
  const tx = or.left + 320 * unit, ty = or.top + 320 * unit;
  const x = lerp(VW / 2, tx, hand), y = lerp(VH / 2, ty, hand);
  const s = lerp(1, unit, hand) * born;
  traveler.style.opacity = born * (1 - smooth(pC, 0.2, 0.26));
  traveler.style.transform = `translate(${x - 54}px,${y - 54}px) scale(${s})`;
}

/* — connect — */
function connect(p) {
  const c = smooth(p, 0, 0.07);
  connectCopy.style.opacity = c;
  connectCopy.style.transform = `translateY(${(1 - c) * 30}px)`;
  olines.forEach(({ p: path, L }, i) => {
    const t = smooth(p, 0.1 + i * 0.045, 0.28 + i * 0.045);
    path.style.strokeDashoffset = L * (1 - t);
    const n = onodes[i], nt = smooth(p, 0.2 + i * 0.045, 0.32 + i * 0.045);
    n.style.opacity = nt;
    n.setAttribute('transform', `translate(${n.dataset.x} ${n.dataset.y}) scale(${0.6 + nt * 0.4})`);
  });
  ghosts.forEach((g, i) => {
    if (g.ring) {
      /* the disc fades in once (ink fill occludes the rings), then only
         its outline shimmers */
      g.ring.style.opacity = smooth(p, 0.3 + g.w * 0.035, 0.42 + g.w * 0.035);
      g.ring.setAttribute('stroke-opacity', (0.09 + 0.05 * Math.sin(T * 0.7 + g.ph)).toFixed(3));
      return;
    }
    g.p.style.strokeDashoffset = g.L * (1 - smooth(p, 0.26 + i * 0.008, 0.44 + i * 0.008));
    g.p.style.opacity = (g.base * (0.6 + 0.4 * Math.sin(T * g.sp + g.ph))).toFixed(2);
  });
  const alive = smooth(p, 0.55, 0.65);
  packets.forEach((c2, i) => {
    if (alive <= 0) { c2.style.opacity = 0; return; }
    let t = (T * 0.22 + i * 0.37) % 1;
    t = t < 0.5 ? t * 2 : 2 - t * 2;
    c2.setAttribute('cx', lerp(320, NODE_XY[i][0], t));
    c2.setAttribute('cy', lerp(320, NODE_XY[i][1], t));
    c2.style.opacity = alive * 0.9;
  });
  gpax.forEach(g => {
    if (alive <= 0) { g.c.style.opacity = 0; return; }
    let t = (T * g.sp + g.ph) % 1;
    t = t < 0.5 ? t * 2 : 2 - t * 2;               // out along the spoke, then home
    const d = t * g.r;
    g.c.setAttribute('cx', (320 + Math.cos(g.a) * d).toFixed(1));
    g.c.setAttribute('cy', (320 + Math.sin(g.a) * d).toFixed(1));
    /* mirror the #ofade gradient (α .4 → .22 @165 → 0 @300), normalized */
    const fade = d < 165 ? 1 - (d / 165) * 0.45 : Math.max(0.55 * (1 - (d - 165) / 135), 0);
    g.c.style.opacity = (alive * 0.75 * fade).toFixed(2);
  });
}

/* — the difference: both panes get the same question; one types a caveat,
     the other lights up its context and answers with receipts — */
const botQ = $('#botQ'), teamQ = $('#teamQ'), botA = $('#botA');
const strataEls = $$('[data-stratum]'), teamAns = $('#teamA');
function chatScene(p) {
  const qt = smooth(p, 0.06, 0.22);
  const qn = Math.round(qt * CHAT_Q.length);
  botQ.textContent = CHAT_Q.slice(0, qn);
  teamQ.textContent = CHAT_Q.slice(0, qn);
  const at = smooth(p, 0.26, 0.52);
  botA.textContent = CHAT_BOT.slice(0, Math.round(at * CHAT_BOT.length));
  strataEls.forEach((el, i) => el.classList.toggle('lit', p > 0.28 + i * 0.055));
  teamAns.classList.toggle('on', p > 0.62);
}

/* — reason — */
function reason(p) {
  const c = smooth(p, 0, 0.07);
  reasonCopy.style.opacity = c;
  reasonCopy.style.transform = `translateY(${(1 - c) * 30}px)`;
  reasonStage.classList.toggle('is-live', p > 0.12);
  insights.forEach((el, i) => {
    const t = smooth(p, 0.14 + i * 0.16, 0.34 + i * 0.16);
    el.style.opacity = smooth(t, 0, 0.4);
    el.style.transform = `translate(${(1 - t) * 120}px,${(1 - t) * (60 + i * 26)}px) rotate(${(1 - t) * (6 + i * 4)}deg) scale(${0.92 + t * 0.08})`;
  });
}

/* — the ledger writes itself in as it arrives, and un-writes on the way
     back up — same scroll-scrub grammar as everything else — */
function ledgerScrub() {
  if (!ledger) return;
  /* no early-out: a fast flick past the window must still settle the
     toggles, or lines strand mid-state (one element, rect is cheap) */
  const r = ledger.getBoundingClientRect();
  const p = clamp((VH - r.top) / (VH * 0.9));
  ledgerLines.forEach((el, i) => el.classList.toggle('in', p > 0.22 + i * 0.115));
}

/* — the catch — */
function catchScene(p) {
  klines.forEach((el, i) => {
    el.style.setProperty('--fill', `${smooth(p, 0.04 + i * 0.155, 0.19 + i * 0.155) * 100}%`);
  });
  const s = smooth(p, 0.7, 0.82);
  slept.style.opacity = s;
  slept.style.transform = `scale(${1.1 - s * 0.1})`;
  if (catchImg) catchImg.style.transform = `translateY(${(p - 0.5) * -7}%) scale(1.08)`;
}

/* ═══ the app screen lives — countdown ticks, tasks land, teammate chats ═══ */
(() => {
  const band = $('#devband'); if (!band) return;
  let live = false;
  new IntersectionObserver(e => { live = e[0].isIntersecting; }, { threshold: 0.12 }).observe(band);

  /* countdown counts for real */
  const secsEl = $('#appSecs'), minsEl = $('#appMins');
  let m = 6, s = 27;
  setInterval(() => {
    if (!live || document.hidden) return;
    s--; if (s < 0) { s = 59; m = m > 0 ? m - 1 : 59; }
    secsEl.textContent = String(s).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
  }, 1000);

  /* tasks keep landing on the timeline */
  const days = $$('.app__day');
  const POOL = [
    ['tcard--blue',  'Master v10 QC Check', 'AUDIO'],
    ['tcard--teal',  'Pre-Save Link Goes Live', 'DSP_ACTIVATION'],
    ['tcard--amber', 'Vinyl PO Sign-off', 'OPS'],
    ['tcard--dark',  'EPK Refresh + Press Shots', 'PRESS'],
    ['tcard--purple','Lyric Video Teaser Cut', 'CONTENT'],
    ['tcard--blue',  'Radio One-Sheet Draft', 'RADIO'],
  ];
  let ti = 0;
  setInterval(() => {
    if (!live || document.hidden) return;
    const [cls, title, tag] = POOL[ti % POOL.length];
    const day = days[1 + (ti % 3)];              // columns 2–4; col 1 keeps its anchors
    ti++;
    if (!day) return;
    const el = document.createElement('div');
    el.className = `tcard ${cls} tcard--pop`;
    el.innerHTML = `<p class="mono tcard__meta">ACTIVE · NEW</p><b>${title}</b><span class="mono">${tag}</span>`;
    day.append(el);
    const mine = day.querySelectorAll('.tcard--pop');
    if (mine.length > 2) { const o = mine[0]; o.classList.add('tcard--out'); setTimeout(() => o.remove(), 550); }
  }, 3800);

  /* the conversation carries on */
  const scroll = $('.app__scroll');
  const CHAT = [
    [0, 'TEAMMATE · 12:53', "Pulled 3 past releases. Ava's pre-save pushes in week 2 outperformed week 4 by 31%."],
    [1, '12:54 · YOU', 'Move the pre-save blast earlier then.'],
    [0, 'TEAMMATE · 12:54', 'Done. Moved to Thu 25 and assigned to Maya. Budget untouched.'],
    [1, '12:56 · YOU', "What's still unassigned this week?"],
    [0, 'TEAMMATE · 12:56', 'Two tasks: the country playlist pitch and the venue shortlist. Want owners on both?'],
    [1, '12:57 · YOU', 'Yes, assign them.'],
    [0, 'TEAMMATE · 12:57', 'Assigned. Playlist pitch to Sam, venues to Maya. Timeline updated.'],
  ];
  let ci = 0;
  setInterval(() => {
    if (!live || document.hidden) return;
    const [you, meta, text] = CHAT[ci % CHAT.length]; ci++;
    const d = document.createElement('div');
    d.className = 'app__msg' + (you ? ' app__msg--you' : '') + ' app__msg--in';
    d.innerHTML = `<u class="mono">${meta}</u><p>${text}</p>`;
    scroll.append(d);
    while (scroll.children.length > 4) scroll.firstChild.remove();
  }, 4200);
})();

/* ── cursor: native by default; the logomark equalizer plays over anything interactive ── */
if (!touch) {
  document.documentElement.classList.add('eqcur');
  const cur = $('.cursor');
  let tx = -100, ty = -100, cx = -100, cy = -100;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a,button,[data-hover]');
    cur.classList.toggle('is-on', !!t);
    if (t) {   // dark bars over light buttons (bone / lime), bone bars everywhere else
      const bg = getComputedStyle(t).backgroundColor.match(/\d+/g) || [0, 0, 0];
      cur.classList.toggle('is-ink', (+bg[0] * 0.299 + +bg[1] * 0.587 + +bg[2] * 0.114) > 140);
    }
  });
  (function cloop() {
    cx = lerp(cx, tx, 0.55); cy = lerp(cy, ty, 0.55);
    cur.style.transform = `translate(${cx}px,${cy}px)`;
    requestAnimationFrame(cloop);
  })();
  $$('[data-magnet]').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });
}

/* ═══ master rAF loop ═══ */
const brand = $('.brand');
let last = performance.now();
function isNear(pin) { return pin && SY > pin.top - VH && SY < pin.top + pin.range + VH; }

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now; T += dt;
  Y = scrollY;
  SY += (Y - SY) * (1 - Math.pow(0.001, dt));
  if (Math.abs(Y - SY) < 0.1) SY = Y;

  narrate(Y, VH);
  brand.style.opacity = Y > VH * 0.5 && Y < docH - VH * 2 ? 0.35 : 1;

  const pH = clamp((SY - marks.hero) / (VH * 0.85));
  const pS = pins.scatter ? clamp((SY - pins.scatter.top) / pins.scatter.range) : 0;
  const pT = pins.turn    ? clamp((SY - pins.turn.top)    / pins.turn.range)    : 0;
  const pC = pins.connect ? clamp((SY - pins.connect.top) / pins.connect.range) : 0;
  const pQ = pins.chat    ? clamp((SY - pins.chat.top)    / pins.chat.range)    : 0;
  const pR = pins.reason  ? clamp((SY - pins.reason.top)  / pins.reason.range)  : 0;
  const pK = pins.catch   ? clamp((SY - pins.catch.top)   / pins.catch.range)   : 0;

  if (SY > marks.hero - VH && SY < marks.hero + VH * 1.2) hero(pH);
  Whisper.update(dt, !touch && VW > 760 &&
    SY > marks.hero - VH * 0.5 && SY < marks.hero + VH * 0.7);
  if (isNear(pins.scatter)) scatter(pS);
  if (isNear(pins.turn)) turn(pT);
  // formation value stays continuous past the pin — gating it on isNear made the field snap
  let conv = pins.turn ? smooth(pT, 0.1, 0.62) : 0;
  if (isNear(pins.turn) || isNear(pins.connect)) travel(pT, pC);
  if (isNear(pins.connect)) connect(pC);
  if (isNear(pins.chat)) chatScene(pQ);
  if (isNear(pins.reason)) reason(pR);
  ledgerScrub();
  if (isNear(pins.catch)) catchScene(pK);

  /* — the brain's whole-page timeline — */
  conv *= 1 - smooth(SY, marks.connect, marks.connect + VH * 1.4);   // release after the turn
  const agit = pS > 0 ? smooth(pS, 0.05, 0.75) * (1 - smooth(pT, 0, 0.3)) : 0;
  let alpha = 1 - smooth(SY, marks.turnEnd + VH * 0.2, marks.connect + VH) * 0.89;   // behind connect/reason/act — matched to the finale's settled level
  alpha *= 1 - smooth(pT, 0.5, 0.75) * 0.6;   // dim behind the turn headline so it stays legible
  alpha *= 1 - smooth(SY, marks.catch - VH * 0.5, marks.catch + VH * 0.3) * 0.6;     // dim for the photo act
  alpha = Math.max(alpha, smooth(SY, marks.who, marks.who + VH) * 0.24);
  const gather = smooth(SY, marks.finale - VH * 0.6, marks.finale + VH * 0.6);
  if (finaleBg) finaleBg.style.opacity = 0.18 - gather * 0.11;   // quieter photo behind the form
  // the gathering field reads on approach, then recedes as the headline + form settle in
  const settle = smooth(SY, marks.finale - VH * 0.1, marks.finale + VH * 0.5);
  alpha = Math.max(alpha, gather * 0.55 * (1 - settle * 0.92));
  Brain.draw(agit, conv, gather, alpha, dt);

  requestAnimationFrame(frame);
}

measure();
addEventListener('resize', () => { clearTimeout(measure._t); measure._t = setTimeout(measure, 150); });
requestAnimationFrame(frame);

})();
