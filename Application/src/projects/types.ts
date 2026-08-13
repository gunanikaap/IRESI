/**
 * What makes one project's site different from another's.
 *
 * ---------------------------------------------------------------------------
 * WHY A PROJECT IS CONFIGURATION AND NOT A DATABASE COLUMN
 * ---------------------------------------------------------------------------
 * IRESI is the parent platform and ADFLEX is the first project under it, with
 * more to follow. The obvious move is a `project_id` on every table — and it is
 * the wrong one to make today, because whether IRESI runs **one database shared
 * by every project** or **one per project** has not been decided. That decision
 * belongs to Adarsh, Paolo and the technical team.
 *
 * So a project is resolved once, at startup, from `ACTIVE_PROJECT`. One
 * deployment serves one project and talks to whatever `DATABASE_URL` points at.
 * Both answers stay reachable from here:
 *
 *   - one database per project  ->  nothing changes; point each deployment at
 *     its own database
 *   - one shared database       ->  add a project column in a migration and a
 *     filter in `repo.ts`, which is the only module that names tables
 *
 * Adding that column later is a migration. Adding it now and removing it later
 * is a mess. See handover/FOR-THE-IRESI-BUILD.md §2.
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
