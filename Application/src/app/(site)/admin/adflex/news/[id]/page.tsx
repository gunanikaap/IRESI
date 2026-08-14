import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getNewsItem } from "@/lib/repo";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import NewsForm from "../../../news/NewsForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditAdflexNewsPage(props: PageProps<"/admin/adflex/news/[id]">) {
	await requireUser();

	const { id } = await props.params;
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) notFound();

	const entry = await getNewsItem(numericId);
	if (!entry) notFound();

	return (
		<>
			<h1 className={styles.pageTitle}>{entry.title}</h1>
			<p className={styles.pageLead}>An entry on the ADFLEX News &amp; Events page.</p>
			<NewsForm entry={entry} site={ADFLEX_SITE} backHref="/admin/adflex/news" />
		</>
	);
}
