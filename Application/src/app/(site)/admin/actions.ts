"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
	SESSION_COOKIE,
	clearAttempts,
	createSessionToken,
	recordFailedAttempt,
	requireUser,
	tooManyAttempts,
	verifyPassword,
} from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { readUploads } from "@/lib/upload";
import {
	createMedia,
	createProject,
	deleteMessage,
	deleteNewsItem,
	deleteProject,
	deletePublication,
	markMessageRead,
	setPublished,
	updateProject,
	type ProjectInput,
	type PublishableTable,
} from "@/lib/repo";

export type ActionState = {
	error?: string;
	/** Field-level messages, keyed by input name. */
	fieldErrors?: Record<string, string>;
	saved?: boolean;
	/**
	 * What the editor typed, handed back so a rejected save refills the form
	 * instead of blanking it. Losing a long write-up to a missing slug is the
	 * fastest way to make someone stop using an admin.
	 */
	values?: Record<string, string>;
};

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const flag = (form: FormData, key: string) => form.get(key) === "on" || form.get(key) === "true";

/* --------------------------------------------------------------------------
 * SIGNING IN
 * ----------------------------------------------------------------------- */

export async function signIn(_previous: ActionState, form: FormData): Promise<ActionState> {
	// Lower-cased so "Nicky" and "nicky" are the same account. The login is a
	// username, not an email address: nothing is ever sent to it.
	const username = text(form, "username").toLowerCase();
	const password = String(form.get("password") ?? "");

	if (!username || !password) return { error: "Enter your username and password." };

	// Counted against the account, the IP and the pair independently — a single
	// combined key can be sidestepped by varying either half.
	const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

	if (tooManyAttempts(ip, username)) {
		return { error: "Too many attempts. Wait fifteen minutes and try again." };
	}

	let row: { id: number; password_hash: string; session_version: number } | null = null;
	try {
		row = await queryOne<{ id: number; password_hash: string; session_version: number }>(
			"SELECT id, password_hash, session_version FROM admin_users WHERE username = $1",
			[username],
		);
	} catch (error) {
		console.error("[admin] sign-in lookup failed:", error);
		return {
			error:
				"Cannot reach the database. Check DATABASE_URL and that the database is running.",
		};
	}

	// Verify against a dummy hash when the account does not exist, so an unknown
	// username and a wrong password take the same time. Skipping the work is how
	// a login endpoint tells an attacker which usernames are real.
	const ok = row
		? await verifyPassword(password, row.password_hash)
		: await verifyPassword(password, `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`);

	if (!row || !ok) {
		recordFailedAttempt(ip, username);
		return { error: "That username and password do not match an account." };
	}

	clearAttempts(ip, username);

	const store = await cookies();
	store.set(SESSION_COOKIE, createSessionToken(row.id, row.session_version), {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60 * 12,
	});

	redirect("/admin");
}

export async function signOut(): Promise<void> {
	const store = await cookies();
	store.delete(SESSION_COOKIE);
	redirect("/admin/login");
}

/* --------------------------------------------------------------------------
 * PUBLISHING
 * ----------------------------------------------------------------------- */

/**
 * Publish is a boolean, not a state machine. Nothing appears publicly until it
 * is set, which is easy to explain — and the person using it is not technical.
 */
export async function togglePublished(form: FormData): Promise<void> {
	await requireUser();

	const table = text(form, "table") as PublishableTable;
	const id = Number(text(form, "id"));
	const published = flag(form, "published");

	if (!Number.isInteger(id)) return;
	await setPublished(table, id, published);
	revalidateSite();
}

/* --------------------------------------------------------------------------
 * PROJECTS
 * ----------------------------------------------------------------------- */

