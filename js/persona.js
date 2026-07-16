/* ═══════════════════════════════════════════════════════════════
   Persona pages — scroll-driven reveals for the two dynamic pieces:
   the scatter cloud (chips settle in one by one) and the night-on-
   the-job ledger (rows post sequentially). Content lives in the HTML;
   this just choreographs it. Respects reduced-motion.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sequence = (root, sel, gap, delay = 0) => {
    if (!root) return;
    const items = [...root.querySelectorAll(sel)];
    if (reduced) { items.forEach(el => el.classList.add('on', 'in')); return; }
    let played = false;
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (e.isIntersecting && !played) {
        played = true;
        items.forEach((el, i) => setTimeout(() => el.classList.add('on', 'in'), delay + i * gap));
        o.disconnect();
      }
    }), { threshold: .35 }).observe(root);
  };

  // the scatter settles quickly (many chips), the ledger posts deliberately
  sequence(document.querySelector('.scloud'), '.schip', 90);
  sequence(document.querySelector('.pledger'), '.pled__row', 460, 300);
})();
