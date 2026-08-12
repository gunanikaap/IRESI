import teamData from "./data/team.json";
import researchData from "./data/research.json";
import researchersData from "./data/researchers.json";

/**
 * IRESI's developer-managed content.
 *
 * ---------------------------------------------------------------------------
 * TWO KINDS OF CONTENT, AND THIS IS THE SECOND KIND
 * ---------------------------------------------------------------------------
 * Content on this site comes from one of two places, and knowing which is most
 * of what makes a handover work:
 *
 *   1. **The admin** (/admin, stored in Postgres) — projects, publications,
 *      news and events, and the images attached to them. These change often and
 *      an editor changes them without a developer. That was the whole point of
 *      the meeting.
 *
 *   2. **This file** — the team list, the seven research topics, the partner
 *      logos, and the standing page copy. These change rarely, and every change
 *      is a considered one: a new staff member, a new partner, a rewrite of the
 *      About page. Putting them behind an admin form would add screens nobody
 *      opens twice a year.
 *
 * So the answer to "where do I change the About text?" is one sentence: here.
 * If the team later wants the team list editable too, it moves to the database
 * and this file loses a section — nothing else changes.
 *
 * The three JSON files under `data/` were generated from the previous
 * WordPress site's content. They are data, not code; edit them directly.
 */

export type TeamMember = {
	name: string;
	role: string;
	photo: string;
	email: string | null;
	linkedin: string | null;
	order: number;
};

/** A heading with its paragraphs and bullets, as rendered by `<Prose>`. */
export type ContentSection = {
	heading: string | null;
	paragraphs: string[];
	bullets: string[];
};

export type ResearchTopic = {
	slug: string;
	title: string;
	summary: string;
	order: number;
	sections: ContentSection[];
};

export type Researcher = {
	slug: string;
	name: string;
	title: string;
	photo: string;
	profileUrl: string;
	order: number;
	intro: string[];
};

export const team: TeamMember[] = teamData;
export const researchTopics: ResearchTopic[] = researchData;

/**
 * The three researchers whose papers are grouped on /publications.
 *
 * Kept here rather than in the database because the *grouping* is editorial —
 * which profiles lead the page — while the papers themselves are editor-managed
 * and live in Postgres. A publication points at one of these by `slug`.
 */
export const researchers: Researcher[] = researchersData;

export const partners = {
	industry: [
		{ name: "Three o’clock", logo: "/images/partners/three-oclock.png" },
		{ name: "Artemat", logo: "/images/partners/artemat.png" },
		{ name: "IKIM", logo: "/images/partners/ikim.png" },
		{ name: "Finnova", logo: "/images/partners/finnova.png" },
		{ name: "Global Hope Network International", logo: "/images/partners/global-hope-network.jpeg" },
	],
	research: [
		{ name: "Lero", logo: "/images/partners/lero.png" },
		{ name: "COER", logo: "/images/partners/coer.png" },
		{ name: "UCD Energy Institute", logo: "/images/partners/ucd-energy-institute.jpg" },
		{ name: "MaREI", logo: "/images/partners/marei.jpg" },
		{ name: "IVI", logo: "/images/partners/ivi.png" },
		{ name: "University of Genoa", logo: "/images/partners/university-of-genoa.jpeg" },
		{ name: "Halmstad University", logo: "/images/partners/halmstad-university.png" },
		{ name: "UNITAR", logo: "/images/partners/unitar.png" },
	],
} as const;

