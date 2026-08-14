import Link from "next/link";
import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import ContentNotice from "@/components/ContentNotice";
import ImageColumns from "@/components/ImageColumns";
import EventCountdown from "@/components/EventCountdown";
import { getNextUpcomingEvent, listPublishedProjectsStatus } from "@/lib/repo";
import { home, partners } from "@/projects/iresi/content";
import { project } from "@/projects";
import { canonical } from "@/lib/site";
import styles from "./home.module.css";

export const metadata: Metadata = {
	description: project.description,
	...canonical("/"),
};

export default async function HomePage() {
	const { data: projects, degraded } = await listPublishedProjectsStatus();

	/*
	 * The next event nobody has been to yet, announced as a countdown panel.
	 * `safeRead` inside means this is null with no database, so the home page is
	 * unchanged on a deployment that has none — and null is also the ordinary
	 * answer, because most of the time there is no event pending.
	 */
	const upcomingEvent = await getNextUpcomingEvent();

	/*
	 * The four the live home page leads with, named rather than taken off the
	 * top of the list: the ordering that governs /projects is not the same
	 * judgement as which four introduce the centre. Anything named but not
	 * published simply does not appear.
	 */
	const FEATURED = ["renew", "res4city", "flow", "lero"];
	const featured = FEATURED.map((slug) => projects.find((p) => p.slug === slug)).filter(
		(p) => p !== undefined
	);

	const allPartners = [...partners.industry, ...partners.research];

	return (
		<>
			<section
				className={styles.hero}
				style={{ backgroundImage: `var(--gradient-banner-overlay), url(${home.hero.image})` }}
			>
				<div className={`container ${styles.heroInner}`}>
					<h1>
						{home.hero.headline} <span>{home.hero.headlineMuted}</span>
					</h1>
					<p>{home.hero.intro}</p>
					<div className={styles.heroActions}>
						<Link className="button" href="/projects">
							Explore Projects
						</Link>
						{/* Down to the About section on this page, not off to /about-us —
						    the point of the button is to keep reading here. */}
						<a className="buttonOutline" href="#aboutus">
							Learn More
						</a>
					</div>
				</div>
			</section>

			<section className={`section ${styles.statsSection}`}>
				<div className="container">
					<ul className={styles.stats}>
						{home.stats.map((stat) => (
							<li key={stat.label}>
								<strong>{stat.value}</strong>
								<span>{stat.label}</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="section" id="aboutus">
				<div className={`container ${styles.aboutGrid}`}>
					<div>
						<span className="eyebrow">{home.about.eyebrow}</span>
						<h2>{home.about.heading}</h2>
						{home.about.paragraphs.map((paragraph) => (
							<p key={paragraph.slice(0, 40)}>{paragraph}</p>
						))}
						<Link className="button" href="/about-us">
							Learn More
						</Link>
					</div>
					<ImageColumns images={home.about.collage} label="Photographs from around the centre" />
				</div>
			</section>

			<section className="section section--alt">
				<div className={`container ${styles.focusGrid}`}>
					<div className={styles.focusIntro}>
						<span className="eyebrow">{home.focus.eyebrow}</span>
						<h2>{home.focus.heading}</h2>
						<div className={styles.focusFrame}>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={home.focus.image} alt="" width={600} height={396} loading="lazy" />
						</div>
					</div>

					{/*
					 * Numbered rather than four equal boxes. They are the four things
					 * the centre does, and a numbered sequence reads as a set rather
					 * than as a grid of unrelated tiles.
					 */}
					<ol className={styles.focusList}>
						{home.focus.items.map((item, index) => (
							<li key={item.title}>
								<span className={styles.focusNumber} aria-hidden="true">
									{String(index + 1).padStart(2, "0")}
								</span>
								<div>
									<h3>{item.title}</h3>
									<p>{item.text}</p>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>

			<section className="section" id="projects">
				<div className="container">
					<span className="eyebrow">What We Worked On</span>
					<h2>Our Projects</h2>
					{featured.length > 0 ? (
						<>
							<ul className={styles.projectGrid}>
								{featured.map((item) => (
									<li key={item.id}>
										<ProjectCard project={item} />
									</li>
								))}
							</ul>
							<p className={styles.sectionCta}>
								<Link className="button" href="/projects">
									See More
								</Link>
							</p>
						</>
					) : (
						<ContentNotice degraded={degraded} what="projects" />
					)}
				</div>
			</section>

			<section className="section section--alt" id="partners">
				<div className="container">
					<span className="eyebrow">Who We Work With</span>
					<h2>Partners &amp; Collaborations</h2>
					<p className="lead">
						We collaborate with leading research institutions and industry partners across Europe to
						advance sustainable energy innovation.
					</p>
					<ul className={styles.logoGrid}>
						{allPartners.map((partner) => (
							<li key={partner.name}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={partner.logo} alt={partner.name} loading="lazy" />
							</li>
						))}
					</ul>
					<p className={styles.sectionCta}>
						<Link className="button" href="/partners">
							Join Our Network
						</Link>
					</p>
				</div>
			</section>

			<section className={styles.ctaBand}>
				<div className="container">
					<h2>{home.cta.heading}</h2>
					<p>{home.cta.text}</p>
					<Link className="buttonOutline" href="/contact">
						Get In Touch
					</Link>
				</div>
			</section>
			{upcomingEvent && <EventCountdown event={upcomingEvent} />}
		</>
	);
}
