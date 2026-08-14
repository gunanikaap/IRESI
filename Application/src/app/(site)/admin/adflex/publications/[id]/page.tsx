import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPublication } from "@/lib/repo";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import PublicationForm from "../../outcomes/PublicationForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditAdflexPublicationPage(
	props: PageProps<"/admin/adflex/publications/[id]">,
) {
	await requireUser();

	const { id } = await props.params;
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) notFound();

	const publication = await getPublication(numericId);
	if (!publication) notFound();

	return (
		<>
			<h1 className={styles.pageTitle}>{publication.title}</h1>
			<p className={styles.pageLead}>
				{publication.authors || "No authors recorded"}
				{publication.year ? ` · ${publication.year}` : ""}
			</p>
			<PublicationForm
				publication={publication}
				site={ADFLEX_SITE}
				backHref="/admin/adflex/outcomes"
			/>
		</>
	);
}
