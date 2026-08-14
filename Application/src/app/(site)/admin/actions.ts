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
import { readDocuments, readUploads } from "@/lib/upload";
import {
	PAGE_IMAGE_SLOTS,
	availableNewsSlug,
	PLATFORM_SITE,
	addPageImage,
	createFile,
	createFinding,
	createMedia,
	createNewsItem,
	createPublication,
	createProject,
	createTeamMember,
	deleteFinding,
	deleteMessage,
	deleteNewsItem,
	deletePageImage,
	deleteProject,
	deletePublication,
	deleteTeamMember,
	getFinding,
	getNewsItem,
	getPublication,
	isPageImageSlot,
	listPageImages,
	markMessageRead,
	nextPageImageOrder,
	nextTeamOrder,
	normaliseDoi,
	setPageImageOrder,
	setPublished,
	slugifyTitle,
	toImageSize,
	updateFinding,
	updateNewsItem,
	updatePublication,
	updateProject,
	updateTeamMember,
	type NewsInput,
	type NewsKind,
	type ProjectInput,
	type PublishableTable,
	type Site,
	type TeamMemberInput,
} from "@/lib/repo";
import { allProjects } from "@/projects";
import { todayInIreland } from "@/lib/dates";

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

	/*
	 * Where this returns to depends on which site's list it was called from.
	 * IRESI keeps publications on their own page; ADFLEX lists them under
	 * Outcomes, beside the findings, which is where its own site shows them.
	 */
	const site = readSite(form);
	await deletePublication(id);
	revalidateSite();
	redirect(site === PLATFORM_SITE ? "/admin/publications?deleted=1" : `${adminBase(site)}/outcomes?deleted=1`);
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

/**
 * Where a site's admin lives.
 *
 * IRESI is the platform and sits at the root of the admin; every other project
 * gets a section beneath it. One place decides that, so a redirect after saving
 * cannot send an ADFLEX editor to IRESI's list.
 */
function adminBase(site: Site): string {
	return site === PLATFORM_SITE ? "/admin" : `/admin/${site}`;
}

/**
 * Which site an admin form is writing to.
 *
 * Carried in a hidden field rather than inferred, and checked against the
 * configured projects — the value reaches this from a browser, so an unknown one
 * must not become a row nobody can find. See migrations/007_site_scope.sql.
 */
function readSite(form: FormData): Site {
	const value = text(form, "site") || PLATFORM_SITE;
	return allProjects.some((entry) => entry.key === value) ? value : PLATFORM_SITE;
}

/* --------------------------------------------------------------------------
 * NEWS AND EVENTS
 * ----------------------------------------------------------------------- */

const KINDS: readonly NewsKind[] = ["news", "event", "upcoming"];


