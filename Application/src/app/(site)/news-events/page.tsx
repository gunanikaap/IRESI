import Link from "next/link";
import type { Metadata } from "next";
import ContentNotice from "@/components/ContentNotice";
import { isEvent, listPublishedNewsStatus, type NewsItem } from "@/lib/repo";
import { canonical } from "@/lib/site";
import { formatDate } from "@/lib/dates";
import styles from "./news.module.css";

export const metadata: Metadata = {
	title: "News & Events",
	description: "News, events and highlights from the IRESI Centre at Maynooth University.",
	openGraph: { images: ["/images/banners/seminar-audience.jpg"] },
	...canonical("/news-events"),
};

export default async function NewsPage() {
	const { data: items, degraded } = await listPublishedNewsStatus();
	// "Unlisted" means kept off this page, not withdrawn — the entry still
	// answers at its own address.
	const listed = items.filter((item) => !item.unlisted);

	/*
	 * The order is the database's, and deliberately not re-sorted here.
	 * `NEWS_ORDER` in repo.ts puts every event that has not happened yet above
	 * everything else, whatever its posting date, then orders those by when they
	 * start — so the next thing a reader could attend is the first thing they
	 * see. Sorting again in the page would mean two places to change it and one
	 * of them would eventually be forgotten.
	 */

	return (
		<>
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<span className={styles.eyebrow}>From the centre</span>
					<h1>News &amp; Events</h1>
					<p className={styles.heroLead}>
						Seminars, awards, outreach and the work our researchers are presenting across
						Ireland and Europe.
					</p>
				</div>
			</section>

			<section className="section">
				<div className="container">
					{listed.length > 0 ? (
						<ul className={styles.grid}>
							{listed.map((item) => (
								<li key={item.id}>
									<NewsCard item={item} />
								</li>
							))}
						</ul>
					) : (
						<ContentNotice degraded={degraded} what="news items" />
					)}
				</div>
			</section>
		</>
	);
}

function NewsCard({ item }: { item: NewsItem }) {
	const href = item.slug ? `/${item.slug}` : null;
	// The banner is the first image, written that way by the admin form.
	const image = item.images[0];

	const upcoming = item.kind === "upcoming" && !item.expired;
	const isEventEntry = isEvent(item.kind);

	const body = (
		<>
			<div className={styles.media}>
				{image ? (
					/* Served from the /media route, which sets its own cache and
					   content-type headers. */
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={`/media/${image.id}`}
						alt={image.alt || ""}
						width={480}
						height={300}
						loading="lazy"
					/>
				) : (
					<div className={styles.placeholder} aria-hidden="true" />
				)}
				{/*
				 * Only events still to come are marked. A "Past event" tag was on
				 * every other card and earned nothing: the date already says when it
				 * happened, and a badge is for the one thing worth interrupting a
				 * reader about.
				 */}
				{upcoming && <span className={styles.badge}>Upcoming event</span>}
			</div>
			<div className={styles.body}>
				{/*
				 * Two dates, and they are not the same thing. An event leads with when
				 * it happens — past or future, that is what the entry is about — and
				 * carries the posting date quietly underneath, the way a social post
				 * does. A news post has only the one date, so repeating it below would
				 * be noise.
				 */}
				{isEventEntry && item.event_date ? (
					<time className={styles.date} dateTime={item.event_date}>
						{formatDate(item.event_date)}
						{upcoming && item.event_time && ` · ${item.event_time}`}
					</time>
				) : (
					<time className={styles.date} dateTime={item.published_on}>
						{formatDate(item.published_on)}
					</time>
				)}
				<h2>{item.title}</h2>
				<p>{item.summary}</p>
				<div className={styles.foot}>
					{href && <span className={styles.cta}>Read more</span>}
					{isEventEntry && item.event_date && (
						<time className={styles.posted} dateTime={item.published_on}>
							Posted {formatDate(item.published_on)}
						</time>
					)}
				</div>
			</div>
		</>
	);

	return (
		<article className={styles.post}>
			{href ? (
				<Link className={styles.link} href={href}>
					{body}
				</Link>
			) : (
				<div className={styles.link}>{body}</div>
			)}
		</article>
	);
}
