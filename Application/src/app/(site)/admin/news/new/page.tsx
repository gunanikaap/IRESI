import { requireUser } from "@/lib/auth";
import { PLATFORM_SITE } from "@/lib/repo";
import NewsForm from "../NewsForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function NewNewsPage() {
	await requireUser();

	return (
		<>
			<h1 className={styles.pageTitle}>Add news or an event</h1>
			<p className={styles.pageLead}>
				Nothing appears on the website until you publish it, so it is safe to save a
				half-finished entry and come back to it.
			</p>
			<NewsForm site={PLATFORM_SITE} backHref="/admin/news" />
		</>
	);
}
