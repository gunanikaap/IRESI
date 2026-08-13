import type { ProjectConfig } from "../types";

/**
 * IRESI — the parent platform's own site.
 *
 * Editing this file changes the header, footer and site identity everywhere.
 * It holds no page copy; that lives in `content.ts` (developer-edited) or in
 * the database (editor-managed through /admin).
 */
export const iresi: ProjectConfig = {
	key: "iresi",
	name: "IRESI",
	fullName:
		"International Research on Energy system integration, Education, and Environment for Sustainability and Innovation",
	description:
		"An interdisciplinary research centre at Maynooth University advancing sustainable, data-driven approaches to the clean energy transition.",
	institution: "Maynooth University",
	address: "Maynooth University, Maynooth, Co. Kildare",
	contactEmail: "info@iresi.eu",

	logo: {
		header: "/images/logo.png",
		footer: "/images/logo-mark.png",
		// The coloured hash from the IRESI mark, which is what the live site uses
		// in the tab. Regenerate from /images/logo-icon.png if sizes change.
		icon: {
			small: "/icon-32.png",
			large: "/icon-192.png",
			apple: "/apple-touch-icon.png",
		},
	},

	social: [
		{
			label: "Facebook",
			href: "https://www.facebook.com/profile.php?id=61551867127792",
			icon: "facebook",
		},
		{
			label: "LinkedIn",
			href: "https://www.linkedin.com/company/100041457/",
			icon: "linkedin",
		},
		{ label: "Twitter", href: "https://twitter.com/Iresi3680421", icon: "twitter" },
	],

	nav: [
		{ label: "Home", href: "/" },
		{
			label: "About",
			href: "/about-us",
			children: [
				{ label: "Who We Are", href: "/about-us" },
				{ label: "Team", href: "/team" },
			],
		},
		{ label: "Partners", href: "/partners" },
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
				{ label: "About Us", href: "/about-us" },
				{ label: "Research", href: "/research" },
				{ label: "Projects", href: "/projects" },
				{ label: "Publications", href: "/publications" },
				{ label: "People", href: "/team" },
				{ label: "Partners", href: "/partners" },
				{ label: "News & Events", href: "/news-events" },
				{ label: "Contact", href: "/contact" },
			],
		},
		// Between Menu and Research, matching the site this replaces.
		{ kind: "contact", heading: "Contact info" },
		{
			heading: "Research",
			links: [
				{ label: "Renewables", href: "/renewables" },
				{ label: "Transport", href: "/transport" },
				{ label: "Buildings", href: "/buildings" },
				{ label: "Electricity and Power System", href: "/electricity-and-power-system" },
				{ label: "Engage Research", href: "/engage-research" },
				{ label: "Green Upskilling", href: "/green-upskilling" },
				{ label: "Heating and Cooling Systems", href: "/heating-and-cooling-systems" },
			],
		},
	],

	themeClass: "theme-iresi",
};