/** Everything on the home page that is not pulled from the database. */
export const home = {
	hero: {
		headline: "Driving the Future of Renewable Energy",
		headlineMuted: "Through Innovation & Research",
		intro:
			"We bring together researchers, institutions, and industries to advance sustainable energy systems and shape a cleaner future.",
		image: "/images/home/hero.jpg",
	},
	stats: [
		{ value: "10+", label: "International Projects" },
		{ value: "20+", label: "Researchers & Experts" },
		{ value: "50+", label: "Scientific Publications" },
		{ value: "10+", label: "Partner Institutions" },
		{ value: "Since 2020", label: "EU-Funded" },
	],
	about: {
		eyebrow: "About Us",
		heading: "Who We Are",
		paragraphs: [
			"The International Research on Energy system integration, Education, and Environment for Sustainability and Innovation (IRESI) Centre serves as a leading interdisciplinary hub at Maynooth University, dedicated to advancing sustainable, data-driven, and community-centred approaches to the clean energy transition.",
			"The mission of the IRESI Centre is to advance sustainable and data-driven solutions for decarbonisation, empowering learning, and fostering stakeholder engagement to accelerate progress towards achieving the SDGs by connecting technologies with communities, industry, and policymakers.",
		],
		collage: Array.from({ length: 9 }, (_, i) => `/images/home/collage-${i + 1}.jpg`),
	},
	focus: {
		eyebrow: "Our Focus",
		heading: "We turn research into real-world energy solutions.",
		image: "/images/home/focus.png",
		items: [
			{
				title: "Research Excellence",
				text: "We lead research in renewable energy integration to build smarter systems.",
			},
			{
				title: "Collaborative Network",
				text: "Connecting academia, industry, and policy to drive innovation.",
			},
			{ title: "Real-World Impact", text: "Delivering measurable change for a sustainable future." },
			{
				title: "Innovation & Integration",
				text: "Transforming research into practical energy solutions.",
			},
		],
	},
	cta: {
		heading: "Join Us in Building a Sustainable Energy Future",
		text: "We collaborate with researchers, industry partners, and institutions across Europe to drive innovation and positive energy transformation.",
	},
};

/** The About Us page. */
export const about = {
	facts: [
		"€9.5M+ Competitive Funding",
		"Maynooth University, Ireland",
		"Interdisciplinary Research Centre",
		"Horizon Europe, SFI, SEAI",
	],
	intro:
		"The International Research on Energy system integration, Education, and Environment for Sustainability and Innovation (IRESI) Centre serves as a leading interdisciplinary hub at Maynooth University, dedicated to advancing sustainable, data-driven, and community-centred approaches to the clean energy transition.",
	leadImage: "/images/about/lead.jpg",
	sections: [
		{
			title: "Our Role & Expertise",
			text: "The Centre addresses pressing national and global challenges in decarbonisation and climate resilience, energy systems integration, digital innovation, education, and environmental stewardship, bringing together expertise across engineering, computer science, business, and social science to deliver impactful and scalable solutions.",
		},
		{
			title: "Strategic Alignment",
			text: "Aligned with Maynooth University’s strategic Research Beacons — Sustainability and Climate Change and Data Science and Digital Transformation — IRESI embeds education, digitalisation, and stakeholder engagement as its core pillars. Its mission reflects the University’s emphasis on partnerships, community connection, and policy engagement, directly contributing to the institution’s leadership in climate action, digital innovation, and societal transformation.",
		},
		{
			title: "Research & Innovation Scope",
			text: "The Centre’s activities bridge the full innovation spectrum — from applying advanced AI, data analytics, and digital twin technologies for optimising energy and transport systems, to co-creating community-driven solutions for decarbonisation, energy efficiency, and climate resilience.",
		},
		{
			title: "National & European Contribution",
			text: "Each research strand contributes to Ireland’s Climate Action Plan (2024), National Energy and Climate Plan (NECP 2021–2030), and Smart Specialisation Strategy, while also supporting the European Union’s Green Deal, REPowerEU, and Horizon Europe Mission on Climate-Neutral and Smart Cities.",
		},
		{
			title: "Research Capacity & Collaboration",
			text: "By establishing IRESI as a Designated Research Centre, Maynooth University will consolidate an existing critical mass of €9.5 million in competitively secured funding, enhance its visibility within national and international research ecosystems (including Horizon Europe, SFI, SEAI, and Enterprise Ireland programmes), and institutionalise a proven model of cross-faculty and cross-sector collaboration.",
		},
		{
			title: "Our Vision & Impact",
			text: "In doing so, IRESI will position Maynooth University as a recognised leader in connecting energy, innovation, environment, and education — driving research excellence with tangible impact on policy, industry, and communities.",
		},
	],
	collage: Array.from({ length: 16 }, (_, i) => `/images/about/collage-${i + 1}.jpg`),
};

/** The Partners page. */
export const partnersPage = {
	subtitle: "Empowering Sustainable Energy Together",
	leadImage: "/images/partners/lead.jpg",
	paragraphs: [
		"At International Renewables and Energy Systems Integration (IRESI), we firmly believe that the path to a sustainable energy future is paved with strong partnerships. Our journey towards energy excellence is enriched by the collective wisdom, expertise, and commitment of our esteemed partners.",
	],
	collaborationHeading: "Collaboration for Impact",
	collaborationText:
		"Our partners play a pivotal role in our mission to integrate and optimize energy systems for a cleaner and greener world. Together, we drive innovation, create real-world solutions, and make a lasting impact on our environment and society.",
	joinHeading: "Join Our Network",
	joinText:
		"If you share our passion for sustainable energy and want to make a difference, we invite you to explore partnership opportunities with IRESI. Together, we can shape the future of energy systems integration.",
};

