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
 * The ADFLEX design system.
 *
 * ADFLEX's own repository had a page like this; it was not ported with the rest
 * of the site, because that version wrote its palette out as data with a comment
 * asking the next person to keep it in sync with the stylesheet. This one reads
 * `src/projects/adflex/tokens.css` at build time instead, so the two cannot
 * disagree.
 *
 * Rendered inside `.adflex-scope`, which the ADFLEX layout provides, so every
 * specimen below is drawn with the real ADFLEX tokens and the real ADFLEX
 * classes rather than with an imitation of them.
 */
export const metadata: Metadata = {
	title: "Design system",
	description: "The visual and interaction foundations behind the ADFLEX project website.",
	robots: { index: false, follow: false },
};

const SECTIONS = [
	{ id: "foundations", label: "Foundations" },
	{ id: "brand", label: "Brand colours" },
	{ id: "palette", label: "Semantic palette" },
	{ id: "contrast", label: "Contrast" },
	{ id: "type", label: "Typography" },
	{ id: "space", label: "Space & shape" },
	{ id: "components", label: "Components" },
	{ id: "rules", label: "Rules" },
] as const;

const CONTRAST_PAIRS = [
	{ foreground: "--adflex-color-text", background: "--adflex-color-background", usage: "Body copy" },
	{ foreground: "--adflex-color-ink", background: "--adflex-color-background", usage: "Headings" },
	{ foreground: "--adflex-color-muted", background: "--adflex-color-background", usage: "Secondary text" },
	{ foreground: "--adflex-color-text", background: "--adflex-color-surface-soft", usage: "Copy on the soft surface" },
	{ foreground: "--adflex-color-primary", background: "--adflex-color-surface", usage: "Links and quiet buttons" },
	{ foreground: "--adflex-color-brand", background: "--adflex-color-surface", usage: "The logo green as text" },
	{ foreground: "--adflex-color-accent", background: "--adflex-color-surface", usage: "The logo yellow as text" },
] as const;

