import type { ReactNode } from "react";
import { contrastGrade, contrastRatio, resolve, type Token } from "@/lib/design-tokens";
import styles from "./design-system.module.css";

/**
 * The pieces both design-system pages are built from.
 *
 * Neither site's own stylesheet is used here. A design system that borrowed the
 * classes it documents would change whenever they changed, and would hide
 * exactly the breakage it exists to show — so the page furniture (tables,
 * swatch frames, the sidebar) has its own small stylesheet, and every specimen
 * inside it uses the real classes and the real tokens.
 */

export function Section({
	id,
	title,
	intro,
	children,
}: {
	id: string;
	title: string;
	intro?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className={styles.section} id={id} aria-labelledby={`${id}-heading`}>
			<h2 className={styles.sectionTitle} id={`${id}-heading`}>
				{title}
			</h2>
			{intro && <p className={styles.sectionIntro}>{intro}</p>}
			{children}
		</section>
	);
}

export function Subsection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className={styles.subsection}>
			<h3 className={styles.subsectionTitle}>{title}</h3>
			{children}
		</div>
	);
}

/**
 * A colour, drawn with the token itself.
 *
 * The block is filled with `var(--token)`, so what you see is what the site
 * uses — not a copy of it. The text beside it is the value read out of the
 * stylesheet at build time.
 */
export function Swatch({ token, onDark = false }: { token: Token; onDark?: boolean }) {
	return (
		<div className={styles.swatch}>
			<div
				className={`${styles.swatchColour} ${onDark ? styles.swatchOnDark : ""}`}
				style={{ background: `var(${token.name})` }}
				aria-hidden="true"
			/>
			<div className={styles.swatchBody}>
				<code className={styles.swatchToken}>{token.name}</code>
				<span className={styles.swatchValue}>{token.value}</span>
				{token.note && <span className={styles.swatchNote}>{token.note}</span>}
			</div>
		</div>
	);
}

export function SwatchGrid({ children }: { children: ReactNode }) {
	return <div className={styles.swatchGrid}>{children}</div>;
}

/** A plain table of tokens, for values that are not colours. */
export function TokenTable({ tokens, caption }: { tokens: Token[]; caption?: string }) {
	if (tokens.length === 0) {
		return <p className={styles.empty}>No tokens matched.</p>;
	}

	return (
		<div className={styles.tableWrap}>
			<table className={styles.table}>
				{caption && <caption>{caption}</caption>}
				<thead>
					<tr>
						<th scope="col">Token</th>
						<th scope="col">Value</th>
						<th scope="col">What it is for</th>
					</tr>
				</thead>
				<tbody>
					{tokens.map((token) => (
						<tr key={token.name}>
							<th scope="row">
								<code>{token.name}</code>
							</th>
							<td>
								<span className={styles.value}>{token.value}</span>
							</td>
							<td>{token.note ?? <span className={styles.dash}>—</span>}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/**
 * Measured contrast for the pairs that carry text.
 *
 * Computed from the parsed values rather than asserted, so this reports what
 * the palette does today. A pair that cannot be measured — a gradient, or a
 * token bound to something this cannot resolve — says so instead of guessing.
 */
export function ContrastTable({
	pairs,
	tokens,
}: {
	pairs: readonly { foreground: string; background: string; usage: string }[];
	tokens: Token[];
}) {
	const value = (name: string) => {
		const token = tokens.find((t) => t.name === name);
		return token ? resolve(token.value, tokens) : null;
	};

	return (
		<div className={styles.tableWrap}>
			<table className={styles.table}>
				<thead>
					<tr>
						<th scope="col">Text on background</th>
						<th scope="col">Where</th>
						<th scope="col">Ratio</th>
						<th scope="col">WCAG</th>
					</tr>
				</thead>
				<tbody>
					{pairs.map((pair) => {
						const fg = value(pair.foreground);
						const bg = value(pair.background);
						const ratio = fg && bg ? contrastRatio(fg, bg) : null;
						const grade = contrastGrade(ratio);

						return (
							<tr key={`${pair.foreground}-${pair.background}`}>
								<th scope="row">
									<span
										className={styles.contrastSample}
										style={{ color: `var(${pair.foreground})`, background: `var(${pair.background})` }}
									>
										Aa
									</span>
									<code className={styles.contrastPair}>
										{pair.foreground} on {pair.background}
									</code>
								</th>
								<td>{pair.usage}</td>
								<td>
									{ratio === null ? (
										<span className={styles.dash}>not a flat colour</span>
									) : (
										`${ratio.toFixed(2)}:1`
									)}
								</td>
								<td>
									{grade === null ? (
										<span className={styles.dash}>—</span>
									) : (
										<span
											className={`${styles.grade} ${
												grade === "Fail" ? styles.gradeFail : styles.gradePass
											}`}
										>
											{grade}
										</span>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

/** A live example with its markup named underneath. */
export function Specimen({
	label,
	note,
	children,
	dark = false,
}: {
	label: string;
	note?: string;
	children: ReactNode;
	dark?: boolean;
}) {
	return (
		<figure className={styles.specimen}>
			<div className={`${styles.specimenStage} ${dark ? styles.specimenDark : ""}`}>{children}</div>
			<figcaption className={styles.specimenCaption}>
				<strong>{label}</strong>
				{note && <span>{note}</span>}
			</figcaption>
		</figure>
	);
}

/** A short list of rules — the things a reader should not have to infer. */
export function Rules({ title, items }: { title: string; items: readonly string[] }) {
	return (
		<div className={styles.rules}>
			<h3 className={styles.subsectionTitle}>{title}</h3>
			<ul>
				{items.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
		</div>
	);
}

/** Anchors down the side, so a long reference page stays navigable. */
export function OnThisPage({ sections }: { sections: readonly { id: string; label: string }[] }) {
	return (
		<nav className={styles.toc} aria-label="On this page">
			<p className={styles.tocTitle}>On this page</p>
			<ul>
				{sections.map((section) => (
					<li key={section.id}>
						<a href={`#${section.id}`}>{section.label}</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
