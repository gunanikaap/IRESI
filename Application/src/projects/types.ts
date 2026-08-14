/**
 * What makes one project's site different from another's.
 *
 * ---------------------------------------------------------------------------
 * IDENTITY IS CONFIGURATION. OWNERSHIP OF A ROW IS NOT — NOT ANY MORE.
 * ---------------------------------------------------------------------------
 * This file used to argue that a project should never be a database column,
 * because whether IRESI ran one shared database or one per project had not been
 * decided, and a column added early and removed late is a mess. Two deployment
 * shapes stayed reachable: a database each, or a shared database plus a column
 * and a filter in `repo.ts`.
 *
 * **The team chose the shared shape on 13 August 2026.** ADFLEX is served from
 * /adflex on this deployment — one process, one database, one admin, one login.
 * So the second path was taken: `migrations/007_site_scope.sql` adds a
 * `project_key` column to the editor-managed tables, and the public reads in
 * `repo.ts` take a `Site` argument. That is the part of the earlier reasoning
 * that no longer applies, and it was planned for rather than worked around.
 *
 * What this file describes is still configuration, and still has no column:
 * a project's **identity** — its name, navigation, logo, theme, contact
 * address. None of that belongs in a row. The distinction that matters is
 * between "who is this site" (here) and "which site owns this row"
 * (`project_key`).
 *
 * `ACTIVE_PROJECT` still selects the identity, and still defaults to IRESI. It
 * is now the answer for the *root* of the deployment; a subpath states its own
 * site explicitly — see `src/projects/adflex/site.ts`.
 */

export type SocialIcon = "facebook" | "linkedin" | "twitter";

export type NavItem = {
	label: string;
	href: string;
	/** Rendered as a dropdown under the parent. */
	children?: readonly NavItem[];
};

export type SocialLink = {
	label: string;
	href: string;
	icon: SocialIcon;
};

/**
 * One column in the footer.
 *
 * The contact details are a column like any other so a project can decide where
 * they sit. IRESI puts them between Menu and Research, which is where the site
 * this replaces has them; a project that wants them last simply reorders its
 * array rather than needing a change here.
 */
export type FooterColumn =
	| { kind?: "links"; heading: string; links: readonly NavItem[] }
	| { kind: "contact"; heading: string };

export type ProjectConfig = {
	/** Matches the folder name and the `ACTIVE_PROJECT` value. */
	key: string;

	/** Short name, used in the browser title and as the logo's alt text. */
	name: string;

	/** Expanded name, used where the acronym alone would not be understood. */
	fullName: string;

	/** One sentence describing the site, used as the default meta description. */
	description: string;

	institution: string;
	address: string;

	/**
	 * Where contact form messages are delivered. That is the whole of its job.
	 *
	 * It is **not** the admin login — signing in uses a username and nothing is
	 * ever sent to it — and it is **not** the mailbox the site authenticates to,
	 * which is `MAIL_SENDER` in `src/lib/site.ts`. Letting one address do all
	 * three meant changing where enquiries went also changed who could sign in.
	 */
	contactEmail: string;

	logo: {
		header: string;
		footer: string;
		/**
		 * The square mark used for the browser tab and home-screen icons.
		 *
		 * Separate from the header and footer logos because those are wordmarks:
		 * at 32 pixels a wordmark is an illegible smear, and the tab is the one
		 * place the site is identified by shape alone.
		 */
		icon: {
			small: string;
			large: string;
			apple: string;
		};
	};

	/** Funding statement shown in the footer, when the project has one. */
	funding?: {
		statement: string;
		logo?: string;
	};

	social: readonly SocialLink[];

	/** Primary header navigation. */
	nav: readonly NavItem[];

	/** Columns of links in the footer, after the logo block. */
	footerColumns: readonly FooterColumn[];

	/**
	 * CSS class applied to `<html>`, selecting the project's token block in
	 * `src/projects/<key>/theme.css`. Theming is the seam where a project's look
	 * is applied; every colour, space and font size is a token so a theme is one
	 * block of CSS rather than a fork of the stylesheets.
	 */
	themeClass: string;
};
