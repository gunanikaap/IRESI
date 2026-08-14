import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllNews, isEvent } from "@/lib/repo";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import { togglePublished, removeNewsItem } from "../../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdflexNewsPage(props: PageProps<"/admin/adflex/news">) {
	await requireUser();
	const items = await listAllNews(ADFLEX_SITE);
	const params = await props.searchParams;

	return (
		<>
			<h1 className={styles.pageTitle}>ADFLEX news &amp; events</h1>
			<p className={styles.pageLead}>
				Published on <code>/adflex/news</code>. An event that has already taken place stays on the
				site as a record — it is never removed for being in the past.
			</p>

			{params.saved && <p className={styles.notice}>Entry saved.</p>}
			{params.deleted && <p className={styles.notice}>Entry deleted.</p>}

			<p className={styles.formActions}>
				<Link className="button" href="/admin/adflex/news/new">
					Add news or an event
				</Link>
				<Link href="/admin/adflex">Back to ADFLEX</Link>
			</p>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{items.length} {items.length === 1 ? "entry" : "entries"}
					</h2>
				</div>

				{items.length === 0 ? (
					<p className={styles.empty}>
						Nothing here yet. ADFLEX&rsquo;s own database was not migrated into this one, so its
						News page is currently empty. Use <strong>Add news or an event</strong> above.
					</p>
				) : (
					<ul className={styles.entryList}>
						{items.map((entry) => (
							<li key={entry.id} className={styles.entry}>
								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>{entry.title}</div>
									<div className={styles.entryMeta}>{describe(entry.kind, entry.expired)}</div>
								</div>

								<span
									className={`${styles.status} ${
										entry.published ? styles.statusLive : styles.statusDraft
									}`}
								>
									{entry.published ? "Published" : "Draft"}
								</span>

								<div className={styles.entryActions}>
									<Link className={styles.smallButton} href={`/admin/adflex/news/${entry.id}`}>
										Edit
									</Link>

									<form action={togglePublished}>
										<input type="hidden" name="table" value="news_items" />
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

									<form action={removeNewsItem}>
										<input type="hidden" name="id" value={entry.id} />
										<ConfirmSubmit
											className={`${styles.smallButton} ${styles.dangerButton}`}
											label="Delete"
											title={`Delete "${entry.title}"?`}
											message="This removes the entry from the ADFLEX site, along with any images only it uses. This cannot be undone."
											confirmLabel="Delete entry"
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

function describe(kind: string, expired: boolean): string {
	if (kind === "news") return "News";
	if (!isEvent(kind as never)) return "News";
	if (kind === "upcoming") return expired ? "Event · now past" : "Upcoming event";
	return "Past event";
}