/** Slugs become URLs, so they are checked rather than sanitised silently. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readProjectForm(form: FormData): {
	input: Omit<ProjectInput, "imageIds">;
	fieldErrors: Record<string, string>;
	values: Record<string, string>;
} {
	const values: Record<string, string> = {};
	for (const key of ["slug", "title", "page_title", "summary", "intro", "tags", "body", "website", "website_label", "vimeo_id", "sort_order"]) {
		values[key] = text(form, key);
	}
	values.external_only = flag(form, "external_only") ? "on" : "";

	const fieldErrors: Record<string, string> = {};

	if (!values.title) fieldErrors.title = "A project needs a title.";
	if (!values.slug) {
		fieldErrors.slug = "A project needs a web address.";
	} else if (!SLUG_PATTERN.test(values.slug)) {
		fieldErrors.slug =
			"Use lower-case letters, numbers and hyphens only — for example renew or ai-effect.";
	}
	if (!values.summary) {
		fieldErrors.summary = "The summary is what the listing card shows, so it cannot be empty.";
	}
	if (values.website && !/^https?:\/\//i.test(values.website)) {
		fieldErrors.website = "Include the full address, starting with https://";
	}
	if (values.vimeo_id && !/^\d+$/.test(values.vimeo_id)) {
		fieldErrors.vimeo_id = "A Vimeo id is digits only — the number at the end of the video's link.";
	}

	const sortOrder = Number(values.sort_order || "0");
	if (!Number.isInteger(sortOrder)) fieldErrors.sort_order = "Use a whole number.";

	return {
		values,
		fieldErrors,
		input: {
			slug: values.slug,
			title: values.title,
			page_title: values.page_title || null,
			summary: values.summary,
			intro: values.intro,
			tags: values.tags,
			body: values.body,
			website: values.website || null,
			website_label: values.website_label || "See Platform",
			vimeo_id: values.vimeo_id || null,
			external_only: values.external_only === "on",
			sort_order: Number.isInteger(sortOrder) ? sortOrder : 0,
		},
	};
}

export async function saveProject(_previous: ActionState, form: FormData): Promise<ActionState> {
	const user = await requireUser();

	const idRaw = text(form, "id");
	const id = idRaw ? Number(idRaw) : null;
	const { input, fieldErrors, values } = readProjectForm(form);

	if (Object.keys(fieldErrors).length > 0) {
		return { error: "Some fields need attention before this can be saved.", fieldErrors, values };
	}

	// Uploads are read before the write so an oversized batch fails with a
	// readable message rather than half-saving the entry.
	let imageIds: number[] | undefined;
	const uploads = await readUploads(form.getAll("images") as File[]);
	if (!uploads.ok) return { error: uploads.error, values };

	if (uploads.uploads.length > 0) {
		imageIds = [];
		for (const upload of uploads.uploads) {
			imageIds.push(
				await createMedia({
					filename: upload.filename,
					mime: upload.mime,
					data: upload.data,
					width: upload.width,
					height: upload.height,
					// Alt text defaults to the title so an image is never announced as
					// nothing; an editor can refine it later.
					alt: input.title,
					uploadedBy: user.id,
				}),
			);
		}
	}

	try {
		if (id) {
			await updateProject(id, { ...input, imageIds });
		} else {
			await createProject({ ...input, imageIds });
		}
	} catch (error) {
		// The commonest failure by far, and worth naming rather than showing raw.
		const message = error instanceof Error ? error.message : String(error);
		if (message.includes("projects_slug_key")) {
			return {
				error: "Another project already uses that web address.",
				fieldErrors: { slug: "This address is already taken." },
				values,
			};
		}
		console.error("[admin] saving project failed:", error);
		return { error: "That could not be saved. Please try again.", values };
	}

	revalidateSite();
	redirect("/admin/projects?saved=1");
}

export async function removeProject(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	await deleteProject(id);
	revalidateSite();
	redirect("/admin/projects?deleted=1");
}

/* --------------------------------------------------------------------------
 * NEWS, PUBLICATIONS AND MESSAGES
 * ----------------------------------------------------------------------- */

export async function removeNewsItem(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	await deleteNewsItem(id);
	revalidateSite();
	redirect("/admin/news?deleted=1");
}

export async function removePublication(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	await deletePublication(id);
	revalidateSite();
	redirect("/admin/publications?deleted=1");
}

export async function readMessage(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	await markMessageRead(id);
	redirect("/admin/messages");
}

/**
 * Deleting a message deletes personal data supplied by a member of the public.
 * That is the intended way to honour a deletion request, so it is a hard delete
 * rather than a flag.
 */
export async function removeMessage(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	await deleteMessage(id);
	redirect("/admin/messages?deleted=1");
}

/* --------------------------------------------------------------------------
 * REVALIDATION
 * ----------------------------------------------------------------------- */

/**
 * Statically rendered pages do not show new content until something
 * revalidates them, so every write says so explicitly.
 *
 * A test that wrote rows straight into the database and then read the home page
 * once reported a bug that did not exist — the page was simply the last build.
 */
function revalidateSite(): void {
	revalidatePath("/", "layout");
}
