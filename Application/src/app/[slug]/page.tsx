import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Prose from "@/components/Prose";
import { getPublishedProjectBySlug, getPublishedNewsBySlug, type Project } from "@/lib/repo";
import { researchTopics } from "@/projects/iresi/content";
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
		const { topic } = found;
		return (
			<>
				<PageHero eyebrow="Research" title={topic.title} subtitle={topic.summary} />
				<section className="section">
					<div className="container">
						<Prose sections={topic.sections} />
						<ul className={styles.related}>
							<li>
								<Link href="/projects">See our projects &rsaquo;</Link>
							</li>
							<li>
								<Link href="/publications">See our publications &rsaquo;</Link>
							</li>
						</ul>
					</div>
				</section>
			</>
		);
	}

	if (found.kind === "project") {
		const { project } = found;
		const hero = project.hero_media_id ? `/media/${project.hero_media_id}` : project.hero_image;

		return (
			<article>
				<section className={styles.projectHero}>
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

				{hero && (
					<section className="section">
						<div className="container">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								className={styles.projectImage}
								src={hero}
								alt={`${project.title} project`}
								loading="lazy"
							/>
						</div>
					</section>
				)}

				{project.vimeo_id && (
					<section className="section" id="video">
						<div className="container">
							<h2>Watch the demo</h2>
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

				<section className="section section--alt">
					<div className="container">
						<h2>About project</h2>
						<Prose sections={parseBody(project.body)} className={styles.projectBody} />
						<p className={styles.back}>
							<Link href="/projects">&larr; All projects</Link>
						</p>
					</div>
				</section>
			</article>
		);
	}

	const { item } = found;
	return (
		<article className="section">
			<div className={`container ${styles.news}`}>
				<p className={styles.back}>
					<Link href="/news-events">&larr; News &amp; Events</Link>
				</p>
				<h1 className={styles.newsTitle}>{item.title}</h1>
				<p className={styles.meta}>
					{item.author && <span>{item.author}</span>}
					<time dateTime={item.published_on}>{item.published_on}</time>
				</p>
				{item.images[0] && (
					// eslint-disable-next-line @next/next/no-img-element
					<img className={styles.newsImage} src={`/media/${item.images[0].id}`} alt="" />
				)}
				<Prose sections={parseBody(item.body)} className={styles.newsBody} />
				{item.images.length > 1 && (
					<ul className={styles.gallery}>
						{item.images.slice(1).map((image) => (
							<li key={image.id}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={`/media/${image.id}`} alt={image.alt} loading="lazy" />
							</li>
						))}
					</ul>
				)}
			</div>
		</article>
	);
}

/**
 * Bodies are stored as plain text: blank-line-separated paragraphs, with `## `
 * marking a heading and `- ` a bullet. Same shape as the developer-managed copy
 * in the content module, so one component renders both.
 */
function parseBody(body: string) {
	const sections: { heading: string | null; paragraphs: string[]; bullets: string[] }[] = [];
	let current = { heading: null as string | null, paragraphs: [] as string[], bullets: [] as string[] };

	for (const block of body.split(/\r?\n\s*\r?\n/)) {
		const text = block.trim();
		if (!text) continue;

		const heading = /^##\s+(.*)$/.exec(text);
		if (heading) {
			if (current.heading || current.paragraphs.length || current.bullets.length) {
				sections.push(current);
			}
			current = { heading: heading[1].trim(), paragraphs: [], bullets: [] };
			continue;
		}
		if (text.startsWith("- ")) {
			for (const line of text.split(/\r?\n/)) {
				const bullet = /^-\s+(.*)$/.exec(line.trim());
				if (bullet) current.bullets.push(bullet[1].trim());
			}
			continue;
		}
		current.paragraphs.push(text.replace(/\r?\n/g, " "));
	}

	if (current.heading || current.paragraphs.length || current.bullets.length) sections.push(current);
	return sections;
}
