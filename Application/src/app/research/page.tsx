import Link from "next/link";
import type { Metadata } from "next";
import { researchHub } from "@/projects/iresi/content";
import { canonical } from "@/lib/site";
import styles from "./research.module.css";

export const metadata: Metadata = {
	title: "Research",
	description:
		"IRESI's research divisions span renewables, transport, buildings, engaged research, green upskilling, electricity and power systems, and heating and cooling.",
	...canonical("/research"),
	openGraph: { images: ["/images/banners/globe.jpg"] },
};

export default function ResearchPage() {
	return (
		<>
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<span className={styles.eyebrow}>Research</span>
					<h1>{researchHub.subtitle}</h1>
				</div>
			</section>

			<section className={`section ${styles.introSection}`}>
				<div className="container">
					<p className={styles.intro}>{researchHub.intro}</p>
				</div>
			</section>

			<section className="section section--alt">
				<div className="container">
					<ol className={styles.divisions}>
						{researchHub.divisions.map((division, index) => (
							<li
								key={division.slug}
								className={division.images.length > 0 ? styles.division : styles.divisionWide}
							>
								<div className={styles.body}>
									<span className={styles.number} aria-hidden="true">
										{String(index + 1).padStart(2, "0")}
									</span>
									<h2>{division.title}</h2>
									<p>{division.text}</p>
									<Link className={styles.link} href={`/${division.slug}`}>
										More on {division.title}
									</Link>
								</div>

								{/*
								 * Only four of the seven carry photographs on the live page, and
								 * the ones that do alternate which side they sit on so the page
								 * does not become a column of identical rows.
								 */}
								{division.images.length > 0 && (
									<ul className={styles.images}>
										{division.images.map((src) => (
											<li key={src}>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img src={src} alt="" loading="lazy" />
											</li>
										))}
									</ul>
								)}
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className={styles.closing}>
				<div className="container">
					<p>{researchHub.closing}</p>
					<div className={styles.closingActions}>
						<Link className="button" href="/projects">
							Our projects
						</Link>
						<Link className="buttonOutline" href="/publications">
							Our publications
						</Link>
					</div>
				</div>
			</section>
		</>
	);
}
