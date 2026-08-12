import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContentNotice from "@/components/ContentNotice";
import { listPublishedPublicationsStatus, type Publication } from "@/lib/repo";
import { researchers } from "@/projects/iresi/content";
import { canonical } from "@/lib/site";
import styles from "./publications.module.css";

export const metadata: Metadata = {
	title: "Publications",
	description:
		"Academic publications, reports and collaborative research outputs from the IRESI Centre.",
	...canonical("/publications"),
};

export default async function PublicationsPage() {
	const { data: publications, degraded } = await listPublishedPublicationsStatus();

	// Group under the researcher profiles the project lists. Anything whose
	// `researcher_slug` matches nothing — including entries with none set —
	// falls into a final "Other publications" group rather than vanishing.
	const grouped = researchers.map((researcher) => ({
		researcher,
		papers: publications.filter((p) => p.researcher_slug === researcher.slug),
	}));

	const known = new Set(researchers.map((r) => r.slug));
	const ungrouped = publications.filter(
		(p) => !p.researcher_slug || !known.has(p.researcher_slug)
	);

	return (
		<>
			<PageHero
				eyebrow="Horizon Europe"
				title="Publications & Research Outputs"
				subtitle="Explore our academic publications, reports, and collaborative research outputs contributing to the clean energy transition."
			/>

			{publications.length === 0 ? (
				<section className="section">
					<div className="container">
						<ContentNotice degraded={degraded} what="publications" />
					</div>
				</section>
			) : (
				<>
					{grouped.map(({ researcher, papers }, index) => (
						<section
							key={researcher.slug}
							className={`section ${index % 2 === 1 ? "section--alt" : ""}`}
						>
							<div className="container">
								<div className={styles.researcher}>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										className={styles.photo}
										src={researcher.photo}
										alt={researcher.name}
										width={300}
										height={286}
										loading="lazy"
									/>
									<div>
										<h2>{researcher.name}</h2>
										<p className={styles.title}>{researcher.title}</p>
										{researcher.intro.map((paragraph) => (
											<p key={paragraph.slice(0, 40)} className={styles.bio}>
												{paragraph}
											</p>
										))}
										<a
											className="button"
											href={researcher.profileUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											View All
										</a>
									</div>
								</div>
								<PublicationList papers={papers} />
							</div>
						</section>
					))}

					{ungrouped.length > 0 && (
						<section className="section">
							<div className="container">
								<h2>Other publications</h2>
								<PublicationList papers={ungrouped} />
							</div>
						</section>
					)}
				</>
			)}
		</>
	);
}

function PublicationList({ papers }: { papers: Publication[] }) {
	if (papers.length === 0) {
		return <p className="muted">No publications listed here yet.</p>;
	}

	return (
		<ul className={styles.list}>
			{papers.map((paper) => (
				<li key={paper.id} className={styles.publication}>
					<h3>{paper.title}</h3>
					<dl className={styles.meta}>
						{paper.authors && (
							<div>
								<dt>Authors</dt>
								<dd>{paper.authors}</dd>
							</div>
						)}
						{(paper.date_text || paper.year) && (
							<div>
								<dt>Publication date</dt>
								<dd>{paper.date_text ?? String(paper.year)}</dd>
							</div>
						)}
						{(paper.journal || paper.venue) && (
							<div>
								<dt>Journal</dt>
								<dd>{paper.journal ?? paper.venue}</dd>
							</div>
						)}
						{paper.volume && (
							<div>
								<dt>Volume</dt>
								<dd>{paper.volume}</dd>
							</div>
						)}
						{paper.pages && (
							<div>
								<dt>Pages</dt>
								<dd>{paper.pages}</dd>
							</div>
						)}
						{paper.publisher && (
							<div>
								<dt>Publisher</dt>
								<dd>{paper.publisher}</dd>
							</div>
						)}
					</dl>
					{paper.description && <p className={styles.description}>{paper.description}</p>}
					{paper.url && (
						<a
							className={styles.readLink}
							href={paper.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							Read &rsaquo;
						</a>
					)}
				</li>
			))}
		</ul>
	);
}
