import type { ProjectConfig } from "../types";

/**
 * ADFLEX — the first project running on the IRESI platform.
 *
 * This exists so the platform is exercised by two projects rather than one.
 * A single-project abstraction is a guess; a second consumer is what proves the
 * seams are in the right places.
 *
 * The ADFLEX **site** still lives in its own repository and is not served from
 * here yet. Whether it eventually runs as a subdomain, a subpath or a separate
 * deployment was explicitly left open in the review meeting, so nothing in this
 * file assumes an answer — the routes are the same routes, and only the
 * identity, navigation and theme differ.
 */
export const adflex: ProjectConfig = {
	key: "adflex",
	name: "ADFLEX",
	fullName: "Advancing Demand Flexibility for Sustainable Energy Communities",
	description:
		"ADFLEX develops and validates smart energy solutions that enhance flexibility, integrate digital technologies, and empower Sustainable Energy Communities to participate in local energy markets.",
	institution: "Maynooth University",
	address: "Maynooth University, Maynooth, Co. Kildare",
	contactEmail: "info@iresi.eu",

	logo: {
		header: "/images/logo.png",
		footer: "/images/logo-mark.png",
	},

	// Confirmed in the review meeting of 12 August 2026: ADFLEX is SEAI-funded,
	// not EU-funded. The grant number and disclaimer have never been supplied,
	// so this is deliberately the shortest true statement.
	funding: {
		statement: "Funded by SEAI.",
	},

	social: [
		{
			label: "LinkedIn",
			href: "https://www.linkedin.com/company/100041457/",
			icon: "linkedin",
		},
	],

	nav: [
		{ label: "Home", href: "/" },
		{ label: "About", href: "/about-us" },
		{ label: "Projects", href: "/projects" },
		{ label: "Publications", href: "/publications" },
		{ label: "News & Events", href: "/news-events" },
		{ label: "Contact", href: "/contact" },
	],

	footerColumns: [
		{
			heading: "Menu",
			links: [
				{ label: "Home", href: "/" },
				{ label: "About", href: "/about-us" },
				{ label: "Projects", href: "/projects" },
				{ label: "Publications", href: "/publications" },
				{ label: "News & Events", href: "/news-events" },
				{ label: "Contact", href: "/contact" },
			],
		},
	],

	themeClass: "theme-adflex",
};
