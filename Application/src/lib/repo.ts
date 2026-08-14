import "server-only";

import { query, queryOne, safeRead, safeReadStatus, withTransaction, type ReadStatus } from "./db";

/**
 * Every database read and write, in one place.
 *
 * Pages and Server Actions call these; nothing else builds SQL. Two rules hold
 * throughout:
 *
 * 1. **Public reads go through `safeRead`** and fall back to an empty list, so
 *    a missing or unreachable database renders the empty state the public pages
 *    already have rather than a 500.
 * 2. **Writes and admin reads do not.** A save that silently fails is worse
 *    than an error, and an admin list that silently shows nothing reads as
 *    "your work is gone".
 */

/* --------------------------------------------------------------------------
 * Which site a row belongs to
 * ----------------------------------------------------------------------- */

/**
 * One deployment serves both IRESI and the ADFLEX site at /adflex, from one
 * database. Every public listing therefore has to say which site is asking, or
 * /adflex/news lists IRESI's news. See migrations/007_site_scope.sql.
 *
 * Passed in rather than read from ambient state. The alternative — resolving it
 * from the request URL inside the repository — would make the same call return
 * different rows depending on where it was made from, which is exactly the kind
 * of thing that is invisible in review and obvious in production.
 *
 * `PLATFORM_SITE` is the default on every read, so the IRESI call sites are
 * unchanged and a forgotten argument fails safe: it shows the parent's content
 * rather than merging the two.
 */
export type Site = string;

export const PLATFORM_SITE: Site = "iresi";

/**
 * How large an entry's images are drawn on the public page.
 *
 * `small`  a narrow column beside the text — a logo, a portrait, a detail shot
 * `medium` the default column beside the text
 * `large`  full width above the text, for a chart or diagram that needs room
 */
export type ImageSize = "small" | "medium" | "large";

const IMAGE_SIZES: readonly ImageSize[] = ["small", "medium", "large"];

/** Anything else in the column — an older row, a hand-edited value — reads as the default. */
export function toImageSize(value: unknown): ImageSize {
  return IMAGE_SIZES.includes(value as ImageSize) ? (value as ImageSize) : "medium";
}

/** One image attached to an entry. `width`/`height` are null when unreadable. */
export type MediaRef = {
  id: number;
  alt: string;
  width: number | null;
  height: number | null;
};

/** One downloadable document attached to an outcome. */
export type FileRef = {
  id: number;
  filename: string;
  mime: string;
  byte_size: number;
  /** What the download link says. Falls back to `filename` when empty. */
  label: string;
};

export type Finding = {
  id: number;
  title: string;
  summary: string;
  body: string;
  images: MediaRef[];
  files: FileRef[];
  image_size: ImageSize;
  published_on: string;
  published: boolean;
  sort_order: number;
};

export type Publication = {
  id: number;
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  doi: string | null;
  url: string | null;
  files: FileRef[];
  published_on: string;
  published: boolean;
  sort_order: number;

  /* The fields a full citation carries. All nullable — ADFLEX's rows predate
   * them and its forms do not set them. See migrations/005. */
  journal: string | null;
  volume: string | null;
  pages: string | null;
  publisher: string | null;
  description: string | null;
  /**
   * The publication date exactly as the source gives it: "2019/4/1" on one
   * paper and "2022" on another. A DATE would force a day and a month onto
   * entries that never had them.
   */
  date_text: string | null;
  /**
   * Which researcher's group this appears under on /publications. Matches a
   * `slug` in the project's content module, not a database row — the grouping
   * is editorial while the papers are editor-managed.
   */
  researcher_slug: string | null;
};

/**
 * What an entry on /news is.
 *
 * `event` is one that has happened and is kept as a record; `upcoming` is one
 * still to come, and is the only kind that can carry a booking link. Both show
 * under "Events" on the public page — see `isEvent`.
 */
export type NewsKind = "news" | "event" | "upcoming";

/** True for either kind of event, as opposed to a news post. */
export function isEvent(kind: NewsKind): boolean {
  return kind === "event" || kind === "upcoming";
}

export type NewsItem = {
  id: number;
  kind: NewsKind;
  title: string;
  summary: string;
  body: string;
  images: MediaRef[];
  image_size: ImageSize;
  published_on: string;
  event_date: string | null;
  /** `HH:MM`, 24-hour. Null when the time has not been fixed yet. */
  event_time: string | null;
  /** `HH:MM`, 24-hour. Required for an upcoming event; null on older rows. */
  event_end_time: string | null;
  location: string | null;
  /** Where attendance is arranged. Null when there is nothing to book. */
  booking_url: string | null;
  /** Set by an editor when the event has no room left. */
  slots_filled: boolean;
  published: boolean;
  /**
   * The entry's address, when it has one of its own.
   *
   * IRESI's posts were published at /celebrating-science-night-... on WordPress
   * and those links have to keep working. Null on entries addressed by id.
   */
  slug: string | null;
  author: string | null;
  /** Reachable at its own address but kept off the listing. */
  unlisted: boolean;
  /** Old addresses that redirect here, one per line. */
  legacy_paths: string;
  /** Arranges entries within their own list. Lower first; 0 means "leave it to the date". */
  sort_order: number;
  /**
   * What happened at the event, written afterwards. Empty until someone adds it,
   * and only shown once the event is over — see `event_video_url`.
   */
  event_outcome: string;
  /**
   * A recording of the event: a YouTube link, or any other video page. Null
   * until someone adds one, and never shown before the event has happened,
   * because until then there is nothing to have recorded.
   */
  event_video_url: string | null;
  /**
   * True once an upcoming event's end time has passed — that is, once it has
   * happened. Computed per query, in the project's timezone — never stored, so
   * it is right the moment it changes rather than whenever something last wrote
   * the row.
   *
   * The entry stays on the public page either way; this decides whether it is
   * presented as still to come or as a past event.
   */
  expired: boolean;
};

export type Message = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

/* --------------------------------------------------------------------------
 * DOI
 * ----------------------------------------------------------------------- */

/**
 * A DOI is stored bare — "10.1234/abcd" — and only ever becomes a URL here.
 *
 * Accepts what an editor is likely to paste (a doi.org link, a `doi:` prefix,
 * surrounding space) and normalises it down to the bare identifier, because the
 * alternative is three spellings of the same DOI in one table.
 */
export function normaliseDoi(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const bare = trimmed
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();

  // The registrant prefix is always "10." followed by 4-9 digits, then a slash
  // and a suffix. Anything else is not a DOI and is rejected rather than stored
  // and rendered as a link that goes nowhere.
  return /^10\.\d{4,9}\/\S+$/.test(bare) ? bare : null;
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}

/* --------------------------------------------------------------------------
 * Findings
 * ----------------------------------------------------------------------- */

/**
 * The attached images, as a JSON array, built inside the query.
 *
 * A plain join would repeat the whole entry once per image and leave the caller
 * to stitch the rows back together. Aggregating in SQL keeps one row per entry
 * and hands back the images already ordered — `pg` parses the `json` column
 * into a real array, so nothing is parsed by hand.
 *
 * `COALESCE(..., '[]')` matters: without it an entry with no images gets `null`
 * rather than an empty array, and every reader would need a guard.
 */
