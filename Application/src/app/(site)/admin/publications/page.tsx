import { requireUser } from "@/lib/auth";
import { listAllPublications } from "@/lib/repo";
import { researchers } from "@/projects/iresi/content";
import { togglePublished, removePublication } from "../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPublicationsPage(props: PageProps<"/admin/publications">) {
	await requireUser();
	const items = await listAllPublications();
	const params = await props.searchParams;

	const names = new Map(researchers.map((r) => [r.slug, r.name]));

	return (
		<>
			<h1 className={styles.pageTitle}>Publications</h1>
			<p className={styles.pageLead}>
				Papers listed on the publications page, grouped under the researcher who wrote them.
			</p>

			{params.deleted && <p className={styles.notice}>Publication deleted.</p>}

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{items.length} {items.length === 1 ? "publication" : "publications"}
					</h2>
				</div>

				{items.length === 0 ? (
					<p className={styles.empty}>
						Nothing here yet. Run <code>npm run db:seed</code> to load the current website&rsquo;s
						publications.
					</p>
				) : (
					<ul className={styles.entryList}>
						{items.map((entry) => (
							<li key={entry.id} className={styles.entry}>
								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>{entry.title}</div>
									<div className={styles.entryMeta}>
										{entry.date_text ?? entry.year ?? "no date"}
										{entry.journal && ` · ${entry.journal}`}
										{" · "}
										{entry.researcher_slug
											? (names.get(entry.researcher_slug) ??
												`unknown researcher “${entry.researcher_slug}”`)
											: "not grouped"}
									</div>
								</div>

								<span
									className={`${styles.status} ${
										entry.published ? styles.statusLive : styles.statusDraft
									}`}
								>
									{entry.published ? "Published" : "Draft"}
								</span>

								<div className={styles.entryActions}>
									<form action={togglePublished}>
										<input type="hidden" name="table" value="publications" />
										<input type="hidden" name="id" value={entry.id} />
										<input
											type="hidden"
											name="published"
											value={entry.published ? "false" : "true"}
										/>
										<button className={styles.smallButton} type="submit">
											{entry.published ? "Unpublish" : "Publish"}
										</button>
									</form>

									<form action={removePublication}>
										<input type="hidden" name="id" value={entry.id} />
										<ConfirmSubmit
											className={`${styles.smallButton} ${styles.dangerButton}`}
											label="Delete"
											title={`Delete "${entry.title}"?`}
											message="This removes the publication from the website. It cannot be undone."
											confirmLabel="Delete publication"
										/>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<p className={styles.warning}>
				<strong>Editing is not available here yet.</strong> Publications can be published,
				unpublished and deleted. The form for adding and editing them is the next piece of work.
			</p>
		</>
	);
}
