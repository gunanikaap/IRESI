# IRESI Website

The website for the **IRESI Centre** (International Research on Energy system integration, Education, and Environment for Sustainability and Innovation) at Maynooth University — <https://www.iresi.eu>.

This is a static rebuild of the previous WordPress/Elementor site. It builds to plain HTML, CSS and images that can be copied onto any web server; there is no database, no PHP and no runtime dependency.

---

## Quick start

Requires **Node.js 20 or newer**.

```bash
git clone https://github.com/gunanikaap/IRESI.git
cd IRESI/Application
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

### Commands

| Command           | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm install`     | Install dependencies                                  |
| `npm run dev`     | Start the local dev server with hot reload            |
| `npm run build`   | Build the production site into `dist/`                |
| `npm run preview` | Serve the built `dist/` locally to check it           |
| `npm run check`   | Type-check the project and validate all content files |

---

## Deploying

```bash
npm run build
```

This produces a `dist/` folder. **Copy the entire contents of `dist/` to your web server's document root** — that is the whole deployment. Nothing else from this repository needs to go on the server.

Notes for whoever configures the server:

- Pages are emitted as directories with an `index.html` inside (`/about-us/index.html`), so the URLs match the old WordPress permalinks exactly. The server must serve `index.html` for directory requests — this is the default for Apache, Nginx and IIS.
- `dist/404.html` is the not-found page. Point the server's 404 handler at it.
- Everything is served over plain HTTP(S) as static files; no rewrite rules are required.
- Total build output is roughly 27 MB, mostly images.

### Replacing the current site

The build is designed to drop in behind the existing `iresi.eu` domain:

- All existing page URLs are preserved (see **URLs** below), so inbound links and search results keep working.
- DNS does not need to change — only the origin the domain points at.

---

## Project structure

```
Application/
├── astro.config.mjs      Build configuration (static output, directory URLs)
├── public/               Copied to the site root as-is
│   ├── favicon.svg
│   └── images/           All site imagery, grouped by area
│       ├── about/  home/  news/  partners/
│       ├── projects/  publications/  research/  team/
│       ├── logo.png          Header logo
│       └── logo-mark.png     Footer logo
└── src/
    ├── components/       Reusable UI (Header, Footer, cards, article templates)
    ├── content/          ← All editable site content lives here
    │   ├── news/         News & Events posts
    │   ├── projects/     Project pages
    │   ├── publications/ Individual papers
    │   ├── research/     The seven research topic pages
    │   ├── researchers/  Researcher profiles on the Publications page
    │   └── team/         Team members
    ├── content.config.ts Schemas for the above — the rules each file must follow
    ├── data/site.ts      Navigation, footer links, contact details, social links
    ├── layouts/          The shared page shell (<head>, header, footer)
    ├── pages/            One file per route
    └── styles/global.css Design tokens and shared styles
```

---

## Editing content

Everyday content changes are made by editing markdown files in `src/content/` — no component or CSS changes needed. Each file has a **frontmatter** block (the `---` fenced section at the top) holding structured fields, and optionally a markdown body below it.

`npm run check` validates every content file against its schema and reports exactly which file and field is wrong, so a typo fails at build time rather than silently breaking the site.

### Add a team member

Create `src/content/team/firstname-lastname.md`:

```markdown
---
name: "Dr Jane Doe"
role: "Researcher"
photo: "/images/team/jane-doe.jpg"
email: "jane.doe@mu.ie"
linkedin: "https://www.linkedin.com/in/jane-doe/"
order: 37
---
```

Put the photo in `public/images/team/`. Square images around 800×800 work best. `order` controls the position in the grid — lower numbers appear first.

### Add a project

Create `src/content/projects/my-project.md`. The filename becomes the URL (`/my-project`).

