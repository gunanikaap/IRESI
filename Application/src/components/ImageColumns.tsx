import styles from "./ImageColumns.module.css";

/**
 * Columns of photographs drifting vertically, adjacent columns in opposite
 * directions.
 *
 * The same trick as `ImageMarquee` turned on its side: each column renders its
 * photographs twice and is animated by half its own height, so the loop has no
 * seam and no JavaScript is involved. Opposite directions matter — two columns
 * moving the same way read as one block sliding, which looks like a rendering
 * fault rather than a deliberate motion.
 *
 * It stops on hover and on keyboard focus, and holds still entirely for anyone
 * who has asked their system for reduced motion.
 */
export default function ImageColumns({
	images,
	label,
	columns = 2,
	/** Seconds for one full pass of a column. Longer is slower. */
	duration = 45,
}: {
	images: readonly string[];
	label: string;
	columns?: number;
	duration?: number;
}) {
	if (images.length === 0) return null;

	// Deal the photographs round the columns so each gets a different set rather
	// than the same run offset, which would read as a repeat.
	const dealt: string[][] = Array.from({ length: columns }, () => []);
	images.forEach((src, i) => dealt[i % columns].push(src));

	return (
		<div
			className={styles.viewport}
			role="group"
			aria-label={label}
			style={{ "--columns-duration": `${duration}s` } as React.CSSProperties}
		>
			{dealt.map((column, index) => (
				<ul
					key={index}
					className={`${styles.track} ${index % 2 === 1 ? styles.reverse : ""}`}
				>
					{column.map((src) => (
						<li key={src}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={src} alt="" loading="lazy" />
						</li>
					))}
					{/* The second pass is what makes the loop seamless; a screen reader
					    should hear these photographs once, and they are decorative. */}
					{column.map((src) => (
						<li key={`${src}-repeat`} aria-hidden="true">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={src} alt="" loading="lazy" />
						</li>
					))}
				</ul>
			))}
		</div>
	);
}
