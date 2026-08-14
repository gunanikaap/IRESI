import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTeamMember } from "@/lib/repo";
import TeamForm from "../TeamForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditTeamMemberPage(props: PageProps<"/admin/team/[id]">) {
	await requireUser();

	const { id } = await props.params;
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) notFound();

	const member = await getTeamMember(numericId);
	if (!member) notFound();

	return (
		<>
			<h1 className={styles.pageTitle}>{member.name}</h1>
			<p className={styles.pageLead}>{member.role || "No role given yet."}</p>
			<TeamForm member={member} />
		</>
	);
}
