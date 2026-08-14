-- Which site a piece of editor-managed content belongs to.
--
-- ---------------------------------------------------------------------------
-- WHY THIS REVERSES AN EARLIER DECISION
-- ---------------------------------------------------------------------------
-- src/projects/types.ts argued at length that a project is configuration and
-- not a database column. That was right while one deployment served one project:
-- ACTIVE_PROJECT picked the identity, a separate DATABASE_URL held the content,
-- and a column would have been a field that was the same value in every row.
--
-- The premise changed on 13 August 2026, when ADFLEX was brought under
-- /adflex on this deployment. One process now serves two sites from one
-- database, so "which site owns this row" became a real question that the
-- environment can no longer answer. Without this column /adflex/news lists
-- IRESI's news.
--
-- Only editor-managed content is scoped. `media` and `files` are reached
-- through the tables below and inherit their scope; `messages` deliberately
-- stays shared, because one inbox for both sites is the point of one admin —
-- the enquiry's subject line says which site it came from.
--
-- The default is 'iresi' because every row that exists when this runs is
-- IRESI's, and because IRESI is the parent platform: an unscoped insert
-- belonging to the parent is the safe way to be wrong.

ALTER TABLE news_items   ADD COLUMN IF NOT EXISTS project_key TEXT NOT NULL DEFAULT 'iresi';
ALTER TABLE publications ADD COLUMN IF NOT EXISTS project_key TEXT NOT NULL DEFAULT 'iresi';
ALTER TABLE findings     ADD COLUMN IF NOT EXISTS project_key TEXT NOT NULL DEFAULT 'iresi';
ALTER TABLE projects     ADD COLUMN IF NOT EXISTS project_key TEXT NOT NULL DEFAULT 'iresi';

-- Every public listing filters on this, so it is worth an index on each table.
CREATE INDEX IF NOT EXISTS news_items_project_key_idx   ON news_items   (project_key);
CREATE INDEX IF NOT EXISTS publications_project_key_idx ON publications (project_key);
CREATE INDEX IF NOT EXISTS findings_project_key_idx     ON findings     (project_key);
CREATE INDEX IF NOT EXISTS projects_project_key_idx     ON projects     (project_key);