const imagesJson = (table: string, fk: string, alias: string) => `
  COALESCE((
    SELECT json_agg(
             json_build_object('id', m.id, 'alt', m.alt, 'width', m.width, 'height', m.height)
             ORDER BY x.position, x.id
           )
    FROM ${table} x JOIN media m ON m.id = x.media_id
    WHERE x.${fk} = ${alias}.id
  ), '[]'::json) AS images
`;

/** The attached documents, aggregated the same way and for the same reasons. */
const filesJson = (table: string, fk: string, alias: string) => `
  COALESCE((
    SELECT json_agg(
             json_build_object('id', d.id, 'filename', d.filename, 'mime', d.mime,
                               'byte_size', d.byte_size, 'label', d.label)
             ORDER BY x.position, x.id
           )
    FROM ${table} x JOIN files d ON d.id = x.file_id
    WHERE x.${fk} = ${alias}.id
  ), '[]'::json) AS files
`;

const FINDING_COLUMNS = `
  f.id, f.title, f.summary, f.body, f.published, f.sort_order, f.image_size,
  to_char(f.published_on, 'YYYY-MM-DD') AS published_on,
  ${imagesJson("finding_images", "finding_id", "f")},
  ${filesJson("finding_files", "finding_id", "f")}
`;

export function listPublishedFindingsStatus(
  site: Site = PLATFORM_SITE,
): Promise<ReadStatus<Finding[]>> {
  return safeReadStatus(
    () =>
      query<Finding>(
        `SELECT ${FINDING_COLUMNS}
         FROM findings f
         WHERE f.published AND f.project_key = $1
         ORDER BY f.sort_order, f.created_at DESC`,
        [site],
      ),
    [],
    "findings",
  );
}

export function listAllFindings(site: Site = PLATFORM_SITE): Promise<Finding[]> {
  return query<Finding>(
    `SELECT ${FINDING_COLUMNS}
     FROM findings f
     WHERE f.project_key = $1
     ORDER BY f.sort_order, f.created_at DESC`,
    [site],
  );
}

export function getFinding(id: number): Promise<Finding | null> {
  return queryOne<Finding>(
    `SELECT ${FINDING_COLUMNS} FROM findings f WHERE f.id = $1`,
    [id],
  );
}

/**
 * No `publishedOn`, for the same reason `NewsInput` has none: the posting date
 * is stamped by the column default on insert and never written again, so an
 * edit cannot move it.
 */
export type FindingInput = {
  title: string;
  summary: string;
  body: string;
  imageIds: number[];
  fileIds: number[];
  imageSize: ImageSize;
  published: boolean;
  sortOrder: number;
};

export async function createFinding(
  input: FindingInput,
  site: Site = PLATFORM_SITE,
): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO findings (title, summary, body, published, sort_order, image_size, project_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [input.title, input.summary, input.body, input.published, input.sortOrder,
     input.imageSize, site],
  );
  await setFindingImages(row!.id, input.imageIds);
  await setFindingFiles(row!.id, input.fileIds);
  return row!.id;
}

export async function updateFinding(id: number, input: FindingInput): Promise<void> {
  await query(
    `UPDATE findings
     SET title = $2, summary = $3, body = $4,
         published = $5, sort_order = $6, image_size = $7, updated_at = now()
     WHERE id = $1`,
    [id, input.title, input.summary, input.body, input.published, input.sortOrder, input.imageSize],
  );
  await setFindingImages(id, input.imageIds);
  await setFindingFiles(id, input.fileIds);
  // An edit that takes a picture off an entry orphans it just as surely as
  // deleting the entry does.
  await deleteOrphanedUploads();
}

/**
 * Replaces the whole set of attached images in their given order.
 *
 * Delete-then-insert rather than working out which rows changed. The set is a
 * handful of rows, the order is part of the value, and reconciling additions,
 * removals and moves separately is where an ordering bug would live.
 */
async function setFindingImages(findingId: number, mediaIds: number[]): Promise<void> {
  await query("DELETE FROM finding_images WHERE finding_id = $1", [findingId]);
  for (const [position, mediaId] of mediaIds.entries()) {
    await query(
      "INSERT INTO finding_images (finding_id, media_id, position) VALUES ($1, $2, $3)",
      [findingId, mediaId, position],
    );
  }
}

/** Same delete-then-insert reasoning as `setFindingImages`. */
async function setFindingFiles(findingId: number, fileIds: number[]): Promise<void> {
  await query("DELETE FROM finding_files WHERE finding_id = $1", [findingId]);
  for (const [position, fileId] of fileIds.entries()) {
    await query(
      "INSERT INTO finding_files (finding_id, file_id, position) VALUES ($1, $2, $3)",
      [findingId, fileId, position],
    );
  }
}

export async function deleteFinding(id: number): Promise<void> {
  // `finding_images` and `finding_files` cascade, which takes the attachments
  // but not the uploads themselves. Anything still attached elsewhere survives
  // the sweep — see `deleteOrphanedUploads`.
  await query("DELETE FROM findings WHERE id = $1", [id]);
  await deleteOrphanedUploads();
}

/* --------------------------------------------------------------------------
 * Publications
 * ----------------------------------------------------------------------- */

const PUBLICATION_COLUMNS = `
  p.id, p.title, p.authors, p.venue, p.year, p.doi, p.url, p.published, p.sort_order,
  p.journal, p.volume, p.pages, p.publisher, p.description, p.date_text, p.researcher_slug,
  to_char(p.published_on, 'YYYY-MM-DD') AS published_on,
  ${filesJson("publication_files", "publication_id", "p")}
`;

export function listPublishedPublicationsStatus(
  site: Site = PLATFORM_SITE,
): Promise<ReadStatus<Publication[]>> {
  return safeReadStatus(
    () =>
      query<Publication>(
        `SELECT ${PUBLICATION_COLUMNS}
         FROM publications p
         WHERE p.published AND p.project_key = $1
         ORDER BY p.sort_order, p.year DESC NULLS LAST, p.title`,
        [site],
      ),
    [],
    "publications",
  );
}

export function listAllPublications(site: Site = PLATFORM_SITE): Promise<Publication[]> {
  return query<Publication>(
    `SELECT ${PUBLICATION_COLUMNS} FROM publications p
     WHERE p.project_key = $1
     ORDER BY p.sort_order, p.year DESC NULLS LAST, p.title`,
    [site],
  );
}

export function getPublication(id: number): Promise<Publication | null> {
  return queryOne<Publication>(
    `SELECT ${PUBLICATION_COLUMNS} FROM publications p WHERE p.id = $1`,
    [id],
  );
}

/** No `publishedOn`, for the same reason as `FindingInput`. */
export type PublicationInput = {
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  doi: string | null;
  url: string | null;
  fileIds: number[];
  published: boolean;
  sortOrder: number;
};

export async function createPublication(
  input: PublicationInput,
  site: Site = PLATFORM_SITE,
): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO publications (title, authors, venue, year, doi, url, published, sort_order, project_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [input.title, input.authors, input.venue, input.year, input.doi, input.url,
     input.published, input.sortOrder, site],
  );
  await setPublicationFiles(row!.id, input.fileIds);
  return row!.id;
}

