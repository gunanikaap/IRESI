import { requireUser } from "@/lib/auth";
import TeamForm from "../TeamForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
	await requireUser();

	return (
		<>
			<h1 className={styles.pageTitle}>Add a person</h1>
			<p className={styles.pageLead}>
				They appear on the Team page as soon as you save, unless you untick “Show on the team
				page”.
			</p>
			<TeamForm />
		</>
	);
}
