"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NewsItem } from "@/lib/repo";
import styles from "./EventAnnouncement.module.css";

/**
 * The next upcoming event, announced on the home page with a countdown.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS NOT A MODAL
 * ---------------------------------------------------------------------------
 * The brief called this a pop-up. It is built as a dismissible panel anchored
 * to the bottom of the window rather than a `<dialog>` over the middle of the
 * page, for three reasons that all point the same way:
 *
 *  - A modal takes focus and makes the page behind it inert. Doing that to
 *    someone who arrived to read about the project, before they have read a
 *    word of it, is the pattern everyone closes without looking at.
 *  - It would land on the hero — the headline and the two calls to action —
 *    which is the one part of the page that must not be covered.
 *  - An event announcement is an offer, not a question. Nothing is blocked by
 *    ignoring it, so nothing should be blocked *while* ignoring it.
 *
 * It still behaves like a pop-up in the ways that matter: it appears over the
 * page, it announces itself, it counts down, and it can be dismissed.
 *
 * ---------------------------------------------------------------------------
 * DISMISSAL LASTS FOR THE PAGE VIEW, NOT FOR EVER
 * ---------------------------------------------------------------------------
 * Closing it hides it until the page is loaded again; a refresh brings it
 * back. That is the client's decision, made on 8 August 2026, and it is a
 * deliberate trade: the announcement is harder to ignore, which is the point of
 * it, at the cost of reappearing for someone who has already said no once.
 *
 * It used to remember the dismissal in `localStorage`, keyed by event id. If
 * that is ever wanted again, the two pieces are: read the key as the initial
 * value of `dismissed`, and write it in `dismiss()`. Keep the id in the key —
 * without it, dismissing one announcement would silence every future one.
 *
 * ---------------------------------------------------------------------------
 * A FULL EVENT IS NEVER ANNOUNCED
 * ---------------------------------------------------------------------------
 * `getNextUpcomingEvent` excludes events with no places left, so one should
 * never reach this component. The guard below is for the gap between an editor
 * marking an event full and a cached home page being rebuilt, where the panel
 * would otherwise still be inviting bookings that cannot be taken.
 */

type Remaining = { days: number; hours: number; minutes: number; seconds: number } | null;

/**
 * Milliseconds until the event starts, in the reader's own timezone.
 *
 * With a time set — `HH:MM` — the target is that moment on that day, so the
 * countdown ends when the event actually begins. With no time set it is
 * midnight at the start of the day, which is what it has always been and means
 * the panel stops showing once the day arrives; an editor who wants a countdown
 * that runs into the morning of the event should give it a start time.
 *
 * Built from the parts rather than `new Date("2026-08-20")`, which the spec
 * defines as *UTC* midnight — an hour or two out in Ireland, and a day out
 * either side of the date line.
 */
function millisecondsUntil(date: string, time: string | null): number {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return 0;
  const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];
  return (
    new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0).getTime() - Date.now()
  );
}

function split(ms: number): Remaining {
  if (ms <= 0) return null;
  const seconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export function EventAnnouncement({ event }: { event: NewsItem }) {
  /*
   * `null` until the first tick, which is what keeps this off the server.
   *
   * The countdown depends on the current time, which does not exist during
   * server rendering — rendering one there would produce markup that disagrees
   * with the client a moment later, which is a hydration error. With `now` null
   * on the server *and* on the first client render, both produce nothing, and
   * the panel appears on the first tick a second later. That second is not a
   * cost worth removing: an announcement that slides in just after the page has
   * settled is easier to take than one that is already there.
   *
   * The clock is set only from inside the interval callback. Setting it in the
   * effect body instead is what `react-hooks/set-state-in-effect` warns about,
   * and the warning is right — it is an extra render on every mount for a value
   * that is about to be replaced anyway.
   */
  const [now, setNow] = useState<number | null>(null);

  // Component state only, so it resets on every page load — see the note above.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const remaining: Remaining =
    now === null || !event.event_date
      ? null
      : split(millisecondsUntil(event.event_date, event.event_time));

  // No date, already started, dismissed, or full: nothing to announce.
  if (dismissed || !remaining || event.slots_filled) return null;

  const dismiss = () => setDismissed(true);

  const units = [
    { value: remaining.days, label: remaining.days === 1 ? "day" : "days" },
    { value: remaining.hours, label: remaining.hours === 1 ? "hour" : "hours" },
    { value: remaining.minutes, label: remaining.minutes === 1 ? "minute" : "minutes" },
    { value: remaining.seconds, label: remaining.seconds === 1 ? "second" : "seconds" },
  ];

  return (
    <aside
      className={styles.panel}
      aria-labelledby="event-announcement-title"
      /*
       * Announced politely, once, when it appears. `assertive` would interrupt
       * whatever a screen reader was already reading — which, on arriving at a
       * page, is the page.
       */
      role="status"
    >
      <div className={styles.body}>
        <p className={styles.eyebrow}>Upcoming event</p>
        <p id="event-announcement-title" className={styles.title}>
          {event.title}
        </p>
        <p className={styles.when}>
          {/* The hour matters most on the panel that is counting down to it. */}
          <time
            dateTime={
              event.event_date
                ? event.event_time
                  ? `${event.event_date}T${event.event_time}`
                  : event.event_date
                : undefined
            }
          >
            {formatEventDate(event.event_date)}
            {event.event_time ? `, ${event.event_time}` : ""}
            {event.event_time && event.event_end_time ? `–${event.event_end_time}` : ""}
          </time>
          {event.location ? <span> · {event.location}</span> : null}
        </p>

        {/*
         * The countdown is `aria-hidden` and the same information is given as
         * one sentence to assistive technology. A screen reader announcing four
         * separate numbers that change every second is unusable; the sentence
         * updates too, but it reads as a sentence.
         */}
        <p className="adflex-visually-hidden">
          {remaining.days > 0
            ? `${remaining.days} ${remaining.days === 1 ? "day" : "days"} until this event.`
            : `${remaining.hours} ${remaining.hours === 1 ? "hour" : "hours"} until this event.`}
        </p>
        <ol className={styles.countdown} aria-hidden="true">
          {units.map((unit) => (
            <li key={unit.label} className={styles.unit}>
              <span className={styles.number}>{String(unit.value).padStart(2, "0")}</span>
              <span className={styles.unitLabel}>{unit.label}</span>
            </li>
          ))}
        </ol>

        {/*
         * There is no "fully booked" state here any more. A full event is
         * filtered out before it reaches this component — see the note at the
         * top — and `/news` is where someone is told that it is full, in the
         * entry itself, rather than by a panel that interrupted them to say so.
         */}
        {event.booking_url ? (
          <p className={styles.action}>
            <a
              className="adflex-cta"
              href={event.booking_url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Book your place
            </a>
          </p>
        ) : (
          <p className={styles.action}>
            <Link className="adflex-link" href="/adflex/news">
              See the details
            </Link>
          </p>
        )}
      </div>

      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        aria-label={`Dismiss the announcement for ${event.title}`}
      >
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}

/** `YYYY-MM-DD` without building a Date, so no timezone can shift the day. */
function formatEventDate(iso: string | null): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const index = Number(month) - 1;
  return months[index] ? `${Number(day)} ${months[index]} ${year}` : iso;
}
