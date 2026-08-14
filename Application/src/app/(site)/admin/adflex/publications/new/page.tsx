import { requireUser } from "@/lib/auth";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import PublicationForm from "../../outcomes/PublicationForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewAdflexPublicationPage() {
	await requireUser();

	return (
		<>
			<h1 className={styles.pageTitle}>Add a publication</h1>
			<p className={styles.pageLead}>
				A paper from the ADFLEX project, listed on <code>/adflex/outcomes</code> beside the
				findings. Only the title is required.
			</p>
			<PublicationForm site={ADFLEX_SITE} backHref="/admin/adflex/outcomes" />
		</>
	);
}
