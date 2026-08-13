import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { contact } from "@/projects/iresi/content";
import { project } from "@/projects";
import { canonical } from "@/lib/site";
import styles from "./contact.module.css";

export const metadata: Metadata = {
	title: "Contact",
	description: `Get in touch with the IRESI Centre at Maynooth University — ${project.contactEmail}.`,
	...canonical("/contact"),
};

const MAIL_ICON =
	"M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.2l-8 5-8-5V6l8 5 8-5v2.2z";
const PIN_ICON =
	"M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z";

export default function ContactPage() {
	return (
		<>
			{/*
			 * The banner carries the two things someone arriving here is looking
			 * for — the address and the postal address — rather than a title on an
			 * empty gradient.
			 */}
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<div>
						<h1>Contact Us</h1>
						<p className={styles.heroLead}>
							Questions about our research, our projects or working with us are all welcome.
						</p>
					</div>

					<ul className={styles.heroFacts}>
						<li>
							<span className={styles.heroIcon} aria-hidden="true">
								<svg viewBox="0 0 24 24" width="20" height="20">
									<path d={MAIL_ICON} fill="currentColor" />
								</svg>
							</span>
							<div>
								<span className={styles.heroLabel}>Email</span>
								<a href={`mailto:${project.contactEmail}`}>{project.contactEmail}</a>
							</div>
						</li>
						<li>
							<span className={styles.heroIcon} aria-hidden="true">
								<svg viewBox="0 0 24 24" width="20" height="20">
									<path d={PIN_ICON} fill="currentColor" />
								</svg>
							</span>
							<div>
								<span className={styles.heroLabel}>Address</span>
								<span>{project.address}</span>
							</div>
						</li>
					</ul>
				</div>
			</section>

			<section className="section">
				<div className={`container ${styles.grid}`}>
					<div>
						{contact.paragraphs.map((paragraph) => (
							<p key={paragraph.slice(0, 40)}>{paragraph}</p>
						))}

						<ul className={styles.details}>
							<li>
								<span className={styles.label}>Email</span>
								<a href={`mailto:${project.contactEmail}`}>{project.contactEmail}</a>
							</li>
							<li>
								<span className={styles.label}>Address</span>
								<span>{project.address}</span>
							</li>
						</ul>
					</div>

					<ContactForm contactEmail={project.contactEmail} />
				</div>
			</section>

			{/*
			 * The map, as on the live site. Google's plain embed endpoint needs no
			 * API key and sets no cookie until someone interacts with it, which is
			 * the version worth having on a page that already collects an email
			 * address. `loading="lazy"` keeps it off the critical path.
			 */}
			<section className={styles.mapSection} aria-label="Where to find us">
				<iframe
					className={styles.map}
					src="https://maps.google.com/maps?q=Maynooth%20University&t=m&z=13&output=embed&iwloc=near"
					title={`Map showing ${project.institution}`}
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
				/>
			</section>
		</>
	);
}
