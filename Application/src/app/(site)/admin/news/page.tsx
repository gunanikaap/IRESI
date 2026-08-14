import { requireUser } from "@/lib/auth";
import { listAllNews, isEvent } from "@/lib/repo";
import { togglePublished, removeNewsItem } from "../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

/**
 * The event lifecycle, in one sentence for whoever reads this next:
 *
 *   Upcoming  ->  the event happens  ->  Past event, still on the site
 *
 * An event is never deleted for having happened, and nothing is scheduled —
 * which state it is in is worked out from its end time on every read. The entry
 * below shows that state so an editor can see it without opening the form.
 */
export default async function AdminNewsPage(props: PageProps<"/admin/news">) {
	await requireUser();
	const items = await listAllNews();
	const params = await props.searchParams;

	return (
		<>
			<h1 className={styles.pageTitle}>News &amp; events</h1>
			<p className={styles.pageLead}>
				Announcements and events. An event that has already taken place stays on the website as a
				record — it is never removed for being in the past.
			</p>

			{params.deleted && <p className={styles.notice}>Entry deleted.</p>}

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{items.length} {items.length === 1 ? "entry" : "entries"}
					</h2>
				</div>

				{items.length === 0 ? (
					<p className={styles.empty}>
						Nothing here yet. Run <code>npm run db:seed</code> to load the current website&rsquo;s
						news.
					</p>
				) : (
					<ul className={styles.entryList}>
						{items.map((entry) => (
							<li key={entry.id} className={styles.entry}>
								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>{entry.title}</div>
									<div className={styles.entryMeta}>
										{describe(entry.kind, entry.expired)}
										{entry.slug && ` · /${entry.slug}`}
										{entry.unlisted && " · hidden from the listing"}
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
											message="This removes the entry and its page from the website, along with any images only it uses. If this is an event that has taken place, consider leaving it as a record instead. This cannot be undone."
											confirmLabel="Delete entry"
										/>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<p className={styles.warning}>
				<strong>Editing is not available here yet.</strong> Entries can be published, unpublished
				and deleted, and new ones loaded from the seed file. The form for writing and editing news
				follows the same pattern as the project form and is the next piece of work.
			</p>
		</>
	);
}

function describe(kind: string, expired: boolean): string {
	if (kind === "news") return "News";
	if (!isEvent(kind as never)) return "News";
	if (kind === "upcoming") return expired ? "Event · now past" : "Upcoming event";
	return "Past event";
}
