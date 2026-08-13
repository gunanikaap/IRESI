import styles from "./ImageMarquee.module.css";

/**
 * A row of photographs that scrolls sideways on its own, three visible at a
 * time.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS CSS AND NOT A CAROUSEL COMPONENT
 * ---------------------------------------------------------------------------
 * There is nothing to interact with: no slide index, no buttons, no autoplay
 * timer to pause and resume. The list is rendered twice and the track is
 * animated by exactly half its width, so the second copy is in the first one's
 * place the moment the animation loops and the join is invisible. That needs no
 * JavaScript at all, which means it also works before hydration and cannot get
 * stuck in a half-transitioned state.
 *
 * The duplicate is hidden from assistive technology — a screen reader should
 * hear each photograph once, and these are decorative anyway.
 *
 * It stops on hover and on keyboard focus, and does not move at all for anyone
 * who has asked their system for reduced motion. Something that slides
 * continuously and cannot be stopped is a genuine accessibility problem, not a
 * matter of taste.
 */
export default function ImageMarquee({
	images,
	label,
	/** Seconds for one full pass. Longer is slower. */
	duration = 60,
}: {
	images: readonly string[];
	label: string;
	duration?: number;
}) {
	if (images.length === 0) return null;

	return (
		<div
			className={styles.viewport}
			role="group"
			aria-label={label}
			style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
		>
			<ul className={styles.track}>
				{images.map((src) => (
					<li key={src} className={styles.item}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={src} alt="" loading="lazy" />
					</li>
				))}
				{images.map((src) => (
					<li key={`${src}-repeat`} className={styles.item} aria-hidden="true">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={src} alt="" loading="lazy" />
					</li>
				))}
			</ul>
		</div>
	);
}
