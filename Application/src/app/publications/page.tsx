import type { Metadata } from "next";
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
	openGraph: { images: ["/images/banners/research-desk.jpg"] },
};

export default async function PublicationsPage() {
	const { data: publications, degraded } = await listPublishedPublicationsStatus();

	// Grouped under the researcher profiles the project lists. Anything whose
	// `researcher_slug` matches nothing — including entries with none set —
	// falls into a final group rather than vanishing.
	const groups = researchers.map((researcher) => ({
		researcher,
		papers: publications.filter((p) => p.researcher_slug === researcher.slug),
	}));

	const known = new Set(researchers.map((r) => r.slug));
	const ungrouped = publications.filter((p) => !p.researcher_slug || !known.has(p.researcher_slug));

	return (
		<>
			<section className={styles.hero}>
				<div className={`container ${styles.heroInner}`}>
					<span className={styles.eyebrow}>Horizon Europe</span>
					<h1>Publications &amp; Research Outputs</h1>
					<p className={styles.heroLead}>
						Explore our academic publications, reports, and collaborative research outputs
						contributing to the clean energy transition.
					</p>
				</div>
			</section>

			{publications.length === 0 ? (
				<section className="section">
					<div className="container">
						<ContentNotice degraded={degraded} what="publications" />
					</div>
				</section>
			) : (
				<>
					{groups.map(({ researcher, papers }, index) => (
						<section
							key={researcher.slug}
							className={`section ${index % 2 === 1 ? "section--alt" : ""}`}
						>
							<div className="container">
								{/*
								 * Photograph beside the profile, as on the live page. The
								 * photograph is sticky on a wide screen so it stays with the
								 * papers as they scroll — a list of four citations is taller
								 * than the profile that introduces it.
								 */}
								<div className={styles.researcher}>
									<div className={styles.portrait}>
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={researcher.photo} alt={researcher.name} loading="lazy" />
									</div>

									<div className={styles.profile}>
										<h2>{researcher.name}</h2>
										<p className={styles.role}>{researcher.title}</p>
										{researcher.intro.map((paragraph) => (
											<p key={paragraph.slice(0, 40)} className={styles.bio}>
												{paragraph}
											</p>
										))}
										<div className={styles.profileFoot}>
											<span className={styles.count}>
												{papers.length} {papers.length === 1 ? "paper" : "papers"} listed
											</span>
											<a
												className="button"
												href={researcher.profileUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												View all on Google Scholar
											</a>
										</div>
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
					<div className={styles.pubHead}>
						{paper.year && <span className={styles.year}>{paper.year}</span>}
						<h3>{paper.title}</h3>
					</div>

					{paper.authors && <p className={styles.authors}>{paper.authors}</p>}

					{/*
					 * The live page runs the citation together as one line of running
					 * text. A definition list gives each field a label the eye can find,
					 * which is what a citation is for.
					 */}
					<dl className={styles.meta}>
						{(paper.date_text || paper.year) && (
							<div>
								<dt>Published</dt>
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
							Read the paper
						</a>
					)}
				</li>
			))}
		</ul>
	);
}
