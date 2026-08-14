import { requireUser } from "@/lib/auth";
import { PAGE_IMAGE_SLOTS, listPageImages } from "@/lib/repo";
import { movePageImage, removePageImage } from "../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import UploadForm from "./UploadForm";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

const SLOT = "about-collage" as const;

/**
 * The photographs on the About page.
 *
 * One slot for now — the scrolling strip. `page_images` is keyed by slot rather
 * than being a table per place, so the next one to become editable is a row in
 * `PAGE_IMAGE_SLOTS` and a second section here, not another migration.
 */
export default async function AdminImagesPage(props: PageProps<"/admin/images">) {
	await requireUser();

	const { data: images, degraded } = await listPageImages(SLOT);
	const params = await props.searchParams;

	return (
		<>
			<h1 className={styles.pageTitle}>Page photographs</h1>
			<p className={styles.pageLead}>
				The scrolling strip of photographs near the bottom of the About page. They appear in the
				order below and repeat continuously, so there is no first or last picture — only the
				order they follow one another in.
			</p>

			{params.added && (
				<p className={styles.notice}>
					{params.added === "1" ? "Photograph added." : `${params.added} photographs added.`}
				</p>
			)}
			{params.deleted && <p className={styles.notice}>Photograph removed.</p>}

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>{PAGE_IMAGE_SLOTS[SLOT]}</h2>
				</div>
				<UploadForm slot={SLOT} />
			</div>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{images.length} {images.length === 1 ? "photograph" : "photographs"}
					</h2>
				</div>

				{degraded ? (
					<p className={styles.empty}>
						These could not be read from the database just now. Nothing has been lost — reload the
						page.
					</p>
				) : images.length === 0 ? (
					<p className={styles.empty}>
						None yet. Add some above, or run <code>npm run db:seed</code> to load the ones the
						current website uses.
					</p>
				) : (
					<ul className={styles.entryList}>
						{images.map((image, index) => (
							<li key={image.id} className={styles.entry}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={`/media/${image.media_id}`}
									alt=""
									width={72}
									height={48}
									style={{ width: 72, height: 48, objectFit: "cover", flex: "0 0 auto" }}
								/>

								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>Position {index + 1}</div>
									<div className={styles.entryMeta}>{image.alt || "No description given"}</div>
								</div>

								<div className={styles.entryActions}>
									<form action={movePageImage}>
										<input type="hidden" name="slot" value={SLOT} />
										<input type="hidden" name="id" value={image.id} />
										<input type="hidden" name="direction" value="up" />
										<button className={styles.smallButton} type="submit" disabled={index === 0}>
											Move up
										</button>
									</form>

									<form action={movePageImage}>
										<input type="hidden" name="slot" value={SLOT} />
										<input type="hidden" name="id" value={image.id} />
										<input type="hidden" name="direction" value="down" />
										<button
											className={styles.smallButton}
											type="submit"
											disabled={index === images.length - 1}
										>
											Move down
										</button>
									</form>

									<form action={removePageImage}>
										<input type="hidden" name="id" value={image.id} />
										<ConfirmSubmit
											className={`${styles.smallButton} ${styles.dangerButton}`}
											label="Remove"
											title="Remove this photograph?"
											message="It is taken off the About page. This cannot be undone."
											confirmLabel="Remove photograph"
										/>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	);
}
