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

	const body = topic.sections.filter(
		(section) => section.heading || section.paragraphs.length > 0
	);

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
					<h2>{topic.closing.heading ?? "Get involved"}</h2>
					{topic.closing.paragraphs.map((paragraph) => (
						<p key={paragraph.slice(0, 40)}>{paragraph}</p>
					))}
					{/*
					 * The two links the live page ends with, kept word for word. Styled
					 * as links rather than buttons: the shared button style uppercases
					 * its label, and "LIST OF PUBLICATIONS UNDER GREEN UPSKILLING
					 * TECHNOLOGIES" is a shout, not a link.
					 */}
					<ul className={styles.ctaLinks}>
						<li>
							<Link href="/projects">list of projects under {topic.linkLabel}</Link>
						</li>
						<li>
							<Link href="/publications">list of publications under {topic.linkLabel}</Link>
						</li>
					</ul>
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

