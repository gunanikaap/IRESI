import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ProjectCard from "@/components/ProjectCard";
import ContentNotice from "@/components/ContentNotice";
import { listPublishedProjectsStatus } from "@/lib/repo";
import { canonical } from "@/lib/site";
import shared from "../shared.module.css";

export const metadata: Metadata = {
	title: "Projects",
	description:
		"Explore the research projects delivered by the IRESI Centre at Maynooth University.",
	...canonical("/projects"),
};

export default async function ProjectsPage() {
	const { data: projects, degraded } = await listPublishedProjectsStatus();

	return (
		<>
			<PageHero
				title="Our Projects"
				subtitle="Research and innovation projects advancing energy systems integration across Europe."
			/>

			<section className="section">
				<div className="container">
					{projects.length > 0 ? (
						<ul className={shared.cardGrid}>
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
