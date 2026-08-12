"use client";

import { useRef } from "react";
import styles from "./confirm.module.css";

/**
 * A submit button that asks first, using a real `<dialog>`.
 *
 * ---------------------------------------------------------------------------
 * WHY NOT `window.confirm`
 * ---------------------------------------------------------------------------
 * `confirm()` blocks the main thread, cannot be styled, cannot say more than
 * one line, and is suppressed entirely by some browsers when it fires from a
 * form submission. A `<dialog>` is focus-trapped and Escape-dismissable for
 * free, and it has room to say what will actually be lost — which is the point
 * of asking at all.
 *
 * The button submits the form it sits in, so the action and its hidden fields
 * are whatever the caller put around it.
 */
export default function ConfirmSubmit({
	label,
	title,
	message,
	confirmLabel,
	className,
}: {
	/** The visible button. */
	label: string;
	title: string;
	message: string;
	/** The confirming button inside the dialogue. */
	confirmLabel: string;
	className?: string;
}) {
	const dialog = useRef<HTMLDialogElement>(null);

	return (
		<>
			<button
				type="button"
				className={className}
				onClick={() => dialog.current?.showModal()}
			>
				{label}
			</button>

			<dialog ref={dialog} className={styles.dialog}>
				<h2 className={styles.title}>{title}</h2>
				<p className={styles.message}>{message}</p>
				<div className={styles.actions}>
					<button
						type="button"
						className={styles.cancel}
						onClick={() => dialog.current?.close()}
					>
						Cancel
					</button>
					{/* The only real submit: reaching the action requires this click. */}
					<button type="submit" className={styles.confirm}>
						{confirmLabel}
					</button>
				</div>
			</dialog>
		</>
	);
}
