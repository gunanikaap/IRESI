import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { countUnreadMessages } from "@/lib/repo";
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

	let unread = 0;
	if (isDatabaseConfigured()) {
		try {
			unread = await countUnreadMessages();
		} catch {
			// A count is decoration. Losing it must not take the whole admin down.
		}
	}

	return (
		<div className={styles.shell}>
			<header className={styles.bar}>
				<span className={styles.brand}>
					{project.name}
					<span className={styles.brandTag}>Admin</span>
				</span>

				<AdminTabs
					tabs={[
						{ href: "/admin", label: "Overview" },
						{ href: "/admin/projects", label: "Projects" },
						{ href: "/admin/news", label: "News & Events" },
						{ href: "/admin/publications", label: "Publications" },
						{
							href: "/admin/messages",
							label: "Messages",
							badge:
								unread > 0 ? (
									<span className={styles.badge}>
										{unread}
										<span className="visuallyHidden"> unread</span>
									</span>
								) : null,
						},
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
