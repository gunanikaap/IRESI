import Link from "next/link";
import styles from "./root-not-found.module.css";

/**
 * The last-resort 404, for addresses that match no route at all — anything with
 * more than one path segment, such as `/a/b/c`.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS ONE IS SELF-CONTAINED
 * ---------------------------------------------------------------------------
 * It sits at the root, so whatever it imports is loaded on **every** route of
 * the deployment, ADFLEX included. When it pulled in `globals.css` and the
 * IRESI header, it dragged IRESI's element rules — `h1…h5`, `a`, `p` — onto the
 * ADFLEX pages, where they outranked ADFLEX's own `:where()`-based base styles
 * and changed its headings, link colours and hover states.
 *
 * So this page carries every value it needs in its own module and imports
 * nothing global. Its styling is deliberately duplicated rather than shared.
 *
 * Single-segment addresses — `/anything` — never reach here: `[slug]` matches
 * them and calls `notFound()`, which resolves to `(site)/not-found.tsx` and
 * gets the full site chrome. That is the 404 nearly everyone sees.
 */
export default function RootNotFound() {
	return (
		<div className={styles.page}>
			<main className={styles.card}>
				<p className={styles.code}>404</p>
				<h1 className={styles.title}>Page not found</h1>
				<p className={styles.lead}>
					The address you followed does not exist on this site.
				</p>
				<p className={styles.actions}>
					<Link className={styles.button} href="/">
						IRESI home
					</Link>
					<Link className={styles.quiet} href="/adflex">
						ADFLEX
					</Link>
				</p>
			</main>
		</div>
	);
}
