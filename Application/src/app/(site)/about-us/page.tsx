import type { Metadata } from "next";
import ImageMarquee from "@/components/ImageMarquee";
import { about } from "@/projects/iresi/content";
import { listPageImages } from "@/lib/repo";
import { canonical } from "@/lib/site";
import styles from "./about.module.css";

export const metadata: Metadata = {
	title: "About Us",
	description:
		"IRESI is a leading interdisciplinary research hub at Maynooth University advancing sustainable, data-driven and community-centred approaches to the clean energy transition.",
	...canonical("/about-us"),
	openGraph: { images: ["/images/about/lead.jpg"] },
};

export default async function AboutPage() {
	/*
	 * The scrolling photographs are editor-managed — added and reordered from
	 * the admin. The paths in `content.ts` remain as the fallback for a
	 * deployment whose database has not been seeded, so the strip is never empty
	 * on a fresh install.
	 */
	const { data: collage } = await listPageImages("about-collage");
	const photographs =
		collage.length > 0 ? collage.map((image) => `/media/${image.media_id}`) : about.collage;

	return (
		<>
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<h1>About Us</h1>
					<p className={styles.heroLead}>
						An interdisciplinary research centre at Maynooth University, working on the clean
						energy transition.
					</p>

					{/* The four standing facts, as chips rather than a paragraph — they
					    are the things a visitor scans for before reading anything. */}
					<ul className={styles.facts}>
						{about.facts.map((fact) => (
							<li key={fact}>{fact}</li>
						))}
					</ul>
				</div>
			</section>

			{/*
			 * The opening statement. It is one long sentence naming the centre in
			 * full, so it is set as a pull quote rather than a paragraph: large,
			 * measured to about 60 characters a line, under a short accent rule.
			 */}
			<section className={`section ${styles.introSection}`}>
				<div className="container">
					<p className={styles.intro}>{about.intro}</p>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						className={styles.leadImage}
						src={about.leadImage}
						alt="The IRESI team at Maynooth University"
						width={1024}
						height={768}
					/>
				</div>
			</section>

			<section className="section section--alt">
				<div className="container">
					<ol className={styles.detailList}>
						{about.sections.map((section, index) => (
							<li key={section.title} className={styles.detailCard}>
								<span className={styles.detailNumber} aria-hidden="true">
									{String(index + 1).padStart(2, "0")}
								</span>
								<h2>{section.title}</h2>
								<p>{section.text}</p>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className={`section ${styles.gallerySection}`}>
				<div className="container">
					<span className="eyebrow">Life at the centre</span>
					<h2 className={styles.galleryHeading}>Our work, our people</h2>
				</div>
				<ImageMarquee images={photographs} label="Photographs from around the centre" />
			</section>
		</>
	);
}
