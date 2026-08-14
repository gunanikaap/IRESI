import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Prose from "@/components/Prose";
import RichText from "@/components/RichText";
import MediaGallery from "@/components/MediaGallery";
import ResearchTopic from "@/components/ResearchTopic";
import {
	getPublishedProjectBySlug,
	getPublishedNewsBySlug,
	isEvent,
	type Project,
} from "@/lib/repo";
import { researchTopics } from "@/projects/iresi/content";
import { parseBody } from "@/lib/page-text";
import { formatDate } from "@/lib/dates";
import { canonical } from "@/lib/site";
import styles from "./entry.module.css";

/**
 * Projects, research topics and news posts all lived at the root of the old
 * WordPress site — /renew, /renewables, /celebrating-science-night-... — so one
 * route serves all three and those addresses keep working when the domain is
 * repointed.
 *
 * Not statically generated: projects and news come from the database and an
 * editor publishing one should not have to wait for a rebuild. Research topics
 * are the exception and could be prerendered, but splitting the route to gain
 * that would mean two places to look for "where does /renewables come from".
 */

type Resolved =
	| { kind: "project"; project: Project }
	| { kind: "research"; topic: (typeof researchTopics)[number] }
	| { kind: "news"; item: Awaited<ReturnType<typeof getPublishedNewsBySlug>> & object };

async function resolve(slug: string): Promise<Resolved | null> {
	const topic = researchTopics.find((t) => t.slug === slug);
	if (topic) return { kind: "research", topic };

	const project = await getPublishedProjectBySlug(slug);
	if (project) return { kind: "project", project };

	const item = await getPublishedNewsBySlug(slug);
	if (item) return { kind: "news", item };

	return null;
}

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
	const { slug } = await props.params;
	const found = await resolve(slug);
	if (!found) return {};

	if (found.kind === "research") {
		return {
			title: found.topic.title,
			description: found.topic.summary,
			...canonical(`/${slug}`),
		};
	}
	if (found.kind === "project") {
		return {
			title: found.project.title,
			description: found.project.summary,
			...canonical(`/${slug}`),
		};
	}
	return {
		title: found.item.title,
		description: found.item.summary,
		...canonical(`/${slug}`),
	};
}

