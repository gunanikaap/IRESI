import type { ReactNode } from "react";
import styles from "./admin-form.module.css";

/**
 * The pieces every admin form is built from.
 *
 * ---------------------------------------------------------------------------
 * WHY THE FIELDS SAY WHAT THEY WANT
 * ---------------------------------------------------------------------------
 * The meeting asked that an IRESI administrator be able to publish content
 * without a developer. Most of what makes that true is not features — it is a
 * form that says which fields are required, which are optional, what shape a
 * value should take, and what went wrong when something is rejected, in words
 * rather than a red outline.
 *
 * So `required` and `hint` are part of the field, not decoration bolted on per
 * form: a new content type gets a usable form by describing its fields.
 */

export function Required() {
	return <span className={styles.required}>required</span>;
}

export function Optional() {
	return <span className={styles.optional}>optional</span>;
}

export function Field({
	name,
	label,
	hint,
	error,
	required = false,
	children,
}: {
	name: string;
	label: string;
	/** One line telling the editor what is expected, e.g. "One per line." */
	hint?: string;
	error?: string;
	required?: boolean;
	children: ReactNode;
}) {
	const hintId = hint ? `${name}-hint` : undefined;
	const errorId = error ? `${name}-error` : undefined;

	return (
		<div className={styles.field}>
			<label htmlFor={name}>
				{label} {required ? <Required /> : <Optional />}
			</label>
			{hint && (
				<p className={styles.hint} id={hintId}>
					{hint}
				</p>
			)}
			{children}
			{error && (
				<p className={styles.error} id={errorId} role="alert">
					{error}
				</p>
			)}
		</div>
	);
}

/**
 * A form-level error banner.
 *
 * Placed above the fields and given `role="alert"` so it is announced when a
 * save is rejected — an editor who has scrolled to the bottom to press Save
 * should not have to hunt for why nothing happened.
 */
export function FormError({ message }: { message?: string }) {
	if (!message) return null;
	return (
		<p className={styles.formError} role="alert">
			{message}
		</p>
	);
}

export function FormSuccess({ message }: { message?: string }) {
	if (!message) return null;
	return (
		<p className={styles.formSuccess} role="status">
			{message}
		</p>
	);
}
