import { requireUser } from "@/lib/auth";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import OutcomeForm from "../OutcomeForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewOutcomePage() {
	await requireUser();

	return (
		<>
			<h1 className={styles.pageTitle}>Add an outcome</h1>
			<p className={styles.pageLead}>
				A finding from the ADFLEX project, listed on <code>/adflex/outcomes</code>. Nothing
				appears until you publish it.
			</p>
			<OutcomeForm site={ADFLEX_SITE} backHref="/admin/adflex/outcomes" />
		</>
	);
}
