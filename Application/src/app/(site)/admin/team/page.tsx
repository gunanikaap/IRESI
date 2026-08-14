import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listAllTeam } from "@/lib/repo";
import { togglePublished, removeTeamMember } from "../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

/**
 * The team page's people.
 *
 * Ordered by `sort_order` and then by id, which is the order the public page
 * uses — so this list reads top to bottom exactly as the page does, and moving
 * somebody is a matter of changing one number rather than guessing.
 */
export default async function AdminTeamPage(props: PageProps<"/admin/team">) {
	await requireUser();
	const people = await listAllTeam();
	const params = await props.searchParams;

	return (
		<>
			<h1 className={styles.pageTitle}>Team</h1>
			<p className={styles.pageLead}>
				The people shown on the Team page, in the order they appear there.
			</p>

			{params.saved && <p className={styles.notice}>Saved.</p>}
			{params.deleted && <p className={styles.notice}>Person removed.</p>}

			<p className={styles.formActions}>
				<Link className="button" href="/admin/team/new">
					Add a person
				</Link>
			</p>

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{people.length} {people.length === 1 ? "person" : "people"}
					</h2>
				</div>

				{people.length === 0 ? (
					<p className={styles.empty}>
						Nobody here yet. Use <strong>Add a person</strong> above, or run{" "}
						<code>npm run db:seed</code> to load the current website&rsquo;s team.
					</p>
				) : (
					<ul className={styles.entryList}>
						{people.map((person) => {
							const photo = person.photo_media_id
								? `/media/${person.photo_media_id}`
								: person.photo_path;
							return (
								<li key={person.id} className={styles.entry}>
									{photo ? (
										/* eslint-disable-next-line @next/next/no-img-element */
										<img
											src={photo}
											alt=""
											width={40}
											height={40}
											style={{
												width: 40,
												height: 40,
												objectFit: "cover",
												borderRadius: "50%",
												flex: "0 0 auto",
											}}
										/>
									) : null}

									<div className={styles.entryMain}>
										<div className={styles.entryTitle}>{person.name}</div>
										<div className={styles.entryMeta}>
											{person.role || "No role given"} · position {person.sort_order}
										</div>
									</div>

									<span
										className={`${styles.status} ${
											person.published ? styles.statusLive : styles.statusDraft
										}`}
									>
										{person.published ? "Shown" : "Hidden"}
									</span>

									<div className={styles.entryActions}>
										<Link className={styles.smallButton} href={`/admin/team/${person.id}`}>
											Edit
										</Link>

										<form action={togglePublished}>
											<input type="hidden" name="table" value="team_members" />
											<input type="hidden" name="id" value={person.id} />
											<input
												type="hidden"
												name="published"
												value={person.published ? "false" : "true"}
											/>
											<button className={styles.smallButton} type="submit">
												{person.published ? "Hide" : "Show"}
											</button>
										</form>

										<form action={removeTeamMember}>
											<input type="hidden" name="id" value={person.id} />
											<ConfirmSubmit
												className={`${styles.smallButton} ${styles.dangerButton}`}
												label="Delete"
												title={`Remove ${person.name}?`}
												message="This removes them from the team page entirely. If they have simply left, consider hiding them instead — that keeps the entry here. This cannot be undone."
												confirmLabel="Remove person"
											/>
										</form>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</>
	);
}
