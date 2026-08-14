"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "@/lib/contact-action";
import { Field, FormError } from "@/components/admin/Field";
import styles from "./EnquiryForm.module.css";

const initial: ContactState = {};

/**
 * The enquiry form, used by the contact page and the partnership panel.
 *
 * Both collect nearly the same thing, so they share one form and one Server
 * Action — every extra unauthenticated endpoint is another thing to keep safe.
 * `origin` is what tells them apart: it titles the email so whoever reads the
 * mailbox can see a partnership approach without opening it.
 *
 * Validation, rate limiting, the honeypot and the fallback to the dashboard all
 * live in the action. This is only the fields.
 */
export default function EnquiryForm({
	contactEmail,
	origin = "contact",
	organisation = false,
	phone = false,
	subject = true,
	onDark = false,
	compact = false,
	submitLabel = "Send",
}: {
	contactEmail: string;
	/** Matches a key in the action's ORIGINS map. */
	origin?: "contact" | "partners";
	organisation?: boolean;
	phone?: boolean;
	subject?: boolean;
	/** Styles the form for a panel sitting over a photograph. */
	onDark?: boolean;
	/** Pairs the short fields two to a row and shortens the message box. */
	compact?: boolean;
	submitLabel?: string;
}) {
	const [state, action, pending] = useActionState(submitContact, initial);

	if (state.sent) {
		return (
			<p className={`${styles.sent} ${onDark ? styles.sentOnDark : ""}`} role="status">
				Thank you — your message has been received. We will be in touch.
			</p>
		);
	}

	return (
		<form className={`${styles.form} ${onDark ? styles.onDark : ""}`} action={action} noValidate>
			<FormError message={state.error} />
			<input type="hidden" name="origin" value={origin} />

			{/*
			 * Paired two to a row when compact. Short fields on their own line each
			 * make a five-field form look like a tax return; side by side it reads
			 * as one block. Explicit wrappers rather than a CSS rule, because the
			 * field markup comes from a component whose class names are hashed in
			 * its own module and cannot be selected from here.
			 */}
			<div className={compact ? styles.row : undefined}>
				<Field name="name" label="Name" required>
					<input type="text" id="name" name="name" autoComplete="name" required />
				</Field>

				{organisation && (
					<Field name="organisation" label="Organisation">
						<input
							type="text"
							id="organisation"
							name="organisation"
							autoComplete="organization"
						/>
					</Field>
				)}
			</div>

			<div className={compact ? styles.row : undefined}>
				<Field name="email" label="Email" required>
					<input type="email" id="email" name="email" autoComplete="email" required />
				</Field>

				{phone && (
					<Field name="phone" label="Phone">
						<input type="tel" id="phone" name="phone" autoComplete="tel" />
					</Field>
				)}
			</div>

			{subject && (
				<Field name="subject" label="Subject">
					<input type="text" id="subject" name="subject" />
				</Field>
			)}

			<Field name="message" label="Message" required>
				<textarea id="message" name="message" rows={compact ? 4 : 6} required />
			</Field>

			{/* Left empty by people and filled in by bots. Hidden from both the
			    screen and assistive technology, and never shown to a visitor. */}
			<div className={styles.honeypot} aria-hidden="true">
				<label htmlFor="website">Website</label>
				<input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
			</div>

			<button
				className={`${styles.submit} ${compact ? styles.submitInline : ""}`}
				type="submit"
				disabled={pending}
			>
				{pending ? "Sending…" : submitLabel}
			</button>

			<p className={styles.note}>
				You can also email us directly at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
			</p>
		</form>
	);
}
