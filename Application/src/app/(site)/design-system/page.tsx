import type { Metadata } from "next";
import Link from "next/link";
import { readTokens } from "@/lib/design-tokens";
import {
	ContrastTable,
	OnThisPage,
	Rules,
	Section,
	Specimen,
	Subsection,
	Swatch,
	SwatchGrid,
	TokenTable,
} from "@/components/design-system/Parts";
import styles from "@/components/design-system/design-system.module.css";

/**
 * The IRESI design system.
 *
 * A reference for whoever builds the next page, and a record of what the
 * decisions were. Not linked from the site's navigation — it documents the
 * site rather than being part of it — and `noindex` so it stays out of search
 * results while living at a stable address the team can bookmark.
 *
 * Every value on this page is read from `src/projects/iresi/theme.css` at build
 * time. There is no second copy to fall out of date. See `readTokens`.
 */
export const metadata: Metadata = {
	title: "Design system",
	description:
		"The colours, type, spacing and components behind the IRESI Centre website.",
	robots: { index: false, follow: false },
};

const SECTIONS = [
	{ id: "foundations", label: "Foundations" },
	{ id: "colour", label: "Colour" },
	{ id: "contrast", label: "Contrast" },
	{ id: "type", label: "Typography" },
	{ id: "layout", label: "Layout" },
	{ id: "components", label: "Components" },
	{ id: "content", label: "Writing" },
	{ id: "rules", label: "Rules" },
] as const;

/** Pairs that actually carry text on the site, measured rather than asserted. */
const CONTRAST_PAIRS = [
	{ foreground: "--color-text", background: "--color-bg", usage: "Body copy" },
	{ foreground: "--color-heading", background: "--color-bg", usage: "Headings" },
	{ foreground: "--color-text-muted", background: "--color-bg", usage: "Card summaries, meta" },
	{ foreground: "--color-text", background: "--color-bg-alt", usage: "Copy on tinted sections" },
	{ foreground: "--color-accent", background: "--color-bg", usage: "Links, CTA text" },
	{ foreground: "--color-accent-contrast", background: "--color-accent", usage: "Filled buttons" },
	{ foreground: "--color-inverse", background: "--color-footer-bg", usage: "Footer" },
] as const;

