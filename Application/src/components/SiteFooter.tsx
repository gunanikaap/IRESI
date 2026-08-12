import Link from "next/link";
import { project } from "@/projects";
import type { SocialIcon } from "@/projects";
import styles from "./SiteFooter.module.css";

/**
 * Inline paths keep the icon set self-contained — no icon font, no CDN, and
 * nothing for a content-security policy to have to allow.
 */
const ICONS: Record<SocialIcon, string> = {
	facebook:
		"M9.1 21.5v-8.4H6.3V9.7h2.8V7.3c0-2.8 1.7-4.3 4.2-4.3 1.2 0 2.2.1 2.5.1v2.9h-1.7c-1.4 0-1.6.6-1.6 1.6v2.1h3.2l-.4 3.4h-2.8v8.4H9.1z",
	linkedin:
		"M6.9 8.6H3.5v11h3.4v-11zM5.2 3.2a2 2 0 100 4 2 2 0 000-4zM20.5 13.5c0-3.2-1.7-4.7-4-4.7-1.8 0-2.7 1-3.1 1.7V8.6H10v11h3.4v-6.1c0-1.6.3-3.2 2.3-3.2s2 1.8 2 3.3v6h3.4v-6.1z",
	twitter:
		"M22 5.9c-.7.3-1.5.6-2.4.7.9-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013.4 4.6a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5a4.1 4.1 0 003.3 4c-.6.2-1.2.2-1.8.1a4.1 4.1 0 003.8 2.9A8.2 8.2 0 012 18.3a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2z",
};

export default function SiteFooter() {
	// Rendered on the server at build time. The copyright year therefore moves
	// when the site is rebuilt, not when the clock passes midnight — which is
	// the honest behaviour for a statically rendered footer.
	const year = new Date().getFullYear();

	return (
		<footer className={styles.footer}>
			<div className={`container ${styles.grid}`}>
				<div className={styles.brand}>
					<Link href="/" aria-label={`${project.name} home`}>
						{/* eslint-disable-next-line @next/next/no-img-element -- see SiteHeader */}
						<img src={project.logo.footer} alt={project.name} width={180} loading="lazy" />
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
										<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
											<path d={ICONS[item.icon]} fill="currentColor" />
										</svg>
									</a>
								</li>
							))}
						</ul>
					)}

					{project.funding && <p className={styles.funding}>{project.funding.statement}</p>}
				</div>

				{project.footerColumns.map((column) => (
					<nav key={column.heading} className={styles.column} aria-label={column.heading}>
						<h3>{column.heading}</h3>
						<ul>
							{column.links.map((link) => (
								<li key={link.href}>
									<Link href={link.href}>{link.label}</Link>
								</li>
							))}
						</ul>
					</nav>
				))}

				<div className={styles.column}>
					<h3>Contact info</h3>
					<p className={styles.label}>Email</p>
					<p>
						<a href={`mailto:${project.contactEmail}`}>{project.contactEmail}</a>
					</p>
					<p className={styles.label}>Location</p>
					<p>
						Reach out to us at:
						<br />
						{project.address}
					</p>
				</div>
			</div>

			<div className={`container ${styles.bottom}`}>
				<p>
					Copyright &copy; {year}, {project.name}. All Rights Reserved
				</p>
			</div>
		</footer>
	);
}
