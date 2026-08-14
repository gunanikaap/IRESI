import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PLATFORM_SITE, getNewsItem } from "@/lib/repo";
import NewsForm from "../NewsForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditNewsPage(props: PageProps<"/admin/news/[id]">) {
	await requireUser();

	const { id } = await props.params;
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) notFound();

	const entry = await getNewsItem(numericId);
	if (!entry) notFound();

	return (
		<>
			<h1 className={styles.pageTitle}>{entry.title}</h1>
			<p className={styles.pageLead}>
				{entry.slug ? (
					<>
						Published at <code>/{entry.slug}</code>.
					</>
				) : (
					"This entry is listed on the News & Events page."
				)}
			</p>
			<NewsForm entry={entry} site={PLATFORM_SITE} backHref="/admin/news" />
		</>
	);
}
