"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./MediaGallery.module.css";

export type GalleryImage = { src: string; alt: string };

/**
 * Project screenshots, enlargeable.
 *
 * The pictures on a project page are interface mockups — dashboards, charts,
 * forms — and at grid size the thing they are meant to show is unreadable. Each
 * one opens full-screen.
 *
 * The overlay is a native `<dialog>` opened with `showModal()`, which brings the
 * focus trap, the inert background, the backdrop and Escape-to-close with it. A
 * hand-rolled overlay would have to reimplement all four, and usually gets the
 * focus trap wrong.
 */
export default function MediaGallery({
	images,
	variant = "grid",
}: {
	images: readonly GalleryImage[];
	variant?: "grid" | "hero";
}) {
	const [open, setOpen] = useState<number | null>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open === null) {
			if (dialog.open) dialog.close();
		} else if (!dialog.open) {
			dialog.showModal();
		}
	}, [open]);

	const step = useCallback(
		(delta: number) =>
			setOpen((i) => (i === null ? i : (i + delta + images.length) % images.length)),
		[images.length],
	);

	if (images.length === 0) return null;

	const current = open === null ? null : { index: open, image: images[open] };

	return (
		<>
			{variant === "hero" ? (
				<button
					type="button"
					className={styles.hero}
					onClick={() => setOpen(0)}
					aria-label={`Enlarge ${images[0].alt}`}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={images[0].src} alt={images[0].alt} />
					<Zoom />
				</button>
			) : (
				<ul className={styles.grid}>
					{images.map((image, i) => (
						<li key={image.src}>
							<button
								type="button"
								className={styles.thumb}
								onClick={() => setOpen(i)}
								aria-label={`Enlarge ${image.alt}`}
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={image.src} alt={image.alt} loading="lazy" />
								<Zoom />
							</button>
						</li>
					))}
				</ul>
			)}

			<dialog
				ref={dialogRef}
				className={styles.dialog}
				onClose={() => setOpen(null)}
				/* A click that lands on the dialog itself rather than on the figure
				   inside it is a click on the backdrop. */
				onClick={(event) => {
					if (event.target === dialogRef.current) setOpen(null);
				}}
				onKeyDown={(event) => {
					if (images.length < 2) return;
					if (event.key === "ArrowRight") {
						event.preventDefault();
						step(1);
					} else if (event.key === "ArrowLeft") {
						event.preventDefault();
						step(-1);
					}
				}}
			>
				{current && (
					<figure className={styles.figure}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img className={styles.full} src={current.image.src} alt={current.image.alt} />

						<button
							type="button"
							className={styles.close}
							onClick={() => setOpen(null)}
							aria-label="Close"
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M6 6l12 12M18 6L6 18" />
							</svg>
						</button>

						{images.length > 1 && (
							<>
								<button
									type="button"
									className={`${styles.step} ${styles.prev}`}
									onClick={() => step(-1)}
									aria-label="Previous image"
								>
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M15 5l-7 7 7 7" />
									</svg>
								</button>
								<button
									type="button"
									className={`${styles.step} ${styles.next}`}
									onClick={() => step(1)}
									aria-label="Next image"
								>
									<svg viewBox="0 0 24 24" aria-hidden="true">
										<path d="M9 5l7 7-7 7" />
									</svg>
								</button>
								<figcaption className={styles.count}>
									{current.index + 1} / {images.length}
								</figcaption>
							</>
						)}
					</figure>
				)}
			</dialog>
		</>
	);
}

function Zoom() {
	return (
		<span className={styles.zoom} aria-hidden="true">
			<svg viewBox="0 0 24 24">
				<circle cx="11" cy="11" r="6.5" />
				<path d="M15.8 15.8L21 21M11 8.5v5M8.5 11h5" />
			</svg>
		</span>
	);
}