export async function updatePublication(id: number, input: PublicationInput): Promise<void> {
  await query(
    `UPDATE publications
     SET title = $2, authors = $3, venue = $4, year = $5, doi = $6, url = $7,
         published = $8, sort_order = $9, updated_at = now()
     WHERE id = $1`,
    [id, input.title, input.authors, input.venue, input.year, input.doi, input.url, input.published, input.sortOrder],
  );
  await setPublicationFiles(id, input.fileIds);
  await deleteOrphanedUploads();
}

/** Same delete-then-insert reasoning as `setFindingImages`. */
async function setPublicationFiles(publicationId: number, fileIds: number[]): Promise<void> {
  await query("DELETE FROM publication_files WHERE publication_id = $1", [publicationId]);
  for (const [position, fileId] of fileIds.entries()) {
    await query(
      "INSERT INTO publication_files (publication_id, file_id, position) VALUES ($1, $2, $3)",
      [publicationId, fileId, position],
    );
  }
}

export async function deletePublication(id: number): Promise<void> {
  await query("DELETE FROM publications WHERE id = $1", [id]);
  await deleteOrphanedUploads();
}

/* --------------------------------------------------------------------------
 * Files
 * ----------------------------------------------------------------------- */

/**
 * Stores one uploaded document and returns its id.
 *
 * Mirrors `createMedia`. The bytes have already been checked against the file's
 * real leading bytes by `readDocuments` — nothing here trusts the browser.
 */
export async function createFile(input: {
  filename: string;
  mime: string;
  data: Buffer;
  label: string;
  uploadedBy: number;
}): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO files (filename, mime, byte_size, data, label, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [input.filename, input.mime, input.data.byteLength, input.data, input.label, input.uploadedBy],
  );
  return row!.id;
}

export async function setFileLabel(id: number, label: string): Promise<void> {
  await query("UPDATE files SET label = $2 WHERE id = $1", [id, label]);
}

/** The bytes for `/files/[id]`. */
export function getFileBytes(
  id: number,
): Promise<{ data: Buffer; mime: string; filename: string } | null> {
  return queryOne<{ data: Buffer; mime: string; filename: string }>(
    "SELECT data, mime, filename FROM files WHERE id = $1",
    [id],
  );
}

/*
 * `fileSize` and `fileKind` live in `upload-limits.ts`, not here: the admin form
 * renders them and cannot import a `server-only` module. Re-exported so server
 * code can reach them through the repo it already imports.
 */
export { fileKind, fileSize } from "./upload-limits";

/* --------------------------------------------------------------------------
 * News and events
 * ----------------------------------------------------------------------- */

/*
 * Now, in the project's own timezone.
 *
 * The database container runs in UTC and the project runs in Ireland — an hour
 * apart from late March to late October. `event_date` and `event_time` are
 * deliberately naive: 14:30 means 14:30 where the event is. So the present is
 * what gets converted, never the event. Comparing against a bare `now()` would
 * have held an Irish event open for an extra hour every summer, and `CURRENT_DATE`
 * would have rolled the day over an hour late.
 *
 * One place, one zone. If ADFLEX ever runs events in another country this has to
 * become a stored zone per event, not a second constant.
 */
const PROJECT_NOW = `(now() AT TIME ZONE 'Europe/Dublin')`;

/** When an event begins. A missing start time means the start of its day. */
const EVENT_START = `(n.event_date + COALESCE(n.event_time, TIME '00:00'))`;

/**
 * When an event is over.
 *
 * A missing end time means the end of its day, which is how every row behaved
 * before the column existed — rows created then have no end time, and there is
 * no honest way to invent one for them.
 */
const EVENT_END = `(n.event_date + COALESCE(n.event_end_time, TIME '23:59:59'))`;

/**
 * An upcoming event whose end time has passed — in other words, one that has
 * now happened.
 *
 * `COALESCE(..., false)` because a row with no `event_date` makes the comparison
 * NULL, and a NULL here would reach the page as neither true nor false. Only
 * `upcoming` can reach this state: `event` means "already held" and was a record
 * from the moment it was created.
 *
 * **This does not remove anything from the public page.** It used to: until
 * 12 August 2026 the published list carried `AND NOT EXPIRED`, so an event
 * disappeared the minute it finished and a visitor the following week found no
 * trace of it. The review meeting asked for the opposite, and was right — the
 * announcement, the poster and the date are exactly what makes a past event
 * worth having. All this flag now decides is which half of the page an event
 * belongs in and how it is labelled.
 */
const EXPIRED = `COALESCE(n.kind = 'upcoming' AND ${EVENT_END} <= ${PROJECT_NOW}, false)`;

/**
 * An event that is still to come.
 *
 * The kind says what the editor intended and the clock has the final word, so
 * an event moves from one group to the other by itself, at the minute it ends,
 * with nothing scheduled to make it happen. Nobody has to remember to change
 * anything, and there is no window in which the page is out of date.
 */
const LIVE_UPCOMING = `(n.kind = 'upcoming' AND NOT ${EXPIRED})`;

const NEWS_COLUMNS = `
  n.id, n.kind, n.title, n.summary, n.body, n.image_size,
  to_char(n.published_on, 'YYYY-MM-DD') AS published_on,
  to_char(n.event_date, 'YYYY-MM-DD') AS event_date,
  to_char(n.event_time, 'HH24:MI') AS event_time,
  to_char(n.event_end_time, 'HH24:MI') AS event_end_time,
  n.location, n.booking_url, n.slots_filled, n.published, n.sort_order,
  n.event_outcome, n.event_video_url,
  n.slug, n.author, n.unlisted, n.legacy_paths,
  ${EXPIRED} AS expired,
  ${imagesJson("news_images", "news_id", "n")}
`;

/**
 * Upcoming events, then events already held, then news.
 *
 * Fixed, not a setting. There was briefly a switch in the admin for which list
 * led the page; it was removed on 9 August 2026 in favour of arranging entries
 * *within* a list, which is what `sort_order` does.
 *
 * Three keys, in this order:
 *
 * 1. **The group.** Upcoming events lead whatever anything else says. An entry's
 *    `sort_order` cannot lift it out of its group, which is the point — a news
 *    post numbered 1 does not jump above the next event.
 * 2. **`sort_order`.** The editor's own arrangement, lower first. Everything is
 *    0 until someone changes it, so an untouched site is entirely date-ordered
 *    and stays that way.
 * 3. **The date.** Events still to come ascend — the nearest thing first — and
 *    everything else descends. The two halves sort on opposite principles
 *    because they answer opposite questions, and one order for both makes one
 *    half read backwards.
 *
 * The first key is `LIVE_UPCOMING`, not `kind = 'upcoming'`. An event that has
 * now happened leaves the top group on its own and joins the events already
 * held, where the descending date puts the most recent one first — so the event
 * that finished last night sits at the head of the past events, both for a
 * reader and for the editor who is about to add the photographs to it.
 */
const NEWS_ORDER = `
  ORDER BY
    ${LIVE_UPCOMING} DESC,
    (n.kind IN ('event', 'upcoming')) DESC,
    n.sort_order,
    CASE WHEN ${LIVE_UPCOMING} THEN ${EVENT_START} END ASC,
    COALESCE(n.event_date, n.published_on) DESC,
    n.id DESC
`;

