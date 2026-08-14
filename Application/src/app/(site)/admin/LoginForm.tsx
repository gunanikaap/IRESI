"use client";

import { useActionState } from "react";
import { signIn, type ActionState } from "./actions";
import { Field, FormError } from "@/components/admin/Field";
import styles from "./admin.module.css";

const initial: ActionState = {};

export function LoginForm() {
	const [state, action, pending] = useActionState(signIn, initial);

	return (
		<form action={action}>
			<FormError message={state.error} />

			{/*
			 * `type="text"`, not `type="email"`, even though the IRESI login is
			 * `admin@iresi.eu`.
			 *
			 * The value is an identifier and nothing is ever sent to it — no reset,
			 * no notification. Some accounts are plain names and some are addresses;
			 * an email input would refuse to submit the former, telling an editor
			 * their correct login is malformed.
			 */}
			<Field
				name="username"
				label="Login"
				required
				hint="The name or address you were given — for example admin@iresi.eu."
			>
				<input
					type="text"
					id="username"
					name="username"
					autoComplete="username"
					autoCapitalize="none"
					spellCheck={false}
					required
				/>
			</Field>

			<Field name="password" label="Password" required>
				<input
					type="password"
					id="password"
					name="password"
					autoComplete="current-password"
					required
				/>
			</Field>

			<button className="button" type="submit" disabled={pending}>
				{pending ? "Signing in…" : "Sign in"}
			</button>

			<p className={styles.panelNote}>
				Accounts are created by a developer with <code>npm run db:user</code>. There is no
				sign-up and no password reset.
			</p>
		</form>
	);
}
