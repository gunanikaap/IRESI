"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveFinding, type ActionState } from "../../actions";
import { Field, FormError } from "@/components/admin/Field";
import type { Finding } from "@/lib/repo";
import styles from "../../admin.module.css";

const initial: ActionState = {};

/**
 * One form for writing and editing an ADFLEX project outcome.
 *
 * The same shape as the news form, deliberately: an editor who has added a news
 * post should not have to learn a second set of habits to add an outcome. The
 * one thing outcomes have that news does not is attached documents — a report or
 * a dataset — which is why there is a file field as well as a picture field.
 */
export default function OutcomeForm({
	outcome,
	site,
	backHref,
}: {
	outcome?: Finding;
	site: string;
	backHref: string;
}) {
	const [state, action, pending] = useActionState(saveFinding, initial);

	const keep = (name: string, fallback: string | number | null | undefined) =>
		state.values?.[name] ?? (fallback == null ? "" : String(fallback));

	const err = (name: string) => state.fieldErrors?.[name];

	const images = outcome?.images ?? [];
	const files = outcome?.files ?? [];

	return (
		<form action={action}>
			<FormError message={state.error} />

			{outcome && <input type="hidden" name="id" value={outcome.id} />}
			<input type="hidden" name="site" value={site} />

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>The outcome</h2>
				</div>

				<Field name="title" label="Title" required error={err("title")}
					hint="What the finding is called, as it appears on the Outcomes page.">
					<input type="text" id="title" name="title" defaultValue={keep("title", outcome?.title)} required />
				</Field>

				<Field name="summary" label="One-line summary" required error={err("summary")}
					hint="One or two sentences. This is what the Outcomes listing shows before anybody opens it.">
					<textarea id="summary" name="summary" rows={3} defaultValue={keep("summary", outcome?.summary)} required />
				</Field>

				<Field name="body" label="Main text" error={err("body")}
					hint="Start a line with ## for a heading, or - for a bullet. Leave a blank line to start a new paragraph. Inside a line, [words](https://example.com) makes a link and **words** is bold.">
					<textarea id="body" name="body" rows={14} defaultValue={keep("body", outcome?.body)} />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>Pictures and documents</h2>
				</div>

				<p className={styles.panelNote}>
					Leaving either of these empty keeps what is already attached. Choosing new files
					replaces that set entirely.
				</p>

				{images.length > 0 && (
					<p className={styles.entryMeta}>
						{images.map((image) => (
							/* eslint-disable-next-line @next/next/no-img-element */
							<img
								key={image.id}
								src={`/media/${image.id}`}
								alt=""
								width={96}
								height={64}
								style={{
									width: 96,
									height: 64,
									objectFit: "cover",
									marginRight: "0.5rem",
									verticalAlign: "middle",
								}}
							/>
						))}
					</p>
				)}

				<Field
					name="images"
					label={images.length > 0 ? "Replace the pictures" : "Pictures"}
					error={err("images")}
					hint="JPEG, PNG or WebP. Charts and diagrams work best at the large size below."
				>
					<input type="file" id="images" name="images" accept="image/jpeg,image/png,image/webp" multiple />
				</Field>

				{files.length > 0 && (
					<p className={styles.entryMeta}>
						{files.length} {files.length === 1 ? "document" : "documents"} attached:{" "}
						{files.map((file) => file.label || file.filename).join(", ")}
					</p>
				)}

				<Field
					name="files"
					label={files.length > 0 ? "Replace the documents" : "Documents"}
					error={err("files")}
					hint="A report, a dataset or a paper, offered as a download beneath the text."
				>
					<input type="file" id="files" name="files" multiple />
				</Field>

				<Field name="image_size" label="Picture size" error={err("image_size")}
					hint="How large the pictures are drawn on the page.">
					<select id="image_size" name="image_size" defaultValue={keep("image_size", outcome?.image_size ?? "medium")}>
						<option value="small">Small — a logo or a detail</option>
						<option value="medium">Medium — the usual column width</option>
						<option value="large">Large — full width, for a chart or diagram</option>
					</select>
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>How it appears</h2>
				</div>

				<Field name="sort_order" label="Position in the list" error={err("sort_order")}
					hint="Lower numbers appear first. Leave at 0 to order by the date it was added.">
					<input type="number" id="sort_order" name="sort_order" step={1} defaultValue={keep("sort_order", outcome?.sort_order ?? 0)} />
				</Field>

				<div className={styles.checkboxField}>
					<input
						type="checkbox"
						id="published"
						name="published"
						defaultChecked={
							state.values ? state.values.published === "on" : Boolean(outcome?.published)
						}
					/>
					<label htmlFor="published">
						<strong>Publish this</strong>
						<span>
							Until this is ticked the outcome is a draft: saved here, and not on the ADFLEX
							site.
						</span>
					</label>
				</div>
			</div>

			<div className={styles.formActions}>
				<button className="button" type="submit" disabled={pending}>
					{pending ? "Saving…" : outcome ? "Save changes" : "Create outcome"}
				</button>
				<Link href={backHref}>Cancel</Link>
			</div>
		</form>
	);
}
