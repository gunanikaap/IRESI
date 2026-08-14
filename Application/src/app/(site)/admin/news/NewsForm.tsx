"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { saveNewsItem, type ActionState } from "../actions";
import { Field, FormError } from "@/components/admin/Field";
import type { NewsItem } from "@/lib/repo";
import styles from "../admin.module.css";

const initial: ActionState = {};

/**
 * Today as `YYYY-MM-DD`, which is the format a date input wants for `min`.
 *
 * The reader's own clock, not the server's — this only feeds the picker, and a
 * picker should agree with the calendar on the machine it is drawn on. The
 * authoritative check is in `saveNewsItem`, against Dublin.
 */
function today(): string {
	return new Intl.DateTimeFormat("en-CA", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());
}

/**
 * One form for a news post and for an event.
 *
 * The two are the same entry with different fields filled in, so they share a
 * form rather than having one each: an announcement that turns out to have a
 * date should not have to be retyped as a different kind of thing. Choosing
 * "Event" reveals the date, time, place and booking fields — hidden rather than
 * absent, so nothing an editor already typed is lost by changing their mind.
 *
 * `site` decides which site the entry belongs to. It is a hidden field because
 * the answer is the section of the admin you are in, not a choice to make while
 * writing — and the action checks it against the configured projects anyway.
 */
