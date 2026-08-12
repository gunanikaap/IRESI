-- --------------------------------------------------------------------------
-- An event that has happened is a record, not a thing to throw away
--                                                            (12 August 2026)
-- --------------------------------------------------------------------------
-- Raised in the review meeting of 12 August 2026: an upcoming event vanished
-- from the public page the moment its end time passed, so anyone visiting the
-- site the following week saw no evidence the event had ever taken place.
--
-- The row was never deleted — it stayed in the admin marked "Expired" — but the
-- public list filtered it out, which comes to the same thing for a reader. The
-- lifecycle is now:
--
--   Upcoming  ->  the event happens  ->  Past event, still on the page
--
-- Nothing here flips a stored flag, and no scheduled job is involved: which
-- state an event is in is worked out from its end time on every read, in the
-- project's timezone. See `EXPIRED` and `LIVE_UPCOMING` in src/lib/repo.ts. A
-- stored state would need something to run at the right moment, and would be
-- wrong in between.
--
-- These two columns are what an editor can add *afterwards*. Photographs
-- already work — `news_images` holds as many as they like — so this is only the
-- write-up and the recording.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS event_outcome TEXT NOT NULL DEFAULT '';

-- One link, not a list. The meeting asked for "videos/YouTube links"; a project
-- that records an event ends up with one recording of it, and a second column
-- would be an ordering problem in exchange for a case nobody has had yet. If a
-- list is genuinely needed later, add an `event_videos` table — do not add
-- `event_video_url_2`.
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS event_video_url TEXT;

-- --------------------------------------------------------------------------
-- Uploads that nothing points at
-- --------------------------------------------------------------------------
-- Also from the meeting: deleting an entry left its images behind. The join
-- tables cascade, so the *attachments* went, but each `media` row carries the
-- whole file in a BYTEA column and those rows stayed — invisible, unreachable
-- since `isMediaPublic` was added, and still taking up the space. Seven had
-- accumulated in the development database by the time this was written.
--
-- `deleteOrphanedUploads` in src/lib/repo.ts now runs after every delete and
-- every edit that detaches something, so this will not build up again. This is
-- the one-off sweep of what is already there.
--
-- The condition is "referenced by nothing at all", not "no longer referenced by
-- the entry just deleted" — an image used by two entries survives losing one of
-- them. The legacy `image_id` columns are not consulted: nothing reads them,
-- migration 001 copied their contents into the join tables, and they are
-- ON DELETE SET NULL.
DELETE FROM media m
WHERE NOT EXISTS (SELECT 1 FROM news_images    ni WHERE ni.media_id = m.id)
  AND NOT EXISTS (SELECT 1 FROM finding_images fi WHERE fi.media_id = m.id);

DELETE FROM files f
WHERE NOT EXISTS (SELECT 1 FROM finding_files     ff WHERE ff.file_id = f.id)
  AND NOT EXISTS (SELECT 1 FROM publication_files pf WHERE pf.file_id = f.id);
