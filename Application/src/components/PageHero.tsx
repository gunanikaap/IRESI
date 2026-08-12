import styles from "./PageHero.module.css";

/** The banner every page except the home page opens with. */
export default function PageHero({
	title,
	subtitle,
	eyebrow,
	facts,
}: {
	title: string;
	subtitle?: string;
	eyebrow?: string;
	/** Short statements shown as chips under the title, as on About Us. */
	facts?: readonly string[];
}) {
	return (
		<section className={styles.hero}>
			<div className="container">
				{eyebrow && <span className={`eyebrow ${styles.eyebrow}`}>{eyebrow}</span>}
				<h1>{title}</h1>
				{subtitle && <p className={styles.subtitle}>{subtitle}</p>}
				{facts && facts.length > 0 && (
					<ul className={styles.facts}>
						{facts.map((fact) => (
							<li key={fact}>{fact}</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