export default function NewsForm({
	entry,
	site,
	backHref,
}: {
	entry?: NewsItem;
	site: string;
	backHref: string;
}) {
	const [state, action, pending] = useActionState(saveNewsItem, initial);
	const [kind, setKind] = useState<string>(state.values?.kind ?? entry?.kind ?? "news");

	const keep = (name: string, fallback: string | number | null | undefined) =>
		state.values?.[name] ?? (fallback == null ? "" : String(fallback));

	const err = (name: string) => state.fieldErrors?.[name];
	const isEventKind = kind === "event" || kind === "upcoming";

	// Stored as one ordered list, banner first. See `saveNewsItem`.
	const banner = entry?.images[0];
	const gallery = entry?.images.slice(1) ?? [];

	return (
		<form action={action}>
			<FormError message={state.error} />

			{entry && <input type="hidden" name="id" value={entry.id} />}
			<input type="hidden" name="site" value={site} />

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>What this is</h2>
				</div>

				<Field
					name="kind"
					label="Type of entry"
					required
					error={err("kind")}
					hint="An upcoming event can take bookings and is counted down to on the home page. A past event stays on the website as a record."
				>
					<select
						id="kind"
						name="kind"
						value={kind}
						onChange={(event) => setKind(event.target.value)}
					>
						<option value="news">News post</option>
						<option value="upcoming">Event — still to come</option>
						<option value="event">Event — already happened</option>
					</select>
				</Field>

				<Field name="title" label="Title" required error={err("title")}
					hint="Shown on the listing card and as the page heading.">
					<input type="text" id="title" name="title" defaultValue={keep("title", entry?.title)} required />
				</Field>

				<Field name="slug" label="Web address" error={err("slug")}
					hint={
						entry?.slug
							? `Currently /${entry.slug}. Changing this breaks any link already shared — leave it alone unless you have a reason.`
							: "Leave empty and one is built from the title. Lower-case letters, numbers and hyphens only."
					}>
					<input type="text" id="slug" name="slug" defaultValue={keep("slug", entry?.slug)} />
				</Field>

				<Field name="summary" label="One-line summary" required error={err("summary")}
					hint="One or two sentences. This is what the listing card shows.">
					<textarea id="summary" name="summary" rows={3} defaultValue={keep("summary", entry?.summary)} required />
				</Field>

				<Field name="body" label="Main text" error={err("body")}
					hint="Start a line with ## for a heading, or - for a bullet. Leave a blank line to start a new paragraph. Inside a line, [words](https://example.com) makes a link, **words** is bold and #Tags are highlighted.">
					<textarea id="body" name="body" rows={14} defaultValue={keep("body", entry?.body)} />
				</Field>

			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>Pictures</h2>
				</div>

				<p className={styles.panelNote}>
					The banner is the wide photograph behind the title at the top of the page, and is also
					the picture on the listing card. Everything else appears as a gallery below the text.
					Each is uploaded separately, and leaving one empty leaves that part as it is.
				</p>

				{banner && (
					<p className={styles.entryMeta}>
						Current banner:{" "}
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={`/media/${banner.id}`}
							alt=""
							width={160}
							height={100}
							style={{ width: 160, height: 100, objectFit: "cover", verticalAlign: "middle" }}
						/>
					</p>
				)}

				<Field
					name="banner"
					label={banner ? "Replace the banner picture" : "Banner picture"}
					error={err("banner")}
					hint="JPEG, PNG or WebP. A wide photograph works best — it is cropped to a band behind the title."
				>
					<input type="file" id="banner" name="banner" accept="image/jpeg,image/png,image/webp" />
				</Field>

				{gallery.length > 0 && (
					<p className={styles.entryMeta}>
						{gallery.length} further {gallery.length === 1 ? "picture" : "pictures"} attached.
						Choosing new ones replaces them.
					</p>
				)}

				<Field
					name="images"
					label={gallery.length > 0 ? "Replace the other pictures" : "Other pictures"}
					error={err("images")}
					hint="Shown as a gallery below the text, and enlargeable. You can choose several at once."
				>
					<input
						type="file"
						id="images"
						name="images"
						accept="image/jpeg,image/png,image/webp"
						multiple
					/>
				</Field>
			</div>

			{/*
			 * Hidden rather than unmounted. An editor who picks "Event", fills in the
			 * date and then switches back to "News post" to reword the title would
			 * otherwise lose the date, and would have no way of knowing it happened.
			 */}
			<div className={styles.panel} hidden={!isEventKind}>
				<div className={styles.panelHeading}>
					<h2>When and where</h2>
				</div>

				{/*
				 * `min` stops the browser accepting a past day for an event still to
				 * come, so the mistake is caught in the picker rather than on save.
				 * It is a convenience, not the guard — the action checks the same
				 * thing, because a form value can be anything by the time it arrives.
				 */}
				<Field
					name="event_date"
					label="Date"
					required={isEventKind}
					error={err("event_date")}
					hint={
						kind === "upcoming"
							? "The day the event takes place. It has to be today or later — pick “Event — already happened” for one that is over."
							: "The day the event took place."
					}
				>
					<input
						type="date"
						id="event_date"
						name="event_date"
						min={kind === "upcoming" ? today() : undefined}
						defaultValue={keep("event_date", entry?.event_date)}
					/>
				</Field>

				<Field name="event_time" label="Start time" error={err("event_time")}
					hint="Leave empty if the time is not settled yet.">
					<input type="time" id="event_time" name="event_time" defaultValue={keep("event_time", entry?.event_time)} />
				</Field>

				<Field name="event_end_time" label="End time" error={err("event_end_time")}
					hint="An upcoming event moves to “past” once this time passes. Without it, the entry is treated as still to come all day.">
					<input type="time" id="event_end_time" name="event_end_time" defaultValue={keep("event_end_time", entry?.event_end_time)} />
				</Field>

				<Field name="location" label="Place" error={err("location")}
					hint="Where it happens — a room, a building, or “Online”.">
					<input type="text" id="location" name="location" defaultValue={keep("location", entry?.location)} />
				</Field>

				<Field name="booking_url" label="Booking link" error={err("booking_url")}
					hint="Where people register. Include https://. Leave empty if there is nothing to book.">
					<input type="url" id="booking_url" name="booking_url" defaultValue={keep("booking_url", entry?.booking_url)} />
				</Field>

				<div className={styles.checkboxField}>
					<input
						type="checkbox"
						id="slots_filled"
						name="slots_filled"
						defaultChecked={
							state.values ? state.values.slots_filled === "on" : Boolean(entry?.slots_filled)
						}
					/>
					<label htmlFor="slots_filled">
						<strong>Fully booked</strong>
						<span>
							The event still appears in the list, marked as full, but stops being announced on
							the home page — that panel exists to get someone to book.
						</span>
					</label>
				</div>

				<Field name="event_outcome" label="What happened" error={err("event_outcome")}
					hint="Written after the event. Only shown once the event is over.">
					<textarea id="event_outcome" name="event_outcome" rows={5} defaultValue={keep("event_outcome", entry?.event_outcome)} />
				</Field>

				<Field name="event_video_url" label="Recording" error={err("event_video_url")}
					hint="A link to a recording, if there is one. Only shown once the event is over.">
					<input type="url" id="event_video_url" name="event_video_url" defaultValue={keep("event_video_url", entry?.event_video_url)} />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>How it appears</h2>
				</div>

				<Field name="image_size" label="Picture size" error={err("image_size")}
					hint="How large the photographs are drawn on the entry's own page.">
					<select id="image_size" name="image_size" defaultValue={keep("image_size", entry?.image_size ?? "medium")}>
						<option value="small">Small — a portrait or a detail</option>
						<option value="medium">Medium — the usual column width</option>
						<option value="large">Large — full width, for a chart or diagram</option>
					</select>
				</Field>

				<Field name="sort_order" label="Position in the list" error={err("sort_order")}
					hint="Lower numbers appear first. Leave at 0 to order by date.">
					<input type="number" id="sort_order" name="sort_order" step={1} defaultValue={keep("sort_order", entry?.sort_order ?? 0)} />
				</Field>

				<div className={styles.checkboxField}>
					<input
						type="checkbox"
						id="published"
						name="published"
						defaultChecked={
							state.values ? state.values.published === "on" : Boolean(entry?.published)
						}
					/>
					<label htmlFor="published">
						<strong>Publish this</strong>
						<span>
							Until this is ticked the entry is a draft: saved here, and not on the website.
						</span>
					</label>
				</div>
			</div>

			<div className={styles.formActions}>
				<button className="button" type="submit" disabled={pending}>
					{pending ? "Saving…" : entry ? "Save changes" : "Create entry"}
				</button>
				<Link href={backHref}>Cancel</Link>
			</div>
		</form>
	);
}
