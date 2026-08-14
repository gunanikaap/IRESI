import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllProjects } from "@/lib/repo";
import { togglePublished, removeProject } from "../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage(props: PageProps<"/admin/projects">) {
	await requireUser();
	const projects = await listAllProjects();
	const params = await props.searchParams;

	return (
		<>
			<h1 className={styles.pageTitle}>Projects</h1>
			<p className={styles.pageLead}>
				The research projects listed on the website. Each published project gets its own page at
				the address in its web address field.
			</p>

			{params.saved && <p className={styles.notice}>Project saved.</p>}
			{params.deleted && <p className={styles.notice}>Project deleted.</p>}

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{projects.length} {projects.length === 1 ? "project" : "projects"}
					</h2>
					<Link className={styles.smallButton} href="/admin/projects/new">
						Add a project
					</Link>
				</div>

				{projects.length === 0 ? (
					<p className={styles.empty}>
						No projects yet. Add one, or run <code>npm run db:seed</code> to load the current
						website&rsquo;s projects.
					</p>
				) : (
					<ul className={styles.entryList}>
						{projects.map((entry) => (
							<li key={entry.id} className={styles.entry}>
								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>{entry.title}</div>
									<div className={styles.entryMeta}>
										/{entry.slug}
										{entry.external_only && " · links out, no page of its own"}
									</div>
								</div>

								<span
									className={`${styles.status} ${
										entry.published ? styles.statusLive : styles.statusDraft
									}`}
								>
									{entry.published ? "Published" : "Draft"}
								</span>

								<div className={styles.entryActions}>
									<Link className={styles.smallButton} href={`/admin/projects/${entry.id}`}>
										Edit
									</Link>

									<form action={togglePublished}>
										<input type="hidden" name="table" value="projects" />
										<input type="hidden" name="id" value={entry.id} />
										<input
											type="hidden"
											name="published"
											value={entry.published ? "false" : "true"}
										/>
										<button className={styles.smallButton} type="submit">
											{entry.published ? "Unpublish" : "Publish"}
										</button>
									</form>

									<form action={removeProject}>
										<input type="hidden" name="id" value={entry.id} />
										<ConfirmSubmit
											className={`${styles.smallButton} ${styles.dangerButton}`}
											label="Delete"
											title={`Delete "${entry.title}"?`}
											message="This removes the project and its page from the website, along with any images only it uses. It cannot be undone."
											confirmLabel="Delete project"
										/>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	);
}
