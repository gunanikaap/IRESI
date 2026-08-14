-- Two kinds of content that were in code and needed to be editable.
--
-- The team list and the About page's photographs were developer-managed, in
-- src/projects/iresi/content.ts. That was the right call while nobody could log
-- in to change them. Now somebody can, and "add a person to the team page" is
-- the single most common thing a research centre needs to do to its own site —
-- it should not require a developer, a commit and a deployment.
--
-- Both tables carry `project_key` for the same reason everything else does:
-- one deployment, two sites. See migrations/007_site_scope.sql.

CREATE TABLE IF NOT EXISTS team_members (
  id             SERIAL PRIMARY KEY,
  project_key    TEXT NOT NULL DEFAULT 'iresi',
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT '',
  -- The uploaded portrait. ON DELETE SET NULL so removing an image leaves the
  -- person on the page without their photograph, rather than removing them.
  photo_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
  -- The path carried over from the previous site, used until someone uploads a
  -- replacement. Same fallback pattern as projects.card_image.
  photo_path     TEXT,
  email          TEXT,
  linkedin       TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  published      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_members_project_key_idx ON team_members (project_key, sort_order);

-- Photographs attached to a named place on a page, rather than to an entry.
--
-- `slot` is what distinguishes them: 'about-collage' is the scrolling strip on
-- the About page, 'about-lead' the single picture above it. A generic table
-- rather than one per place, because the next request of this kind — the
-- Partners page lead image, a photograph on Research — needs a new row, not a
-- new migration.
CREATE TABLE IF NOT EXISTS page_images (
  id          SERIAL PRIMARY KEY,
  project_key TEXT NOT NULL DEFAULT 'iresi',
  slot        TEXT NOT NULL,
  -- No ON DELETE SET NULL here: a slot entry with no image is nothing at all,
  -- so it goes when its image goes.
  media_id    INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_images_slot_idx ON page_images (project_key, slot, sort_order);