function readNewsForm(form: FormData): {
	input: Omit<NewsInput, "imageIds">;
	fieldErrors: Record<string, string>;
	values: Record<string, string>;
} {
	const values: Record<string, string> = {};
	for (const key of [
		"kind", "title", "slug", "summary", "body", "event_date", "event_time",
		"event_end_time", "location", "booking_url", "sort_order",
		"event_outcome", "event_video_url", "image_size",
	]) {
		values[key] = text(form, key);
	}
	values.slots_filled = flag(form, "slots_filled") ? "on" : "";
	values.published = flag(form, "published") ? "on" : "";

	const fieldErrors: Record<string, string> = {};
	const kind = (KINDS.includes(values.kind as NewsKind) ? values.kind : "news") as NewsKind;

	if (!values.title) fieldErrors.title = "This needs a title.";
	if (values.slug && !SLUG_PATTERN.test(values.slug)) {
		fieldErrors.slug =
			"Use lower-case letters, numbers and hyphens only — or leave it empty to build one from the title.";
	}
	if (!values.summary) {
		fieldErrors.summary = "The summary is what the listing card shows, so it cannot be empty.";
	}
	// An event with no date cannot be placed on the page, ordered, or told apart
	// from one that has already happened.
	if (kind !== "news" && !values.event_date) {
		fieldErrors.event_date = "An event needs a date.";
	}

	/*
	 * An event still to come cannot be on a day that has already gone.
	 *
	 * Without this the save succeeded and `settleFinishedEvents` then turned the
	 * entry into a past event the next time the admin was opened — so an editor
	 * who mistyped the month saw "still to come" accepted and "already happened"
	 * stored, with nothing said. Reclassifying somebody's work in silence is the
	 * problem; refusing it and saying why is the fix.
	 *
	 * Compared as `YYYY-MM-DD` strings, which sidesteps timezone arithmetic
	 * entirely — both sides are calendar dates in Dublin and sort correctly as
	 * text. Today itself is allowed: an event later this afternoon is still to
	 * come, and one entered an hour after it started is a late entry, not a
	 * mistake worth blocking.
	 */
	if (kind === "upcoming" && values.event_date && values.event_date < todayInIreland()) {
		fieldErrors.event_date =
			"That date has already gone. An upcoming event needs today's date or a later one — " +
			"or choose “Event — already happened” instead.";
	}
	if (values.booking_url && !/^https?:\/\//i.test(values.booking_url)) {
		fieldErrors.booking_url = "Include the full address, starting with https://";
	}
	if (values.event_video_url && !/^https?:\/\//i.test(values.event_video_url)) {
		fieldErrors.event_video_url = "Include the full address, starting with https://";
	}

	const sortOrder = Number(values.sort_order || "0");
	if (!Number.isInteger(sortOrder)) fieldErrors.sort_order = "Use a whole number.";

	return {
		values,
		fieldErrors,
		input: {
			kind,
			title: values.title,
			// Filled in by `saveNewsItem`, which is where the database can be asked
			// whether the address is free.
			slug: "",
			summary: values.summary,
			body: values.body,
			imageSize: toImageSize(values.image_size),
			eventDate: values.event_date || null,
			eventTime: values.event_time || null,
			eventEndTime: values.event_end_time || null,
			location: values.location || null,
			bookingUrl: values.booking_url || null,
			slotsFilled: values.slots_filled === "on",
			published: values.published === "on",
			sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
			eventOutcome: values.event_outcome,
			eventVideoUrl: values.event_video_url || null,
		},
	};
}

export async function saveNewsItem(_previous: ActionState, form: FormData): Promise<ActionState> {
	const user = await requireUser();

	const site = readSite(form);
	const idRaw = text(form, "id");
	const id = idRaw ? Number(idRaw) : null;
	const { input, fieldErrors, values } = readNewsForm(form);

	if (Object.keys(fieldErrors).length > 0) {
		return { error: "Some fields need attention before this can be saved.", fieldErrors, values };
	}

	/*
	 * The banner and the rest are uploaded through separate fields and stored as
	 * one ordered list, banner first — `setNewsImages` writes the array positions
	 * and the public page reads `images[0]` as the banner. Two fields because the
	 * two pictures do different jobs: the banner is the wide photograph behind the
	 * title, the others are the gallery below the text, and an editor should not
	 * have to know that "whichever file the browser happened to list first" decides
	 * which is which.
	 */
	const bannerUpload = await readUploads(form.getAll("banner") as File[]);
	if (!bannerUpload.ok) return { error: bannerUpload.error, values };

	const galleryUpload = await readUploads(form.getAll("images") as File[]);
	if (!galleryUpload.ok) return { error: galleryUpload.error, values };

	const store = async (upload: (typeof bannerUpload.uploads)[number]) =>
		createMedia({
			filename: upload.filename,
			mime: upload.mime,
			data: upload.data,
			width: upload.width,
			height: upload.height,
			alt: input.title,
			uploadedBy: user.id,
		});

	try {
		/*
		 * Each field is independent, and choosing no file leaves that part alone.
		 * Replacing the banner must not clear the gallery, and adding gallery
		 * pictures must not clear the banner — which is what a single "replaces
		 * everything" upload would have done.
		 */
		const current = id ? await getNewsItem(id) : null;
		const existing = current?.images ?? [];

		/*
		 * Every entry gets an address.
		 *
		 * `/[slug]` is the only route that serves a news entry, so a row without
		 * one is a row nothing can open — no "Read more" on the card and no page
		 * behind it. Entries created through this form had exactly that problem,
		 * because nothing here ever set a slug.
		 *
		 * An editor can type one; leaving it empty derives it from the title. An
		 * existing address is never changed silently, because changing it breaks
		 * every link anybody has already shared.
		 */
		const slug = await availableNewsSlug(
			values.slug || current?.slug || slugifyTitle(input.title),
			id,
		);

		const bannerId =
			bannerUpload.uploads.length > 0
				? await store(bannerUpload.uploads[0])
				: (existing[0]?.id ?? null);

		const galleryIds =
			galleryUpload.uploads.length > 0
				? await Promise.all(galleryUpload.uploads.map(store))
				: existing.slice(1).map((image) => image.id);

		const imageIds = [...(bannerId === null ? [] : [bannerId]), ...galleryIds];

		if (id) {
			await updateNewsItem(id, { ...input, slug, imageIds });
		} else {
			await createNewsItem({ ...input, slug, imageIds }, site);
		}
	} catch (error) {
		console.error("[admin] saving news entry failed:", error);
		return { error: "That could not be saved. Please try again.", values };
	}

	revalidateSite();
	redirect(`${adminBase(site)}/news?saved=1`);
}

