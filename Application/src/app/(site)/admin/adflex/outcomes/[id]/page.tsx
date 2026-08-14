import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getFinding } from "@/lib/repo";
import { ADFLEX_SITE } from "@/projects/adflex/site";
import OutcomeForm from "../OutcomeForm";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditOutcomePage(props: PageProps<"/admin/adflex/outcomes/[id]">) {
	await requireUser();

	const { id } = await props.params;
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) notFound();

	const outcome = await getFinding(numericId);
	if (!outcome) notFound();

	return (
		<>
			<h1 className={styles.pageTitle}>{outcome.title}</h1>
			<p className={styles.pageLead}>An outcome on the ADFLEX Project Outcomes page.</p>
			<OutcomeForm outcome={outcome} site={ADFLEX_SITE} backHref="/admin/adflex/outcomes" />
		</>
	);
}
