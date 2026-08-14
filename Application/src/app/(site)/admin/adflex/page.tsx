import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllFindings, listAllNews } from "@/lib/repo";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

/**
 * The ADFLEX section of the admin.
 *
 * Same login, same tables, same forms — only the site key differs. Everything
 * listed here is scoped to `project_key = 'adflex'`, so nothing an ADFLEX editor
 * does can reach IRESI's content and the reverse is equally true.
 */
export default async function AdflexAdminPage() {
	await requireUser();

	const [news, outcomes] = await Promise.all([
		listAllNews(ADFLEX_SITE),
		listAllFindings(ADFLEX_SITE),
	]);

	return (
		<>
			<h1 className={styles.pageTitle}>ADFLEX</h1>
			<p className={styles.pageLead}>
				The ADFLEX project site, published at <code>/adflex</code>. It shares this login and this
				database with IRESI, but its content is entirely separate — nothing added here appears on
				the IRESI website.
			</p>

			<div className={styles.cardGrid}>
				<div className={styles.statCard}>
					<strong>{news.length}</strong>
					<span>News &amp; events</span>
				</div>
				<div className={styles.statCard}>
					<strong>{outcomes.length}</strong>
					<span>Outcomes</span>
				</div>
			</div>

			<div className={styles.panel} style={{ marginTop: "1.5rem" }}>
				<div className={styles.panelHeading}>
					<h2>What you can change here</h2>
				</div>
				<ul>
					<li>
						<strong>News &amp; events</strong> — announcements and events for the ADFLEX site. An
						upcoming event is counted down to on the ADFLEX home page.
					</li>
					<li>
						<strong>Outcomes</strong> — the findings and papers listed on{" "}
						<code>/adflex/outcomes</code>.
					</li>
					<li>
						<strong>Messages</strong> — the contact form is shared. Enquiries from either site
						arrive in the same inbox, and an ADFLEX one is subject-lined “ADFLEX enquiry”.
					</li>
				</ul>
				<p className={styles.panelNote}>
					The ADFLEX site&rsquo;s standing text — the pilot, the technologies, the consortium — is
					in the code, in <code>src/projects/adflex/content.ts</code>. It was ported from the
					ADFLEX repository and is kept close to it so the two can still be compared.
				</p>
			</div>

			<p className={styles.formActions}>
				<Link className="button" href="/admin/adflex/news">
					News &amp; events
				</Link>
				<Link href="/admin/adflex/outcomes">Outcomes</Link>
			</p>
		</>
	);
}