/** The /research hub page, which introduces the seven topic pages. */
export const researchHub = {
	subtitle: "Research at IRESI: Pioneering Sustainable Solutions",
	intro:
		"At the International Renewables and Energy Systems Integration Group (IRESI), research is at the forefront of our mission to transform the energy landscape and drive sustainable change. Our dedicated team of experts spans various research divisions, each focused on advancing knowledge and innovation in specific areas of sustainable energy. Explore our diverse research divisions below.",
	divisions: [
		{
			slug: "renewables",
			title: "Renewables",
			text: "In the realm of renewable energy, our research at IRESI is dedicated to harnessing the full potential of sources like solar, wind, and hydro power. We’re not content with just their existence; we strive to optimize their efficiency, storage capabilities, and seamless integration into established energy grids. Our goal is clear: to position renewable energy as the bedrock of a sustainable future.",
			images: ["/images/research/renewables-1.jpg", "/images/research/renewables-2.jpg"],
		},
		{
			slug: "transport",
			title: "Transportation",
			text: "At IRESI, our dedication to revolutionizing transportation is unwavering. Through rigorous research and innovation, we focus on electric vehicles, alternative fuels, and sustainable urban mobility solutions. Our goal is to drive a seismic shift away from fossil fuel dependency, mitigating emissions, and ushering in a cleaner, greener era of transportation.",
			images: [],
		},
		{
			slug: "buildings",
			title: "Buildings",
			text: "In the realm of building research, IRESI delves deep into the development of sustainable building materials, the creation of energy-efficient architectural designs, and the integration of smart technologies. Our aim is to foster the construction of environmentally responsible structures that substantially reduce their carbon footprint.",
			images: ["/images/research/buildings-1.jpg", "/images/research/buildings-2.jpg"],
		},
		{
			slug: "engage-research",
			title: "Engaged Research",
			text: "Our commitment to impactful research extends beyond the confines of academia. Through collaborative projects with industry partners and local communities, we bridge the gap between theory and practice. These partnerships enable us to tackle real-world challenges head-on, harnessing the power of our research to effect tangible change in society.",
			images: [],
		},
		{
			slug: "green-upskilling",
			title: "Green Technologies Upskilling",
			text: "IRESI’s dedication to education extends to a crucial facet: upskilling the workforce in green technologies. Through specialized training programs, workshops, and collaborations with industry partners, we equip individuals with the knowledge and practical skills needed to thrive in the ever-evolving green technology landscape.",
			images: ["/images/research/upskilling-1.jpg", "/images/research/upskilling-2.jpg"],
		},
		{
			slug: "electricity-and-power-system",
			title: "Electricity and Power Systems",
			text: "In the domain of electricity and power systems, our research endeavors at IRESI focus on the development of cutting-edge solutions. We delve into advanced grid management strategies, harnessing smart technologies and data analytics to enhance grid reliability and efficiency, and pioneer storage solutions that facilitate the integration of renewable energy sources.",
			images: [],
		},
		{
			slug: "heating-and-cooling-systems",
			title: "Heating and Cooling Systems",
			text: "Within the Heating and Cooling Systems division, our research is dedicated to exploring sustainable methods that significantly reduce energy consumption and carbon emissions. We delve into innovative approaches such as harnessing geothermal energy, utilizing solar thermal systems, and optimizing HVAC technologies.",
			images: ["/images/research/heating-cooling-1.jpg"],
		},
	],
	closing:
		"At IRESI, our research isn’t just theoretical; it’s a driving force for change. We actively collaborate with partners worldwide, embrace interdisciplinary approaches, and push the boundaries of knowledge to create a more sustainable and equitable future. Join us in our journey to make a difference through research that matters.",
};

/** The Contact page. */
export const contact = {
	paragraphs: [
		"Thank you for your interest in the International Research on Energy System Integration, Education, and Environment for Sustainability and Innovation (IRESI) Centre.",
		"We welcome your questions and enquiries and are happy to provide further information about our research, projects, and collaborations. Please use the form below to contact us.",
	],
};