/* --------------------------------------------------------------------------
 * OUTCOMES
 * ----------------------------------------------------------------------- */

/**
 * ADFLEX's project outcomes — the `findings` table, which only ADFLEX uses.
 *
 * Same shape as `saveNewsItem`, including the rule that matters most in both:
 * choosing no files leaves the existing ones attached. `setFindingImages` and
 * `setFindingFiles` replace the whole set, so sending an empty array on every
 * save would strip an outcome's pictures and its PDF the first time somebody
 * corrected a typo in the title.
 */
export async function saveFinding(_previous: ActionState, form: FormData): Promise<ActionState> {
	const user = await requireUser();

	const site = readSite(form);
	const idRaw = text(form, "id");
	const id = idRaw ? Number(idRaw) : null;

	const values: Record<string, string> = {};
	for (const key of ["title", "summary", "body", "sort_order", "image_size"]) {
		values[key] = text(form, key);
	}
	values.published = flag(form, "published") ? "on" : "";

	const fieldErrors: Record<string, string> = {};
	if (!values.title) fieldErrors.title = "An outcome needs a title.";
	if (!values.summary) {
		fieldErrors.summary = "The summary is what the listing shows, so it cannot be empty.";
	}

	const givenOrder = values.sort_order.trim();
	if (givenOrder && !/^-?\d+$/.test(givenOrder)) {
		fieldErrors.sort_order = "Use a whole number.";
	}

	if (Object.keys(fieldErrors).length > 0) {
		return { error: "Some fields need attention before this can be saved.", fieldErrors, values };
	}

	const images = await readUploads(form.getAll("images") as File[]);
	if (!images.ok) return { error: images.error, values };

	const documents = await readDocuments(form.getAll("files") as File[]);
	if (!documents.ok) return { error: documents.error, values };

	try {
		const existing = id ? await getFinding(id) : null;

		const imageIds =
			images.uploads.length > 0
				? await Promise.all(
						images.uploads.map((upload) =>
							createMedia({
								filename: upload.filename,
								mime: upload.mime,
								data: upload.data,
								width: upload.width,
								height: upload.height,
								alt: values.title,
								uploadedBy: user.id,
							}),
						),
					)
				: (existing?.images ?? []).map((image) => image.id);

		const fileIds =
			documents.documents.length > 0
				? await Promise.all(
						documents.documents.map((document) =>
							createFile({
								filename: document.filename,
								mime: document.mime,
								data: document.data,
								// The download link says the filename until somebody gives it
								// a better label; an empty link text is worse than a dull one.
								label: document.filename,
								uploadedBy: user.id,
							}),
						),
					)
				: (existing?.files ?? []).map((file) => file.id);

		const input = {
			title: values.title,
			summary: values.summary,
			body: values.body,
			imageIds,
			fileIds,
			imageSize: toImageSize(values.image_size),
			published: values.published === "on",
			sortOrder: givenOrder ? Number(givenOrder) : 0,
		};

		if (id) {
			await updateFinding(id, input);
		} else {
			await createFinding(input, site);
		}
	} catch (error) {
		console.error("[admin] saving outcome failed:", error);
		return { error: "That could not be saved. Please try again.", values };
	}

	revalidateSite();
	redirect(`${adminBase(site)}/outcomes?saved=1`);
}

