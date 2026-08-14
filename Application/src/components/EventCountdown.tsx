"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NewsItem } from "@/lib/repo";
import { formatDayAndTime } from "@/lib/dates";
import styles from "./EventCountdown.module.css";

type Remaining = { days: number; hours: number; minutes: number; seconds: number } | null;

/**
 * The next upcoming event, announced on the home page with a countdown.
 *
 * ---------------------------------------------------------------------------
 * IT COMES BACK ON EVERY VISIT, AND THAT IS THE POINT
 * ---------------------------------------------------------------------------
 * The dismissal lives in component state and nowhere else, so closing it lasts
 * until the page is reloaded. That was asked for directly: the panel exists to
 * get somebody to the event, and an event happens once.
 *
 * If it ever becomes a nuisance — a long-announced event and a returning
 * reader — the change is small and belongs here: read `localStorage` for the
 * initial value of `dismissed` and write it in `dismiss()`. **Key it by event
 * id**; without that, dismissing one announcement would silence every future
 * one, which is the failure that is impossible to notice.
 *
 * ---------------------------------------------------------------------------
 * IT DISAPPEARS WHEN THE EVENT STARTS, NOT WHEN IT ENDS
 * ---------------------------------------------------------------------------
 * The countdown is to the start time, so the panel stops the moment the event
 * begins — announcing something already under way, with a dead clock, is worse
 * than announcing nothing. The entry itself stays on News & Events either way.
 *
 * An event with no start time counts down to midnight at the beginning of its
 * day, so the panel stops once the day arrives.
 */

/**
 * Built from the parts rather than `new Date("2026-08-20")`, which the spec
 * defines as *UTC* midnight — an hour or two out in Ireland, and a whole day
 * out either side of the date line.
 */
function millisecondsUntil(date: string, time: string | null): number {
	const [year, month, day] = date.split("-").map(Number);
	if (!year || !month || !day) return 0;
	const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];
	return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0).getTime() - Date.now();
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

export default function EventCountdown({ event }: { event: NewsItem }) {
	/*
	 * `null` until the first tick, which is what keeps this off the server.
	 *
	 * The countdown depends on the current time, which does not exist during
	 * server rendering — rendering one there would produce markup that disagrees
	 * with the client a moment later, and that is a hydration error. With `now`
	 * null on the server *and* on the first client render, both produce nothing,
	 * and the panel arrives on the first tick a second later. That second is not
	 * worth removing: a panel that slides in just after the page has settled is
	 * easier to take than one that is already there.
	 */
	const [now, setNow] = useState<number | null>(null);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		const tick = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(tick);
	}, []);

	const remaining: Remaining =
		now === null || !event.event_date
			? null
			: split(millisecondsUntil(event.event_date, event.event_time));

	// No date, already started, dismissed, or full: nothing to announce. The
	// date check also narrows `event_date` to a string for the markup below.
	if (dismissed || !remaining || event.slots_filled || !event.event_date) return null;
	const eventDate = event.event_date;

	const units = [
		{ value: remaining.days, label: remaining.days === 1 ? "day" : "days" },
		{ value: remaining.hours, label: remaining.hours === 1 ? "hour" : "hours" },
		{ value: remaining.minutes, label: remaining.minutes === 1 ? "minute" : "minutes" },
		{ value: remaining.seconds, label: remaining.seconds === 1 ? "second" : "seconds" },
	];

	const href = event.slug ? `/${event.slug}` : "/news-events";

	return (
		<aside
			className={styles.panel}
			aria-labelledby="event-countdown-title"
			/*
			 * Announced politely, once, when it appears. `assertive` would interrupt
			 * whatever a screen reader was already reading — which, on arriving at a
			 * page, is the page.
			 */
			role="status"
		>
			<div className={styles.body}>
				<p className={styles.eyebrow}>Upcoming event</p>
				<p id="event-countdown-title" className={styles.title}>
					{event.title}
				</p>

				<p className={styles.when}>
					<time
						dateTime={
							event.event_time ? `${eventDate}T${event.event_time}` : eventDate
						}
					>
						{formatDayAndTime(eventDate, event.event_time)}
					</time>
					{event.location && <span className={styles.where}>{event.location}</span>}
				</p>

				<ul className={styles.clock}>
					{units.map((unit) => (
						<li key={unit.label}>
							{/* Tabular figures, or the panel jiggles once a second as the
							    digits change width. */}
							<span className={styles.number}>{String(unit.value).padStart(2, "0")}</span>
							<span className={styles.unit}>{unit.label}</span>
						</li>
					))}
				</ul>

				<p className={styles.actions}>
					{event.booking_url ? (
						<a
							className={styles.book}
							href={event.booking_url}
							target="_blank"
							rel="noopener noreferrer"
						>
							Book your place
						</a>
					) : (
						<Link className={styles.book} href={href}>
							See the details
						</Link>
					)}
				</p>
			</div>

			<button
				type="button"
				className={styles.close}
				onClick={() => setDismissed(true)}
				aria-label="Close this announcement"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M6 6l12 12M18 6L6 18" />
				</svg>
			</button>
		</aside>
	);
}

