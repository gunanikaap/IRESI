import type {
  FileRef,
  Finding,
  ImageSize,
  MediaRef,
  NewsItem,
  Publication,
} from "@/lib/repo";
import { doiUrl, fileKind, fileSize, isEvent } from "@/lib/repo";
import { Gallery } from "./Gallery";
import styles from "./PublishedList.module.css";

/**
 * Renders database-backed content on the public site.
 *
 * ---------------------------------------------------------------------------
 * EVERYTHING HERE IS TEXT, NEVER MARKUP
 * ---------------------------------------------------------------------------
 * The bodies come from a textarea in the admin. They are split on blank lines
 * into paragraphs and rendered as text nodes — no `dangerouslySetInnerHTML`, no
 * Markdown parser, no sanitiser. That is a deliberate ceiling on what an editor
 * can do: they get paragraphs and nothing else, and in exchange there is no
 * injection surface and no half-supported syntax leaking onto a public,
 * publicly funded site. If rich text is ever wanted, it needs a real editor and
 * a real sanitiser, not a `dangerouslySetInnerHTML` here.
 *
 * Images use a plain `<img>` rather than `next/image`, because they are served
 * from `/media/[id]` out of the database and we deliberately do not store pixel
 * dimensions. The fixed `aspect-ratio` frame in the stylesheet does the job
 * `width`/`height` would: it reserves the space so nothing shifts as they load.
 */

/** Splits a plain-text field into paragraphs on blank lines. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function Prose({ text, className }: { text: string; className: string }) {
  const blocks = paragraphs(text);
  if (blocks.length === 0) return null;
  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <p key={index}>{block}</p>
      ))}
    </div>
  );
}

/** Formats `YYYY-MM-DD` without building a Date, so no timezone can shift the day. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const index = Number(month) - 1;
  if (!months[index]) return iso;
  return `${Number(day)} ${months[index]} ${year}`;
}

/**
 * A date with its time after it — "10 August 2026, 14:30" — or the date alone
 * when no time has been set.
 *
 * Kept inside one `<time>` element rather than split into two, so the hour
 * cannot wrap onto its own line away from the day, and so the machine-readable
 * value is a single `2026-08-10T14:30` rather than two unrelated halves.
 *
 * The time is shown as stored, on a 24-hour clock. No timezone is printed
 * because none is stored: the project runs its events in one place, and 14:30
 * means 14:30 where the event is.
 */
function formatDateTime(
  iso: string,
  time: string | null,
  endTime: string | null = null,
): string {
  const date = formatDate(iso);
  if (time && endTime) return `${date}, ${time}–${endTime}`;
  if (time) return `${date}, ${time}`;
  // An end time with no start is possible only on a record typed in that way.
  // Saying "until 16:00" is honest about knowing one end of it and not the other.
  if (endTime) return `${date}, until ${endTime}`;
  return date;
}

/**
 * The `datetime` attribute for the pair above.
 *
 * Only the start is machine-readable. `datetime` holds one moment, and the
 * range syntax a calendar would want is not part of it — the visible text
 * carries the full span, and the attribute carries the moment the entry is
 * sorted and found by.
 */
function machineDateTime(iso: string, time: string | null): string {
  return time ? `${iso}T${time}` : iso;
}

/* --------------------------------------------------------------------------
 * Findings
 * ----------------------------------------------------------------------- */

/**
 * Which layout an entry takes.
 *
 * `large` stacks — images across the full width, text underneath — because a
 * chart that needs the width has nothing to sit beside. Everything else puts
 * the images in a column next to the text, `small` narrower than `medium`.
 * No images at all means the text takes the whole row.
 */
function entryClass(images: MediaRef[], size: ImageSize): string {
  if (images.length === 0) return `${styles.entry} ${styles.entryNoImage}`;
  if (size === "large") return `${styles.entry} ${styles.entryStacked}`;
  if (size === "small") return `${styles.entry} ${styles.entrySmallMedia}`;
  return styles.entry;
}

/** True when the images sit above the text rather than beside it. */
function isStacked(images: MediaRef[], size: ImageSize): boolean {
  return images.length > 0 && size === "large";
}

/**
 * The documents attached to an outcome, as download links.
 *
 * Each says what it is and how big it is before the reader commits to the
 * click — `/files/[id]` sends everything as an attachment, so following one
 * starts a download rather than opening a tab, and being told that first is the
 * difference between a considered click and a surprise.
 *
 * `download` on the anchor asks the browser to use the stored filename. The
 * route sets `Content-Disposition` regardless, so this is a hint, not the
 * mechanism.
 */