/**
 * A paper, listed on the Outcomes page beside the findings.
 *
 * **Link and DOI are both optional, and independently so.** Plenty of a
 * project's output is a conference talk or a report with neither; a form that
 * insisted on one would push an editor into inventing a URL, and an invented
 * link is worse than none. What is required is a title — everything else is
 * detail the citation reads better for having.
 */
export async function savePublication(_previous: ActionState, form: FormData): Promise<ActionState> {
	const user = await requireUser();

	const site = readSite(form);
	const idRaw = text(form, "id");
	const id = idRaw ? Number(idRaw) : null;

	const values: Record<string, string> = {};
	for (const key of ["title", "authors", "venue", "year", "doi", "url", "sort_order"]) {
		values[key] = text(form, key);
	}
	values.published = flag(form, "published") ? "on" : "";

	const fieldErrors: Record<string, string> = {};
	if (!values.title) fieldErrors.title = "A publication needs a title.";

	if (values.url && !/^https?:\/\//i.test(values.url)) {
		fieldErrors.url = "Include the full address, starting with https://";
	}

	/*
	 * A DOI is normalised rather than rejected: an editor pastes whatever the
	 * publisher's page gave them — a doi.org link, a `doi:` prefix, or the bare
	 * identifier — and all three mean the same thing. Only something that is not
	 * a DOI at all is refused.
	 */
	const doi = values.doi ? normaliseDoi(values.doi) : null;
	if (values.doi && doi === null) {
		fieldErrors.doi =
			"That does not look like a DOI. It looks like 10.1234/abcd, and a doi.org link is fine too.";
	}

	const year = values.year ? Number(values.year) : null;
	if (values.year && (!Number.isInteger(year) || year! < 1900 || year! > 2200)) {
		fieldErrors.year = "Use a four-digit year.";
	}

	const givenOrder = values.sort_order.trim();
	if (givenOrder && !/^-?\d+$/.test(givenOrder)) {
		fieldErrors.sort_order = "Use a whole number.";
	}

	if (Object.keys(fieldErrors).length > 0) {
		return { error: "Some fields need attention before this can be saved.", fieldErrors, values };
	}

	const documents = await readDocuments(form.getAll("files") as File[]);
	if (!documents.ok) return { error: documents.error, values };

	try {
		const existing = id ? await getPublication(id) : null;

		// As everywhere else: choosing no file leaves the attached one alone.
		const fileIds =
			documents.documents.length > 0
				? await Promise.all(
						documents.documents.map((document) =>
							createFile({
								filename: document.filename,
								mime: document.mime,
								data: document.data,
								label: document.filename,
								uploadedBy: user.id,
							}),
						),
					)
				: (existing?.files ?? []).map((file) => file.id);

		const input = {
			title: values.title,
			authors: values.authors,
			venue: values.venue,
			year: year ?? null,
			doi,
			url: values.url || null,
			fileIds,
			published: values.published === "on",
			sortOrder: givenOrder ? Number(givenOrder) : 0,
		};

		if (id) {
			await updatePublication(id, input);
		} else {
			await createPublication(input, site);
		}
	} catch (error) {
		console.error("[admin] saving publication failed:", error);
		return { error: "That could not be saved. Please try again.", values };
	}

	revalidateSite();
	redirect(`${adminBase(site)}/outcomes?saved=1`);
}

export async function removeFinding(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	const site = readSite(form);
	await deleteFinding(id);
	revalidateSite();
	redirect(`${adminBase(site)}/outcomes?deleted=1`);
}

/* --------------------------------------------------------------------------
 * TEAM
 * ----------------------------------------------------------------------- */

