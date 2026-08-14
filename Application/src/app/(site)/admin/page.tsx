import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { countUnreadMessages, listAllNews, listAllProjects, listAllPublications } from "@/lib/repo";
import { project } from "@/projects";
import { MAIL_SENDER } from "@/lib/site";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
	const user = await requireUser();

	// Admin reads deliberately do not go through `safeRead`: a list that silently
	// shows nothing reads as "your work is gone".
	const [projects, news, publications, unread] = await Promise.all([
		listAllProjects(),
		listAllNews(),
		listAllPublications(),
		isDatabaseConfigured() ? countUnreadMessages() : Promise.resolve(0),
	]);

	const drafts =
		projects.filter((p) => !p.published).length +
		news.filter((n) => !n.published).length +
		publications.filter((p) => !p.published).length;

	const mailReady = Boolean(MAIL_SENDER.address && MAIL_SENDER.host && process.env.SMTP_PASSWORD);

	return (
		<>
			<h1 className={styles.pageTitle}>Welcome back, {user.name}</h1>
			<p className={styles.pageLead}>
				You are editing the {project.name} website. Nothing you save appears publicly until it is
				published.
			</p>

			{!mailReady && (
				<p className={styles.warning}>
					<strong>Contact email is not configured yet.</strong> Messages sent through the website
					are being stored here in <Link href="/admin/messages">Messages</Link> rather than emailed.
					Nothing is lost.
				</p>
			)}

			<div className={styles.cardGrid}>
				<div className={styles.statCard}>
					<strong>{projects.length}</strong>
					<span>Projects</span>
				</div>
				<div className={styles.statCard}>
					<strong>{news.length}</strong>
					<span>News &amp; events</span>
				</div>
				<div className={styles.statCard}>
					<strong>{publications.length}</strong>
					<span>Publications</span>
				</div>
				<div className={styles.statCard}>
					<strong>{unread}</strong>
					<span>Unread messages</span>
				</div>
			</div>

			{drafts > 0 && (
				<p className={styles.notice} style={{ marginTop: "1.5rem" }}>
					{drafts === 1
						? "One entry is saved but not published yet."
						: `${drafts} entries are saved but not published yet.`}{" "}
					They are only visible here.
				</p>
			)}

			<div className={styles.panel} style={{ marginTop: "1.5rem" }}>
				<div className={styles.panelHeading}>
					<h2>What you can change here</h2>
				</div>
				<ul>
					<li>
						<strong>Projects</strong> — the research projects listed on the website, each with its
						own page.
					</li>
					<li>
						<strong>News &amp; events</strong> — announcements and events. An event that has passed
						stays on the site as a record rather than disappearing.
					</li>
					<li>
						<strong>Publications</strong> — papers, grouped by researcher on the public page.
					</li>
					<li>
						<strong>Messages</strong> — enquiries sent through the contact form.
					</li>
				</ul>
				<p className={styles.panelNote}>
					The team list, research topic pages, partner logos and standing page text are not edited
					here. They change rarely, so they live in the code — ask a developer, and see the README
					for exactly which file.
				</p>
			</div>
		</>
	);
}
