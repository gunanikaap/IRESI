/**
 * Tests for reading design tokens out of the stylesheets that define them.
 *
 *   node --test src/lib/design-tokens.test.mjs
 *
 * The design-system pages claim to show the site's real values. These check
 * that claim against the real files, so a page that has quietly stopped
 * matching the stylesheet fails the build rather than misleading a reader.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
	contrastGrade,
	contrastRatio,
	readTokens,
	resolve,
} from "./design-tokens.ts";

test("reads the IRESI theme, including values and their comments", async () => {
	const tokens = await readTokens("src/projects/iresi/theme.css", ".theme-iresi");

	assert.ok(tokens.length > 15, "the theme declares more than fifteen tokens");

	const accent = tokens.find((t) => t.name === "--color-accent");
	assert.equal(accent?.value, "#0070b2");

	// The comment above a token is carried with it — that is the part worth
	// reading, and duplicating it by hand is what this avoids.
	const banner = tokens.find((t) => t.name === "--gradient-banner");
	assert.match(banner?.note ?? "", /banner gradient/i);
});

test("reads the ADFLEX tokens from their own scope", async () => {
	const tokens = await readTokens("src/projects/adflex/tokens.css", ".adflex-scope");

	assert.ok(tokens.length > 30, "ADFLEX declares a larger scale");
	assert.ok(
		tokens.every((t) => t.name.startsWith("--adflex-")),
		"every ADFLEX token is namespaced, which is what keeps the two sites apart",
	);
});

test("a multi-line value comes back on one line", async () => {
	const tokens = await readTokens("src/projects/iresi/theme.css", ".theme-iresi");
	const photo = tokens.find((t) => t.name === "--gradient-banner-photo");

	assert.ok(photo, "the photo scrim is declared");
	assert.doesNotMatch(photo.value, /\n/, "no newlines survive into the value");
	assert.match(photo.value, /^linear-gradient\(/);
});

test("an unknown selector yields nothing rather than throwing", async () => {
	const tokens = await readTokens("src/projects/iresi/theme.css", ".theme-nonexistent");
	assert.deepEqual(tokens, []);
});

test("a var() reference resolves to the literal behind it", () => {
	const tokens = [
		{ name: "--a", value: "var(--b)", note: null },
		{ name: "--b", value: "var(--c)", note: null },
		{ name: "--c", value: "#123456", note: null },
	];
	assert.equal(resolve("var(--a)", tokens), "#123456");
});

test("a reference that loops does not hang", () => {
	const tokens = [
		{ name: "--a", value: "var(--b)", note: null },
		{ name: "--b", value: "var(--a)", note: null },
	];
	// Returns something rather than recursing for ever; the value is not
	// meaningful, only the fact that it terminates.
	assert.ok(typeof resolve("var(--a)", tokens) === "string");
});

test("contrast is computed the way WCAG defines it", () => {
	// Black on white is the maximum, and the canonical check on any
	// implementation of this formula.
	assert.equal(contrastRatio("#000000", "#ffffff")?.toFixed(0), "21");
	assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
	assert.equal(contrastGrade(contrastRatio("#000000", "#ffffff")), "AAA");
});

test("IRESI body text passes AA on its own background", async () => {
	const tokens = await readTokens("src/projects/iresi/theme.css", ".theme-iresi");
	const text = tokens.find((t) => t.name === "--color-text")?.value;
	const background = tokens.find((t) => t.name === "--color-bg")?.value;

	const ratio = contrastRatio(text, background);
	assert.ok(ratio !== null, "both are flat colours");
	assert.ok(ratio >= 4.5, `body text is ${ratio.toFixed(2)}:1, which must be at least 4.5:1`);
});

test("something that is not a colour returns null rather than a wrong number", () => {
	assert.equal(contrastRatio("linear-gradient(180deg, #000, #fff)", "#ffffff"), null);
	assert.equal(contrastRatio("var(--unresolved)", "#ffffff"), null);
	assert.equal(contrastGrade(null), null);
});

test("short hex is understood", () => {
	assert.equal(contrastRatio("#000", "#fff")?.toFixed(0), "21");
});
