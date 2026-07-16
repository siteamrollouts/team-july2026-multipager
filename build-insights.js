#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   build-insights.js — Insights (blog / resources) static generator.

   Content lives as Markdown files in content/insights/, one per post, whose
   frontmatter maps 1:1 to the Sanity `insightPost` schema. Run this script to
   (re)generate:
     • insights.html                 — the index (hero + filterable card grid)
     • insights/<slug>.html          — a static page per post (crawlable)
     • sitemap.xml + robots.txt      — so search / AI crawlers discover posts

   AUTHORING A NEW POST
     1. Drop a new <slug>.md in content/insights/ (copy an existing one).
     2. Fill the frontmatter (title, excerpt, category, publishDate, …).
     3. Run:  node build-insights.js
   Set `hidden: true` in frontmatter for an SEO/GEO page: it gets a real,
   indexable page + sitemap entry, but is left OFF the index and nav.

   MIGRATION → Astro + Sanity
     Each frontmatter field already matches an `insightPost` field, and
     _categories.json matches `insightCategory`. See INSIGHTS.md.
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

// typographer OFF on purpose: it would insert em-dashes / smart quotes, which
// break the house style (commas over em-dashes, straight quotes).
const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content', 'insights');
const POSTS_DIR = path.join(ROOT, 'insights');
const SITE = 'https://teamrollouts.com'; // canonical origin for sitemap; change on deploy
// where share-card assets are actually served right now (the GH Pages preview).
// og:url + og:image must resolve from the shared link, so these use the live
// preview origin until the site cuts over to teamrollouts.com — change on deploy.
const OG_BASE = 'https://siteamrollouts.github.io/team-july2026-multipager';
const OG_IMAGE = `${OG_BASE}/assets/og.png`;

// ── helpers ─────────────────────────────────────────────────────────────
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    } else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (val !== '' && /^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
    data[key] = val;
  }
  return { data, body: m[2] };
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const readTime = (body, given) =>
  given || Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));

// ── load categories + posts ─────────────────────────────────────────────
const catFile = JSON.parse(fs.readFileSync(path.join(CONTENT, '_categories.json'), 'utf8'));
const CATS = catFile.categories;
const catBySlug = Object.fromEntries(CATS.map(c => [c.slug, c]));

const posts = fs.readdirSync(CONTENT)
  .filter(f => f.endsWith('.md') && !f.startsWith('_'))
  .map(f => {
    const raw = fs.readFileSync(path.join(CONTENT, f), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const slug = data.slug || f.replace(/\.md$/, '');
    const cat = catBySlug[data.category] || { slug: data.category || '', title: data.category || 'Insight', color: '#d9fa87' };
    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      category: cat,
      author: data.author || 'Team',
      publishDate: data.publishDate || '',
      readMinutes: readTime(body, data.readMinutes),
      hidden: data.hidden === true,
      heroImage: data.heroImage || '',
      seoTitle: data.seoTitle || data.title || slug,
      seoDescription: data.seoDescription || data.excerpt || '',
      bodyHtml: md.render(body),
    };
  })
  .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

const visible = posts.filter(p => !p.hidden);
const hidden = posts.filter(p => p.hidden);

// ── shared bits ──────────────────────────────────────────────────────────
const endCta = () => `
  <section class="section container">
    <div class="pfinal reveal">
      <h2 class="h2">Run your next release <em>on a brain.</em></h2>
      <div class="ctaband__row">
        <a class="btn btn--solid" href="../pricing.html#beta">Get early access</a>
        <a class="btn btn--ghost" href="#demo" data-demo>Book a demo <span class="btn__arr">&rarr;</span></a>
      </div>
    </div>
  </section>`;

