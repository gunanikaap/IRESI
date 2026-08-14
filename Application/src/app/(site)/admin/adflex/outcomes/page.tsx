import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllFindings, listAllPublications } from "@/lib/repo";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import { togglePublished, removeFinding, removePublication } from "../../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

/**
 * ADFLEX's project outcomes.
 *
 * Two kinds of thing, on one page because that is how `/adflex/outcomes` shows
 * them: **findings**, which are written here, and **publications**, which are
 * papers with a citation and — optionally — a DOI or a link. Splitting them into
 * two admin sections would have made an editor learn where the boundary was
 * before they could add either.
 */
export default async function AdflexOutcomesPage(props: PageProps<"/admin/adflex/outcomes">) {
	await requireUser();
	const [outcomes, publications] = await Promise.all([
		listAllFindings(ADFLEX_SITE),
		listAllPublications(ADFLEX_SITE),
	]);
	const params = await props.searchParams;

	return (
		<>
			<h1 className={styles.pageTitle}>ADFLEX outcomes</h1>
			<p className={styles.pageLead}>
				The findings listed on <code>/adflex/outcomes</code>, alongside the project&rsquo;s
				publications.
			</p>

			{params.saved && <p className={styles.notice}>Outcome saved.</p>}
			{params.deleted && <p className={styles.notice}>Outcome deleted.</p>}

			<p className={styles.formActions}>
				<Link className="button" href="/admin/adflex/outcomes/new">
					Add an outcome
				</Link>
				<Link className="button" href="/admin/adflex/publications/new">
					Add a publication
				</Link>
				<Link href="/admin/adflex">Back to ADFLEX</Link>
			</p>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{outcomes.length} {outcomes.length === 1 ? "outcome" : "outcomes"}
					</h2>
				</div>

				{outcomes.length === 0 ? (
					<p className={styles.empty}>
						Nothing here yet. ADFLEX&rsquo;s own database was not migrated into this one, so its
						Outcomes page shows its empty state until something is added here.
					</p>
				) : (
					<ul className={styles.entryList}>
						{outcomes.map((outcome) => (
							<li key={outcome.id} className={styles.entry}>
								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>{outcome.title}</div>
									<div className={styles.entryMeta}>
										{outcome.images.length}{" "}
										{outcome.images.length === 1 ? "image" : "images"} · {outcome.files.length}{" "}
										{outcome.files.length === 1 ? "file" : "files"}
									</div>
								</div>

								<span
									className={`${styles.status} ${
										outcome.published ? styles.statusLive : styles.statusDraft
									}`}
								>
									{outcome.published ? "Published" : "Draft"}
								</span>

								<div className={styles.entryActions}>
									<Link
										className={styles.smallButton}
										href={`/admin/adflex/outcomes/${outcome.id}`}
									>
										Edit
									</Link>

									<form action={togglePublished}>
										<input type="hidden" name="table" value="findings" />
										<input type="hidden" name="id" value={outcome.id} />
										<input
											type="hidden"
											name="published"
											value={outcome.published ? "false" : "true"}
										/>
										<button className={styles.smallButton} type="submit">
											{outcome.published ? "Unpublish" : "Publish"}
										</button>
									</form>

									<form action={removeFinding}>
										<input type="hidden" name="id" value={outcome.id} />
										<input type="hidden" name="site" value={ADFLEX_SITE} />
										<ConfirmSubmit
											className={`${styles.smallButton} ${styles.dangerButton}`}
											label="Delete"
											title={`Delete "${outcome.title}"?`}
											message="This removes the outcome from the ADFLEX site, along with any pictures and documents only it uses. This cannot be undone."
											confirmLabel="Delete outcome"
										/>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{publications.length} {publications.length === 1 ? "publication" : "publications"}
					</h2>
				</div>

				{publications.length === 0 ? (
					<p className={styles.empty}>
						No papers yet. Use <strong>Add a publication</strong> above. Only a title is
						required — a DOI and a link are both optional.
					</p>
				) : (
					<ul className={styles.entryList}>
						{publications.map((paper) => (
							<li key={paper.id} className={styles.entry}>
								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>{paper.title}</div>
									<div className={styles.entryMeta}>
										{[paper.authors, paper.venue, paper.year]
											.filter(Boolean)
											.join(" · ") || "No citation details"}
										{paper.doi && ` · DOI ${paper.doi}`}
										{paper.url && " · has a link"}
									</div>
								</div>

								<span
									className={`${styles.status} ${
										paper.published ? styles.statusLive : styles.statusDraft
									}`}
								>
									{paper.published ? "Published" : "Draft"}
								</span>

								<div className={styles.entryActions}>
									<Link
										className={styles.smallButton}
										href={`/admin/adflex/publications/${paper.id}`}
									>
										Edit
									</Link>

									<form action={togglePublished}>
										<input type="hidden" name="table" value="publications" />
										<input type="hidden" name="id" value={paper.id} />
										<input
											type="hidden"
											name="published"
											value={paper.published ? "false" : "true"}
										/>
										<button className={styles.smallButton} type="submit">
											{paper.published ? "Unpublish" : "Publish"}
										</button>
									</form>

									<form action={removePublication}>
										<input type="hidden" name="id" value={paper.id} />
										<input type="hidden" name="site" value={ADFLEX_SITE} />
										<ConfirmSubmit
											className={`${styles.smallButton} ${styles.dangerButton}`}
											label="Delete"
											title={`Delete "${paper.title}"?`}
											message="This removes the publication from the ADFLEX site, along with any file only it uses. This cannot be undone."
											confirmLabel="Delete publication"
										/>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	);
}
