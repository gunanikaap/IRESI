import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { researchHub } from "@/projects/iresi/content";
import { canonical } from "@/lib/site";
import styles from "./research.module.css";

export const metadata: Metadata = {
	title: "Research",
	description:
		"IRESI's research divisions span renewables, transport, buildings, engaged research, green upskilling, electricity and power systems, and heating and cooling.",
	...canonical("/research"),
};

export default function ResearchPage() {
	return (
		<>
			<PageHero title="Research" subtitle={researchHub.subtitle} />

			<section className="section">
				<div className="container">
					<p className="lead">{researchHub.intro}</p>

					<ul className={styles.divisions}>
						{researchHub.divisions.map((division) => (
							<li
								key={division.slug}
								className={division.images.length > 0 ? styles.division : styles.divisionWide}
							>
								<div>
									<h2>{division.title}</h2>
									<p>{division.text}</p>
									<Link className={styles.link} href={`/${division.slug}`}>
										More on {division.title} &rsaquo;
									</Link>
								</div>
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
					</ul>

					<p className={styles.closing}>{researchHub.closing}</p>
				</div>
			</section>
		</>
	);
}
