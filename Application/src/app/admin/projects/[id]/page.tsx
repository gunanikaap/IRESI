import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProject } from "@/lib/repo";
import ProjectForm from "../ProjectForm";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

export default async function EditProjectPage(props: PageProps<"/admin/projects/[id]">) {
	await requireUser();

	const { id } = await props.params;
	const numericId = Number(id);
	if (!Number.isInteger(numericId)) notFound();

	const project = await getProject(numericId);
	if (!project) notFound();

	return (
		<>
			<h1 className={styles.pageTitle}>{project.title}</h1>
			<p className={styles.pageLead}>
				Editing the project published at <code>/{project.slug}</code>.
			</p>
			<ProjectForm project={project} />
		</>
	);
}
