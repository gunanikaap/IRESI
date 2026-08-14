import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { settleFinishedEvents } from "@/lib/repo";
import { project } from "@/projects";
import { signOut } from "./actions";
import { AdminTabs } from "./AdminTabs";
import styles from "./admin.module.css";

/**
 * The admin shell.
 *
 * `noindex, nofollow` because this must never appear in a search result. That
 * is presentation, not protection — the real guard is `requireUser()` on every
 * page and in every action.
 *
 * Rendered per request: it reads the session cookie, which is request data.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	// `absolute` opts out of the root layout's "%s | IRESI" template, which
	// would otherwise render this as "IRESI admin | IRESI".
	title: { absolute: `${project.name} admin` },
	robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const user = await getCurrentUser();

	// The login page renders inside this layout too and has no signed-in user.
	// Showing the bare card rather than an empty navigation bar above it.
	if (!user) return <>{children}</>;

	if (isDatabaseConfigured()) {
		/*
		 * Any upcoming event whose end time has passed becomes a past event here,
		 * so an editor never opens a form that still says "still to come" about
		 * something that finished last week. The public pages already worked this
		 * out for themselves on every read — see `settleFinishedEvents`.
		 *
		 * Failure is swallowed deliberately: this is tidying, and it must not be
		 * able to take the admin down.
		 */
		try {
			await settleFinishedEvents();
		} catch (error) {
			console.error("[admin] settling finished events failed:", error);
		}
	}

	return (
		<div className={styles.shell}>
			<header className={styles.bar}>
				<span className={styles.brand}>
					{project.name}
					<span className={styles.brandTag}>Admin</span>
				</span>

				{/*
				 * IRESI's own sections, then a divider, then the projects running
				 * beneath it. One deployment serves both sites and one login opens
				 * both, so the switch between them belongs here rather than being a
				 * second address to remember.
				 *
				 * ---------------------------------------------------------------
				 * PROJECTS, PUBLICATIONS AND MESSAGES ARE DELIBERATELY ABSENT
				 * ---------------------------------------------------------------
				 * Taken out of the bar on 14 August 2026 at the team's request. The
				 * pages, their forms and their actions are all still here and still
				 * work — /admin/projects, /admin/publications and /admin/messages
				 * answer if you type them — so this is a change to what the admin
				 * offers, not a deletion. Putting any of them back is one line.
				 *
				 * Worth knowing before leaving Messages out for good: until SMTP is
				 * configured, a contact form enquiry is *stored* rather than emailed,
				 * and that page is the only place it can be read. See the note on the
				 * overview page.
				 */}
				<AdminTabs
					tabs={[
						{ href: "/admin", label: "Overview" },
						{ href: "/admin/news", label: "News & Events" },
						{ href: "/admin/team", label: "Team" },
						{ href: "/admin/images", label: "Photographs" },
						{ href: "/admin/adflex", label: "ADFLEX", separated: true },
					]}
				/>

				<div className={styles.who}>
					<span>{user.name}</span>
					<form action={signOut}>
						<button type="submit" className={styles.linkButton}>
							Sign out
						</button>
					</form>
				</div>
			</header>

			{/* The skip link in the root layout points at #content, which the public
			    <main> provides. The admin needs its own, or the first tab stop on
			    every admin screen jumps to a fragment that does not exist. */}
			<main id="content" className={styles.main}>
				{children}
			</main>
		</div>
	);
}
