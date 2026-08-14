/**
 * Turning a stored date into words.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERY FUNCTION HERE READS THE DATE AT MIDDAY
 * ---------------------------------------------------------------------------
 * `published_on` and `event_date` are `DATE` columns, read out of Postgres as
 * plain `YYYY-MM-DD` strings by `to_char` — never as a `Date`, because `pg`
 * would map a `DATE` to midnight in the *server's* zone and an entry dated the
 * 1st would render as the 31st for anyone west of it.
 *
 * `new Date("2026-08-14")` has the same trap on the other side: the spec defines
 * a bare date string as **UTC** midnight, so formatting it in a zone behind UTC
 * moves it back a day. Appending `T12:00:00Z` puts the instant in the middle of
 * the day, which lands on the intended calendar date in every zone the site is
 * read in.
 *
 * This was written out three times in three files before it was collected here.
 * Each copy was correct; the risk was that the next person would fix one of them
 * and not the other two.
 */

const IRELAND = "Europe/Dublin";

const LONG = new Intl.DateTimeFormat("en-IE", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: IRELAND,
});

const SHORT_DAY = new Intl.DateTimeFormat("en-IE", {
	weekday: "short",
	day: "numeric",
	month: "long",
	timeZone: IRELAND,
});

/** Reads a `YYYY-MM-DD` string as the middle of that day. See the note above. */
function atMidday(iso: string): Date {
	return new Date(`${iso}T12:00:00Z`);
}

/** `14 August 2026` — the form used on cards, listings and entry pages. */
export function formatDate(iso: string): string {
	return LONG.format(atMidday(iso));
}

/** `Fri 14 August`, optionally with the time — used where the year is obvious. */
export function formatDayAndTime(iso: string, time: string | null): string {
	const day = SHORT_DAY.format(atMidday(iso));
	return time ? `${day} · ${time}` : day;
}

/**
 * Today in Ireland, as `YYYY-MM-DD`.
 *
 * The site's own day, not the host's — a server in another zone would otherwise
 * decide the date rolls over at the wrong moment. `en-CA` is used only because
 * its short format *is* `YYYY-MM-DD`, which makes the result directly comparable
 * with what an `<input type="date">` submits and with the values in the database.
 */
export function todayInIreland(): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: IRELAND,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());
}
