import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
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

export default function ContactPage() {
	return (
		<>
			<PageHero title="Contact Us" />

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
		</>
	);
}
