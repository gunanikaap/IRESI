import { requireUser } from "@/lib/auth";
import ProjectForm from "../ProjectForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
	await requireUser();

	return (
		<>
			<h1 className={styles.pageTitle}>Add a project</h1>
			<p className={styles.pageLead}>
				Nothing appears on the website until you publish it, so it is safe to save a half-finished
				entry and come back to it.
			</p>
			<ProjectForm />
		</>
	);
}
