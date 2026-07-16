/* ═══════════════════════════════════════════════════════════════
   Team app preview — the product "in action": the countdown ticks,
   tasks keep landing on the timeline, and the TeamMate chat carries
   on. Lifted from the homepage (onepager.js) so it can be reused.
   Runs only while #devband is in view. Needs css/app-preview.css.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const band = $('#devband'); if (!band) return;
  let live = false;
  new IntersectionObserver(e => { live = e[0].isIntersecting; }, { threshold: 0.12 }).observe(band);

  /* countdown counts for real */
  const secsEl = $('#appSecs'), minsEl = $('#appMins');
  let m = 6, s = 27;
  if (secsEl && minsEl) setInterval(() => {
    if (!live || document.hidden) return;
    s--; if (s < 0) { s = 59; m = m > 0 ? m - 1 : 59; }
    secsEl.textContent = String(s).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
  }, 1000);

  /* tasks keep landing on the timeline */
  const days = $$('.app__day');
  const POOL = [
    ['tcard--blue', 'Master v10 QC Check', 'AUDIO'],
    ['tcard--teal', 'Pre-Save Link Goes Live', 'DSP_ACTIVATION'],
    ['tcard--amber', 'Vinyl PO Sign-off', 'OPS'],
    ['tcard--dark', 'EPK Refresh + Press Shots', 'PRESS'],
    ['tcard--purple', 'Lyric Video Teaser Cut', 'CONTENT'],
    ['tcard--blue', 'Radio One-Sheet Draft', 'RADIO'],
  ];
  let ti = 0;
  if (days.length) setInterval(() => {
    if (!live || document.hidden) return;
    const [cls, title, tag] = POOL[ti % POOL.length];
    const day = days[1 + (ti % 3)]; ti++;
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
  if (scroll) setInterval(() => {
    if (!live || document.hidden) return;
    const [you, meta, text] = CHAT[ci % CHAT.length]; ci++;
    const d = document.createElement('div');
    d.className = 'app__msg' + (you ? ' app__msg--you' : '') + ' app__msg--in';
    d.innerHTML = `<u class="mono">${meta}</u><p>${text}</p>`;
    scroll.append(d);
    while (scroll.children.length > 4) scroll.firstChild.remove();
  }, 4200);
})();