```markdown
---
title: "MYPROJECT"
pageTitle: "MyProject — Full Title"     # optional, used as the page heading
summary: "One line shown on the projects listing."
intro:                                   # lead paragraphs on the project page
  - "First paragraph."
  - "Second paragraph."
tags:                                    # the chips in the project header
  - "EU-Funded Project"
  - "Energy Flexibility"
cardImage: "/images/projects/my-project-card.jpg"
image: "/images/projects/my-project.jpg" # optional wide image
website: "https://example.eu/"           # optional
vimeoId: "123456789"                     # optional embedded demo video
externalOnly: false                      # true = link straight out, no page
order: 12
---

## Objective

Body copy here.

## Impact

More body copy.
```

### Add a news post

Create `src/content/news/my-post.md`. The filename becomes the URL.

```markdown
---
title: "Post title"
date: "2026-08-11"
author: "Paolo Cammardella"
summary: "Short excerpt shown on the News & Events listing."
image: "/images/news/my-post.jpeg"
gallery:                    # optional extra images shown at the end
  - "/images/news/my-post-2.jpeg"
unlisted: false             # true = page exists but is hidden from the listing
legacyPaths: []             # old URLs that should redirect here
---

Body copy in markdown.
```

### Add a publication

Create `src/content/publications/my-paper.md`. `researcher` must match a filename in `src/content/researchers/`.

```markdown
---
title: "Paper title"
authors:
  - "Author One"
  - "Author Two"
date: "2026/3/1"
year: 2026
journal: "Journal Name"
volume: "12"
pages: "100-120"
publisher: "Publisher"
description: "Short abstract."
link: "https://scholar.google.com/..."
researcher: "fabiano-pallonetto"
order: 13
---
```

### Change navigation, contact details or social links

Edit `src/data/site.ts`. It holds the header menu, footer menu, research topic list, email address, postal address and social profiles used across every page.

---

## URLs

The routes below match the previous WordPress site so existing links keep working.

| Page              | URL                                                                   |
| ----------------- | --------------------------------------------------------------------- |
| Home              | `/`                                                                   |
| Who We Are        | `/about-us`                                                           |
| Team              | `/team`                                                               |
| Partners          | `/partners`                                                           |
| Projects listing  | `/projects`                                                           |
| Project pages     | `/renew`, `/res4city`, `/flow`, `/sherlock`, `/streacs`, `/ai-effect`, `/resskill`, `/nexsys`, `/adflex` |
| Publications      | `/publications`                                                       |
| News & Events     | `/news-events` and one page per post at the post's own slug           |
| Research hub      | `/research`                                                           |
| Research topics   | `/renewables`, `/transport`, `/buildings`, `/electricity-and-power-system`, `/engage-research`, `/green-upskilling`, `/heating-and-cooling-systems` |
| Contact           | `/contact`                                                            |

### Redirects

A few old URLs no longer have a page of their own and are redirected via a small HTML stub:

- `/about` → `/about-us`
- `/research-2` → `/research`
- `/people` → `/team`
- The three news posts whose WordPress URLs contained emoji redirect to plain-text slugs, e.g. `/🌍-exciting-times-ahead-for-energy-system-integration-🌍` → `/exciting-times-ahead-for-energy-system-integration`

To add a redirect to a news post, list the old path in that post's `legacyPaths`. For other redirects, edit `STATIC_REDIRECTS` in `src/pages/[...legacy].astro`.

---

## Things worth knowing

- **The contact form does not post anywhere.** The site is static, so submitting the form opens the visitor's email client with the message pre-filled and addressed to `info@iresi.eu`. If real server-side form handling is wanted later, it needs either a host that provides it or a third-party form service.
- **Fonts load from Google Fonts** (Montserrat and Work Sans), as they did on the WordPress site. If the Centre would rather not call out to Google, the fonts can be self-hosted from `public/`.
- **Images are served as-is** from `public/images/`. They were exported at sensible sizes from the original site, but there is no automatic responsive-image generation. Keep new uploads under about 500 KB.
- **Design tokens** (colours, fonts, spacing, container width) are defined once at the top of `src/styles/global.css` and carried over from the previous theme.

---

## Built with

[Astro](https://astro.build) 5 — static site generator. No UI framework, no client-side routing; the only JavaScript shipped is the mobile menu toggle and the contact form handler.
