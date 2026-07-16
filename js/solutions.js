/* ═══════════════════════════════════════════════════════════════
   Solutions pages — shared behaviour, auto-initialised by markup.
   Runs after chrome.js (which exposes window.TM). Pages are static
   HTML; this wires: hero notifications, ledgers, spotlights,
   rail↔board switchers, and count-up stat tiles.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const TM = window.TM || { reduced:false, replay:(el,f)=>f&&f(), seq:()=>({play(){},reset(){}}) };

  /* hero TeamMate notifications — post in one by one, reset on scroll-out */
  document.querySelectorAll('.tnote-stack').forEach(stack => {
    const s = TM.seq(stack.querySelectorAll('.tnote'), 'in', 520, 350);
    TM.replay(stack, s.play, s.reset, .3);
  });

  /* ledgers — sequential row reveal */
  document.querySelectorAll('[data-ledger]').forEach(led => {
    const s = TM.seq(led.querySelectorAll('[data-lrow]'), 'in', 320, 200);
    TM.replay(led, s.play, s.reset, .3);
  });

  /* outcome stat tiles — viz animates (via .go) + numbers count up */
  document.querySelectorAll('.ostats').forEach(wrap => {
    const nums = [...wrap.querySelectorAll('.ostat__n')];
    const run = () => {
      wrap.classList.add('go');
      nums.forEach(el => {
        const to = +el.dataset.to, suf = el.dataset.suffix || '';
        if (TM.reduced || to === 0) { el.textContent = to + suf; return; }
        const dur = 950, t0 = performance.now();
        const step = now => { const p = Math.min(1,(now-t0)/dur), e = 1-Math.pow(1-p,3);
          el.textContent = Math.round(to*e) + suf; if (p<1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    };
    const reset = () => { wrap.classList.remove('go'); nums.forEach(el => el.textContent = '0' + (el.dataset.suffix || '')); };
    TM.replay(wrap, run, reset, .35);
  });

  /* spotlights — cards ↔ product panels, auto-rotate until interaction */
  document.querySelectorAll('[data-spot]').forEach(spot => {
    const cards = [...spot.querySelectorAll('.spot__card')], panels = [...spot.querySelectorAll('.spot__panel')];
    if (!cards.length) return;
    const ROT = +(spot.dataset.rot || 5000);
    let idx = 0, timer = null, touched = false, hovering = false, inView = false;
    const hoverCap = matchMedia('(hover: hover)').matches; spot.style.setProperty('--rot', ROT + 'ms');
    const act = i => { idx = i; cards.forEach((c,n)=>c.classList.toggle('is-active',n===i)); panels.forEach((p,n)=>p.classList.toggle('is-active',n===i));
      const pr = cards[i].querySelector('.prog'); if (pr) { pr.style.animation='none'; void pr.offsetWidth; pr.style.animation=''; } };
    const tick = () => { if (!touched && !hovering && inView) act((idx+1)%cards.length); };
    const start = () => { stop(); if (!TM.reduced) timer = setInterval(tick, ROT); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    cards.forEach((c,i)=>{ c.addEventListener('click',()=>{touched=true;stop();act(i);});
      if (hoverCap) { c.addEventListener('mouseenter',()=>{hovering=true;act(i);}); c.addEventListener('mouseleave',()=>{hovering=false;}); } });
    new IntersectionObserver(es=>es.forEach(e=>{ inView=e.isIntersecting; if(inView)start(); else stop(); }),{threshold:.3}).observe(spot);
  });

  /* immersive switchers — rail tabs ↔ boards, timeline fills, auto-cycle */
  document.querySelectorAll('[data-switch]').forEach(sw => {
    const tabs = [...sw.querySelectorAll('.rm-artist')], boards = [...sw.querySelectorAll('.rm-board')];
    if (!tabs.length) return;
    const ROT = +(sw.dataset.rot || 4200); sw.style.setProperty('--rmrot', ROT + 'ms');
    let idx = 0, timer = null, hovering = false, inView = false;
    const fill = b => b.querySelectorAll('[data-fill]').forEach(i => { i.style.width='0'; requestAnimationFrame(()=>{ i.style.width = i.dataset.fill + '%'; }); });
    const act = n => { idx = n; tabs.forEach((t,i)=>t.classList.toggle('is-active',i===n)); boards.forEach((b,i)=>b.classList.toggle('is-active',i===n)); fill(boards[n]);
      const p = tabs[n].querySelector('.prog'); if (p) { p.style.animation='none'; void p.offsetWidth; p.style.animation=''; } };
    const tick = () => { if (!hovering && inView) act((idx+1)%tabs.length); };
    const start = () => { stop(); if (!TM.reduced) timer = setInterval(tick, ROT); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    tabs.forEach((t,i)=>{ t.addEventListener('click',()=>act(i)); t.addEventListener('mouseenter',()=>{hovering=true;act(i);}); t.addEventListener('mouseleave',()=>{hovering=false;}); });
    new IntersectionObserver(es=>es.forEach(e=>{ inView=e.isIntersecting; if(inView){ fill(boards[idx]); start(); } else stop(); }),{threshold:.25}).observe(sw);
  });
})();
