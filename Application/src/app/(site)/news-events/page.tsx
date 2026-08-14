import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContentNotice from "@/components/ContentNotice";
import { listPublishedNewsStatus } from "@/lib/repo";
import { canonical } from "@/lib/site";
import styles from "./news.module.css";

export const metadata: Metadata = {
	title: "News & Events",
	description: "News, events and highlights from the IRESI Centre at Maynooth University.",
	...canonical("/news-events"),
};

const dateFormat = new Intl.DateTimeFormat("en-IE", {
	day: "numeric",
	month: "long",
	year: "numeric",
	timeZone: "Europe/Dublin",
});

/**
 * `published_on` is a plain `YYYY-MM-DD` string, never a Date from `pg`.
 * Parsing it as UTC and formatting in Dublin keeps an entry dated the 1st from
 * rendering as the 31st. See the note on dates in the platform handover.
 */
function formatDate(iso: string): string {
	return dateFormat.format(new Date(`${iso}T12:00:00Z`));
}

export default async function NewsPage() {
	const { data: items, degraded } = await listPublishedNewsStatus();
	// "Unlisted" means kept off this page, not withdrawn — the entry still
	// answers at its own address.
	const listed = items.filter((item) => !item.unlisted);

	return (
		<>
			<PageHero title="News & Events" />

			<section className="section">
				<div className="container">
					{listed.length > 0 ? (
						<ul className={styles.grid}>
							{listed.map((item) => {
								const href = item.slug ? `/${item.slug}` : null;
								const body = (
									<>
										{item.images[0] && (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												className={styles.image}
												src={`/media/${item.images[0].id}`}
												alt=""
												width={480}
												height={300}
												loading="lazy"
											/>
										)}
										<div className={styles.body}>
											<h2>{item.title}</h2>
											<p>{item.summary}</p>
											<div className={styles.footer}>
												<time dateTime={item.published_on}>{formatDate(item.published_on)}</time>
												{href && <span className={styles.cta}>Read More &raquo;</span>}
											</div>
										</div>
									</>
								);

								return (
									<li key={item.id} className={styles.post}>
										{href ? (
											<Link className={styles.link} href={href}>
												{body}
											</Link>
										) : (
											<div className={styles.link}>{body}</div>
										)}
									</li>
								);
							})}
						</ul>
					) : (
						<ContentNotice degraded={degraded} what="news items" />
					)}
				</div>
			</section>
		</>
	);
}
