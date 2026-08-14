import { readFile } from "node:fs/promises";
import path from "node:path";

/*
 * No `import "server-only"` here, deliberately.
 *
 * It would be belt and braces — `node:fs` already makes this impossible to
 * bundle into a client component — and it costs something real: the package
 * throws when imported outside Next's bundler, which puts the parser and the
 * contrast maths beyond the reach of `node --test`. Those are the parts most
 * worth testing, so they stay testable.
 */

/**
 * Reads design tokens out of the stylesheet that defines them.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS PARSES CSS INSTEAD OF LISTING VALUES
 * ---------------------------------------------------------------------------
 * The obvious way to build a design-system page is to write the palette out as
 * data — `{ token: "--color-accent", hex: "#0070b2" }` — and add a comment
 * saying "keep in sync with the theme". That comment is a promise nobody keeps.
 * The moment somebody adjusts a colour, the page documenting it becomes a
 * confident, well-designed lie, and a reader has no way to tell.
 *
 * So the values come out of the real file at build time. There is one source of
 * truth and the page is a view of it. If a token is renamed the page stops
 * showing it; if a value changes the page changes with it.
 *
 * The comment above each token comes across too, because the reasoning is
 * usually the part worth reading — "decorative only, 1.65:1 on white" tells you
 * more than the hex does.
 *
 * ---------------------------------------------------------------------------
 * IT IS A SMALL PARSER, NOT A CSS ENGINE
 * ---------------------------------------------------------------------------
 * It reads one flat declaration block and understands `/* … *\/` comments and
 * `--name: value;` pairs. That is all these files contain. It is not asked to
 * handle nesting, media queries or anything else, and it should not be taught
 * to — a token file that needs a real parser has stopped being a token file.
 */

export type Token = {
	/** The custom property, including the leading dashes. */
	name: string;
	/** Exactly as written in the stylesheet. May itself be a `var(...)`. */
	value: string;
	/** The comment immediately above it, if there was one. */
	note: string | null;
};

/** Everything under one selector, in the order the file declares it. */
export async function readTokens(relativePath: string, selector: string): Promise<Token[]> {
	const file = path.join(process.cwd(), relativePath);
	const css = await readFile(file, "utf8");

	const block = blockFor(css, selector);
	if (block === null) return [];

	const tokens: Token[] = [];
	let note: string | null = null;
	let index = 0;

	while (index < block.length) {
		const rest = block.slice(index);

		const comment = /^\s*\/\*([\s\S]*?)\*\//.exec(rest);
		if (comment) {
			note = tidy(comment[1]);
			index += comment[0].length;
			continue;
		}

		const declaration = /^\s*(--[a-z0-9-]+)\s*:\s*([\s\S]*?);/i.exec(rest);
		if (declaration) {
			tokens.push({
				name: declaration[1],
				value: declaration[2].replace(/\s+/g, " ").trim(),
				note,
			});
			// A note belongs to the token under it and to nothing after that.
			note = null;
			index += declaration[0].length;
			continue;
		}

		// Anything else — a blank line, a stray brace — is skipped a character at
		// a time rather than being guessed at.
		index += 1;
		note = /^\s/.test(rest) ? note : null;
	}

	return tokens;
}

/** The text between the braces of the first rule matching `selector`. */
function blockFor(css: string, selector: string): string | null {
	const start = css.indexOf(`${selector} {`);
	if (start === -1) return null;

	const open = css.indexOf("{", start);
	let depth = 0;

	for (let i = open; i < css.length; i++) {
		if (css[i] === "{") depth++;
		else if (css[i] === "}") {
			depth--;
			if (depth === 0) return css.slice(open + 1, i);
		}
	}
	return null;
}

/** Collapses a block comment into one readable line. */
function tidy(comment: string): string | null {
	const text = comment
		.split("\n")
		.map((line) => line.replace(/^\s*\*?\s?/, "").trim())
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
	// Section rules like `--- Typography ---------` are furniture, not prose.
	return text && !/^-{2,}/.test(text) ? text : null;
}

/* --------------------------------------------------------------------------
 * Contrast
 * ----------------------------------------------------------------------- */

/**
 * The contrast ratio between two colours, as WCAG defines it.
 *
 * Computed here rather than asserted in prose, so the page reports what the
 * palette actually does. A token whose value is a `var(...)` reference or a
 * gradient returns null — there is no single colour to measure, and inventing
 * one would be worse than saying so.
 */
export function contrastRatio(a: string, b: string): number | null {
	const first = luminance(a);
	const second = luminance(b);
	if (first === null || second === null) return null;

	const lighter = Math.max(first, second);
	const darker = Math.min(first, second);
	return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG grade for body text at normal size. */
export function contrastGrade(ratio: number | null): "AAA" | "AA" | "AA Large" | "Fail" | null {
	if (ratio === null) return null;
	if (ratio >= 7) return "AAA";
	if (ratio >= 4.5) return "AA";
	if (ratio >= 3) return "AA Large";
	return "Fail";
}

function luminance(colour: string): number | null {
	const rgb = parseHex(colour);
	if (!rgb) return null;

	const [r, g, b] = rgb.map((channel) => {
		const c = channel / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseHex(colour: string): [number, number, number] | null {
	const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim());
	if (!match) return null;

	const hex =
		match[1].length === 3
			? match[1]
				.split("")
				.map((c) => c + c)
				.join("")
			: match[1];

	return [
		parseInt(hex.slice(0, 2), 16),
		parseInt(hex.slice(2, 4), 16),
		parseInt(hex.slice(4, 6), 16),
	];
}

/**
 * Follows `var(--other)` references until a literal value is reached.
 *
 * ADFLEX binds its semantic tokens to a fixed palette — `--adflex-color-ink`
 * is `var(--adflex-l-ink)` — so measuring contrast on the semantic name means
 * resolving one or two hops first.
 */
export function resolve(value: string, tokens: Token[], depth = 0): string {
	if (depth > 5) return value;

	const reference = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(value.trim());
	if (!reference) return value;

	const target = tokens.find((token) => token.name === reference[1]);
	return target ? resolve(target.value, tokens, depth + 1) : value;
}
