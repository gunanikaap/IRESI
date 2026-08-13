import type { Metadata } from "next";
import { team } from "@/projects/iresi/content";
import { project } from "@/projects";
import { canonical } from "@/lib/site";
import styles from "./team.module.css";

export const metadata: Metadata = {
	title: "Team",
	description:
		"Meet the researchers, educators and innovators of the IRESI Centre at Maynooth University.",
	...canonical("/team"),
	openGraph: { images: ["/images/about/lead.jpg"] },
};

const MAIL_ICON =
	"M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.2l-8 5-8-5V6l8 5 8-5v2.2z";
const LINKEDIN_ICON =
	"M6.9 8.6H3.5v11h3.4v-11zM5.2 3.2a2 2 0 100 4 2 2 0 000-4zM20.5 13.5c0-3.2-1.7-4.7-4-4.7-1.8 0-2.7 1-3.1 1.7V8.6H10v11h3.4v-6.1c0-1.6.3-3.2 2.3-3.2s2 1.8 2 3.3v6h3.4v-6.1z";

export default function TeamPage() {
	return (
		<>
			{/*
			 * The banner photograph is the team itself — the one image on the site
			 * that is literally the subject of the page. About Us uses it in the
			 * body rather than as a banner, so the two do not read as a repeat.
			 */}
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<h1>Our Team</h1>
					<p className={styles.heroLead}>
						The International Research on Energy system integration, Education, and Environment for
						Sustainability and Innovation (IRESI) Centre brings together researchers, educators and
						innovators committed to advancing sustainable energy.
					</p>
					<p className={styles.heroLead}>
						As part of {project.institution}, our team combines diverse expertise to address complex
						energy challenges through interdisciplinary research, education and collaboration.
					</p>
				</div>
			</section>

			<section className="section section--alt">
				<div className="container">
					<ul className={styles.grid}>
						{team.map((member) => (
							<li key={member.name} className={styles.member}>
								<div className={styles.photoFrame}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className={styles.photo}
										src={member.photo}
										alt={member.name}
										width={300}
										height={300}
										loading="lazy"
									/>
								</div>
								<div className={styles.memberBody}>
									<h2 className={styles.name}>{member.name}</h2>
									<p className={styles.role}>{member.role}</p>
									<ul className={styles.links}>
										{member.email && (
											<li>
												<a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`}>
													<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
														<path fill="currentColor" d={MAIL_ICON} />
													</svg>
												</a>
											</li>
										)}
										{member.linkedin && (
											<li>
												<a
													href={member.linkedin}
													target="_blank"
													rel="noopener noreferrer"
													aria-label={`${member.name} profile`}
												>
													<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
														<path fill="currentColor" d={LINKEDIN_ICON} />
													</svg>
												</a>
											</li>
										)}
									</ul>
								</div>
							</li>
						))}
					</ul>
				</div>
			</section>
		</>
	);
}
