import { requireUser } from "@/lib/auth";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import NewsForm from "../../../news/NewsForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewAdflexNewsPage() {
	await requireUser();

	return (
		<>
			<h1 className={styles.pageTitle}>Add ADFLEX news or an event</h1>
			<p className={styles.pageLead}>
				This appears on the ADFLEX site only. Nothing is published until you tick the box, so a
				half-finished entry is safe to save.
			</p>
			<NewsForm site={ADFLEX_SITE} backHref="/admin/adflex/news" />
		</>
	);
}
