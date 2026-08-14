"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProject, type ActionState } from "../actions";
import { Field, FormError } from "@/components/admin/Field";
import type { Project } from "@/lib/repo";
import styles from "../admin.module.css";

const initial: ActionState = {};

/**
 * One form for creating and editing.
 *
 * `keep` puts a rejected submission's values back in the fields rather than
 * blanking them: losing a long write-up to a mistyped web address is the
 * fastest way to make an editor stop trusting the admin.
 */
export default function ProjectForm({ project }: { project?: Project }) {
	const [state, action, pending] = useActionState(saveProject, initial);

	const keep = (name: string, fallback: string | number | null | undefined) =>
		state.values?.[name] ?? (fallback == null ? "" : String(fallback));

	const err = (name: string) => state.fieldErrors?.[name];

	return (
		<form action={action}>
			<FormError message={state.error} />

			{project && <input type="hidden" name="id" value={project.id} />}

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>The basics</h2>
				</div>

				<Field name="title" label="Project name" required error={err("title")}
					hint="Shown on the listing card and used as the page heading.">
					<input type="text" id="title" name="title" defaultValue={keep("title", project?.title)} required />
				</Field>

				<Field name="slug" label="Web address" required error={err("slug")}
					hint="The last part of the page's address. Lower-case letters, numbers and hyphens only — for example “renew” gives /renew. Changing this breaks existing links.">
					<input type="text" id="slug" name="slug" defaultValue={keep("slug", project?.slug)} required />
				</Field>

				<Field name="summary" label="One-line summary" required error={err("summary")}
					hint="One sentence, shown on the projects listing and the home page.">
					<textarea id="summary" name="summary" rows={2} defaultValue={keep("summary", project?.summary)} required />
				</Field>

				<Field name="page_title" label="Longer heading" error={err("page_title")}
					hint="Used as the heading on the project's own page when the short name needs expanding — for example “Renew — Smart Energy Platform”. Leave empty to use the project name.">
					<input type="text" id="page_title" name="page_title" defaultValue={keep("page_title", project?.page_title)} />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>The project page</h2>
				</div>

				<Field name="intro" label="Opening paragraphs" error={err("intro")}
					hint="Shown at the top of the page, above the picture. One paragraph per line.">
					<textarea id="intro" name="intro" rows={4} defaultValue={keep("intro", project?.intro.join("\n"))} />
				</Field>

				<Field name="tags" label="Descriptor chips" error={err("tags")}
					hint="The short labels beside the title — for example “EU-Funded Project”. One per line, four works well.">
					<textarea id="tags" name="tags" rows={4} defaultValue={keep("tags", project?.tags.join("\n"))} />
				</Field>

				<Field name="body" label="Main text" error={err("body")}
					hint="The body of the page. Start a line with ## for a heading, or - for a bullet. Leave a blank line to start a new paragraph.">
					<textarea id="body" name="body" rows={16} defaultValue={keep("body", project?.body)} />
				</Field>

				<Field name="images" label="Pictures" error={err("images")}
					hint="JPEG, PNG or WebP. Choosing new pictures replaces the ones already attached. Photographs are resized and camera data is stripped on upload.">
					<input type="file" id="images" name="images" accept="image/jpeg,image/png,image/webp" multiple />
				</Field>
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>Links and ordering</h2>
				</div>

				<Field name="website" label="Project website" error={err("website")}
					hint="The consortium or platform site, if there is one. Include https://">
					<input type="url" id="website" name="website" defaultValue={keep("website", project?.website)} />
				</Field>

				<Field name="website_label" label="Link wording" error={err("website_label")}
					hint="What the button to that website says. Defaults to “See Platform”.">
					<input type="text" id="website_label" name="website_label" defaultValue={keep("website_label", project?.website_label ?? "See Platform")} />
				</Field>

				<Field name="vimeo_id" label="Vimeo video id" error={err("vimeo_id")}
					hint="Digits only — the number at the end of a Vimeo link. Leave empty if there is no video.">
					<input type="text" id="vimeo_id" name="vimeo_id" inputMode="numeric" defaultValue={keep("vimeo_id", project?.vimeo_id)} />
				</Field>

				<Field name="sort_order" label="Position in the list" error={err("sort_order")}
					hint="Lower numbers appear first. Leave everything at 0 to order by date added.">
					<input type="number" id="sort_order" name="sort_order" step={1} defaultValue={keep("sort_order", project?.sort_order ?? 0)} />
				</Field>

				<div className={styles.checkboxField}>
					<input
						type="checkbox"
						id="external_only"
						name="external_only"
						defaultChecked={
							state.values ? state.values.external_only === "on" : Boolean(project?.external_only)
						}
					/>
					<label htmlFor="external_only">
						<strong>Link straight to the project website</strong>
						<span>
							Tick this for a project that has its own site and does not need a page here. The card
							will link out instead, and no page is created.
						</span>
					</label>
				</div>
			</div>

			<div className={styles.formActions}>
				<button className="button" type="submit" disabled={pending}>
					{pending ? "Saving…" : project ? "Save changes" : "Create project"}
				</button>
				<Link href="/admin/projects">Cancel</Link>
				<span className={styles.entryMeta}>
					{project?.published
						? "This project is published — saving updates the live page."
						: "Saving keeps this as a draft. Publish it from the projects list when it is ready."}
				</span>
			</div>
		</form>
	);
}
