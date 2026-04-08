

## SEO Enhancement Plan for Unplayed

### Current State

**What's already in place:**
- `react-helmet-async` on all 6 major pages with unique titles and descriptions
- Open Graph and Twitter Card meta tags in `index.html` (but only for the homepage — not per-page)
- `robots.txt` allowing all crawlers
- Favicon set
- JSON-LD structured data on ProfilePage only
- Canonical URL on ProfilePage only

**What's missing:**
- No `sitemap.xml`
- No canonical URLs on any page except ProfilePage
- No JSON-LD structured data on homepage or public pages
- No per-page Open Graph URLs (`og:url`)
- `robots.txt` has no `Sitemap:` directive
- No keyword-rich content on the unauthenticated homepage (the landing page is the only crawlable marketing surface)
- Leaderboard page (the only other public page) has no structured data
- No `<meta name="keywords">` (minor, but easy)
- Font loading blocks rendering (no `font-display: swap` in link tags — though Google Fonts handles this via the `&display=swap` param, which is already present)

### Plan

**1. Add `public/sitemap.xml`** (new file)

Static sitemap listing all public, crawlable routes:
- `/` (homepage)
- `/leaderboard`
- `/auth`
- `/support`

Protected routes (`/library`, `/dust`, `/spend`) are behind auth and shouldn't be indexed. Profile pages are dynamic and would need a server-generated sitemap later.

**2. Update `public/robots.txt`**

- Add `Sitemap: https://unplayed.lovable.app/sitemap.xml`
- Add `Disallow` for admin, auth callback, and error routes that shouldn't be indexed

**3. Add canonical URLs to all pages** (via Helmet)

Each page gets `<link rel="canonical" href="https://unplayed.lovable.app/...">` to prevent duplicate content issues and consolidate ranking signals.

**4. Add per-page Open Graph meta tags** (via Helmet)

Currently the homepage `index.html` sets OG tags, but Helmet on inner pages doesn't override `og:url`. Add `og:url`, `og:title`, `og:description`, and `og:image` to each page's `<Helmet>` block. Pages: Index, LeaderboardPage, DustPage, SpendPage, LibraryPage.

**5. Add JSON-LD structured data to homepage**

Add `WebSite` schema with `SearchAction` potential, plus `SoftwareApplication` schema describing unplayed as a web app for Steam backlog management. This helps Google understand what the site is.

**6. Add JSON-LD structured data to Leaderboard**

Add `ItemList` schema for the leaderboard entries — this can produce rich results in search.

**7. Enhance unauthenticated homepage content**

The landing page for logged-out users currently shows a single headline and one sentence. This is the only page Google can fully crawl. Add a brief "How It Works" section and feature highlights with keyword-rich text (e.g., "Steam backlog tracker", "unplayed games finder", "dust score", "gaming library analytics"). This is the highest-impact SEO change.

### Files Modified

| File | Change |
|------|--------|
| `public/sitemap.xml` | New — static sitemap |
| `public/robots.txt` | Add Sitemap directive and Disallow rules |
| `src/pages/Index.tsx` | Add canonical, OG tags, JSON-LD, and landing content for logged-out users |
| `src/pages/LeaderboardPage.tsx` | Add canonical, OG tags, JSON-LD ItemList |
| `src/pages/DustPage.tsx` | Add canonical and OG tags |
| `src/pages/SpendPage.tsx` | Add canonical and OG tags |
| `src/pages/LibraryPage.tsx` | Add canonical and OG tags |
| `index.html` | Minor: add `og:url` for homepage default |

### No backend or database changes needed

All changes are client-side static content and meta tags.

