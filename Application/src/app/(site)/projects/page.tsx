import type { Metadata } from "next";
import ProjectCard from "@/components/ProjectCard";
import ContentNotice from "@/components/ContentNotice";
import { listPublishedProjectsStatus } from "@/lib/repo";
import { canonical } from "@/lib/site";
import styles from "./projects.module.css";

export const metadata: Metadata = {
	title: "Projects",
	description:
		"Explore the research projects delivered by the IRESI Centre at Maynooth University.",
	openGraph: { images: ["/images/banners/grid-sunset.jpg"] },
	...canonical("/projects"),
};

export default async function ProjectsPage() {
	const { data: projects, degraded } = await listPublishedProjectsStatus();

	return (
		<>
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<span className={styles.eyebrow}>What we worked on</span>
					<h1>Our Projects</h1>
					<p className={styles.heroLead}>
						Research and innovation projects advancing energy systems integration across Europe,
						from community energy platforms to EV charging and green skills.
					</p>
				</div>
			</section>

			<section className="section">
				<div className="container">
					{projects.length > 0 ? (
						<ul className={styles.grid}>
							{projects.map((item) => (
								<li key={item.id}>
									<ProjectCard project={item} />
								</li>
							))}
						</ul>
					) : (
						<ContentNotice degraded={degraded} what="projects" />
					)}
				</div>
			</section>
		</>
	);
}
