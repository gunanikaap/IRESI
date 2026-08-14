import { requireUser } from "@/lib/auth";
import { listMessages } from "@/lib/repo";
import { isMailConfigured } from "@/lib/mail";
import { project } from "@/projects";
import { readMessage, removeMessage } from "../actions";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage(props: PageProps<"/admin/messages">) {
	await requireUser();
	const messages = await listMessages();
	const params = await props.searchParams;
	const mailWorks = isMailConfigured();

	return (
		<>
			<h1 className={styles.pageTitle}>Messages</h1>
			<p className={styles.pageLead}>Enquiries sent through the website&rsquo;s contact form.</p>

			{params.deleted && <p className={styles.notice}>Message deleted.</p>}

			{mailWorks ? (
				<p className={styles.notice}>
					Messages are emailed to <strong>{project.contactEmail}</strong> and also kept here as a
					record.
				</p>
			) : (
				<p className={styles.warning}>
					<strong>Email is not configured yet</strong>, so messages are only stored here — nothing
					is being sent to {project.contactEmail}. Check this page regularly until the SMTP
					details are in place. Nothing is lost in the meantime.
				</p>
			)}

			<div className={styles.panel}>
				<div className={styles.panelHeading}>
					<h2>
						{messages.length} {messages.length === 1 ? "message" : "messages"}
					</h2>
				</div>

				{messages.length === 0 ? (
					<p className={styles.empty}>No messages yet.</p>
				) : (
					<ul className={styles.entryList}>
						{messages.map((message) => (
							<li key={message.id} className={styles.entry}>
								<div className={styles.entryMain}>
									<div className={styles.entryTitle}>
										{message.subject || "(no subject)"}
										{!message.read_at && <span className={styles.badge}>new</span>}
									</div>
									<div className={styles.entryMeta}>
										{message.name} &lt;{message.email}&gt;
									</div>
									<p style={{ marginTop: "0.6rem", whiteSpace: "pre-wrap" }}>{message.message}</p>
								</div>

								<div className={styles.entryActions}>
									<a
										className={styles.smallButton}
										href={`mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
											`Re: ${message.subject || "your enquiry"}`,
										)}`}
									>
										Reply
									</a>

									{!message.read_at && (
										<form action={readMessage}>
											<input type="hidden" name="id" value={message.id} />
											<button className={styles.smallButton} type="submit">
												Mark read
											</button>
										</form>
									)}

									<form action={removeMessage}>
										<input type="hidden" name="id" value={message.id} />
										<ConfirmSubmit
											className={`${styles.smallButton} ${styles.dangerButton}`}
											label="Delete"
											title="Delete this message?"
											message="This permanently removes the sender's name, address and message. This is how to honour a deletion request, and it cannot be undone."
											confirmLabel="Delete message"
										/>
									</form>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</>
	);
}
