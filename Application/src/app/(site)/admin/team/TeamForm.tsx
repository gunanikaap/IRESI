"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveTeamMember, type ActionState } from "../actions";
import { Field, FormError } from "@/components/admin/Field";
import type { TeamMemberRow } from "@/lib/repo";
import styles from "../admin.module.css";

const initial: ActionState = {};

export default function TeamForm({ member }: { member?: TeamMemberRow }) {
	const [state, action, pending] = useActionState(saveTeamMember, initial);

	const keep = (name: string, fallback: string | number | null | undefined) =>
		state.values?.[name] ?? (fallback == null ? "" : String(fallback));

	const err = (name: string) => state.fieldErrors?.[name];

	const currentPhoto = member?.photo_media_id
		? `/media/${member.photo_media_id}`
		: member?.photo_path ?? null;

	return (
		<form action={action}>
			<FormError message={state.error} />

			{member && <input type="hidden" name="id" value={member.id} />}

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>Who they are</h2>
				</div>

				<Field name="name" label="Name" required error={err("name")}
					hint="As it should appear on the page, including any title — for example “Prof. Fabiano Pallonetto”.">
					<input type="text" id="name" name="name" defaultValue={keep("name", member?.name)} required />
				</Field>

				<Field name="role" label="Role" error={err("role")}
					hint="Their position in the centre — “Director”, “Postdoctoral Researcher”, and so on.">
					<input type="text" id="role" name="role" defaultValue={keep("role", member?.role)} />
				</Field>

				<Field name="email" label="Email address" error={err("email")}
					hint="Shown as an envelope icon beside their name. Leave empty to show no email.">
					<input type="email" id="email" name="email" defaultValue={keep("email", member?.email)} />
				</Field>

				<Field name="linkedin" label="LinkedIn profile" error={err("linkedin")}
					hint="The full address of their profile, starting with https://. Leave empty to show no link.">
					<input type="url" id="linkedin" name="linkedin" defaultValue={keep("linkedin", member?.linkedin)} />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>Photograph</h2>
				</div>

				{currentPhoto && (
					<p className={styles.entryMeta}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={currentPhoto}
							alt=""
							width={96}
							height={96}
							style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "50%" }}
						/>
					</p>
				)}

				<Field name="photo" label={currentPhoto ? "Replace the photograph" : "Photograph"} error={err("photo")}
					hint="JPEG, PNG or WebP. A square picture works best — the page crops to a circle. Choosing nothing leaves the current photograph in place.">
					<input type="file" id="photo" name="photo" accept="image/jpeg,image/png,image/webp" />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>How they appear</h2>
				</div>

				{/*
				 * Empty by default for a new person, and that is the point: an empty
				 * field means "at the end", which is what the action does with it.
				 * It used to default to 0, and 0 sorts first — so a colleague added
				 * without a position appeared above the Director.
				 */}
				<Field name="sort_order" label="Position in the list" error={err("sort_order")}
					hint="Lower numbers appear first — the Director is 1. Leave it empty and they are added at the end of the list.">
					<input
						type="number"
						id="sort_order"
						name="sort_order"
						step={1}
						placeholder="Added at the end"
						defaultValue={keep("sort_order", member?.sort_order)}
					/>
				</Field>

				<div className={styles.checkboxField}>
					<input
						type="checkbox"
						id="published"
						name="published"
						/* New people default to shown: somebody added to the team page is
						   almost always meant to be on it, and the alternative is adding a
						   colleague and quietly seeing nothing change. */
						defaultChecked={
							state.values ? state.values.published === "on" : member ? member.published : true
						}
					/>
					<label htmlFor="published">
						<strong>Show on the team page</strong>
						<span>
							Untick to keep the entry here without it appearing publicly — useful for somebody
							who has not started yet.
						</span>
					</label>
				</div>
			</div>

			<div className={styles.formActions}>
				<button className="button" type="submit" disabled={pending}>
					{pending ? "Saving…" : member ? "Save changes" : "Add to the team"}
				</button>
				<Link href="/admin/team">Cancel</Link>
			</div>
		</form>
	);
}