export default async function EntryPage(props: PageProps<"/[slug]">) {
	const { slug } = await props.params;
	const found = await resolve(slug);
	if (!found) notFound();

	if (found.kind === "research") {
		return <ResearchTopic topic={found.topic} />;
	}

	if (found.kind === "project") {
		const { project } = found;
		const hero = project.hero_media_id ? `/media/${project.hero_media_id}` : project.hero_image;

		const cardArt = project.card_media_id ? `/media/${project.card_media_id}` : project.card_image;

		return (
			<article>
				{/*
				 * The banner carries the project's own listing art behind a heavy
				 * scrim. The live pages use a flat gradient, which makes every
				 * project look identical in a browser's history; this gives each one
				 * its own colour without needing a photograph that does not exist.
				 */}
				<section
					className={styles.projectHero}
					style={
						cardArt
							? { backgroundImage: `var(--gradient-banner-photo), url(${cardArt})` }
							: undefined
					}
				>
					<div className="container">
						<h1>{project.page_title ?? project.title}</h1>
						{project.tags.length > 0 && (
							<ul className={styles.tags}>
								{project.tags.map((tag) => (
									<li key={tag}>{tag}</li>
								))}
							</ul>
						)}
						{project.intro.map((paragraph) => (
							<p key={paragraph.slice(0, 40)} className={styles.projectIntro}>
								{paragraph}
							</p>
						))}
						<div className={styles.actions}>
							{project.vimeo_id && (
								<a className="button" href="#video">
									Watch Demo
								</a>
							)}
							{project.website && (
								<a
									className="buttonOutline"
									href={project.website}
									target="_blank"
									rel="noopener noreferrer"
								>
									{project.website_label}
								</a>
							)}
						</div>
					</div>
				</section>

				{/*
				 * The demo leads, where there is one. A video is the quickest way to
				 * understand what a platform does, and it was below the fold under a
				 * still image of the same platform.
				 */}
				{project.vimeo_id && (
					<section className="section" id="video">
						<div className="container">
							<div className={styles.video}>
								<iframe
									src={`https://player.vimeo.com/video/${project.vimeo_id}`}
									title={`${project.title} demo video`}
									allow="autoplay; fullscreen; picture-in-picture"
									allowFullScreen
									loading="lazy"
								/>
							</div>
						</div>
					</section>
				)}

				{hero && (
					<section className={project.vimeo_id ? styles.tightSection : "section"}>
						<div className="container">
							<MediaGallery
								variant="hero"
								images={[{ src: hero, alt: `The ${project.title} platform` }]}
							/>
						</div>
					</section>
				)}

				{/*
				 * Every project's copy is the same three headings — Objective, Impact,
				 * Our Role — so they are laid out as a numbered index rather than a
				 * stack of paragraphs, which is what a reader skimming for one of the
				 * three actually needs.
				 */}
				<section className="section section--alt">
					<div className="container">
						<h2 className={styles.sectionHead}>About project</h2>
						<div className={styles.about}>
							{parseBody(project.body).map((section, i) => (
								<article className={styles.aboutBlock} key={section.heading ?? `s${i}`}>
									<div className={styles.aboutLabel}>
										<span className={styles.aboutNumber}>
											{String(i + 1).padStart(2, "0")}
										</span>
										{section.heading && <h3>{section.heading}</h3>}
									</div>
									<div className={styles.aboutText}>
										{section.paragraphs.map((paragraph) => (
											<p key={paragraph.slice(0, 40)}>
												<RichText text={paragraph} />
											</p>
										))}
										{section.bullets.length > 0 && (
											<ul>
												{section.bullets.map((bullet) => (
													<li key={bullet.slice(0, 40)}>
														<RichText text={bullet} />
													</li>
												))}
											</ul>
										)}
									</div>
								</article>
							))}
						</div>
					</div>
				</section>

				{/* The further screenshots the live pages carry below the main image. */}
				{project.gallery.length > 0 && (
					<section className="section">
						<div className="container">
							<h2 className={styles.sectionHead}>A closer look</h2>
							<MediaGallery
								images={project.gallery.map((src, i) => ({
									src,
									alt: `${project.title} screen ${i + 1}`,
								}))}
							/>
						</div>
					</section>
				)}

				<section className={styles.projectFoot}>
					<div className="container">
						<Link className={styles.back} href="/projects">
							&larr; All projects
						</Link>
						{project.website && (
							<a
								className="button"
								href={project.website}
								target="_blank"
								rel="noopener noreferrer"
							>
								{project.website_label}
							</a>
						)}
					</div>
				</section>
			</article>
		);
	}

	const { item } = found;
	// The banner is the first image and the gallery is the rest — one ordered
	// list, written that way by the admin form. See `saveNewsItem`.
	const banner = item.images[0];
	const gallery = item.images.slice(1);

	// An upcoming event whose end time has passed is presented as a past one.
	const upcoming = item.kind === "upcoming" && !item.expired;
	const isEventEntry = isEvent(item.kind);

	return (
		<article>
			{/*
			 * The post's own banner photograph behind the title, under the same
			 * scrim the project pages use. The live page opens on a flat grey
			 * band, which gives an event write-up — the one kind of entry that
			 * always has photographs — nothing to open on.
			 */}
			<section
				className={styles.newsHero}
				style={
					banner
						? { backgroundImage: `var(--gradient-banner-photo), url(/media/${banner.id})` }
						: undefined
				}
			>
				<div className={`container ${styles.newsHeroInner}`}>
					<Link className={styles.crumb} href="/news-events">
						&larr; News &amp; Events
					</Link>
					{isEventEntry && (
						<p className={styles.kindTag} data-upcoming={upcoming || undefined}>
							{upcoming ? "Upcoming event" : "Past event"}
						</p>
					)}
					<h1 className={styles.newsTitle}>{item.title}</h1>
					<p className={styles.meta}>
						{item.author && <span className={styles.author}>{item.author}</span>}
						<time dateTime={item.published_on}>Posted {formatDate(item.published_on)}</time>
					</p>
				</div>
			</section>

			<section className="section">
				<div className={`container ${styles.news}`}>
					{/*
					 * When, where and how to attend, above the write-up. An event page
					 * that makes a reader hunt through prose for the date has failed at
					 * the one thing it is for.
					 */}
					{isEventEntry && (item.event_date || item.location || item.booking_url) && (
						<dl className={styles.eventFacts}>
							{item.event_date && (
								<div>
									<dt>Date</dt>
									<dd>
										<time dateTime={item.event_date}>{formatDate(item.event_date)}</time>
									</dd>
								</div>
							)}
							{item.event_time && (
								<div>
									<dt>Time</dt>
									<dd>
										{item.event_time}
										{item.event_end_time && ` – ${item.event_end_time}`}
									</dd>
								</div>
							)}
							{item.location && (
								<div>
									<dt>Place</dt>
									<dd>{item.location}</dd>
								</div>
							)}
							{/*
							 * Booking is offered only while the event is still to come. A
							 * live "Book your place" on an event that finished last month
							 * is worse than no link at all.
							 */}
							{upcoming && item.booking_url && !item.slots_filled && (
								<div className={styles.eventAction}>
									<a
										className="button"
										href={item.booking_url}
										target="_blank"
										rel="noopener noreferrer"
									>
										Book your place
									</a>
								</div>
							)}
							{upcoming && item.slots_filled && (
								<div className={styles.eventAction}>
									<span className={styles.fullyBooked}>Fully booked</span>
								</div>
							)}
						</dl>
					)}

					{banner && (
						<div className={styles.newsImage}>
							<MediaGallery
								variant="hero"
								images={[{ src: `/media/${banner.id}`, alt: banner.alt || item.title }]}
							/>
						</div>
					)}

					<Prose sections={parseBody(item.body)} className={styles.newsBody} />

					{/* Written after the event, so it is only shown once there is one. */}
					{item.event_outcome && (
						<div className={styles.newsGallery}>
							<h2 className={styles.sectionHead}>How it went</h2>
							<Prose
								sections={parseBody(item.event_outcome)}
								className={styles.newsBody}
							/>
						</div>
					)}

					{item.event_video_url && (
						<p className={styles.newsBody}>
							<a href={item.event_video_url} target="_blank" rel="noopener noreferrer">
								Watch the recording
							</a>
						</p>
					)}

					{gallery.length > 0 && (
						<div className={styles.newsGallery}>
							<h2 className={styles.sectionHead}>
								{isEventEntry && !upcoming ? "From the day" : "Pictures"}
							</h2>
							<MediaGallery
								images={gallery.map((image, i) => ({
									src: `/media/${image.id}`,
									alt: image.alt || `${item.title} photo ${i + 2}`,
								}))}
							/>
						</div>
					)}
				</div>
			</section>

			<section className={styles.projectFoot}>
				<div className="container">
					<Link className={styles.back} href="/news-events">
						&larr; All news &amp; events
					</Link>
				</div>
			</section>
		</article>
	);
}


