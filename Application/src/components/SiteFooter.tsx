import Link from "next/link";
import { project } from "@/projects";
import type { SocialIcon } from "@/projects";
import styles from "./SiteFooter.module.css";

/**
 * Inline paths keep the icon set self-contained — no icon font, no CDN, and
 * nothing for a content-security policy to have to allow.
 */
const SOCIAL_ICONS: Record<SocialIcon, string> = {
	facebook:
		"M9.1 21.5v-8.4H6.3V9.7h2.8V7.3c0-2.8 1.7-4.3 4.2-4.3 1.2 0 2.2.1 2.5.1v2.9h-1.7c-1.4 0-1.6.6-1.6 1.6v2.1h3.2l-.4 3.4h-2.8v8.4H9.1z",
	linkedin:
		"M6.9 8.6H3.5v11h3.4v-11zM5.2 3.2a2 2 0 100 4 2 2 0 000-4zM20.5 13.5c0-3.2-1.7-4.7-4-4.7-1.8 0-2.7 1-3.1 1.7V8.6H10v11h3.4v-6.1c0-1.6.3-3.2 2.3-3.2s2 1.8 2 3.3v6h3.4v-6.1z",
	twitter:
		"M22 5.9c-.7.3-1.5.6-2.4.7.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013.4 4.6a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5a4.1 4.1 0 003.3 4c-.6.2-1.2.2-1.8.1a4.1 4.1 0 003.8 2.9A8.2 8.2 0 012 18.3a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2z",
};

const MAIL_ICON =
	"M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.2l-8 5-8-5V6l8 5 8-5v2.2z";
const PIN_ICON =
	"M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z";

export default function SiteFooter() {
	// Rendered on the server at build time, so the year moves when the site is
	// rebuilt rather than when the clock passes midnight — the honest behaviour
	// for a statically rendered footer.
	const year = new Date().getFullYear();

	return (
		<footer className={styles.footer}>
			<div className={`container ${styles.grid}`}>
				{/*
				 * The logo sits on a white card rather than straight on the dark
				 * background. It is not decoration: the mark carries the centre's full
				 * name underneath it in dark blue, and on a near-black footer that line
				 * is invisible. The card is what makes it readable, which is also how
				 * the site this replaces does it.
				 */}
				<div className={styles.brand}>
					<div className={styles.brandCard}>
						<Link href="/" aria-label={`${project.name} home`}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								className={styles.brandLogo}
								src={project.logo.footer}
								alt={project.name}
								width={367}
								height={158}
								loading="lazy"
							/>
						</Link>

						{project.social.length > 0 && (
							<ul className={styles.socials}>
								{project.social.map((item) => (
									<li key={item.href}>
										<a
											href={item.href}
											target="_blank"
											rel="noopener noreferrer"
											aria-label={item.label}
										>
											<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
												<path d={SOCIAL_ICONS[item.icon]} fill="currentColor" />
											</svg>
										</a>
									</li>
								))}
							</ul>
						)}
					</div>

					{project.funding && <p className={styles.funding}>{project.funding.statement}</p>}
				</div>

				{project.footerColumns.map((column) =>
					column.kind === "contact" ? (
						<div key={column.heading} className={styles.column}>
							<h3 className={styles.heading}>{column.heading}</h3>

							<div className={styles.contactRow}>
								<span className={styles.contactIcon} aria-hidden="true">
									<svg viewBox="0 0 24 24" width="22" height="22">
										<path d={MAIL_ICON} fill="currentColor" />
									</svg>
								</span>
								<div>
									<p className={styles.contactLabel}>Email</p>
									<p>
										<a href={`mailto:${project.contactEmail}`}>{project.contactEmail}</a>
									</p>
								</div>
							</div>

							<div className={styles.contactRow}>
								<span className={styles.contactIcon} aria-hidden="true">
									<svg viewBox="0 0 24 24" width="22" height="22">
										<path d={PIN_ICON} fill="currentColor" />
									</svg>
								</span>
								<div>
									<p className={styles.contactLabel}>Location</p>
									<p>Reach out to us at: {project.address}</p>
								</div>
							</div>
						</div>
					) : (
						<nav key={column.heading} className={styles.column} aria-label={column.heading}>
							<h3 className={styles.heading}>{column.heading}</h3>
							<ul className={styles.linkList}>
								{column.links.map((link) => (
									<li key={link.href}>
										<Link href={link.href}>{link.label}</Link>
									</li>
								))}
							</ul>
						</nav>
					)
				)}
			</div>

			<div className={styles.bottom}>
				<div className="container">
					<p>
						Copyright &copy; {year}, {project.name}. All Rights Reserved
					</p>
				</div>
			</div>
		</footer>
	);
}