/**
 * Dates come back as `YYYY-MM-DD` strings via `to_char`, not as `Date` objects.
 *
 * `pg` maps `DATE` to a JavaScript `Date` at midnight in the *server's* local
 * zone, so an event on the 1st can render as the 31st for anyone west of it.
 * Formatting in SQL keeps a calendar date a calendar date.
 */
/**
 * The same lists the public pages already used, but saying whether the answer
 * is real.
 *
 * A page that cannot tell an empty database from an unreachable one has to guess
 * which message to show, and the guess it made was the damaging one — see
 * `safeReadStatus`. These exist so `/news` and `/outcomes` can say "nothing
 * published yet" only when that is true.
 */
export function listPublishedNewsStatus(
  site: Site = PLATFORM_SITE,
): Promise<ReadStatus<NewsItem[]>> {
  return safeReadStatus(
    () =>
      query<NewsItem>(
        `SELECT ${NEWS_COLUMNS}
         FROM news_items n
         WHERE n.published AND n.project_key = $1
         ${NEWS_ORDER}`,
        [site],
      ),
    [],
    "news",
  );
}

/**
 * The next published event that has not started yet and still has places, or
 * null.
 *
 * What the home page announces, and it counts down to the start — so the test
 * is whether the event has begun, not whether it has finished. That also means
 * an event running right now does not sit on the panel with a dead countdown
 * while the one after it goes unannounced.
 *
 * `NOT n.slots_filled` because the announcement exists to get someone to book.
 * A panel that interrupts the home page to say a thing is full is an
 * advertisement for a disappointment; the event is still listed in full on
 * `/news`, marked "Fully booked", for anyone who wants to know it is happening.
 * Excluding it here rather than hiding it in the component also means the next
 * event with places left gets announced instead of nothing at all.
 *
 * `safeRead` because this feeds a public page: with no database, or an
 * unreachable one, the home page simply shows no announcement rather than
 * failing to render.
 */
export function getNextUpcomingEvent(site: Site = PLATFORM_SITE): Promise<NewsItem | null> {
  return safeRead(
    () =>
      queryOne<NewsItem>(
        `SELECT ${NEWS_COLUMNS}
         FROM news_items n
         WHERE n.published
           AND n.project_key = $1
           AND n.kind = 'upcoming'
           AND NOT n.slots_filled
           AND n.event_date IS NOT NULL
           AND ${EVENT_START} > ${PROJECT_NOW}
         ORDER BY ${EVENT_START}, n.id
         LIMIT 1`,
        [site],
      ),
    null,
    "next event",
  );
}

/**
 * Everything, for the admin — including expired events, which the public list
 * drops. An editor has to be able to see what has fallen off the page in order
 * to do anything about it.
 */
/**
 * Turns every upcoming event whose end time has passed into a past one.
 *
 * ---------------------------------------------------------------------------
 * THE DISPLAY NEVER NEEDED THIS
 * ---------------------------------------------------------------------------
 * `expired` is computed on every read, so a finished event stops being labelled
 * "Upcoming", loses its booking button and drops out of the pinned group at the
 * minute it ends, with nothing scheduled and no window in which the public page
 * is wrong. That is still how the site behaves and it is the part that matters.
 *
 * What did not change was the stored `kind`. An editor opening a seminar that
 * finished last week found "Event — still to come" selected in the form, which
 * is the site telling them something the site does not believe. This settles the
 * column so the record agrees with the page.
 *
 * Called from the admin layout, so it runs when somebody opens the admin and
 * never on a public request: a read that writes would be wrong on the public
 * path, and pointless there, since those pages are already correct.
 *
 * Returns how many rows moved, which is zero on almost every call.
 */
export async function settleFinishedEvents(): Promise<number> {
  const rows = await query<{ id: number }>(
    `UPDATE news_items n
     SET kind = 'event', updated_at = now()
     WHERE n.kind = 'upcoming'
       AND n.event_date IS NOT NULL
       AND ${EVENT_END} <= ${PROJECT_NOW}
     RETURNING n.id`,
  );
  return rows.length;
}

export function listAllNews(site: Site = PLATFORM_SITE): Promise<NewsItem[]> {
  return query<NewsItem>(
    `SELECT ${NEWS_COLUMNS}
     FROM news_items n
     WHERE n.project_key = $1
     ${NEWS_ORDER}`,
    [site],
  );
}

export function getNewsItem(id: number): Promise<NewsItem | null> {
  return queryOne<NewsItem>(
    `SELECT ${NEWS_COLUMNS} FROM news_items n WHERE n.id = $1`,
    [id],
  );
}

/**
 * There is deliberately no `publishedOn`.
 *
 * The posting date used to be a field the editor filled in, which meant it
 * could be wrong, could be forgotten, and had to be retyped on every edit. It
 * is now stamped by the database: `published_on` takes its `CURRENT_DATE`
 * default when the row is created and is never written again, so it records
 * when the entry was actually posted — and editing a typo three weeks later
 * does not silently move it to the top of the list.
 *
 * `eventDate` is a different thing and stays: it is when the event happens,
 * which only the editor knows.
 */
export type NewsInput = {
  kind: NewsKind;
  title: string;
  /**
   * The entry's address. Never empty: `/[slug]` is the only route that serves a
   * news entry, so a row without one is a row nothing can open — which is
   * exactly what entries created through the admin used to be.
   */
  slug: string;
  summary: string;
  body: string;
  imageIds: number[];
  imageSize: ImageSize;
  eventDate: string | null;
  /** `HH:MM`, 24-hour, or null when no time has been fixed. */
  eventTime: string | null;
  /** `HH:MM`, 24-hour. Required for an upcoming event; may be null otherwise. */
  eventEndTime: string | null;
  location: string | null;
  bookingUrl: string | null;
  slotsFilled: boolean;
  published: boolean;
  /** Position within this entry's own list. Lower first. */
  sortOrder: number;
  /** What happened at the event, added after it. Empty string when unwritten. */
  eventOutcome: string;
  /** A recording of the event. Null when there is none. */
  eventVideoUrl: string | null;
};

/**
 * Turns a title into an address.
 *
 * Emoji, punctuation and accents all go; what is left is lower-case words joined
 * by hyphens. The titles carried over from the old site open with things like
 * "🌟 Renew Team Represented…", so stripping to `[a-z0-9]` rather than escaping
 * is the only thing that produces an address anybody would type.
 *
 * Returns an empty string when nothing survives — a title of pure emoji — and
 * the caller is expected to fall back rather than write an empty slug.
 */
export function slugifyTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * A slug nothing else is using.
 *
 * `news_slug_key` is unique, so a clash is an error at save time rather than a
 * silently overwritten address. Suffixing is done here instead: an editor who
 * writes two posts called "Annual Report" gets `annual-report` and
 * `annual-report-2` rather than a failure they cannot act on.
 */
