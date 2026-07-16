# Insights — content model & authoring

The Insights section (blog / resources) is **content-as-data**: every post is a
Markdown file whose frontmatter maps 1:1 to the Sanity `insightPost` schema on
the live site. A small generator turns those files into static HTML, so posts
are fully crawlable (important for SEO / AI search) and the whole thing lifts
cleanly into Astro + Sanity when we go live.

## Author a new post

1. Copy an existing file in `content/insights/` to `content/insights/<slug>.md`.
2. Fill in the frontmatter and write the body in Markdown.
3. Regenerate:

   ```bash
   node build-insights.js
   ```

That writes `insights.html` (index), `insights/<slug>.html` (the post),
`sitemap.xml`, and `robots.txt`.

## Frontmatter fields

| Field            | Required | Notes                                                        |
|------------------|----------|--------------------------------------------------------------|
| `title`          | yes      | Post title.                                                  |
| `slug`           | no       | Defaults to the filename.                                    |
| `excerpt`        | yes      | 1–2 sentences, shown on the index card.                      |
| `category`       | yes      | A category **slug** from `_categories.json`.                 |
| `author`         | no       | Defaults to `Team`.                                          |
| `publishDate`    | yes      | `YYYY-MM-DD`. Controls sort order (newest first).            |
| `readMinutes`    | no       | Auto-calculated from word count if omitted.                  |
| `heroImage`      | no       | Path relative to site root, e.g. `assets/insights/x.jpg`.    |
| `seoTitle`       | no       | `<title>` override. Defaults to `title`.                     |
| `seoDescription` | no       | Meta description override. Defaults to `excerpt`.            |
| `hidden`         | no       | `true` = SEO/GEO page (see below). Defaults to `false`.      |

Categories live in `content/insights/_categories.json` (mirrors the Sanity
`insightCategory` document: `title`, `slug`, `color`, `sortOrder`).

## Hidden SEO / GEO pages

Set `hidden: true` in a post's frontmatter. That post:

- **gets a real, indexable static page** at `insights/<slug>.html`
- **is included in `sitemap.xml`** (with `<lastmod>`), so search engines and AI
  crawlers discover it
- carries `BlogPosting` JSON-LD structured data like any other post
- is **left off** the Insights index grid and the site nav

In other words: it exists to rank / feed AI search, but you won't see it linked
anywhere on the site. This maps to a single `hidden` boolean field we'll add to
the `insightPost` schema in Sanity. `music-release-management-software.md` is a
worked example (targets the query "music release management software").

## What the generator produces

- `insights.html` — hero + category filter chips + search + card grid (listed posts only)
- `insights/<slug>.html` — one static page per post (listed **and** hidden)
- `sitemap.xml` — all top-level pages + every post (listed and hidden)
- `robots.txt` — allows all, points to the sitemap

The `SITE` constant at the top of `build-insights.js` sets the canonical origin
used in the sitemap and `<link rel="canonical">`. Change it on deploy.

## Migration → Astro + Sanity

The model was built to match the live site, so migration is mostly a lift:

| Local (multi-pager)                    | Live (Astro + Sanity)                          |
|----------------------------------------|------------------------------------------------|
| `content/insights/<slug>.md` frontmatter | `insightPost` document fields                |
| `_categories.json` entries             | `insightCategory` documents                    |
| `hidden: true`                         | new `hidden` boolean on `insightPost`          |
| `build-insights.js` → `insights/*.html`| `src/pages/insights/[slug].astro` (`getStaticPaths`) |
| `insights.html`                        | `src/pages/insights.astro` + `insightsIndexPage` |
| Markdown body                          | Portable Text `body` (or keep Markdown via a plugin) |
| generated `sitemap.xml`                | Astro sitemap integration; index query filters `!hidden`, `getStaticPaths` includes all |

The one thing to preserve on migration: the index query filters out `hidden`
posts, but `getStaticPaths` and the sitemap must **include** them.
