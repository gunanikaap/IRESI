"use client";

import Link from "next/link";
import { useActionState } from "react";
import { savePublication, type ActionState } from "../../actions";
import { Field, FormError } from "@/components/admin/Field";
import type { Publication } from "@/lib/repo";
import styles from "../../admin.module.css";

const initial: ActionState = {};

/**
 * A paper, listed on the ADFLEX Outcomes page beside the findings.
 *
 * Only the title is required. A project's output includes conference talks and
 * reports that have no DOI and no page of their own, and a form that insisted on
 * one would push an editor into inventing a link — which is worse than leaving
 * it out.
 */
export default function PublicationForm({
	publication,
	site,
	backHref,
}: {
	publication?: Publication;
	site: string;
	backHref: string;
}) {
	const [state, action, pending] = useActionState(savePublication, initial);

	const keep = (name: string, fallback: string | number | null | undefined) =>
		state.values?.[name] ?? (fallback == null ? "" : String(fallback));

	const err = (name: string) => state.fieldErrors?.[name];
	const files = publication?.files ?? [];

	return (
		<form action={action}>
			<FormError message={state.error} />

			{publication && <input type="hidden" name="id" value={publication.id} />}
			<input type="hidden" name="site" value={site} />

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>The paper</h2>
				</div>

				<Field name="title" label="Title" required error={err("title")}
					hint="The title of the paper, chapter or report.">
					<input type="text" id="title" name="title" defaultValue={keep("title", publication?.title)} required />
				</Field>

				<Field name="authors" label="Authors" error={err("authors")}
					hint="As they should be cited — for example “Pallonetto, F., Fahy, A.”.">
					<input type="text" id="authors" name="authors" defaultValue={keep("authors", publication?.authors)} />
				</Field>

				<Field name="venue" label="Journal or conference" error={err("venue")}
					hint="Where it appeared. Leave empty for something unpublished, such as a project report.">
					<input type="text" id="venue" name="venue" defaultValue={keep("venue", publication?.venue)} />
				</Field>

				<Field name="year" label="Year" error={err("year")}
					hint="Four digits. Leave empty if it has not appeared yet.">
					<input type="number" id="year" name="year" step={1} min={1900} max={2200}
						defaultValue={keep("year", publication?.year)} />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>Where to find it</h2>
				</div>

				<p className={styles.panelNote}>
					Both of these are optional, and independently so. A paper with neither is listed with
					its citation and no link, which is better than a link that goes nowhere.
				</p>

				<Field name="doi" label="DOI" error={err("doi")}
					hint="Looks like 10.1234/abcd. A full doi.org link is fine too — it is tidied up on save.">
					<input type="text" id="doi" name="doi" defaultValue={keep("doi", publication?.doi)}
						placeholder="10.1234/abcd" />
				</Field>

				<Field name="url" label="Link" error={err("url")}
					hint="A page where the paper can be read, if it has one. Include https://">
					<input type="url" id="url" name="url" defaultValue={keep("url", publication?.url)} />
				</Field>

				{files.length > 0 && (
					<p className={styles.entryMeta}>
						{files.length} {files.length === 1 ? "file" : "files"} attached:{" "}
						{files.map((file) => file.label || file.filename).join(", ")}
					</p>
				)}

				<Field name="files" label={files.length > 0 ? "Replace the file" : "Attach a file"}
					error={err("files")}
					hint="A PDF of the paper, where the project is free to host it. Leaving this empty keeps whatever is already attached.">
					<input type="file" id="files" name="files" multiple />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>How it appears</h2>
				</div>

				<Field name="sort_order" label="Position in the list" error={err("sort_order")}
					hint="Lower numbers appear first. Leave at 0 to order by year, newest first.">
					<input type="number" id="sort_order" name="sort_order" step={1}
						defaultValue={keep("sort_order", publication?.sort_order ?? 0)} />
				</Field>

				<div className={styles.checkboxField}>
					<input
						type="checkbox"
						id="published"
						name="published"
						defaultChecked={
							state.values ? state.values.published === "on" : Boolean(publication?.published)
						}
					/>
					<label htmlFor="published">
						<strong>Publish this</strong>
						<span>Until this is ticked it is a draft: saved here, and not on the ADFLEX site.</span>
					</label>
				</div>
			</div>

			<div className={styles.formActions}>
				<button className="button" type="submit" disabled={pending}>
					{pending ? "Saving…" : publication ? "Save changes" : "Add publication"}
				</button>
				<Link href={backHref}>Cancel</Link>
			</div>
		</form>
	);
}
