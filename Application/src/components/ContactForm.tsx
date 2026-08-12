"use client";

import { useActionState } from "react";
import { submitContact, type ContactState } from "@/app/contact/actions";
import styles from "./ContactForm.module.css";

const initial: ContactState = {};

/**
 * The contact form.
 *
 * Validation, rate limiting, the honeypot and the fallback to the admin
 * dashboard all live in the Server Action — this is only the fields. Required
 * fields are marked in the label rather than relying on the browser's own
 * message, because an editor reading the form should be able to see what is
 * needed before submitting it.
 */
export default function ContactForm({ contactEmail }: { contactEmail: string }) {
	const [state, action, pending] = useActionState(submitContact, initial);

	if (state.sent) {
		return (
			<p className={styles.sent} role="status">
				Thank you — your message has been received. We will be in touch.
			</p>
		);
	}

	return (
		<form className={styles.form} action={action} noValidate>
			{state.error && (
				<p className={styles.error} role="alert">
					{state.error}
				</p>
			)}

			<div className={styles.field}>
				<label htmlFor="name">
					Name <span className={styles.required}>(required)</span>
				</label>
				<input type="text" id="name" name="name" autoComplete="name" required />
			</div>

			<div className={styles.field}>
				<label htmlFor="email">
					Email <span className={styles.required}>(required)</span>
				</label>
				<input type="email" id="email" name="email" autoComplete="email" required />
			</div>

			<div className={styles.field}>
				<label htmlFor="subject">
					Subject <span className={styles.optional}>(optional)</span>
				</label>
				<input type="text" id="subject" name="subject" />
			</div>

			<div className={styles.field}>
				<label htmlFor="message">
					Message <span className={styles.required}>(required)</span>
				</label>
				<textarea id="message" name="message" rows={6} required />
			</div>

			{/* Left empty by people and filled in by bots. Hidden from both the
			    screen and assistive technology, and never shown to a real visitor. */}
			<div className={styles.honeypot} aria-hidden="true">
				<label htmlFor="website">Website</label>
				<input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
			</div>

			<button className="button" type="submit" disabled={pending}>
				{pending ? "Sending…" : "Send"}
			</button>

			<p className={styles.note}>
				You can also email us directly at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
			</p>
		</form>
	);
}
