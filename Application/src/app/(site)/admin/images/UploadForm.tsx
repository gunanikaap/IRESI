"use client";

import { useActionState } from "react";
import { addPageImages, type ActionState } from "../actions";
import { Field, FormError } from "@/components/admin/Field";
import styles from "../admin.module.css";

const initial: ActionState = {};

export default function UploadForm({ slot }: { slot: string }) {
	const [state, action, pending] = useActionState(addPageImages, initial);

	return (
		<form action={action}>
			<FormError message={state.error} />
			<input type="hidden" name="slot" value={slot} />

			<Field
				name="images"
				label="Add photographs"
				hint="JPEG, PNG or WebP. You can choose several at once — they are added to the end of the strip and can be reordered below. Pictures are resized and camera data is stripped on upload."
			>
				<input
					type="file"
					id="images"
					name="images"
					accept="image/jpeg,image/png,image/webp"
					multiple
				/>
			</Field>

			<Field
				name="alt"
				label="Description of the pictures"
				hint="Read aloud by screen readers in place of the images. One description covers everything added in this batch."
			>
				<input type="text" id="alt" name="alt" placeholder="Life at the IRESI Centre" />
			</Field>

			<div className={styles.formActions}>
				<button className="button" type="submit" disabled={pending}>
					{pending ? "Uploading…" : "Add photographs"}
				</button>
			</div>
		</form>
	);
}
