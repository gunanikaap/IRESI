import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { about } from "@/projects/iresi/content";
import { canonical } from "@/lib/site";
import styles from "./about.module.css";

export const metadata: Metadata = {
	title: "About Us",
	description:
		"IRESI is a leading interdisciplinary research hub at Maynooth University advancing sustainable, data-driven and community-centred approaches to the clean energy transition.",
	...canonical("/about-us"),
};

export default function AboutPage() {
	return (
		<>
			<PageHero title="About Us" facts={about.facts} />

			<section className="section">
				<div className="container">
					<p className={`lead ${styles.intro}`}>{about.intro}</p>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						className={styles.leadImage}
						src={about.leadImage}
						alt=""
						width={1024}
						height={768}
					/>
				</div>
			</section>

			<section className="section section--alt">
				<div className="container">
					<ul className={styles.detailList}>
						{about.sections.map((section) => (
							<li key={section.title}>
								<h2>{section.title}</h2>
								<p>{section.text}</p>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="section">
				<div className="container">
					<h2 className="visuallyHidden">Life at IRESI</h2>
					<ul className={styles.collage}>
						{about.collage.map((src) => (
							<li key={src}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={src} alt="" width={256} height={256} loading="lazy" />
							</li>
						))}
					</ul>
				</div>
			</section>
		</>
	);
}