export async function availableNewsSlug(
  desired: string,
  excludeId: number | null = null,
): Promise<string> {
  const base = desired || "entry";
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await queryOne<{ id: number }>(
      "SELECT id FROM news_items WHERE slug = $1 AND ($2::int IS NULL OR id <> $2)",
      [candidate, excludeId],
    );
    if (!clash) return candidate;
  }
  // 50 entries with the same title is not a real case; a timestamp ends the
  // loop rather than looping for ever or returning a slug that will fail.
  return `${base}-${Date.now()}`;
}

export async function createNewsItem(
  input: NewsInput,
  site: Site = PLATFORM_SITE,
): Promise<number> {
  // `published_on` is omitted so the column's CURRENT_DATE default applies.
  const row = await queryOne<{ id: number }>(
    `INSERT INTO news_items
       (kind, title, summary, body, event_date, location, published, image_size,
        booking_url, slots_filled, event_time, event_end_time, sort_order,
        event_outcome, event_video_url, project_key, slug)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
    [input.kind, input.title, input.summary, input.body,
     input.eventDate, input.location, input.published, input.imageSize,
     input.bookingUrl, input.slotsFilled, input.eventTime, input.eventEndTime,
     input.sortOrder, input.eventOutcome, input.eventVideoUrl, site, input.slug],
  );
  await setNewsImages(row!.id, input.imageIds);
  return row!.id;
}

export async function updateNewsItem(id: number, input: NewsInput): Promise<void> {
  // `published_on` is not in the SET list, so an edit leaves the original
  // posting date alone.
  await query(
    `UPDATE news_items
     SET kind = $2, title = $3, summary = $4, body = $5,
         event_date = $6, location = $7, published = $8,
         image_size = $9, booking_url = $10, slots_filled = $11,
         event_time = $12, event_end_time = $13, sort_order = $14,
         event_outcome = $15, event_video_url = $16, slug = $17,
         updated_at = now()
     WHERE id = $1`,
    [id, input.kind, input.title, input.summary, input.body,
     input.eventDate, input.location, input.published, input.imageSize,
     input.bookingUrl, input.slotsFilled, input.eventTime, input.eventEndTime,
     input.sortOrder, input.eventOutcome, input.eventVideoUrl, input.slug],
  );
  await setNewsImages(id, input.imageIds);
  await deleteOrphanedUploads();
}

/** Same delete-then-insert reasoning as `setFindingImages`. */
async function setNewsImages(newsId: number, mediaIds: number[]): Promise<void> {
  await query("DELETE FROM news_images WHERE news_id = $1", [newsId]);
  for (const [position, mediaId] of mediaIds.entries()) {
    await query(
      "INSERT INTO news_images (news_id, media_id, position) VALUES ($1, $2, $3)",
      [newsId, mediaId, position],
    );
  }
}

/**
 * Marks an upcoming event as full, or not.
 *
 * `AND kind = 'upcoming'` is in the query rather than left to the caller: this
 * runs behind a Server Action, which is a POST endpoint someone can reach
 * directly, so the rule that only an upcoming event can be full belongs
 * somewhere it cannot be bypassed. A request naming a news post simply updates
 * no rows.
 */
export async function setSlotsFilled(id: number, filled: boolean): Promise<void> {
  await query(
    "UPDATE news_items SET slots_filled = $2, updated_at = now() WHERE id = $1 AND kind = 'upcoming'",
    [id, filled],
  );
}

export async function deleteNewsItem(id: number): Promise<void> {
  await query("DELETE FROM news_items WHERE id = $1", [id]);
  await deleteOrphanedUploads();
}

/* --------------------------------------------------------------------------
 * Publishing
 * ----------------------------------------------------------------------- */

/** The three tables carrying a `published` flag. */
export type PublishableTable =
  | "findings"
  | "publications"
  | "news_items"
  | "projects"
  | "team_members";

// Checked against, not interpolated blindly: the table name reaches this from a
// form field, and an allow-list is what stops it reaching SQL as anything else.
const PUBLISHABLE: readonly PublishableTable[] = [
  "findings",
  "publications",
  "news_items",
  "projects",
  "team_members",
];

/**
 * Sets an entry's published flag.
 *
 * The table name cannot be parameterised in SQL, so it is interpolated — and is
 * therefore checked against a fixed list first. That check is the only thing
 * standing between a caller's string and the query text, so do not remove it
 * and do not widen it to accept arbitrary input.
 */
export async function setPublished(
  table: PublishableTable,
  id: number,
  published: boolean,
): Promise<void> {
  if (!PUBLISHABLE.includes(table)) {
    throw new Error(`Refusing to publish against an unknown table: ${table}`);
  }
  await query(
    `UPDATE ${table} SET published = $2, updated_at = now() WHERE id = $1`,
    [id, published],
  );
}

/* --------------------------------------------------------------------------
 * Contact messages
 * ----------------------------------------------------------------------- */

export async function createMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await query(
    `INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
    [input.name, input.email, input.subject, input.message],
  );
}

export function listMessages(): Promise<Message[]> {
  return query<Message>(`
    SELECT id, name, email, subject, message,
           to_char(read_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS read_at,
           to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at
    FROM messages ORDER BY created_at DESC
  `);
}

export async function countUnreadMessages(): Promise<number> {
  const row = await queryOne<{ n: string }>(
    "SELECT count(*)::text AS n FROM messages WHERE read_at IS NULL",
  );
  return Number(row?.n ?? 0);
}

export async function markMessageRead(id: number): Promise<void> {
  await query("UPDATE messages SET read_at = now() WHERE id = $1 AND read_at IS NULL", [id]);
}

export async function deleteMessage(id: number): Promise<void> {
  await query("DELETE FROM messages WHERE id = $1", [id]);
}

/* --------------------------------------------------------------------------
 * Media
 * ----------------------------------------------------------------------- */

export type MediaSummary = {
  id: number;
  filename: string;
  mime: string;
  byte_size: number;
  alt: string;
};

export async function createMedia(input: {
  filename: string;
  mime: string;
  data: Buffer;
  alt: string;
  width: number | null;
  height: number | null;
  uploadedBy: number;
}): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO media (filename, mime, byte_size, data, alt, width, height, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [input.filename, input.mime, input.data.byteLength, input.data, input.alt,
     input.width, input.height, input.uploadedBy],
  );
  return row!.id;
}

/** Updates the alt text on images already attached to an entry. */
export async function setMediaAlt(id: number, alt: string): Promise<void> {
  await query("UPDATE media SET alt = $2 WHERE id = $1", [id, alt]);
}

export function listMedia(): Promise<MediaSummary[]> {
  return query<MediaSummary>(
    "SELECT id, filename, mime, byte_size, alt FROM media ORDER BY created_at DESC",
  );
}

export function getMediaBytes(
  id: number,
): Promise<{ data: Buffer; mime: string } | null> {
  return queryOne<{ data: Buffer; mime: string }>(
    "SELECT data, mime FROM media WHERE id = $1",
    [id],
  );
}

export async function deleteMedia(id: number): Promise<void> {
  // Rows referencing this image have `ON DELETE SET NULL`, so an item whose
  // picture is removed keeps its text rather than disappearing with it.
  await query("DELETE FROM media WHERE id = $1", [id]);
}

/* --------------------------------------------------------------------------
 * Uploads nothing points at any more
 * ----------------------------------------------------------------------- */

