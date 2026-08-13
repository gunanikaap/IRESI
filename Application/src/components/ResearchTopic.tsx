import Link from "next/link";
import {
	imagesForTopic,
	researchTopics,
	type ResearchTopic as Topic,
} from "@/projects/iresi/content";
import styles from "./ResearchTopic.module.css";

/**
 * A research topic page — the seven pages the footer links to.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS NOT A STRAIGHT COPY OF THE PAGE IT REPLACES
 * ---------------------------------------------------------------------------
 * The WordPress version is a single column of dense prose: a heading, five or
 * six long paragraphs under small subheadings, then two text links. Reproducing
 * that faithfully would reproduce a page nobody reads to the bottom of.
 *
 * The words are unchanged. What changed is the structure around them: the lead
 * paragraph is given room, each section is a two-column block so the heading
 * stays visible beside its text, bullet lists become cards rather than
 * run-on prose, and the page ends with somewhere to go — the other six topics,
 * and the projects and publications the old page linked to as bare text.
 */
export default function ResearchTopic({ topic }: { topic: Topic }) {
	const images = imagesForTopic(topic.slug);
	const others = researchTopics.filter((other) => other.slug !== topic.slug);

	const { body, closing } = splitClosing(topic);

	return (
		<article>
			<section className={styles.hero}>
				<div className="container">
					<span className={`eyebrow ${styles.eyebrow}`}>Research</span>
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
							<li key={section.heading} className={styles.block}>
								<div className={styles.blockHead}>
									<span className={styles.blockNumber} aria-hidden="true">
										{String(index + 1).padStart(2, "0")}
									</span>
									<h2>{section.heading}</h2>
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

			<section className="section">
				<div className="container">
					<h2 className={styles.moreHeading}>Other research areas</h2>
					<ul className={styles.topicGrid}>
						{others.map((other) => (
							<li key={other.slug}>
								<Link href={`/${other.slug}`}>
									<strong>{other.title}</strong>
									<span>{firstSentence(other.summary)}</span>
								</Link>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className={styles.cta}>
				<div className="container">
					<h2>Get involved</h2>
					{closing.map((paragraph) => (
						<p key={paragraph.slice(0, 40)}>{paragraph}</p>
					))}
					<div className={styles.ctaActions}>
						<Link className="button" href="/projects">
							Our projects
						</Link>
						<Link className="buttonOutline" href="/publications">
							Our publications
						</Link>
						<Link className="buttonOutline" href="/contact">
							Get in touch
						</Link>
					</div>
				</div>
			</section>
		</article>
	);
}

/** Keeps the topic cards to one line each rather than a full paragraph. */
function firstSentence(text: string): string {
	const end = text.search(/\.\s/);
	return end > 0 ? text.slice(0, end + 1) : text;
}

/** The copy uses `**bold**` for bullet labels; nothing renders markdown here. */
const stripMarkdown = (text: string) => text.replace(/\*\*/g, "").trim();

/**
 * Splits a bullet written as `**Label:** description` into its two halves.
 *
 * A bullet with no colon renders as a single line rather than inventing a
 * label out of its first few words.
 */
function splitBullet(bullet: string): { label: string | null; text: string } {
	const clean = stripMarkdown(bullet);
	const split = clean.indexOf(":");
	if (split <= 0) return { label: null, text: clean };
	return { label: clean.slice(0, split).trim(), text: clean.slice(split + 1).trim() };
}

/**
 * Separates the closing invitation from the body of the page.
 *
 * Every topic ends the same way — a "join us / explore our projects" paragraph.
 * On the site this replaces it is the last paragraph of the last section, where
 * it reads as an afterthought. Promoting it into the call-to-action band is
 * what makes the page end somewhere rather than just stop.
 *
 * Anything with no heading at all is a trailing paragraph and is always
 * promoted. Otherwise the final section's last paragraph is used, provided that
 * section has more than one — a single-paragraph section would be emptied.
 */
function splitClosing(topic: Topic): { body: Topic["sections"]; closing: string[] } {
	const headed = topic.sections.filter((section) => section.heading);
	const loose = topic.sections.filter((section) => !section.heading);

	if (loose.length > 0) {
		return { body: headed, closing: loose.flatMap((section) => section.paragraphs) };
	}

	const last = headed.at(-1);
	if (!last || last.paragraphs.length < 2) return { body: headed, closing: [] };

	const trimmed = { ...last, paragraphs: last.paragraphs.slice(0, -1) };
	return {
		body: [...headed.slice(0, -1), trimmed],
		closing: [last.paragraphs[last.paragraphs.length - 1]],
	};
}
