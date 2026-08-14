import Link from "next/link";
import styles from "./not-found.module.css";

/**
 * The 404 nearly every visitor sees.
 *
 * `/anything` is matched by `[slug]`, which calls `notFound()` when the address
 * is not a project, research topic or news entry — and that resolves to the
 * nearest boundary, which is this one. It renders inside the IRESI layout, so
 * the header, footer and stylesheet come for free.
 *
 * The root `app/not-found.tsx` catches what is left: addresses with more than
 * one segment, which match no route at all.
 */
export default function NotFound() {
	return (
		<section className={`section ${styles.notFound}`}>
			<div className="container">
				<p className={styles.code}>404</p>
				<h1>Page not found</h1>
				<p className="lead">
					The page you were looking for may have moved or no longer exists. Try one of the links
					below, or <Link href="/contact">get in touch</Link>.
				</p>
				<ul className={styles.links}>
					<li>
						<Link className="button" href="/">
							Home
						</Link>
					</li>
					<li>
						<Link className="buttonOutline buttonOutlineDark" href="/projects">
							Projects
						</Link>
					</li>
					<li>
						<Link className="buttonOutline buttonOutlineDark" href="/publications">
							Publications
						</Link>
					</li>
					<li>
						<Link className="buttonOutline buttonOutlineDark" href="/news-events">
							News &amp; Events
						</Link>
					</li>
				</ul>
			</div>
		</section>
	);
}