/**
 * Deletes every upload that is no longer attached to anything, and reports how
 * many went.
 *
 * ---------------------------------------------------------------------------
 * EVERY TABLE THAT CAN HOLD AN IMAGE HAS TO BE LISTED HERE
 * ---------------------------------------------------------------------------
 * An upload this misses is an upload it deletes. That is not hypothetical: when
 * `page_images` was added on 13 August 2026 it was not added here, and because
 * its foreign key cascades, every save of a news entry silently deleted all
 * sixteen photographs from the About page. Nothing reported an error; the strip
 * simply emptied.
 *
 * So the list includes the join tables, the two `projects` columns that point at
 * an image directly, and `team_members.photo_media_id`. That last one is
 * `ON DELETE SET NULL` rather than a cascade, so missing it would not have
 * removed anybody — it would have blanked their portrait instead, which is
 * harder to notice and no better.
 *
 * **Adding a table that references `media` means adding a line here.** There is
 * no way to make this automatic that is worth the indirection, so it is written
 * down instead.
 *
 * `finding_images`, `news_images`, `finding_files` and `publication_files` all
 * cascade, so deleting an entry takes its *attachments* with it — but the
 * `media` and `files` rows themselves survive, and each one carries the whole
 * file in a `BYTEA` column. Deleting an event with six photographs therefore
 * used to leave six photographs in the database for ever: invisible, unreachable
 * once `isMediaPublic` was added, and still occupying the space. Seven such rows
 * had already accumulated when this was written.
 *
 * The old behaviour was deliberate — the comment on `deleteFinding` explains it
 * as protecting an image shared with another entry — and that instinct is still
 * respected here. This does not delete an upload because *one* entry let go of
 * it; it deletes an upload that **nothing at all** refers to. A shared image
 * keeps its other references and is left alone.
 *
 * The two legacy `image_id` columns are not consulted. Nothing reads them
 * (verified by search), migration 001 copied their contents into the join
 * tables, and they are `ON DELETE SET NULL` — so a delete here simply nulls a
 * column no code looks at.
 *
 * **Safe only because uploads cannot exist unattached by design.** There is no
 * media-library page: `createMedia` is called from one place, mid-save, inside
 * the same transaction that attaches the row. Nothing uploads now and attaches
 * later. If a library is ever added — an editor uploading a picture in advance —
 * this becomes a reaper of their work, and it must then be given a grace period
 * on `created_at` or a flag distinguishing "not attached yet" from "no longer
 * attached". An uncommitted upload in another transaction is invisible to this
 * one under MVCC, so concurrent saves are already safe.
 */
export async function deleteOrphanedUploads(): Promise<{ media: number; files: number }> {
  const media = await query<{ id: number }>(`
    DELETE FROM media m
    WHERE NOT EXISTS (SELECT 1 FROM news_images    ni WHERE ni.media_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM finding_images fi WHERE fi.media_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM project_images pi WHERE pi.media_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM page_images    gi WHERE gi.media_id = m.id)
      AND NOT EXISTS (
        SELECT 1 FROM projects p
        WHERE p.card_media_id = m.id OR p.hero_media_id = m.id
      )
      AND NOT EXISTS (SELECT 1 FROM team_members t WHERE t.photo_media_id = m.id)
    RETURNING m.id
  `);
  const files = await query<{ id: number }>(`
    DELETE FROM files f
    WHERE NOT EXISTS (SELECT 1 FROM finding_files     ff WHERE ff.file_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM publication_files pf WHERE pf.file_id = f.id)
    RETURNING f.id
  `);
  return { media: media.length, files: files.length };
}

/* --------------------------------------------------------------------------
 * Whether an asset may be served to the public
 * ----------------------------------------------------------------------- */

/**
 * Is this image attached to anything that is published?
 *
 * `/media/[id]` is a public URL with sequential ids, so without this an
 * unpublished draft's picture could be read by anyone who counted upwards —
 * raised in the external review of 9 August 2026, and reproduced before fixing.
 *
 * "Attached to something published" rather than "not a draft": an image reused
 * across two entries is public as soon as either is published, and stops being
 * public when the last of them is unpublished or deleted. That also closes the
 * orphan case in the same test — an image whose entry was deleted is attached to
 * nothing, so it matches nothing here and is no longer served.
 *
 * Projects arrived after this was written and have three ways of holding an
 * image — the gallery join table and the two single-image columns an editor
 * sets from the project form — so all three are tested. A published project's
 * card art is public even when the project is `external_only`: it has no page
 * of its own, but its card is still on the listing.
 *
 * ---------------------------------------------------------------------------
 * EVERY TABLE THAT CAN HOLD AN IMAGE HAS TO BE LISTED HERE TOO
 * ---------------------------------------------------------------------------
 * The same rule as `deleteOrphanedUploads`, and it has to be applied to both:
 * one decides whether an upload is *kept*, this one whether it is *served*.
 * `page_images` was added to that function and missed here, which meant the
 * sixteen About-page photographs were stored, kept, listed in the admin — and
 * answered 404 to every visitor who was not signed in. It looked correct from
 * inside the admin, which is exactly why it survived a check.
 *
 * **When testing an image, test it signed out.**
 */
