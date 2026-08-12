import "server-only";

import { query, queryOne, safeRead, safeReadStatus, type ReadStatus } from "./db";

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

export function listPublishedFindingsStatus(): Promise<ReadStatus<Finding[]>> {
  return safeReadStatus(
    () =>
      query<Finding>(`
        SELECT ${FINDING_COLUMNS}
        FROM findings f
        WHERE f.published
        ORDER BY f.sort_order, f.created_at DESC
      `),
    [],
    "findings",
  );
}

export function listAllFindings(): Promise<Finding[]> {
  return query<Finding>(`
    SELECT ${FINDING_COLUMNS}
    FROM findings f
    ORDER BY f.sort_order, f.created_at DESC
  `);
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

export async function createFinding(input: FindingInput): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO findings (title, summary, body, published, sort_order, image_size)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [input.title, input.summary, input.body, input.published, input.sortOrder, input.imageSize],
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

export function listPublishedPublicationsStatus(): Promise<ReadStatus<Publication[]>> {
  return safeReadStatus(
    () =>
      query<Publication>(`
        SELECT ${PUBLICATION_COLUMNS}
        FROM publications p
        WHERE p.published
        ORDER BY p.sort_order, p.year DESC NULLS LAST, p.title
      `),
    [],
    "publications",
  );
}

export function listAllPublications(): Promise<Publication[]> {
  return query<Publication>(`
    SELECT ${PUBLICATION_COLUMNS} FROM publications p
    ORDER BY p.sort_order, p.year DESC NULLS LAST, p.title
  `);
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

export async function createPublication(input: PublicationInput): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO publications (title, authors, venue, year, doi, url, published, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [input.title, input.authors, input.venue, input.year, input.doi, input.url, input.published, input.sortOrder],
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
export function listPublishedNewsStatus(): Promise<ReadStatus<NewsItem[]>> {
  return safeReadStatus(
    () =>
      query<NewsItem>(`
        SELECT ${NEWS_COLUMNS}
        FROM news_items n
        WHERE n.published
        ${NEWS_ORDER}
      `),
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
export function getNextUpcomingEvent(): Promise<NewsItem | null> {
  return safeRead(
    () =>
      queryOne<NewsItem>(`
        SELECT ${NEWS_COLUMNS}
        FROM news_items n
        WHERE n.published
          AND n.kind = 'upcoming'
          AND NOT n.slots_filled
          AND n.event_date IS NOT NULL
          AND ${EVENT_START} > ${PROJECT_NOW}
        ORDER BY ${EVENT_START}, n.id
        LIMIT 1
      `),
    null,
    "next event",
  );
}

/**
 * Everything, for the admin — including expired events, which the public list
 * drops. An editor has to be able to see what has fallen off the page in order
 * to do anything about it.
 */
export function listAllNews(): Promise<NewsItem[]> {
  return query<NewsItem>(`
    SELECT ${NEWS_COLUMNS}
    FROM news_items n
    ${NEWS_ORDER}
  `);
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

export async function createNewsItem(input: NewsInput): Promise<number> {
  // `published_on` is omitted so the column's CURRENT_DATE default applies.
  const row = await queryOne<{ id: number }>(
    `INSERT INTO news_items
       (kind, title, summary, body, event_date, location, published, image_size,
        booking_url, slots_filled, event_time, event_end_time, sort_order,
        event_outcome, event_video_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
    [input.kind, input.title, input.summary, input.body,
     input.eventDate, input.location, input.published, input.imageSize,
     input.bookingUrl, input.slotsFilled, input.eventTime, input.eventEndTime,
     input.sortOrder, input.eventOutcome, input.eventVideoUrl],
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
         event_outcome = $15, event_video_url = $16,
         updated_at = now()
     WHERE id = $1`,
    [id, input.kind, input.title, input.summary, input.body,
     input.eventDate, input.location, input.published, input.imageSize,
     input.bookingUrl, input.slotsFilled, input.eventTime, input.eventEndTime,
     input.sortOrder, input.eventOutcome, input.eventVideoUrl],
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
export type PublishableTable = "findings" | "publications" | "news_items";

const PUBLISHABLE: readonly PublishableTable[] = ["findings", "publications", "news_items"];

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
};

/** Stored as newline-separated text; empty lines are not entries. */
function splitLines(value: string | null): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type ProjectRow = Omit<Project, "intro" | "tags"> & { intro: string; tags: string };

const PROJECT_COLUMNS = `
  id, slug, title, page_title, summary, intro, tags, body,
  card_image, hero_image, card_media_id, hero_media_id,
  website, website_label, vimeo_id, external_only,
  published, sort_order, to_char(published_on, 'YYYY-MM-DD') AS published_on
`;

function toProject(row: ProjectRow): Project {
  return { ...row, intro: splitLines(row.intro), tags: splitLines(row.tags) };
}

/**
 * Projects for the public listing, newest-arranged-first within `sort_order`.
 *
 * Returns `{ data, degraded }` rather than a bare array. An empty list is also
 * what the page shows when nothing has been published, so a database that
 * blinked would otherwise tell visitors the centre runs no projects. Every
 * public read must distinguish "there is nothing" from "I could not find out".
 */
export function listPublishedProjectsStatus(): Promise<ReadStatus<Project[]>> {
  return safeReadStatus(
    async () => {
      const rows = await query<ProjectRow>(
        `SELECT ${PROJECT_COLUMNS} FROM projects
         WHERE published
         ORDER BY sort_order, created_at DESC`,
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
export function getPublishedNewsBySlug(slug: string): Promise<NewsItem | null> {
  return safeRead(
    async () =>
      (await queryOne<NewsItem>(
        `SELECT ${NEWS_COLUMNS} FROM news_items n WHERE n.slug = $1 AND n.published`,
        [slug],
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

/** One published project by its address. Used by `/[slug]`. */
export function getPublishedProjectBySlug(slug: string): Promise<Project | null> {
  return safeRead(
    async () => {
      const row = await queryOne<ProjectRow>(
        `SELECT ${PROJECT_COLUMNS} FROM projects WHERE slug = $1 AND published`,
        [slug],
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

/** The same test as `isMediaPublic`, extended to images attached to projects. */
export function isProjectMediaPublic(id: number): Promise<boolean> {
  return safeRead(
    async () => {
      const row = await queryOne<{ ok: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM project_images pi
             JOIN projects p ON p.id = pi.project_id AND p.published
           WHERE pi.media_id = $1
         ) AS ok`,
        [id],
      );
      return row?.ok ?? false;
    },
    false,
    "project media visibility",
  );
}

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


