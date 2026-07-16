/* ═══════════════════════════════════════════════════════════════
   Team multi-pager — shared chrome. Injects nav + footer into every
   page (one source of truth), wires the mobile menu, scroll state,
   active-link, and reveal-on-scroll. Set <body data-nav="platform">
   to light the matching top-level item.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  // Depth-aware base prefix: read how this very script was included
  // ("js/chrome.js" at the root, "../js/chrome.js" one folder deep, e.g.
  // /insights/<post>.html) and derive the prefix to reach the site root.
  // This makes every relative nav/footer/asset link resolve from any depth,
  // regardless of where the site is deployed (subpath, GH Pages, etc.).
  const ME = document.currentScript;
  const BASE = ME ? ME.getAttribute('src').replace(/js\/chrome\.js.*$/, '') : '';
  // Prefix relative links only; leave absolute URLs, mailto:, #anchors, and /root-relative alone.
  const U = (h) => (!h || /^(https?:|mailto:|tel:|#|\/)/.test(h)) ? h : BASE + h;
  const LOGO = U('assets/logo/team-logo-live.svg');

  // simple line icons for the Platform dropdown
  const IC = {
    overview:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/></svg>',
    teammate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a5 5 0 0 1 5 5v1a4 4 0 0 1 0 8 5 5 0 0 1-10 0 4 4 0 0 1 0-8V8a5 5 0 0 1 5-5z"/><path d="M12 8v8M9 11h6"/></svg>',
    integrations:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2.4"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M10.3 10.3 6.4 6.4M13.7 10.3l3.9-3.9M10.3 13.7l-3.9 3.9M13.7 13.7l3.9 3.9"/></svg>',
    security:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    // Solutions
    artists:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    managers:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M15.5 5.2a3 3 0 0 1 0 5.6M3 20a6 6 0 0 1 12 0M15.5 14a5 5 0 0 1 5.5 6"/></svg>',
    labels:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/></svg>',
    partners:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 3 3v6.5"/></svg>',
    enterprise:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M10 21v-4h4v4"/></svg>',
    // Resources
    insights:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10.5c-.7.7-1 1.3-1 2.5H9c0-1.2-.3-1.8-1-2.5A6 6 0 0 1 12 3z"/></svg>',
    changelog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    about:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };

  const GROUPS = [
    { key:'platform', label:'Platform', panel:{ head:'The brain, and how it works', rows:[
      ['platform.html', IC.overview, 'Overview', 'Connect, reason, act — how Team works'],
      ['teammate.html', IC.teammate, 'TeamMate', 'The intelligence that holds your whole release'],
      ['integrations.html', IC.integrations, 'Integrations', 'The tools you already use, connected'],
      ['security.html', IC.security, 'Security & trust', 'Why it\'s safe on your whole stack'],
    ]}},
    { key:'solutions', label:'Solutions', panel:{ head:'One brain, for how you work', rows:[
      ['for-artists.html', IC.artists, 'Solo artists', 'A label-grade rollout, solo'],
      ['for-managers.html', IC.managers, 'Artist managers', 'The whole roster, in one mind'],
      ['for-labels.html', IC.labels, 'Labels', 'Every release, one living picture'],
      ['for-partners.html', IC.partners, 'Distributors & partners', 'Risk across the whole slate'],
      ['enterprise.html', IC.enterprise, 'Enterprise', 'Controls, deployment, scale'],
    ]}},
    // { key:'customers', label:'Customers', href:'customers.html' }, // deferred until real customers to feature
    { key:'resources', label:'Resources', panel:{ head:'Learn & keep up', rows:[
      ['insights.html', IC.insights, 'Insights', 'Playbooks & release strategy'],
      // ['changelog.html', IC.changelog, 'Changelog', 'What\'s shipping in Team'], // hidden for now
      ['about.html', IC.about, 'About', 'Why we built Team'],
    ]}},
    { key:'pricing', label:'Pricing', href:'pricing.html' },
  ];
  const BETA = 'pricing.html#beta';
  const SIGNIN = 'https://app.teamrollouts.com/sign-in';
  // Single source of truth for the "book a demo" link. Change it here and every
  // CTA marked data-demo across the site updates. (See the rewrite pass below.)
  const DEMO = 'https://calendly.com/teamrollouts-demo/30min';

  const active = document.body.dataset.nav || '';

  // Theme toggle only appears on themeable pages (those loading base.css, which
  // defines --scrim). The homepage uses onepager.css and stays dark-locked, so
  // its nav is left exactly as-is.
  const THEMED = !!getComputedStyle(document.documentElement).getPropertyValue('--scrim').trim();
  const SUN = '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A7.5 7.5 0 0 1 9.5 4a6 6 0 1 0 10.5 10.5z"/></svg>';
  const themeBtn = THEMED ? `<button class="nav__theme" id="navTheme" aria-label="Switch light / dark theme" title="Switch theme">${SUN}${MOON}</button>` : '';

  const panelHTML = (p) => `<div class="nav__panel" role="menu">
    <p class="nav__plabel">${p.head}</p>
    ${p.rows.map(([href,ic,b,s]) => `<a class="nav__prow" href="${href}" role="menuitem">
      ${ic ? `<span class="ic">${ic}</span>` : ''}
      <span><b>${b}</b><span>${s}</span></span></a>`).join('')}
  </div>`;

  const nav = document.createElement('header');
  nav.className = 'nav';
  nav.innerHTML = `<div class="nav__in">
    <a class="nav__brand" href="index.html" aria-label="Team — home"><img src="${LOGO}" alt="Team"></a>
    <nav class="nav__menu" aria-label="Primary">
      ${GROUPS.map(g => g.href
        ? `<div class="nav__item"><a class="nav__link${active===g.key?' is-active':''}" href="${g.href}">${g.label}</a></div>`
        : `<div class="nav__item"><button class="nav__link${active===g.key?' is-active':''}" aria-haspopup="true">${g.label}<i class="caret"></i></button>${panelHTML(g.panel)}</div>`
      ).join('')}
    </nav>
    <div class="nav__spacer"></div>
    <div class="nav__cta">
      ${themeBtn}
      <a class="nav__signin" href="${SIGNIN}">Sign in</a>
      <a class="nav__beta" href="${BETA}">Join the beta</a>
    </div>
    <button class="nav__burger" id="navBurger" aria-label="Menu" aria-expanded="false"><i></i><i></i><i></i></button>
  </div>`;
  document.body.prepend(nav);

  // mobile menu
  const mnav = document.createElement('div');
  mnav.className = 'mnav';
  mnav.innerHTML = GROUPS.map(g => {
    if (g.href) return `<div class="mnav__grp"><a href="${g.href}">${g.label}</a></div>`;
    return `<div class="mnav__grp"><p>${g.label}</p>${g.panel.rows.map(r=>`<a href="${r[0]}">${r[2]}</a>`).join('')}</div>`;
  }).join('') + `<div class="mnav__cta"><a class="btn btn--ghost" href="${SIGNIN}">Sign in</a><a class="btn btn--solid" href="${BETA}">Join the beta</a>${THEMED ? `<button class="nav__theme mnav__theme" aria-label="Switch light / dark theme">${SUN}${MOON}<span>Switch theme</span></button>` : ''}</div>`;
  document.body.appendChild(mnav);

  const burger = nav.querySelector("#navBurger");
  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', open);
  });
  mnav.addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('menu-open'); });

  // theme toggle — persist choice, flip the root attribute, tell the brain to repaint
  if (THEMED) {
    const setTheme = t => {
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem('tm-theme', t); } catch (e) {}
      dispatchEvent(new Event('themechange'));
    };
    [nav, mnav].forEach(root => {
      const btn = root.querySelector('.nav__theme');
      btn && btn.addEventListener('click', () => {
        const now = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        setTheme(now === 'light' ? 'dark' : 'light');
      });
    });
  }

  // scroll state
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive:true });

  // footer
  const IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>';
  const XI = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.3-5.6L6.5 21H3.5l7-8L2.7 3h6l3.9 5.1zm-1 16h1.7L7.6 4.7H5.8z"/></svg>';
  const LI = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-.9 1.8-1.9 3.7-1.9 4 0 4.7 2.6 4.7 6V21h-4v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21H9z"/></svg>';
  const foot = document.createElement('footer');
  foot.className = 'foot';
  foot.innerHTML = `<div class="foot__in">
    <div class="foot__news">
      <div class="foot__news-copy">
        <h3>Operational intelligence for <em>every release.</em></h3>
        <p>The occasional email on where music operations are heading, and what we're shipping in Team.</p>
      </div>
      <form class="foot__form" id="footNews" novalidate>
        <input type="email" name="email" placeholder="you@label.com" aria-label="Email address" required>
        <input type="text" name="website" class="foot__hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button type="submit">Subscribe</button>
      </form>
    </div>
    <div class="foot__grid">
      <div class="foot__brand">
        <a href="index.html" aria-label="Team — home"><img src="${LOGO}" alt="Team"></a>
        <p>Team connects the systems your music operation already runs on, turning every tool, file, message, plan, and data point into one living intelligence layer.</p>
        <div class="foot__social">
          <a href="https://www.instagram.com/teamrollouts/" target="_blank" rel="noopener" aria-label="Instagram">${IG}</a>
          <a href="https://x.com/Teamrollouts" target="_blank" rel="noopener" aria-label="X">${XI}</a>
          <a href="https://www.linkedin.com/company/teamrollouts" target="_blank" rel="noopener" aria-label="LinkedIn">${LI}</a>
        </div>
      </div>
      <div class="foot__col"><p>Platform</p>
        <a href="platform.html">Overview</a><a href="teammate.html">TeamMate</a><a href="integrations.html">Integrations</a><a href="security.html">Security</a></div>
      <div class="foot__col"><p>Solutions</p>
        <a href="for-artists.html">Solo artists</a><a href="for-managers.html">Managers</a><a href="for-labels.html">Labels</a><a href="for-partners.html">Distributors</a><a href="enterprise.html">Enterprise</a></div>
      <div class="foot__col"><p>Company</p>
        <a href="insights.html">Insights</a><a href="about.html">About</a><a href="pricing.html">Pricing</a><a href="contact.html">Contact</a></div>
      <div class="foot__col"><p>Legal</p>
        <a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="security.html">Security</a></div>
    </div>
    <div class="foot__bot">
      <span class="mono">© 2026 Team Rollouts</span>
      <span class="mono">Operational Intelligence for Music Releases</span>
    </div>
  </div>`;
  document.body.appendChild(foot);
  // Resolve every relative nav/footer/mobile link against the site root so
  // pages nested in subfolders (e.g. /insights/<post>.html) still work. Runs
  // once per link; absolute/mailto/#/root links are left untouched by U().
  [nav, mnav, foot].forEach(root =>
    root.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', U(a.getAttribute('href')))));
  const news = foot.querySelector('#footNews');
  news && news.addEventListener('submit', e => {
    e.preventDefault();
    if (news.website.value) return;                          // honeypot tripped, ignore
    const input = news.querySelector('input[type=email]'), btn = news.querySelector('button');
    if (!input.value || !input.checkValidity()) { input.focus(); return; }
    const email = input.value.trim();
    news.classList.add('done'); btn.textContent = 'Subscribed ✓'; input.disabled = true;  // optimistic
    try {
      fetch('https://admin.getteamnow.com/api/v1/website-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_form: 'newsletter',
          email,
          first_name: email.split('@')[0],
          website: '',
          page_url: location.href
        })
      }).catch(() => {});
    } catch (err) {}
  });

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold:.16 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // point every "book a demo" CTA at the single DEMO source of truth
  document.querySelectorAll('[data-demo]').forEach(a => { a.href = DEMO; a.target = '_blank'; a.rel = 'noopener'; });

  /* ── shared motion: one consistent scroll-choreography for every page ──
     TM.replay(el, onEnter, onExit, threshold) fires onEnter each time el
     scrolls into view and onExit each time it leaves, so animated UI plays
     coming down and resets going back up — the homepage behaviour. */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.TM = {
    reduced,
    replay(el, onEnter, onExit, threshold = .35) {
      if (!el) return;
      if (reduced) { onEnter && onEnter(); return; }   // no scrub, just settle open
      let inView = false;
      new IntersectionObserver((es) => es.forEach(e => {
        if (e.isIntersecting && !inView) { inView = true; onEnter && onEnter(); }
        else if (!e.isIntersecting && inView) { inView = false; onExit && onExit(); }
      }), { threshold }).observe(el);
    },
    // sequential class-toggle for a set of children; returns {play, reset}
    seq(items, cls, gap, delay = 0) {
      const list = [...items]; let timers = [];
      const clear = () => { timers.forEach(t => { clearTimeout(t); }); timers = []; };
      return {
        play() { if (reduced) { list.forEach(el => el.classList.add(cls)); return; }
          clear(); list.forEach((el, i) => timers.push(setTimeout(() => el.classList.add(cls), delay + i * gap))); },
        reset() { clear(); list.forEach(el => el.classList.remove(cls)); }
      };
    }
  };
})();
