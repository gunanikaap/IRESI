import Link from "next/link";
import { imagesForTopic, type ResearchTopic as Topic } from "@/projects/iresi/content";
import styles from "./ResearchTopic.module.css";

/**
 * A research topic page — the seven pages the footer links to.
 *
 * The words are the live site's, checked against it line by line. The banner
 * photograph and the closing panel's photograph are the live site's too; every
 * topic uses the same two, which is why they are named for their role rather
 * than for a topic.
 *
 * What differs is the middle: the live page runs five long sections down one
 * column under small subheadings. Here each section is a numbered two-column
 * block so its heading stays beside its text, and bullet lists become cards.
 */
export default function ResearchTopic({ topic }: { topic: Topic }) {
	const images = imagesForTopic(topic.slug);
	const body = topic.sections.filter(
		(section) => section.heading || section.paragraphs.length > 0
	);

	return (
		<article>
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<span className={styles.eyebrow}>Research</span>
					<h1>{topic.title}</h1>
				</div>
			</section>

			<section className="section">
				<div className={`container ${images.length > 0 ? styles.leadGrid : ""}`}>
					<p className={styles.lead}>{topic.summary}</p>
					{images.length > 0 && (
						<div className={styles.leadImages}>
							{images.map((src) => (
								// eslint-disable-next-line @next/next/no-img-element
								<img key={src} src={src} alt="" loading="lazy" />
							))}
						</div>
					)}
				</div>
			</section>

			<section className="section section--alt">
				<div className="container">
					<ol className={styles.sections}>
						{body.map((section, index) => (
							<li key={section.heading ?? index} className={styles.block}>
								<div className={styles.blockHead}>
									<span className={styles.blockNumber} aria-hidden="true">
										{String(index + 1).padStart(2, "0")}
									</span>
									{section.heading && <h2>{section.heading}</h2>}
								</div>

								<div className={styles.blockBody}>
									{section.paragraphs.map((paragraph) => (
										<p key={paragraph.slice(0, 40)}>{paragraph}</p>
									))}

									{section.bullets.length > 0 && (
										<ul className={styles.bulletCards}>
											{section.bullets.map((bullet) => {
												const { label, text } = splitBullet(bullet);
												return (
													<li key={bullet.slice(0, 40)}>
														{label && <strong>{label}</strong>}
														<span>{text}</span>
													</li>
												);
											})}
										</ul>
									)}
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* The closing panel, as on the live page: photograph, accent heading,
			    and the two links it ends with, worded exactly as they are there. */}
			<section className="section">
				<div className="container">
					<div className={styles.cta}>
						<div className={styles.ctaInner}>
							<h2>{topic.closing.heading ?? `Explore ${topic.title}`}</h2>
							{topic.closing.paragraphs.map((paragraph) => (
								<p key={paragraph.slice(0, 40)}>{paragraph}</p>
							))}
							<div className={styles.ctaActions}>
								<Link className={styles.ctaButton} href="/projects">
									List of projects under {topic.linkLabel}
								</Link>
								<Link className={styles.ctaButton} href="/publications">
									List of publications under {topic.linkLabel}
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</article>
	);
}

/** The copy uses `**bold**` for bullet labels; nothing renders markdown here. */
const stripMarkdown = (text: string) => text.replace(/\*\*/g, "").trim();

/**
 * Splits a bullet written as `**Label:** description` into its two halves.
 * A bullet with no colon renders as a single line rather than inventing a label
 * out of its first few words.
 */
function splitBullet(bullet: string): { label: string | null; text: string } {
	const clean = stripMarkdown(bullet);
	const split = clean.indexOf(":");
	if (split <= 0) return { label: null, text: clean };
	return { label: clean.slice(0, split).trim(), text: clean.slice(split + 1).trim() };
}
