import Link from "next/link";
import type { ResearchTopic as Topic } from "@/projects/iresi/content";
import styles from "./ResearchTopic.module.css";

/**
 * A research topic page — the seven pages the footer links to.
 *
 * The words are the live site's, checked against it line by line, as are the
 * banner and closing photographs. What differs is the middle: the live page
 * runs five long sections down one column under small subheadings, so each
 * section is a numbered two-column block here and lists are set as points.
 */
export default function ResearchTopic({ topic }: { topic: Topic }) {
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

			{/*
			 * The opening statement, given the width of the page and set large.
			 * It carried a pair of stock photographs beside it for a while; they
			 * added nothing the words did not already say, so the emphasis is
			 * typographic instead.
			 */}
			<section className={`section ${styles.leadSection}`}>
				<div className="container">
					<p className={styles.lead}>{topic.summary}</p>
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
										<ul className={styles.points}>
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

			{/*
			 * The closing panel, as on the live page.
			 *
			 * The two links are worded generally rather than "list of projects
			 * under Renewables". That wording is on the live site, but it promises
			 * a filtered list and delivers the whole page — so it is a promise the
			 * site does not keep, and repeating it would carry the fault across.
			 */}
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
									See all our projects
								</Link>
								<Link className={styles.ctaButton} href="/publications">
									See all our publications
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</article>
	);
}

/** The copy uses `**bold**` for point labels; nothing renders markdown here. */
const stripMarkdown = (text: string) => text.replace(/\*\*/g, "").trim();

/**
 * Splits a point written as `**Label:** description` into its two halves.
 * A point with no colon renders as a single line rather than inventing a label
 * out of its first few words.
 */
function splitBullet(bullet: string): { label: string | null; text: string } {
	const clean = stripMarkdown(bullet);
	const split = clean.indexOf(":");
	if (split <= 0) return { label: null, text: clean };
	return { label: clean.slice(0, split).trim(), text: clean.slice(split + 1).trim() };
}