export default async function IresiDesignSystemPage() {
	const tokens = await readTokens("src/projects/iresi/theme.css", ".theme-iresi");

	const colours = tokens.filter((token) => token.name.startsWith("--color-"));
	const gradients = tokens.filter((token) => token.name.startsWith("--gradient-"));
	const type = tokens.filter(
		(token) => token.name.startsWith("--font-") || token.name.startsWith("--heading-"),
	);
	const layout = tokens.filter((token) =>
		["--container", "--header-height", "--radius"].includes(token.name),
	);

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.eyebrow}>IRESI Centre</p>
				<h1 className={styles.title}>Design system</h1>
				<p className={styles.lede}>
					The colours, type, spacing and components the IRESI website is built from. Written for
					whoever adds the next page — and as a record of which decisions were deliberate.
				</p>
				<p className={styles.sourceNote}>
					<strong>Every value here is read from the stylesheet at build time.</strong> The tokens
					come from <code>src/projects/iresi/theme.css</code> and the swatches are filled with the
					custom properties themselves, so this page cannot drift from the site. Change a token
					and this page changes with it. The contrast figures are calculated, not claimed.
				</p>
			</header>

			<OnThisPage sections={SECTIONS} />

			<div>
				<Section
					id="foundations"
					title="Foundations"
					intro={
						<>
							A project&rsquo;s look is one block of CSS custom properties. Nothing in{" "}
							<code>src/app</code> or <code>src/components</code> names a project; swapping the
							theme class on <code>&lt;html&gt;</code> swaps the site&rsquo;s appearance. That is
							the seam that lets ADFLEX run from the same codebase — see its own{" "}
							<Link href="/adflex/design-system">design system</Link>.
						</>
					}
				>
					<TokenTable
						tokens={type}
						caption="Type and heading tokens, exactly as declared in .theme-iresi"
					/>
				</Section>

				<Section
					id="colour"
					title="Colour"
					intro="Carried over from the previous site so the rebuild matches it. Names are generic on purpose — a component asks for the accent, never for blue."
				>
					<SwatchGrid>
						{colours.map((token) => (
							<Swatch
								key={token.name}
								token={token}
								onDark={/inverse|contrast|--color-bg$/.test(token.name)}
							/>
						))}
					</SwatchGrid>

					<Subsection title="Gradients">
						<SwatchGrid>
							{gradients.map((token) => (
								<Swatch key={token.name} token={token} />
							))}
						</SwatchGrid>
					</Subsection>
				</Section>

				<Section
					id="contrast"
					title="Contrast"
					intro="Measured from the parsed values, not asserted in prose. AA is the target for body text; AA Large is only acceptable at 24px or 19px bold and above."
				>
					<ContrastTable pairs={CONTRAST_PAIRS} tokens={tokens} />
				</Section>

				<Section
					id="type"
					title="Typography"
					intro="Montserrat for headings, Work Sans for body copy, both self-hosted by next/font so no visitor's browser contacts Google to render a page. Headings are uppercase at weight 500 — a project token, not a hard-coded rule."
				>
					<Specimen label="h1" note="clamp(2.1875rem → 3.125rem)">
						<h1>Advancing energy systems integration</h1>
					</Specimen>
					<Specimen label="h2" note="clamp(1.875rem → 2.5rem)">
						<h2>Our research</h2>
					</Specimen>
					<Specimen label="h3" note="1.25rem">
						<h3>Renewables</h3>
					</Specimen>
					<Specimen label="p.lead" note="Opening paragraph, larger and lighter">
						<p className="lead">
							An interdisciplinary research centre at Maynooth University advancing sustainable,
							data-driven approaches to the clean energy transition.
						</p>
					</Specimen>
					<Specimen label="p" note="Body copy, 1rem / 1.7">
						<p>
							The Centre addresses national and global challenges in decarbonisation and climate
							resilience, energy systems integration, digital innovation and education.
						</p>
					</Specimen>
					<Specimen label="span.eyebrow" note="Section label above a heading">
						<span className="eyebrow">Life at the centre</span>
					</Specimen>
					<Specimen label="p.muted" note="Secondary text">
						<p className="muted">Published 14 August 2026</p>
					</Specimen>
				</Section>

				<Section
					id="layout"
					title="Layout"
					intro="One container width and one corner radius, both tokens. Sections carry their own vertical rhythm so pages do not need bespoke spacing."
				>
					<TokenTable tokens={layout} />

					<Subsection title="Section rhythm">
						<Specimen
							label=".section / .section--alt"
							note="--section-gap is clamp(3.5rem → 6rem); the alt variant tints the ground"
						>
							<div style={{ border: "1px dashed #cfd6de", borderRadius: 6, overflow: "hidden" }}>
								<div className="section" style={{ background: "var(--color-bg)" }}>
									<div className="container">
										<strong>.section</strong> — the default ground
									</div>
								</div>
								<div className="section section--alt">
									<div className="container">
										<strong>.section--alt</strong> — alternating tint
									</div>
								</div>
							</div>
						</Specimen>
					</Subsection>
				</Section>

				<Section
					id="components"
					title="Components"
					intro="Rendered here with the site's own classes, so anything that breaks in them breaks here too."
				>
					<Subsection title="Buttons">
						<Specimen label=".button" note="Primary action. Filled with the accent">
							<a className="button" href="#components">
								Get in touch
							</a>
						</Specimen>
						<Specimen label=".buttonOutline" note="Secondary action on a dark ground" dark>
							<a className="buttonOutline" href="#components">
								See platform
							</a>
						</Specimen>
						<Specimen
							label=".buttonOutline.buttonOutlineDark"
							note="The same, for use on a light ground"
						>
							<a className="buttonOutline buttonOutlineDark" href="#components">
								All projects
							</a>
						</Specimen>
					</Subsection>

					<Subsection title="Long-form copy">
						<Specimen
							label=".prose"
							note="Wraps rendered page text: headings, paragraphs, bullets and inline marks"
						>
							<div className="prose">
								<h2>Objective</h2>
								<p>
									The main goal is to encourage carbon reduction and improve energy efficiency at
									the local level.
								</p>
								<ul>
									<li>Community energy platforms</li>
									<li>EV charging and smart tariffs</li>
								</ul>
								<p>
									Credit where it is due —{" "}
									<a href="#components">a link looks like this</a> — and{" "}
									<span className="hashtag">#Hashtags</span> are set apart.
								</p>
							</div>
						</Specimen>
					</Subsection>
				</Section>

				<Section
					id="content"
					title="Writing"
					intro="Page copy is stored as plain text, not HTML and not markdown. These are the only marks that mean anything; everything else renders literally."
				>
					<div className={styles.tableWrap}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th scope="col">Written</th>
									<th scope="col">Becomes</th>
									<th scope="col">Notes</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<th scope="row">
										<code>## Heading</code>
									</th>
									<td>A section heading</td>
									<td>Recognised at the start of any line</td>
								</tr>
								<tr>
									<th scope="row">
										<code>- point</code>
									</th>
									<td>A bullet</td>
									<td>
										<code>*</code> works too. A paragraph after a list starts a new section, so
										it stays below the list
									</td>
								</tr>
								<tr>
									<th scope="row">
										<code>[words](https://…)</code>
									</th>
									<td>A link</td>
									<td>http, https and mailto only — anything else renders as plain text</td>
								</tr>
								<tr>
									<th scope="row">
										<code>**words**</code>
									</th>
									<td>Bold</td>
									<td>
										Tried before <code>*words*</code>, or the inner match would eat it
									</td>
								</tr>
								<tr>
									<th scope="row">
										<code>*words*</code>
									</th>
									<td>Italic</td>
									<td>—</td>
								</tr>
								<tr>
									<th scope="row">
										<code>#Hashtag</code>
									</th>
									<td>An accent-coloured tag</td>
									<td>For the trailing tags the news posts end on</td>
								</tr>
								<tr>
									<th scope="row">A blank line</th>
									<td>A new paragraph</td>
									<td>Consecutive lines join, so soft-wrapped text stays one paragraph</td>
								</tr>
							</tbody>
						</table>
					</div>
				</Section>

				<Section id="rules" title="Rules">
					<Rules
						title="Accessibility"
						items={[
							"Body text meets WCAG AA. The muted grey is the one to watch — check the contrast table before using it smaller than 16px.",
							"Every interactive element keeps a visible focus ring. Do not remove an outline without replacing it with something at least as clear.",
							"Images that carry meaning need alt text; decorative ones take alt=\"\" so a screen reader skips them rather than reading a filename.",
							"Animation is opt-in: every transition is inside a prefers-reduced-motion guard, and the site is fully usable without any of it.",
							"Headings descend in order. A page has one h1 and does not skip a level to get a size — the size is a class.",
						]}
					/>
					<Rules
						title="Using the tokens"
						items={[
							"Reach for a token before a literal. A hex in a component is a value that cannot be re-themed and will be missed when a project's palette changes.",
							"Token names describe a role, never an appearance: --color-accent, not --color-blue.",
							"A new value that only one component needs belongs in that component's module. A value two components share belongs in the theme.",
							"Ask whether ADFLEX would need the same thing. If it would, it is a platform token; if it would not, it is component CSS.",
						]}
					/>
				</Section>
			</div>
		</div>
	);
}
