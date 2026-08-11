import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections are the editable surface of the site: every page below is
 * rendered from these markdown files, so adding a project or team member never
 * requires touching a component. This is also the schema a future admin UI
 * would write against.
 */

const team = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
	schema: z.object({
		name: z.string(),
		role: z.string(),
		photo: z.string(),
		email: z.string().optional(),
		linkedin: z.string().url().optional(),
		/** Controls position in the /team grid; lower numbers appear first. */
		order: z.number(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		/** Longer heading used on the project's own page; falls back to `title`. */
		pageTitle: z.string().optional(),
		/** One-line description used on the projects listing and homepage. */
		summary: z.string(),
		/** Lead paragraphs shown under the title on the project's own page. */
		intro: z.array(z.string()).default([]),
		/** Vimeo id for an embedded demo, when the project has one. */
		vimeoId: z.string().optional(),
		/** The four short descriptor chips shown in the project hero. */
		tags: z.array(z.string()).default([]),
		/** Square-ish art for the listing cards. */
		cardImage: z.string(),
		/** Wide mockup shown on the detail page. */
		image: z.string().optional(),
		/** External project site, when there is one. */
		website: z.string().url().optional(),
		websiteLabel: z.string().default('See Platform'),
		/**
		 * Projects without their own page (LERO, CO-CREATIVE LAB) link straight
		 * out; setting this suppresses the generated detail route.
		 */
		externalOnly: z.boolean().default(false),
		order: z.number(),
	}),
});

const researchers = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/researchers' }),
	schema: z.object({
		name: z.string(),
		title: z.string(),
		photo: z.string(),
		/** Link to the full Google Scholar profile. */
		profileUrl: z.string().url(),
		order: z.number(),
	}),
});

const publications = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
	schema: z.object({
		title: z.string(),
		authors: z.array(z.string()),
		/** Kept as a string because the site shows partial dates (e.g. "2022"). */
		date: z.string(),
		year: z.number(),
		journal: z.string().optional(),
		volume: z.string().optional(),
		pages: z.string().optional(),
		publisher: z.string().optional(),
		description: z.string().optional(),
		link: z.string().url().optional(),
		researcher: reference('researchers'),
		order: z.number(),
	}),
});

const news = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		author: z.string().optional(),
		summary: z.string(),
		image: z.string().optional(),
		gallery: z.array(z.string()).default([]),
		/** Reachable at its own URL but hidden from the /news-events listing. */
		unlisted: z.boolean().default(false),
		/**
		 * Old WordPress permalinks that should redirect here. Several news posts
		 * had emoji in their URLs; those links stay alive via redirect stubs.
		 */
		legacyPaths: z.array(z.string()).default([]),
	}),
});

const research = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		order: z.number(),
	}),
});

export const collections = { team, projects, researchers, publications, news, research };