export function isMediaPublic(id: number): Promise<boolean> {
  return safeRead(
    async () => {
      const row = await queryOne<{ ok: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM finding_images fi
             JOIN findings f ON f.id = fi.finding_id AND f.published
           WHERE fi.media_id = $1
           UNION ALL
           SELECT 1 FROM news_images ni
             JOIN news_items n ON n.id = ni.news_id AND n.published
           WHERE ni.media_id = $1
           UNION ALL
           SELECT 1 FROM project_images pi
             JOIN projects p ON p.id = pi.project_id AND p.published
           WHERE pi.media_id = $1
           UNION ALL
           SELECT 1 FROM projects p
           WHERE p.published AND (p.card_media_id = $1 OR p.hero_media_id = $1)
           UNION ALL
           /*
            * A page photograph has no published flag of its own — the slot it
            * sits in is a public page, so being attached is what makes it
            * public. Removing it from the slot is how it is taken down, and
            * that also makes it an orphan for the sweep.
            */
           SELECT 1 FROM page_images gi WHERE gi.media_id = $1
           UNION ALL
           -- A hidden colleague's portrait is not public, which is why this
           -- one does have a condition.
           SELECT 1 FROM team_members t WHERE t.published AND t.photo_media_id = $1
         ) AS ok`,
        [id],
      );
      return row?.ok ?? false;
    },
    // A database that cannot be reached must not turn into "serve everything".
    false,
    "media visibility",
  );
}

/* ==========================================================================
 * PROJECTS
 * ==========================================================================
 * The research projects a centre runs — IRESI publishes eleven of them. Same
 * shape as a finding with different words, plus the two things a project has
 * that a finding does not: an address of its own, and somewhere else to send
 * people (its consortium website).
 *
 * Added 12 August 2026. See migrations/005_platform_projects.sql.
 * ======================================================================== */

export type Project = {
  id: number;
  slug: string;
  title: string;
  /** Longer heading for the project's own page. Falls back to `title`. */
  page_title: string | null;
  summary: string;
  /** Lead paragraphs, split from the stored newline-separated text. */
  intro: string[];
  /** Short descriptor chips shown in the project header. */
  tags: string[];
  body: string;
  card_image: string | null;
  hero_image: string | null;
  card_media_id: number | null;
  hero_media_id: number | null;
  website: string | null;
  website_label: string;
  vimeo_id: string | null;
  external_only: boolean;
  published: boolean;
  sort_order: number;
  published_on: string;
  /** Further screenshots shown below the hero image, one path per line. */
  gallery: string[];
};

/** Stored as newline-separated text; empty lines are not entries. */
function splitLines(value: string | null): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type ProjectRow = Omit<Project, "intro" | "tags" | "gallery"> & {
  intro: string;
  tags: string;
  gallery: string;
};

const PROJECT_COLUMNS = `
  id, slug, title, page_title, summary, intro, tags, body,
  card_image, hero_image, card_media_id, hero_media_id,
  website, website_label, vimeo_id, external_only, gallery,
  published, sort_order, to_char(published_on, 'YYYY-MM-DD') AS published_on
`;

function toProject(row: ProjectRow): Project {
  return {
    ...row,
    intro: splitLines(row.intro),
    tags: splitLines(row.tags),
    gallery: splitLines(row.gallery),
  };
}

/**
 * Projects for the public listing, newest-arranged-first within `sort_order`.
 *
 * Returns `{ data, degraded }` rather than a bare array. An empty list is also
 * what the page shows when nothing has been published, so a database that
 * blinked would otherwise tell visitors the centre runs no projects. Every
 * public read must distinguish "there is nothing" from "I could not find out".
 */
export function listPublishedProjectsStatus(
  site: Site = PLATFORM_SITE,
): Promise<ReadStatus<Project[]>> {
  return safeReadStatus(
    async () => {
      const rows = await query<ProjectRow>(
        `SELECT ${PROJECT_COLUMNS} FROM projects
         WHERE published AND project_key = $1
         ORDER BY sort_order, created_at DESC`,
        [site],
      );
      return rows.map(toProject);
    },
    [],
    "projects",
  );
}

/**
 * One published news entry by its address, for `/[slug]`.
 *
 * Unlisted entries are reachable here on purpose: "unlisted" means kept off the
 * listing, not withdrawn. An entry that is not `published` is not served at all.
 */
export function getPublishedNewsBySlug(
  slug: string,
  site: Site = PLATFORM_SITE,
): Promise<NewsItem | null> {
  return safeRead(
    async () =>
      (await queryOne<NewsItem>(
        `SELECT ${NEWS_COLUMNS} FROM news_items n
         WHERE n.slug = $1 AND n.published AND n.project_key = $2`,
        [slug, site],
      )) ?? null,
    null,
    "news entry",
  );
}

/** Admin list: every project, published or not. Deliberately not `safeRead`. */
export async function listAllProjects(): Promise<Project[]> {
  const rows = await query<ProjectRow>(
    `SELECT ${PROJECT_COLUMNS} FROM projects ORDER BY sort_order, created_at DESC`,
  );
  return rows.map(toProject);
}

/**
 * One published project by its address. Used by `/[slug]`.
 *
 * `external_only` entries are excluded on purpose. Those are projects that live
 * on someone else's website — LERO and CO-CREATIVE LAB today — and get a card
 * that links straight out. Serving a page here too would mean two addresses for
 * the same project, one of them nearly empty, and would not match the site this
 * replaces. The listing card is the only place they appear.
 */
export function getPublishedProjectBySlug(
  slug: string,
  site: Site = PLATFORM_SITE,
): Promise<Project | null> {
  return safeRead(
    async () => {
      const row = await queryOne<ProjectRow>(
        `SELECT ${PROJECT_COLUMNS} FROM projects
         WHERE slug = $1 AND published AND NOT external_only AND project_key = $2`,
        [slug, site],
      );
      return row ? toProject(row) : null;
    },
    null,
    "project",
  );
}

export async function getProject(id: number): Promise<Project | null> {
  const row = await queryOne<ProjectRow>(`SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`, [
    id,
  ]);
  return row ? toProject(row) : null;
}

export type ProjectInput = {
  slug: string;
  title: string;
  page_title: string | null;
  summary: string;
  /** One paragraph per line. */
  intro: string;
  /** One tag per line. */
  tags: string;
  body: string;
  website: string | null;
  website_label: string;
  vimeo_id: string | null;
  external_only: boolean;
  sort_order: number;
  /** Uploaded images to attach, in order. Existing ones are replaced. */
  imageIds?: number[];
};

/**
 * Writes go through a transaction so an entry and its images are saved together
 * or not at all. `withTransaction` puts the connection in async-local storage,
 * so the `query` calls below join it without being handed a client.
 */
export async function createProject(input: ProjectInput): Promise<number> {
  return withTransaction(async () => {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO projects
         (slug, title, page_title, summary, intro, tags, body,
          website, website_label, vimeo_id, external_only, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [
        input.slug,
        input.title,
        input.page_title,
        input.summary,
        input.intro,
        input.tags,
        input.body,
        input.website,
        input.website_label,
        input.vimeo_id,
        input.external_only,
        input.sort_order,
      ],
    );
    const id = row!.id;
    await attachProjectImages(id, input.imageIds ?? []);
    return id;
  });
}

export async function updateProject(id: number, input: ProjectInput): Promise<void> {
  await withTransaction(async () => {
    await query(
      `UPDATE projects SET
         slug = $2, title = $3, page_title = $4, summary = $5, intro = $6, tags = $7,
         body = $8, website = $9, website_label = $10, vimeo_id = $11,
         external_only = $12, sort_order = $13, updated_at = now()
       WHERE id = $1`,
      [
        id,
        input.slug,
        input.title,
        input.page_title,
        input.summary,
        input.intro,
        input.tags,
        input.body,
        input.website,
        input.website_label,
        input.vimeo_id,
        input.external_only,
        input.sort_order,
      ],
    );

    // Only touch images when the form sent some; an edit that does not include
    // the image field should not silently detach what is already there.
    if (input.imageIds) {
      await query("DELETE FROM project_images WHERE project_id = $1", [id]);
      await attachProjectImages(id, input.imageIds);
    }
  });

  // An edit that detached an image can leave it referenced by nothing.
  await deleteOrphanedUploads();
}

async function attachProjectImages(projectId: number, mediaIds: number[]): Promise<void> {
  for (const [position, mediaId] of mediaIds.entries()) {
    await query(
      "INSERT INTO project_images (project_id, media_id, position) VALUES ($1,$2,$3)",
      [projectId, mediaId, position],
    );
  }
}

export async function deleteProject(id: number): Promise<void> {
  await query("DELETE FROM projects WHERE id = $1", [id]);
  // `project_images` cascades, but each `media` row carries the whole file in a
  // BYTEA column and would otherwise stay behind. Sweeps only what nothing at
  // all points at, so an image shared with another entry survives.
  await deleteOrphanedUploads();
}

/*
 * `isProjectMediaPublic` was removed on 14 August 2026. It was never called,
 * and its comment claimed it was "the same test as isMediaPublic, extended to
 * projects" when it was strictly narrower — it checked `project_images` and
 * nothing else. Anyone who had believed the comment and used it would have
 * 404'd every news photograph on the site. `isMediaPublic` covers projects
 * itself; there is one visibility test for images and this is not a second one.
 */

/** The same test for a downloadable document behind `/files/[id]`. */
export function isFilePublic(id: number): Promise<boolean> {
  return safeRead(
    async () => {
      const row = await queryOne<{ ok: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM finding_files ff
             JOIN findings f ON f.id = ff.finding_id AND f.published
           WHERE ff.file_id = $1
           UNION ALL
           SELECT 1 FROM publication_files pf
             JOIN publications p ON p.id = pf.publication_id AND p.published
           WHERE pf.file_id = $1
         ) AS ok`,
        [id],
      );
      return row?.ok ?? false;
    },
    false,
    "file visibility",
  );
}



