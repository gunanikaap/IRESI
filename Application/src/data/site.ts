/**
 * Single source of truth for site-wide chrome: navigation, footer and contact
 * details. Editing this file changes the header and footer everywhere.
 */

export const site = {
	name: 'IRESI',
	fullName:
		'International Research on Energy system integration, Education, and Environment for Sustainability and Innovation',
	shortDescription:
		'An interdisciplinary research centre at Maynooth University advancing sustainable, data-driven approaches to the clean energy transition.',
	url: 'https://www.iresi.eu',
	email: 'info@iresi.eu',
	institution: 'Maynooth University',
	address: 'Maynooth University, Maynooth, Co. Kildare',
} as const;

export const social = [
	{
		label: 'Facebook',
		href: 'https://www.facebook.com/profile.php?id=61551867127792',
		icon: 'facebook',
	},
	{ label: 'LinkedIn', href: 'https://www.linkedin.com/company/100041457/', icon: 'linkedin' },
	{ label: 'Twitter', href: 'https://twitter.com/Iresi3680421', icon: 'twitter' },
] as const;

export type NavLink = {
	label: string;
	href: string;
	children?: readonly { label: string; href: string }[];
};

/** Primary header navigation, mirroring the live site's menu. */
export const mainNav: readonly NavLink[] = [
	{ label: 'Home', href: '/' },
	{
		label: 'About',
		href: '/about-us',
		children: [
			{ label: 'Who We Are', href: '/about-us' },
			{ label: 'Team', href: '/team' },
		],
	},
	{ label: 'Partners', href: '/partners' },
	{ label: 'Projects', href: '/projects' },
	{ label: 'Publications', href: '/publications' },
	{ label: 'News & Events', href: '/news-events' },
	{ label: 'Contact', href: '/contact' },
];

/** Footer "Menu" column. */
export const footerNav = [
	{ label: 'Home', href: '/' },
	{ label: 'About Us', href: '/about-us' },
	{ label: 'Research', href: '/research' },
	{ label: 'Projects', href: '/projects' },
	{ label: 'Publications', href: '/publications' },
	{ label: 'People', href: '/team' },
	{ label: 'Partners', href: '/partners' },
	{ label: 'News & Events', href: '/news-events' },
	{ label: 'Contact', href: '/contact' },
] as const;

/**
 * The seven research topics. `slug` doubles as the top-level URL, matching the
 * WordPress permalinks exactly.
 */
export const researchTopics = [
	{ label: 'Renewables', slug: 'renewables' },
	{ label: 'Transport', slug: 'transport' },
	{ label: 'Buildings', slug: 'buildings' },
	{ label: 'Electricity and Power System', slug: 'electricity-and-power-system' },
	{ label: 'Engage Research', slug: 'engage-research' },
	{ label: 'Green Upskilling', slug: 'green-upskilling' },
	{ label: 'Heating and Cooling Systems', slug: 'heating-and-cooling-systems' },
] as const;
