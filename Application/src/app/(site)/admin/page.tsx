import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { countUnreadMessages, listAllNews, listAllTeam } from "@/lib/repo";
import { project } from "@/projects";
import { MAIL_SENDER } from "@/lib/site";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
	const user = await requireUser();

	// Admin reads deliberately do not go through `safeRead`: a list that silently
	// shows nothing reads as "your work is gone".
	const [news, team, unread] = await Promise.all([
		listAllNews(),
		listAllTeam(),
		isDatabaseConfigured() ? countUnreadMessages() : Promise.resolve(0),
	]);

	const drafts = news.filter((entry) => !entry.published).length;

	const mailReady = Boolean(MAIL_SENDER.address && MAIL_SENDER.host && process.env.SMTP_PASSWORD);

	return (
		<>
			<h1 className={styles.pageTitle}>Welcome back, {user.name}</h1>
			<p className={styles.pageLead}>
				You are editing the {project.name} website. Nothing you save appears publicly until it is
				published.
			</p>

			{/*
			 * Messages was taken out of the navigation, but this warning stays.
			 * With no SMTP settings a contact enquiry is stored rather than emailed,
			 * and that page is the only place it can be read — hiding where they go
			 * while they are going nowhere else would lose real messages from real
			 * people. It disappears of its own accord once email is configured.
			 */}
			{!mailReady && (
				<p className={styles.warning}>
					<strong>Contact email is not configured yet.</strong> Enquiries sent through the website
					are being stored rather than emailed —{" "}
					<Link href="/admin/messages">
						{unread > 0
							? `read them here (${unread} unread)`
							: "read them here"}
					</Link>
					. Nothing is lost. Once the mailbox settings are in place they will arrive by email
					instead and this notice will go.
				</p>
			)}

			<div className={styles.cardGrid}>
				<div className={styles.statCard}>
					<strong>{news.length}</strong>
					<span>News &amp; events</span>
				</div>
				<div className={styles.statCard}>
					<strong>{team.length}</strong>
					<span>Team members</span>
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
						<strong>News &amp; events</strong> — announcements and events. An event that has passed
						stays on the site as a record rather than disappearing, and becomes a past event by
						itself once its end time goes by.
					</li>
					<li>
						<strong>Team</strong> — the people on the Team page, their photographs and the order
						they appear in.
					</li>
					<li>
						<strong>Photographs</strong> — the scrolling strip of pictures on the About page.
					</li>
					<li>
						<strong>ADFLEX</strong> — the project site at <code>/adflex</code>. Its content is
						entirely separate from IRESI&rsquo;s; the same login opens both.
					</li>
				</ul>
				<p className={styles.panelNote}>
					Projects, publications and the research topic pages are not edited here. Neither are the
					partner logos or the standing page text. They change rarely, so they live in the code —
					ask a developer, and see the README for exactly which file.
				</p>
			</div>
		</>
	);
}