/* ==========================================================================
 * TEAM
 * ==========================================================================
 * The people on the team page. Moved out of `content.ts` and into the database
 * on 13 August 2026 so that adding a colleague stops being a code change — see
 * migrations/008_team_and_page_images.sql.
 * ======================================================================== */

export type TeamMemberRow = {
  id: number;
  name: string;
  role: string;
  photo_media_id: number | null;
  photo_path: string | null;
  email: string | null;
  linkedin: string | null;
  sort_order: number;
  published: boolean;
};

const TEAM_COLUMNS = `
  id, name, role, photo_media_id, photo_path, email, linkedin, sort_order, published
`;

const TEAM_ORDER = "ORDER BY sort_order, id";

/**
 * The published team, for the public page.
 *
 * `ReadStatus` rather than a bare list for the usual reason: the page has to be
 * able to tell "nobody has been added yet" from "the database did not answer".
 */
export function listPublishedTeamStatus(
  site: Site = PLATFORM_SITE,
): Promise<ReadStatus<TeamMemberRow[]>> {
  return safeReadStatus(
    () =>
      query<TeamMemberRow>(
        `SELECT ${TEAM_COLUMNS} FROM team_members
         WHERE published AND project_key = $1
         ${TEAM_ORDER}`,
        [site],
      ),
    [],
    "team",
  );
}

/** Admin list: everyone, published or not. Deliberately not `safeRead`. */
export function listAllTeam(site: Site = PLATFORM_SITE): Promise<TeamMemberRow[]> {
  return query<TeamMemberRow>(
    `SELECT ${TEAM_COLUMNS} FROM team_members WHERE project_key = $1 ${TEAM_ORDER}`,
    [site],
  );
}

export function getTeamMember(id: number): Promise<TeamMemberRow | null> {
  return queryOne<TeamMemberRow>(
    `SELECT ${TEAM_COLUMNS} FROM team_members WHERE id = $1`,
    [id],
  );
}

/**
 * The position a new person takes when nobody says where they go.
 *
 * The end of the list, not the start. The form used to default the field to 0,
 * and 0 sorts first — so somebody added without a position landed above the
 * Director, which is not what "I did not fill that in" means.
 */
export async function nextTeamOrder(site: Site = PLATFORM_SITE): Promise<number> {
  const row = await queryOne<{ next: number }>(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM team_members WHERE project_key = $1",
    [site],
  );
  return row?.next ?? 1;
}

export type TeamMemberInput = {
  name: string;
  role: string;
  email: string | null;
  linkedin: string | null;
  sortOrder: number;
  published: boolean;
  /** Undefined leaves the existing portrait alone; a number replaces it. */
  photoMediaId?: number;
};

export async function createTeamMember(
  input: TeamMemberInput,
  site: Site = PLATFORM_SITE,
): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO team_members
       (project_key, name, role, email, linkedin, sort_order, published, photo_media_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [site, input.name, input.role, input.email, input.linkedin,
     input.sortOrder, input.published, input.photoMediaId ?? null],
  );
  return row!.id;
}

export async function updateTeamMember(id: number, input: TeamMemberInput): Promise<void> {
  /*
   * The portrait is updated only when a new one was uploaded. Writing
   * `photo_media_id = $8` unconditionally would clear the existing picture every
   * time somebody corrected a job title, because the form sends no file when
   * none was chosen.
   */
  await query(
    `UPDATE team_members
     SET name = $2, role = $3, email = $4, linkedin = $5,
         sort_order = $6, published = $7,
         photo_media_id = COALESCE($8, photo_media_id),
         updated_at = now()
     WHERE id = $1`,
    [id, input.name, input.role, input.email, input.linkedin,
     input.sortOrder, input.published, input.photoMediaId ?? null],
  );
}

export async function deleteTeamMember(id: number): Promise<void> {
  await query("DELETE FROM team_members WHERE id = $1", [id]);
}

/* ==========================================================================
 * PAGE IMAGES
 * ==========================================================================
 * Photographs attached to a named place on a page rather than to an entry —
 * the scrolling strip on the About page, for instance. `slot` names the place.
 * ======================================================================== */

/** The slots the admin offers. Anything else is refused rather than created. */
export const PAGE_IMAGE_SLOTS = {
  "about-collage": "About page — scrolling photographs",
  "about-lead": "About page — main picture",
} as const;

export type PageImageSlot = keyof typeof PAGE_IMAGE_SLOTS;

export function isPageImageSlot(value: string): value is PageImageSlot {
  return Object.prototype.hasOwnProperty.call(PAGE_IMAGE_SLOTS, value);
}

export type PageImage = {
  id: number;
  media_id: number;
  sort_order: number;
  alt: string;
};

export function listPageImages(
  slot: PageImageSlot,
  site: Site = PLATFORM_SITE,
): Promise<ReadStatus<PageImage[]>> {
  return safeReadStatus(
    () =>
      query<PageImage>(
        `SELECT pi.id, pi.media_id, pi.sort_order, m.alt
         FROM page_images pi JOIN media m ON m.id = pi.media_id
         WHERE pi.project_key = $1 AND pi.slot = $2
         ORDER BY pi.sort_order, pi.id`,
        [site, slot],
      ),
    [],
    "page images",
  );
}

export async function addPageImage(
  slot: PageImageSlot,
  mediaId: number,
  sortOrder: number,
  site: Site = PLATFORM_SITE,
): Promise<void> {
  await query(
    `INSERT INTO page_images (project_key, slot, media_id, sort_order)
     VALUES ($1, $2, $3, $4)`,
    [site, slot, mediaId, sortOrder],
  );
}

/** Deletes the row and, through the cascade, nothing else — the upload stays. */
export async function deletePageImage(id: number): Promise<void> {
  await query("DELETE FROM page_images WHERE id = $1", [id]);
}

export async function setPageImageOrder(id: number, sortOrder: number): Promise<void> {
  await query("UPDATE page_images SET sort_order = $2 WHERE id = $1", [id, sortOrder]);
}

/** The highest position in a slot, so a new upload lands at the end. */
export async function nextPageImageOrder(
  slot: PageImageSlot,
  site: Site = PLATFORM_SITE,
): Promise<number> {
  const row = await queryOne<{ next: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next
     FROM page_images WHERE project_key = $1 AND slot = $2`,
    [site, slot],
  );
  return row?.next ?? 0;
}