export default async function AdflexDesignSystemPage() {
	const tokens = await readTokens("src/projects/adflex/tokens.css", ".adflex-scope");

	const brand = tokens.filter((token) => /^--adflex-brand-/.test(token.name));
	const semantic = tokens.filter((token) => /^--adflex-color-/.test(token.name));
	const type = tokens.filter((token) => /^--adflex-(font|text|leading|tracking)/.test(token.name));
	const space = tokens.filter((token) =>
		/^--adflex-(space|radius|shadow|header-height|target-min)/.test(token.name),
	);

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<p className={styles.eyebrow}>ADFLEX</p>
				<h1 className={styles.title}>Design system</h1>
				<p className={styles.lede}>
					The visual and interaction foundations behind the ADFLEX project website, which runs
					from the IRESI platform at <code>/adflex</code>.
				</p>
				<p className={styles.sourceNote}>
					<strong>Every value here is read from the stylesheet at build time.</strong> The tokens
					come from <code>src/projects/adflex/tokens.css</code>, the swatches are filled with the
					custom properties themselves, and the specimens use the real{" "}
					<code>.adflex-*</code> classes — so this page cannot drift from the site. Contrast is
					calculated from the resolved values, not claimed. IRESI has its own{" "}
					<Link href="/design-system">design system</Link>.
				</p>
			</header>

			<OnThisPage sections={SECTIONS} />

			<div>
				<Section
					id="foundations"
					title="Foundations"
					intro={
						<>
							Every ADFLEX rule is written against <code>.adflex-scope</code> and every token is
							named <code>--adflex-*</code>. That is not decoration: it is what allows the ADFLEX
							site to run inside the IRESI deployment without either stylesheet reaching the
							other. The base styles use <code>:where()</code>, so they carry zero specificity
							and a component&rsquo;s own class always wins.
						</>
					}
				>
					<Rules
						title="The two-layer palette"
						items={[
							"Brand constants are sampled from the logo and never rebind. They are the project's identity.",
							"A fixed light palette holds the source values, and the semantic tokens bind to it.",
							"Components only ever use semantic tokens — --adflex-color-ink, not --adflex-brand-green. That indirection is what would let a dark theme be added by rebinding one block.",
						]}
					/>
				</Section>

				<Section
					id="brand"
					title="Brand colours"
					intro="Sampled from the supplied logo. These are identity, not interface — the notes below come from the stylesheet itself and say where each may and may not be used."
				>
					<SwatchGrid>
						{brand.map((token) => (
							<Swatch key={token.name} token={token} />
						))}
					</SwatchGrid>
				</Section>

				<Section
					id="palette"
					title="Semantic palette"
					intro="What components actually reference. Each is bound to the fixed light palette; the value column shows the binding, and the contrast table below resolves it."
				>
					<SwatchGrid>
						{semantic.map((token) => (
							<Swatch
								key={token.name}
								token={token}
								onDark={/background|surface/.test(token.name)}
							/>
						))}
					</SwatchGrid>
				</Section>

				<Section
					id="contrast"
					title="Contrast"
					intro="Measured, after following each semantic token to the literal it binds to. The two logo colours are included precisely because they fail as text — that is why the stylesheet marks them decorative."
				>
					<ContrastTable pairs={CONTRAST_PAIRS} tokens={tokens} />
				</Section>

				<Section
					id="type"
					title="Typography"
					intro="Sora for display, Inter for body copy, both self-hosted by next/font. The scale is a set of tokens rather than sizes chosen per component."
				>
					<TokenTable tokens={type} />

					<Subsection title="Specimens">
						<Specimen label="h1" note="--adflex-text-3xl, Sora 700">
							<div className="adflex-scope">
								<h1>Local energy flexibility</h1>
							</div>
						</Specimen>
						<Specimen label="h2" note="--adflex-text-2xl">
							<div className="adflex-scope">
								<h2>Technologies</h2>
							</div>
						</Specimen>
						<Specimen label="h3" note="--adflex-text-lg">
							<div className="adflex-scope">
								<h3>Digital spine</h3>
							</div>
						</Specimen>
						<Specimen label=".adflex-eyebrow" note="Section label, with its leading rule">
							<div className="adflex-scope">
								<p className="adflex-eyebrow">What we are building</p>
							</div>
						</Specimen>
						<Specimen label="p" note="--adflex-text-base, Inter">
							<div className="adflex-scope">
								<p>
									ADFLEX helps Sustainable Energy Communities in mixed-use buildings provide
									flexibility and take part in local energy markets.
								</p>
							</div>
						</Specimen>
					</Subsection>
				</Section>

				<Section
					id="space"
					title="Space & shape"
					intro="One spacing scale, one radius scale, two shadows. A component that needs a value outside these is usually a component that needs rethinking."
				>
					<TokenTable tokens={space} />
				</Section>

				<Section
					id="components"
					title="Components"
					intro="Drawn with the real classes inside a real .adflex-scope, so anything that breaks in them breaks here too."
				>
					<Subsection title="Actions">
						<Specimen label=".adflex-cta" note="Primary action">
							<div className="adflex-scope">
								<a className="adflex-cta" href="#components">
									Explore the pilot
								</a>
							</div>
						</Specimen>
						<Specimen label=".adflex-cta-quiet" note="Secondary action">
							<div className="adflex-scope">
								<a className="adflex-cta-quiet" href="#components">
									Know more about ADFLEX
								</a>
							</div>
						</Specimen>
						<Specimen label=".adflex-link" note="Inline link">
							<div className="adflex-scope">
								<p>
									Read the <a className="adflex-link" href="#components">project outcomes</a>.
								</p>
							</div>
						</Specimen>
					</Subsection>

					<Subsection title="Surfaces">
						<Specimen
							label=".adflex-band"
							note="The emphasis band — a soft tint with a faint lattice, not a dark block"
						>
							<div className="adflex-scope">
								<div className="adflex-band" style={{ padding: "2rem 1.5rem" }}>
									<p className="adflex-eyebrow">Who is involved</p>
									<h2>The consortium</h2>
								</div>
							</div>
						</Specimen>
						<Specimen label=".adflex-container" note="The measure every section is set in">
							<div className="adflex-scope">
								<div
									className="adflex-container"
									style={{ outline: "1px dashed rgba(16,36,62,0.25)", padding: "1rem 0" }}
								>
									<p>Content sits inside this measure.</p>
								</div>
							</div>
						</Specimen>
					</Subsection>
				</Section>

				<Section id="rules" title="Rules">
					<Rules
						title="Accessibility"
						items={[
							"The logo green and yellow are decorative. Neither passes as body text on white — the contrast table above shows the measured ratios, which is why the stylesheet says so.",
							"Focus is a 3px outline in the primary colour with an offset, applied to links, buttons and summaries inside the scope. Do not remove it.",
							"Scroll reveals are gated three ways: on a JavaScript class, on prefers-reduced-motion, and on a fallback the observer sets directly. With JavaScript off the page is static, not blank.",
							"Interactive targets meet --adflex-target-min. That token exists so the rule is checkable rather than remembered.",
						]}
					/>
					<Rules
						title="Keeping this site close to its repository"
						items={[
							"The ADFLEX stylesheets here are byte-for-byte copies of the ones in the ADFLEX repository, so the two can still be diffed. Changing one means deciding which is the source.",
							"The content module is a near-copy: only asset paths and internal links were rebased onto /adflex.",
							"Anything genuinely specific to being hosted inside IRESI lives in src/projects/adflex/site.ts, apart from the content, so that distinction stays visible.",
						]}
					/>
				</Section>
			</div>
		</div>
	);
}
