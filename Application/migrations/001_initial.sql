-- ADFLEX admin schema.
--
-- Applied by `npm run db:setup`, which is idempotent — every statement here is
-- `IF NOT EXISTS` so it can be re-run against a live database without dropping
-- anything. There is no migration tool: this file IS the schema, and a change
-- to it needs a matching `ALTER` added below rather than an edit in place once
-- the database is real.

-- Editors. Seeded by `npm run db:user`; never created through the web UI,
-- because a publicly reachable sign-up form on an admin surface is a way in.
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploaded images, stored as bytes rather than in an object store.
--
-- This keeps DATABASE_URL the only secret the deployment needs. It is the right
-- trade at this scale — a project site with tens of images, not thousands — and
-- the wrong one past roughly a few hundred megabytes, because database storage
-- costs more than object storage and every backup carries the images. The swap
-- point is `src/lib/repo/media.ts`; nothing else reads `data` directly.
CREATE TABLE IF NOT EXISTS media (
  id          SERIAL PRIMARY KEY,
  filename    TEXT        NOT NULL,
  mime        TEXT        NOT NULL,
  byte_size   INTEGER     NOT NULL,
  data        BYTEA       NOT NULL,
  alt         TEXT        NOT NULL DEFAULT '',
  uploaded_by INTEGER     REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project findings, shown on /outcomes.
CREATE TABLE IF NOT EXISTS findings (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  summary    TEXT        NOT NULL DEFAULT '',
  body       TEXT        NOT NULL DEFAULT '',
  image_id   INTEGER     REFERENCES media(id) ON DELETE SET NULL,
  published  BOOLEAN     NOT NULL DEFAULT false,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Publications, shown on /outcomes.
--
-- `doi` holds the bare DOI ("10.1234/abcd"), never a URL. The resolver prefix
-- is added at render time by `doiUrl()` so a stored value cannot drift between
-- doi.org, dx.doi.org and a bare string.
CREATE TABLE IF NOT EXISTS publications (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  authors    TEXT        NOT NULL DEFAULT '',
  venue      TEXT        NOT NULL DEFAULT '',
  year       INTEGER,
  doi        TEXT,
  url        TEXT,
  published  BOOLEAN     NOT NULL DEFAULT false,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News and events share one table because they share one route. `kind` is what
-- separates them; `event_date` and `location` are only meaningful for events
-- and are left null for news.
CREATE TABLE IF NOT EXISTS news_items (
  id           SERIAL PRIMARY KEY,
  kind         TEXT        NOT NULL CHECK (kind IN ('news', 'event')),
  title        TEXT        NOT NULL,
  summary      TEXT        NOT NULL DEFAULT '',
  body         TEXT        NOT NULL DEFAULT '',
  image_id     INTEGER     REFERENCES media(id) ON DELETE SET NULL,
  published_on DATE        NOT NULL DEFAULT CURRENT_DATE,
  event_date   DATE,
  location     TEXT,
  published    BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contact form submissions.
--
-- This table holds personal data — name, email and free text — supplied by
-- members of the public. Maynooth University is the data controller named in
-- the privacy policy. Do not add analytics on it, do not export it casually,
-- and honour deletion requests by deleting the row.
CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL DEFAULT '',
  message    TEXT        NOT NULL,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- Multiple images per entry                                    (5 August 2026)
-- --------------------------------------------------------------------------
-- `findings.image_id` and `news_items.image_id` held exactly one image each.
-- These tables replace that with an ordered set.
--
-- Two tables rather than one polymorphic table with an `item_type` column. A
-- polymorphic `item_id` cannot carry a foreign key, so deleting a finding would
-- leave its image rows behind as orphans to be cleaned up by hand. Separate
-- tables get `ON DELETE CASCADE` for free, and that is worth the duplication.
CREATE TABLE IF NOT EXISTS finding_images (
  id         SERIAL PRIMARY KEY,
  finding_id INTEGER NOT NULL REFERENCES findings(id)  ON DELETE CASCADE,
  media_id   INTEGER NOT NULL REFERENCES media(id)     ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS news_images (
  id       SERIAL PRIMARY KEY,
  news_id  INTEGER NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media(id)      ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0
);

-- Real pixel dimensions, read from the file header on upload. Null for anything
-- uploaded before this existed, or whose header could not be parsed; the
-- renderer falls back to a 3:2 box in that case.
ALTER TABLE media ADD COLUMN IF NOT EXISTS width  INTEGER;
ALTER TABLE media ADD COLUMN IF NOT EXISTS height INTEGER;

-- How large the images should be drawn on the public page. See `ImageSize` in
-- src/lib/repo.ts for what each value means.
ALTER TABLE findings   ADD COLUMN IF NOT EXISTS image_size TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS image_size TEXT NOT NULL DEFAULT 'medium';

-- Carries anything stored under the old single-image columns into the new
-- tables. Guarded by NOT EXISTS so re-running db:setup cannot duplicate a row.
--
-- `image_id` is deliberately **not dropped**. Dropping a column is irreversible,
-- and making the drop safely re-runnable needs a dollar-quoted DO block, which
-- the statement splitter in scripts/db-setup.mjs does not parse. It is dead
-- weight and nothing reads it; leave it unless you also teach that splitter
-- about `$$`.
INSERT INTO finding_images (finding_id, media_id, position)
SELECT f.id, f.image_id, 0 FROM findings f
WHERE f.image_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM finding_images fi WHERE fi.finding_id = f.id);

INSERT INTO news_images (news_id, media_id, position)
SELECT n.id, n.image_id, 0 FROM news_items n
WHERE n.image_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM news_images ni WHERE ni.news_id = n.id);

CREATE INDEX IF NOT EXISTS finding_images_idx ON finding_images (finding_id, position);
CREATE INDEX IF NOT EXISTS news_images_idx    ON news_images (news_id, position);

CREATE INDEX IF NOT EXISTS findings_live_idx     ON findings (published, sort_order, created_at DESC);
CREATE INDEX IF NOT EXISTS publications_live_idx ON publications (published, sort_order, year DESC);
CREATE INDEX IF NOT EXISTS news_live_idx         ON news_items (published, published_on DESC);
CREATE INDEX IF NOT EXISTS messages_recent_idx   ON messages (created_at DESC);

-- --------------------------------------------------------------------------
-- Posting dates on outcomes                                    (7 August 2026)
-- --------------------------------------------------------------------------
-- Findings and publications now carry a posting date, the same way news items
-- do, so the public page can say when each was added. Set by the default on
-- insert and never written again by the app — an edit does not move it.
--
-- Existing rows take today's date rather than their `created_at`, because the
-- default is what `ADD COLUMN` applies. If a real database ever has rows worth
-- backdating, do it once by hand:
--   UPDATE findings SET published_on = created_at::date;
ALTER TABLE findings     ADD COLUMN IF NOT EXISTS published_on DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS published_on DATE NOT NULL DEFAULT CURRENT_DATE;

-- --------------------------------------------------------------------------
-- Downloadable files on outcomes                                (7 August 2026)
-- --------------------------------------------------------------------------
-- A report, a deliverable, a slide deck: the documents behind a finding or a
-- publication. Separate from `media`, which holds images that are rendered on
-- the page — these are never rendered, only downloaded, and they are served by
-- a different route with different headers.
--
-- Bytes in Postgres for the same reason as `media`: it keeps DATABASE_URL the
-- only secret a deployment needs. The same caveat applies — this is the right
-- trade for tens of documents and the wrong one for thousands.
CREATE TABLE IF NOT EXISTS files (
  id          SERIAL PRIMARY KEY,
  filename    TEXT        NOT NULL,
  mime        TEXT        NOT NULL,
  byte_size   INTEGER     NOT NULL,
  data        BYTEA       NOT NULL,
  -- What the download link says. Falls back to the filename when empty.
  label       TEXT        NOT NULL DEFAULT '',
  uploaded_by INTEGER     REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Two join tables rather than one polymorphic one, for the reason given above
-- `finding_images`: a polymorphic item_id cannot carry a foreign key, so a
-- deleted parent would leave orphan rows to be swept up by hand.
CREATE TABLE IF NOT EXISTS finding_files (
  id         SERIAL PRIMARY KEY,
  finding_id INTEGER NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  file_id    INTEGER NOT NULL REFERENCES files(id)    ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS publication_files (
  id             SERIAL PRIMARY KEY,
  publication_id INTEGER NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  file_id        INTEGER NOT NULL REFERENCES files(id)        ON DELETE CASCADE,
  position       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS finding_files_idx     ON finding_files (finding_id, position);
CREATE INDEX IF NOT EXISTS publication_files_idx ON publication_files (publication_id, position);

-- --------------------------------------------------------------------------
-- Upcoming events: booking and capacity                        (8 August 2026)
-- --------------------------------------------------------------------------
-- An event can now carry a link to wherever attendance is arranged — a booking
-- page, a registration form, a ticket seller — and a flag for when there is no
-- room left.
--
-- `slots_filled` is a plain boolean rather than a count. The project does not
-- own the booking system, so a number here would be a copy of someone else's
-- state and would be wrong the moment it changed. A flag the editor sets when
-- they know it is full is honest about what it is.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS booking_url  TEXT;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS slots_filled BOOLEAN NOT NULL DEFAULT false;

-- Finds the next upcoming published event, which is what the home page announces.
CREATE INDEX IF NOT EXISTS news_upcoming_idx ON news_items (published, event_date)
  WHERE kind = 'event';

-- --------------------------------------------------------------------------
-- "Upcoming event" as its own kind                             (8 August 2026)
-- --------------------------------------------------------------------------
-- The type an editor chooses is now News, Event or Upcoming event, and the
-- booking link and the no-places-left flag are offered only for the last of
-- these. Before this, every event carried a booking field — including ones that
-- had already happened, where a booking link is at best useless.
--
--   news      an announcement
--   event     an event that has happened, kept as a record
--   upcoming  an event still to come, which people can book a place at
--
-- Both event kinds appear under "Events" on the public page; only `upcoming`
-- can offer booking, and only while its date is still ahead — the date remains
-- the final word, so an upcoming event that passes stops offering a booking
-- link without anyone having to change its type.
ALTER TABLE news_items DROP CONSTRAINT IF EXISTS news_items_kind_check;
ALTER TABLE news_items ADD CONSTRAINT news_items_kind_check
  CHECK (kind IN ('news', 'event', 'upcoming'));

DROP INDEX IF EXISTS news_upcoming_idx;
CREATE INDEX IF NOT EXISTS news_upcoming_idx ON news_items (published, event_date)
  WHERE kind = 'upcoming';

-- Carries existing events onto the new kinds.
--
-- Before `upcoming` existed there was one event kind, and whether an event was
-- still to come was worked out from its date on every render. Promoting the
-- future ones preserves exactly that behaviour: they keep their "Upcoming" tag
-- and their booking link, which they would otherwise have lost silently.
--
-- Safe to re-run: it only ever looks at rows still marked `event`, and an
-- editor who deliberately sets one back to "already held" is not undone,
-- because a past date no longer matches.
UPDATE news_items
SET kind = 'upcoming'
WHERE kind = 'event'
  AND event_date IS NOT NULL
  AND event_date >= CURRENT_DATE;

-- --------------------------------------------------------------------------
-- Event start time                                             (8 August 2026)
-- --------------------------------------------------------------------------
-- Optional, because plenty of entries are announced before a time is fixed.
-- Stored as a bare TIME with no zone: the site serves one project in one place,
-- and an event at 14:30 is at 14:30 where it happens. A timestamptz would be
-- the right type only if events were held in several zones, and would then need
-- the zone recording alongside it.
--
-- With no time set, the countdown on the home page runs to the start of the
-- day, which is what it did before this column existed.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS event_time TIME;

-- --------------------------------------------------------------------------
-- Event end time, and expiry                                   (8 August 2026)
-- --------------------------------------------------------------------------
-- An upcoming event now says when it finishes as well as when it starts, and
-- disappears from the public page once it has. The end time is required for an
-- upcoming event and optional for one already held — a record of something that
-- happened is worth keeping whether or not anyone wrote down the hour.
--
-- Nullable in the database even so. The requirement is enforced where the
-- editor is: rows created before this column existed have no end time and no
-- honest way to invent one, and a NOT NULL would either reject them or fill
-- them with a fiction. Anything reading the column treats a missing end time as
-- the end of the event's day, which is exactly how those rows behaved before.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS event_end_time TIME;

-- --------------------------------------------------------------------------
-- Order of the public page                                     (9 August 2026)
-- --------------------------------------------------------------------------
-- There was briefly a `site_settings` table here holding one key: which of the
-- two lists led News & Events. It is gone, and so is the switch in the admin.
-- The order is fixed — upcoming events, then events already held, then news —
-- and what an editor arranges instead is the order of entries *within* a list,
-- which is the `sort_order` column below.
--
-- The `site_settings` table goes with it.
--
-- It briefly held a second key — the contact form's destination address, set
-- from a panel in the admin. That went too, on the same day and for the same
-- reason: the address is also the admin login and the sending mailbox, and
-- having one of the three live in a database table, one in an environment
-- variable and one in an account row is three places to look for one address.
--
-- Both now come from `PROJECT_EMAIL` in `src/lib/site.ts` — one line, changed
-- once. Nothing reads this table, so it is dropped rather than left as a
-- half-remembered feature for the next person to find.
DROP TABLE IF EXISTS site_settings;

-- --------------------------------------------------------------------------
-- Entry order                                                  (9 August 2026)
-- --------------------------------------------------------------------------
-- Lets an editor arrange entries by hand within their list, the same way
-- findings and publications already work: lower numbers first, everything at 0
-- by default so an untouched site falls back to date order.
--
-- It orders entries *within* a group, never between groups. Upcoming events lead
-- the page whatever number they carry — that is not a preference, it is what the
-- page is for.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Expiry is compared in the project's own timezone, not the server's.
--
-- The database container runs in UTC and the project runs in Ireland, an hour
-- apart for half the year. `event_date` and `event_time` are naive local values
-- by design — 14:30 means 14:30 where the event is — so anything comparing them
-- to the present must convert the present, not the event. Queries do this with
-- `now() AT TIME ZONE 'Europe/Dublin'`; there is no index expression here to
-- keep in step, because the comparison is against a moving target.
DROP INDEX IF EXISTS news_upcoming_idx;
CREATE INDEX IF NOT EXISTS news_upcoming_idx
  ON news_items (published, event_date, event_end_time)
  WHERE kind = 'upcoming';
