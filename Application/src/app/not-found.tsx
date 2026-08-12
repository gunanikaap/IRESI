import Link from "next/link";
import styles from "./not-found.module.css";

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