// ── post page template (lives in /insights/, so assets are "../") ─────────
function postPage(p) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.seoDescription,
    datePublished: p.publishDate,
    author: { '@type': 'Organization', name: p.author },
    publisher: { '@type': 'Organization', name: 'Team Rollouts' },
    mainEntityOfPage: `${SITE}/insights/${p.slug}.html`,
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){try{var t=localStorage.getItem('tm-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t}catch(e){}})();</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(p.seoTitle)} | Team</title>
<meta name="description" content="${esc(p.seoDescription)}">
<link rel="canonical" href="${SITE}/insights/${p.slug}.html">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Team">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.seoDescription)}">
<meta property="og:url" content="${OG_BASE}/insights/${p.slug}.html">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Team — a brain for music operations">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.seoDescription)}">
<meta name="twitter:image" content="${OG_IMAGE}">
<link rel="preload" href="../assets/fonts/NyghtSerif-LightItalic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="../assets/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../css/chrome.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/insights.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body data-nav="resources">

<article class="post container">
  <a class="post__back" href="../insights.html">&larr; Back to Insights</a>
  <span class="post__cat">${esc(p.category.title)}</span>
  <h1 class="post__title">${esc(p.title)}</h1>
  <div class="post__meta">
    <span>By ${esc(p.author)}</span><span class="dot"></span>
    <span>${formatDate(p.publishDate)}</span><span class="dot"></span>
    <span>${p.readMinutes} min read</span>
  </div>
  ${p.heroImage ? `<img class="post__hero" src="../${esc(p.heroImage)}" alt="">` : ''}
  <div class="prose">
${p.bodyHtml}
  </div>
</article>
${endCta()}

<script src="../js/brain.js"></script>
<script src="../js/chrome.js"></script>
</body>
</html>
`;
}

// ── index card ────────────────────────────────────────────────────────────
function card(p) {
  return `<a class="icard reveal" href="insights/${p.slug}.html" data-cat="${esc(p.category.slug)}" data-search="${esc((p.title + ' ' + p.excerpt).toLowerCase())}">
      <div class="icard__top">
        <span class="icard__cat">${esc(p.category.title)}</span>
        <span class="icard__read">${p.readMinutes} min</span>
      </div>
      <h2 class="icard__title">${esc(p.title)}</h2>
      <p class="icard__excerpt">${esc(p.excerpt)}</p>
      <div class="icard__foot"><span>${formatDate(p.publishDate)}</span><span class="icard__arrow">&rarr;</span></div>
    </a>`;
}

// ── index page template (site root) ───────────────────────────────────────
function indexPage() {
  const chips = [`<button class="ichip on" data-cat="all">All</button>`]
    .concat(CATS.filter(c => visible.some(p => p.category.slug === c.slug))
      .map(c => `<button class="ichip" data-cat="${esc(c.slug)}">${esc(c.title)}</button>`))
    .join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){try{var t=localStorage.getItem('tm-theme');if(t!=='light'&&t!=='dark')t='dark';document.documentElement.dataset.theme=t}catch(e){}})();</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Insights | Team</title>
<meta name="description" content="Strategy, industry trends, and how the best teams ship releases. Playbooks and ideas from Team.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Team">
<meta property="og:title" content="Insights | Team">
<meta property="og:description" content="Strategy, industry trends, and how the best teams ship releases. Playbooks and ideas from Team.">
<meta property="og:url" content="${OG_BASE}/insights.html">
<meta property="og:image" content="${OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Team — a brain for music operations">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Insights | Team">
<meta name="twitter:description" content="Strategy, industry trends, and how the best teams ship releases. Playbooks and ideas from Team.">
<meta name="twitter:image" content="${OG_IMAGE}">
<link rel="preload" href="assets/fonts/NyghtSerif-LightItalic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/chrome.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/insights.css">
</head>
<body data-nav="resources">

<section class="phero container" id="top">
  <div class="phero__in">
    <h1 class="h1"><em>Insights.</em></h1>
  </div>
</section>

<section class="section container">
  <div class="itools reveal">
    <div class="ichips">${chips}</div>
    <label class="isearch"><input type="search" id="isearch" placeholder="Search posts..." aria-label="Search posts"></label>
  </div>
  <div class="igrid" id="igrid">
    ${visible.map(card).join('\n    ')}
  </div>
  <p class="iempty" id="iempty" hidden>No posts match that yet.</p>
</section>

<script src="js/brain.js"></script>
<script src="js/chrome.js"></script>
<script>
/* category + search filtering, client-side */
(() => {
  const grid = document.getElementById('igrid');
  const cards = [...grid.querySelectorAll('.icard')];
  const chips = [...document.querySelectorAll('.ichip')];
  const search = document.getElementById('isearch');
  const empty = document.getElementById('iempty');
  let cat = 'all';
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    cards.forEach(c => {
      const ok = (cat === 'all' || c.dataset.cat === cat) && (!q || c.dataset.search.includes(q));
      c.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    empty.hidden = shown > 0;
  };
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('on'));
    ch.classList.add('on');
    cat = ch.dataset.cat;
    apply();
  }));
  search.addEventListener('input', apply);
})();
</script>
</body>
</html>
`;
}

// ── sitemap + robots ──────────────────────────────────────────────────────
function sitemap() {
  // Top-level pages that exist as .html at the root.
  const TOP = ['index', 'platform', 'teammate', 'integrations', 'security', 'for-artists',
    'for-managers', 'for-labels', 'for-partners', 'enterprise', 'customers', 'insights',
    'about', 'pricing', 'contact', 'privacy', 'terms'];
  const urls = [];
  urls.push(`  <url><loc>${SITE}/</loc></url>`);
  TOP.filter(s => s !== 'index' && fs.existsSync(path.join(ROOT, s + '.html')))
    .forEach(s => urls.push(`  <url><loc>${SITE}/${s}.html</loc></url>`));
  // Every post — visible AND hidden — so crawlers/AI find the unlinked SEO pages.
  posts.forEach(p => urls.push(
    `  <url><loc>${SITE}/insights/${p.slug}.html</loc>${p.publishDate ? `<lastmod>${new Date(p.publishDate).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`;

// ── write everything ──────────────────────────────────────────────────────
if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
posts.forEach(p => fs.writeFileSync(path.join(POSTS_DIR, p.slug + '.html'), postPage(p)));
fs.writeFileSync(path.join(ROOT, 'insights.html'), indexPage());
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots);

console.log(`✓ insights.html  (${visible.length} listed)`);
posts.forEach(p => console.log(`  ${p.hidden ? '· hidden ' : '· listed '} insights/${p.slug}.html`));
console.log(`✓ sitemap.xml  (${posts.length} posts, ${hidden.length} hidden/unlisted)`);
console.log(`✓ robots.txt`);
