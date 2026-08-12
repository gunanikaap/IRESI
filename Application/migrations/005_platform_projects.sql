-- --------------------------------------------------------------------------
-- Project entries, and the columns IRESI's content needs
--                                                            (12 August 2026)
-- --------------------------------------------------------------------------
-- Everything here is additive. Nothing is renamed and nothing is dropped,
-- because whether IRESI runs one database shared by every project or one per
-- project has not been decided — that is Adarsh's and Paolo's call, and this
-- migration must be safe under either answer.
--
-- In particular there is deliberately **no `project_id` column** anywhere. See
-- src/projects/types.ts: a project is resolved from `ACTIVE_PROJECT` at startup
-- and one deployment serves one project. If central storage wins later, adding
-- the column is a migration and `repo.ts` is the only module that names tables.
-- Adding it now on the assumption it wins, and taking it out again, is worse.

-- --------------------------------------------------------------------------
-- Projects
-- --------------------------------------------------------------------------
-- The research projects a centre runs. Shaped from IRESI's existing project
-- pages, which is the same shape ADFLEX's "findings" have with different words:
-- a title, a summary, some images, a body and a link.
--
-- `slug` rather than an id in the URL. The WordPress site published these at
-- /renew, /res4city and so on, and those addresses have to keep working when
-- the domain is repointed. It is UNIQUE because it is an address.
CREATE TABLE IF NOT EXISTS projects (
  id            SERIAL PRIMARY KEY,
  slug          TEXT        NOT NULL UNIQUE,
  title         TEXT        NOT NULL,
  -- Longer heading for the project's own page; falls back to `title`.
  page_title    TEXT,
  summary       TEXT        NOT NULL DEFAULT '',
  -- Lead paragraphs above the fold, one per line.
  intro         TEXT        NOT NULL DEFAULT '',
  -- The short descriptor chips in the project header, one per line.
  tags          TEXT        NOT NULL DEFAULT '',
  body          TEXT        NOT NULL DEFAULT '',
  -- Art for the listing card and the wide image on the detail page. These are
  -- paths under /public rather than media ids: they came from the old site as
  -- files and an editor replacing one uploads through the admin, which stores
  -- the new one in `media` and points `card_media_id` at it.
  card_image    TEXT,
  hero_image    TEXT,
  card_media_id INTEGER     REFERENCES media(id) ON DELETE SET NULL,
  hero_media_id INTEGER     REFERENCES media(id) ON DELETE SET NULL,
  website       TEXT,
  -- Label for the outbound link; "See Platform" on every current entry.
  website_label TEXT        NOT NULL DEFAULT 'See Platform',
  -- Vimeo id for an embedded demo. One project has one; nothing else does.
  vimeo_id      TEXT,
  -- Projects that only link out (LERO, CO-CREATIVE LAB) get a card but no page.
  external_only BOOLEAN     NOT NULL DEFAULT false,
  published     BOOLEAN     NOT NULL DEFAULT false,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  published_on  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Its own join table rather than a polymorphic one, for the reason given above
-- `finding_images` in 001: a polymorphic item_id cannot carry a foreign key, so
-- a deleted parent leaves orphan rows to be swept by hand.
CREATE TABLE IF NOT EXISTS project_images (
  id         SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  media_id   INTEGER NOT NULL REFERENCES media(id)    ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS project_images_idx ON project_images (project_id, position);
CREATE INDEX IF NOT EXISTS projects_live_idx  ON projects (published, sort_order, created_at DESC);

-- --------------------------------------------------------------------------
-- Publications: the fields a citation actually carries
-- --------------------------------------------------------------------------
-- ADFLEX stored authors, venue, year, DOI and a URL. IRESI's publications page
-- also shows the journal, volume, page range, publisher and an abstract, and
-- groups papers under the researcher who wrote them.
--
-- All nullable, so ADFLEX's existing rows are untouched and its forms keep
-- working without knowing these exist.
ALTER TABLE publications ADD COLUMN IF NOT EXISTS journal     TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS volume      TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS pages       TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS publisher   TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS description TEXT;
-- Free text, because the publication date is shown exactly as the source gives
-- it: "2019/4/1" on one paper and "2022" on another. A DATE would force a day
-- and a month onto entries that never had them.
ALTER TABLE publications ADD COLUMN IF NOT EXISTS date_text   TEXT;

-- Which researcher's group a paper appears under on /publications. It matches a
-- `slug` in src/projects/iresi/content.ts, not a database row: the *grouping*
-- is editorial — which profiles lead the page — while the papers are
-- editor-managed. A paper with no match, or none set, falls into "Other".
ALTER TABLE publications ADD COLUMN IF NOT EXISTS researcher_slug TEXT;

-- --------------------------------------------------------------------------
-- News: addresses, authorship, and entries that are reachable but not listed
-- --------------------------------------------------------------------------
-- `slug` for the same reason as projects: the WordPress posts live at
-- /celebrating-science-night-at-maynooth-university and that has to keep
-- working. Nullable, because ADFLEX's existing rows are addressed by id and
-- inventing slugs for them would change their URLs.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS slug   TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS author TEXT;

-- Reachable at its own address but kept off the listing. One WordPress post is
-- published this way and removing it from the listing would change the site;
-- giving it no page at all would break its link.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS unlisted BOOLEAN NOT NULL DEFAULT false;

-- Old addresses that should redirect here, one per line. Three posts had emoji
-- in their WordPress URLs; they now have readable slugs and the old links are
-- kept alive by a redirect rather than by shipping emoji directories.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS legacy_paths TEXT NOT NULL DEFAULT '';

-- Partial rather than plain UNIQUE: ADFLEX's rows have no slug, and several
-- NULLs are fine in a unique index, but being explicit about it documents that
-- a slug is optional and unique *when present*.
CREATE UNIQUE INDEX IF NOT EXISTS news_slug_key ON news_items (slug) WHERE slug IS NOT NULL;
