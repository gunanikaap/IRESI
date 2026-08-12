import Link from "next/link";
import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import ContentNotice from "@/components/ContentNotice";
import { listPublishedProjectsStatus } from "@/lib/repo";
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
	// The home page previews a handful; the rest live on /projects.
	const featured = projects.slice(0, 4);
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
						<Link className="buttonOutline" href="/about-us">
							Learn More
						</Link>
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
					<ul className={styles.collage}>
						{home.about.collage.map((src) => (
							<li key={src}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={src} alt="" width={278} height={307} loading="lazy" />
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="section section--alt">
				<div className={`container ${styles.focusGrid}`}>
					<div>
						<span className="eyebrow">{home.focus.eyebrow}</span>
						<h2>{home.focus.heading}</h2>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							className={styles.focusImage}
							src={home.focus.image}
							alt=""
							width={600}
							height={396}
							loading="lazy"
						/>
					</div>
					<ul className={styles.focusList}>
						{home.focus.items.map((item) => (
							<li key={item.title}>
								<h3>{item.title}</h3>
								<p>{item.text}</p>
							</li>
						))}
					</ul>
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
						<Link className="button" href="/contact">
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
		</>
	);
}