function Downloads({ files }: { files: FileRef[] }) {
  if (files.length === 0) return null;

  return (
    <ul className={styles.downloads}>
      {files.map((file) => (
        <li key={file.id}>
          <a className={`adflex-link ${styles.download}`} href={`/files/${file.id}`} download>
            {/*
             * The format is shown once, as the tag, and said once, in the
             * hidden text. Printing it in the tag *and* again beside the size
             * gave every link a stuttering "PDF … PDF, 214 KB"; leaving it out
             * of the accessible name altogether would have told a screen-reader
             * user the size of something without saying what it was.
             */}
            <span className={styles.downloadKind} aria-hidden="true">
              {fileKind(file.filename)}
            </span>
            <span>{file.label || file.filename}</span>
            <span className={styles.downloadSize}>
              <span className="adflex-visually-hidden">
                {fileKind(file.filename)} file,{" "}
              </span>
              {fileSize(file.byte_size)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function FindingList({ findings }: { findings: Finding[] }) {
  return (
    <ul className={styles.list}>
      {findings.map((finding) => {
        const gallery = <Gallery images={finding.images} size={finding.image_size} />;
        const heading = (
          <>
            {/* A real <time>, so the date is machine-readable as well as
                legible — the same treatment news entries get. */}
            <p className={styles.meta}>
              <time dateTime={finding.published_on}>
                {formatDate(finding.published_on)}
              </time>
            </p>
            <h3 className={styles.title}>{finding.title}</h3>
            {finding.summary ? <p className={styles.summary}>{finding.summary}</p> : null}
          </>
        );
        const detail = (
          <>
            <Prose text={finding.body} className={styles.body} />
            <Downloads files={finding.files} />
          </>
        );

        return (
          <li key={finding.id} className={entryClass(finding.images, finding.image_size)}>
            {/*
             * Stacked entries read heading, summary, picture, then the detail —
             * the shape of an article. A reader should know what they are
             * looking at before they look at it, and the long text belongs
             * after the thing it describes rather than before it.
             *
             * Beside-the-text layouts keep the image first with all the text in
             * one column, where the heading is already level with it.
             *
             * The order is set in the markup rather than with CSS, so what a
             * screen reader hears matches what the page shows.
             */}
            {isStacked(finding.images, finding.image_size) ? (
              <>
                <div className={styles.entryBody}>{heading}</div>
                {gallery}
                <div className={styles.entryDetail}>{detail}</div>
              </>
            ) : (
              <>
                {gallery}
                <div className={styles.entryBody}>
                  {heading}
                  {detail}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------------------------------------------------------
 * Publications
 * ----------------------------------------------------------------------- */

export function PublicationList({ publications }: { publications: Publication[] }) {
  return (
    <ul className={styles.publications}>
      {publications.map((publication) => (
        <li key={publication.id} className={styles.publication}>
          <p className={styles.meta}>
            <time dateTime={publication.published_on}>
              {formatDate(publication.published_on)}
            </time>
          </p>
          <h3 className={styles.publicationTitle}>{publication.title}</h3>

          {publication.authors || publication.venue || publication.year ? (
            <p className={styles.publicationMeta}>
              {[publication.authors, publication.venue, publication.year?.toString()]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}

          {/*
           * The link leads, the DOI follows.
           *
           * The DOI used to be rendered as its own full doi.org URL used as the
           * link text, which set a 40-character machine string as the most
           * prominent thing under the title. It is now a short labelled link,
           * and the plain link — the ordinary way to reach a publication —
           * comes first. Either, both or neither may be present.
           */}
          {publication.url || publication.doi ? (
            <p className={styles.links}>
              {publication.url ? (
                <a
                  className="adflex-link"
                  href={publication.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Read the paper
                </a>
              ) : null}
              {publication.doi ? (
                <a
                  className={`adflex-link ${styles.doi}`}
                  href={doiUrl(publication.doi)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  DOI: {publication.doi}
                </a>
              ) : null}
            </p>
          ) : null}

          <Downloads files={publication.files} />
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------------------
 * News and events
 * ----------------------------------------------------------------------- */

/*
 * `isUpcoming(eventDate)` used to live here, comparing the event's date against
 * today's. It was removed on 12 August 2026: every caller now reads `expired`,
 * which the database computes from the event's **end time** in the project's
 * timezone. The old test was a day too coarse — a morning event stayed
 * "Upcoming", and kept offering bookings, until midnight — and it derived the
 * answer twice, once here and once in SQL, which is how the two came to
 * disagree.
 */

/**
 * What a reader can do about an event: book a place, or be told it is full.
 *
 * Only shown while the event is still to come. A booking button on an event
 * that happened last month is worse than no button — it sends someone to a
 * page that will either take a booking for nothing or confuse them.
 */
function EventBooking({ item }: { item: NewsItem }) {
  /*
   * Only an upcoming event, and only while it is still to come. The kind says
   * what the editor intended; the clock has the final word, so an event that
   * passes stops offering a booking link on its own.
   *
   * `item.expired` rather than the date: it is computed by the database from
   * the event's *end time* in the project's timezone, so a morning event stops
   * taking bookings at lunchtime instead of at midnight.
   */
  if (item.kind !== "upcoming" || item.expired) return null;

  if (item.slots_filled) {
    return (
      <p className={styles.slotsFull}>
        <strong>Fully booked.</strong> There are no places left for this event.
      </p>
    );
  }

  if (!item.booking_url) return null;

  return (
    <p className={styles.booking}>
      <a
        className="adflex-cta"
        href={item.booking_url}
        target="_blank"
        rel="noreferrer noopener"
      >
        Book your place
      </a>
    </p>
  );
}

/**
 * What happened at the event, and where to watch it.
 *
 * Only once the event is over. An editor can write both at any time — an event
 * typed up weeks after the fact is entered in one sitting — so the decision
 * about when a reader sees them is made here rather than in the form.
 *
 * "Over" means `expired` for an upcoming event, and always, for an event
 * recorded as already held. Between them those cover every event on the page,
 * so a write-up is never withheld from an entry that has no clock to wait for.
 *
 * Renders nothing at all when there is nothing to say, which is the state every
 * event is in until someone writes it up.
 */
function AfterEvent({ item }: { item: NewsItem }) {
  const over = item.kind === "event" || item.expired;
  if (!over || (!item.event_outcome && !item.event_video_url)) return null;

  return (
    <div className={styles.afterEvent}>
      <h4 className={styles.afterEventTitle}>How it went</h4>
      {item.event_outcome ? (
        <Prose text={item.event_outcome} className={styles.body} />
      ) : null}
      {item.event_video_url ? (
        <p className={styles.recording}>
          <a href={item.event_video_url} target="_blank" rel="noreferrer noopener">
            Watch the recording
          </a>
        </p>
      ) : null}
    </div>
  );
}

/**
 * `showKind` adds a News/Event pill to each entry.
 *
 * Off by default because `/news` now groups entries under their own "Events"
 * and "News" headings, which says the same thing once instead of on every row.
 * Turn it on for any future list that mixes the two.
 */
export function NewsList({
  items,
  showKind = false,
}: {
  items: NewsItem[];
  showKind?: boolean;
}) {
  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const gallery = <Gallery images={item.images} size={item.image_size} />;
        const heading = (
          <>
            <p className={styles.meta}>
              {showKind ? (
                <span className={styles.kind}>
                  {isEvent(item.kind) ? "Event" : "News"}
                </span>
              ) : null}
              {/* A real <time> element, so the date is machine-readable as well
                  as legible. An event leads with when it happens; a news post
                  leads with when it was posted. */}
              {isEvent(item.kind) && item.event_date ? (
                <time dateTime={machineDateTime(item.event_date, item.event_time)}>
                  {formatDateTime(item.event_date, item.event_time, item.event_end_time)}
                </time>
              ) : (
                <time dateTime={item.published_on}>{formatDate(item.published_on)}</time>
              )}
              {item.location ? <span>{item.location}</span> : null}
              {/*
                * Which events are still to come, and which have happened.
                *
                * Both labels, since 12 August 2026. A past event used to be
                * taken off the page when it ended, so "Upcoming" or nothing
                * meant "upcoming or news". Now that events stay, a reader
                * scanning the list would otherwise have to work the answer out
                * from the dates.
                */}
              {isEvent(item.kind) ? (
                item.kind === "upcoming" && !item.expired ? (
                  <span className={styles.upcoming}>Upcoming</span>
                ) : (
                  <span className={styles.past}>Past event</span>
                )
              ) : null}
            </p>

            <h3 className={styles.title}>{item.title}</h3>
            {item.summary ? <p className={styles.summary}>{item.summary}</p> : null}
          </>
        );
        const detail = (
          <>
            <Prose text={item.body} className={styles.body} />
            <EventBooking item={item} />
            <AfterEvent item={item} />
          </>
        );

        return (
          <li key={item.id} className={entryClass(item.images, item.image_size)}>
            {/* Heading and summary above the pictures, detail below them — see
                the note in FindingList. */}
            {isStacked(item.images, item.image_size) ? (
              <>
                <div className={styles.entryBody}>{heading}</div>
                {gallery}
                <div className={styles.entryDetail}>{detail}</div>
              </>
            ) : (
              <>
                {gallery}
                <div className={styles.entryBody}>
                  {heading}
                  {detail}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
