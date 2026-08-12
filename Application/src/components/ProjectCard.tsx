import Link from "next/link";
import type { Project } from "@/lib/repo";
import styles from "./ProjectCard.module.css";

/**
 * Card art comes from an uploaded image when an editor has chosen one, and
 * otherwise from the path carried over with the original site's content. An
 * editor replacing the picture uploads through the admin, which stores it in
 * `media` and sets `card_media_id` — so the fallback quietly stops being used
 * rather than needing to be cleared.
 */
function cardArt(project: Project): string | null {
	if (project.card_media_id) return `/media/${project.card_media_id}`;
	return project.card_image;
}

export default function ProjectCard({ project }: { project: Project }) {
	const href = project.external_only ? project.website : `/${project.slug}`;
	const external = Boolean(project.external_only && project.website);
	const art = cardArt(project);

	// A project with no page and no website has nowhere to send anyone; render it
	// as a plain card rather than a link to nothing.
	const body = (
		<>
			<div className={styles.media}>
				{art ? (
					/* Served either from /public or from the /media route, which sets its
					   own cache and content-type headers. next/image would put an
					   optimiser in front of both for no gain at this size. */
					// eslint-disable-next-line @next/next/no-img-element
					<img src={art} alt="" width={480} height={300} loading="lazy" />
				) : (
					<div className={styles.placeholder} aria-hidden="true" />
				)}
			</div>
			<div className={styles.body}>
				<h3>{project.title}</h3>
				<p>{project.summary}</p>
				{href && <span className={styles.cta}>{external ? "Visit site" : "Read more"} &rsaquo;</span>}
			</div>
		</>
	);

	if (!href) {
		return <article className={styles.card}>{body}</article>;
	}

	return (
		<article className={styles.card}>
			{external ? (
				<a
					className={styles.link}
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`${project.title} (opens in a new tab)`}
				>
					{body}
				</a>
			) : (
				<Link className={styles.link} href={href} aria-label={project.title}>
					{body}
				</Link>
			)}
		</article>
	);
}