export async function saveTeamMember(_previous: ActionState, form: FormData): Promise<ActionState> {
	const user = await requireUser();

	const idRaw = text(form, "id");
	const id = idRaw ? Number(idRaw) : null;

	const values: Record<string, string> = {};
	for (const key of ["name", "role", "email", "linkedin", "sort_order"]) {
		values[key] = text(form, key);
	}
	values.published = flag(form, "published") ? "on" : "";

	const fieldErrors: Record<string, string> = {};
	if (!values.name) fieldErrors.name = "A person needs a name.";
	if (values.email && !values.email.includes("@")) {
		fieldErrors.email = "That does not look like an email address.";
	}
	if (values.linkedin && !/^https?:\/\//i.test(values.linkedin)) {
		fieldErrors.linkedin = "Include the full address, starting with https://";
	}
	/*
	 * An empty position means "wherever, I do not mind" — which is the end of the
	 * list, not the front. Left as 0 it sorted first, so a colleague added without
	 * a position appeared above the Director.
	 *
	 * Only a value actually typed is validated: `Number("")` is 0, so testing the
	 * parsed number would have accepted an empty field as a deliberate zero and
	 * put them back at the top.
	 */
	const givenOrder = values.sort_order.trim();
	if (givenOrder && !/^-?\d+$/.test(givenOrder)) {
		fieldErrors.sort_order = "Use a whole number, or leave it empty to add them at the end.";
	}

	if (Object.keys(fieldErrors).length > 0) {
		return { error: "Some fields need attention before this can be saved.", fieldErrors, values };
	}

	const sortOrder = givenOrder ? Number(givenOrder) : await nextTeamOrder();

	const uploads = await readUploads(form.getAll("photo") as File[]);
	if (!uploads.ok) return { error: uploads.error, values };

	let photoMediaId: number | undefined;
	if (uploads.uploads.length > 0) {
		const upload = uploads.uploads[0];
		photoMediaId = await createMedia({
			filename: upload.filename,
			mime: upload.mime,
			data: upload.data,
			width: upload.width,
			height: upload.height,
			alt: values.name,
			uploadedBy: user.id,
		});
	}

	const input: TeamMemberInput = {
		name: values.name,
		role: values.role,
		email: values.email || null,
		linkedin: values.linkedin || null,
		sortOrder,
		published: values.published === "on",
		photoMediaId,
	};

	try {
		if (id) {
			await updateTeamMember(id, input);
		} else {
			await createTeamMember(input);
		}
	} catch (error) {
		console.error("[admin] saving team member failed:", error);
		return { error: "That could not be saved. Please try again.", values };
	}

	revalidateSite();
	redirect("/admin/team?saved=1");
}

export async function removeTeamMember(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	await deleteTeamMember(id);
	revalidateSite();
	redirect("/admin/team?deleted=1");
}

/* --------------------------------------------------------------------------
 * PAGE PHOTOGRAPHS
 * ----------------------------------------------------------------------- */

export async function addPageImages(_previous: ActionState, form: FormData): Promise<ActionState> {
	const user = await requireUser();

	const slot = text(form, "slot");
	if (!isPageImageSlot(slot)) return { error: "Unknown place on the page." };

	const uploads = await readUploads(form.getAll("images") as File[]);
	if (!uploads.ok) return { error: uploads.error };
	if (uploads.uploads.length === 0) return { error: "Choose at least one picture to add." };

	let position = await nextPageImageOrder(slot);
	for (const upload of uploads.uploads) {
		const mediaId = await createMedia({
			filename: upload.filename,
			mime: upload.mime,
			data: upload.data,
			width: upload.width,
			height: upload.height,
			alt: text(form, "alt") || PAGE_IMAGE_SLOTS[slot],
			uploadedBy: user.id,
		});
		await addPageImage(slot, mediaId, position);
		position++;
	}

	revalidateSite();
	redirect(`/admin/images?added=${uploads.uploads.length}`);
}

export async function removePageImage(form: FormData): Promise<void> {
	await requireUser();
	const id = Number(text(form, "id"));
	if (!Number.isInteger(id)) return;

	await deletePageImage(id);
	revalidateSite();
	redirect("/admin/images?deleted=1");
}

/**
 * Moves one photograph up or down.
 *
 * A swap rather than a renumber: the two rows exchange positions, so a list
 * whose numbers were never contiguous — because something was deleted from the
 * middle — still reorders correctly.
 */
export async function movePageImage(form: FormData): Promise<void> {
	await requireUser();

	const slot = text(form, "slot");
	const id = Number(text(form, "id"));
	const direction = text(form, "direction");
	if (!isPageImageSlot(slot) || !Number.isInteger(id)) return;

	const { data: images } = await listPageImages(slot);
	const index = images.findIndex((image) => image.id === id);
	if (index === -1) return;

	const swapWith = direction === "up" ? index - 1 : index + 1;
	if (swapWith < 0 || swapWith >= images.length) return;

	await setPageImageOrder(images[index].id, images[swapWith].sort_order);
	await setPageImageOrder(images[swapWith].id, images[index].sort_order);

	revalidateSite();
	redirect("/admin/images");
}
