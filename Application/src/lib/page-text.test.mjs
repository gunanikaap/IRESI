/**
 * Tests for how stored page text becomes rendered sections.
 *
 *   node --test src/lib/page-text.test.mjs
 *
 * Worth testing because it is now the format editors type by hand, not just the
 * shape a converter produced. The first entry written through the admin came out
 * with its `##` and `-` printed on the page, and that is the case these lock in.
 *
 * The module is TypeScript; Node runs it with types stripped, no build step.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { parseBody } from "./page-text.ts";

test("a heading followed straight by content, with no blank lines", () => {
	const sections = parseBody(
		["## Main text", "- a bullet point", "Paragraph one", "Paragraph two"].join("\n"),
	);

	assert.equal(sections.length, 2, "the paragraph after the list opens a new section");
	assert.equal(sections[0].heading, "Main text");
	assert.deepEqual(sections[0].bullets, ["a bullet point"]);
	assert.deepEqual(sections[1].paragraphs, ["Paragraph one Paragraph two"]);
	assert.equal(sections[1].heading, null);
});

test("blank-line separated content still parses as it did", () => {
	const sections = parseBody(
		["## Objective", "", "First paragraph.", "", "Second paragraph."].join("\n"),
	);

	assert.equal(sections.length, 1);
	assert.equal(sections[0].heading, "Objective");
	assert.deepEqual(sections[0].paragraphs, ["First paragraph.", "Second paragraph."]);
});

test("soft-wrapped lines join into one paragraph", () => {
	const sections = parseBody(["A sentence that was", "wrapped across two lines."].join("\n"));

	assert.deepEqual(sections[0].paragraphs, ["A sentence that was wrapped across two lines."]);
});

test("several headings make several sections", () => {
	const sections = parseBody(
		["## One", "First.", "## Two", "Second.", "## Three", "Third."].join("\n"),
	);

	assert.deepEqual(
		sections.map((s) => s.heading),
		["One", "Two", "Three"],
	);
	assert.deepEqual(sections[1].paragraphs, ["Second."]);
});

test("bullets group, and both - and * are accepted", () => {
	const sections = parseBody(["- one", "* two", "- three"].join("\n"));

	assert.equal(sections.length, 1);
	assert.deepEqual(sections[0].bullets, ["one", "two", "three"]);
});

test("a paragraph before a list stays above it, in one section", () => {
	const sections = parseBody(["## Heading", "Intro line.", "- point"].join("\n"));

	assert.equal(sections.length, 1);
	assert.deepEqual(sections[0].paragraphs, ["Intro line."]);
	assert.deepEqual(sections[0].bullets, ["point"]);
});

test("empty and whitespace-only text produce no sections", () => {
	assert.deepEqual(parseBody(""), []);
	assert.deepEqual(parseBody("   \n\n  \n"), []);
});

test("a heading with no body still renders", () => {
	const sections = parseBody("## Just a heading");

	assert.equal(sections.length, 1);
	assert.equal(sections[0].heading, "Just a heading");
	assert.deepEqual(sections[0].paragraphs, []);
});

test("windows line endings are handled", () => {
	const sections = parseBody("## Heading\r\n- point\r\nParagraph.");

	assert.equal(sections[0].heading, "Heading");
	assert.deepEqual(sections[0].bullets, ["point"]);
	assert.deepEqual(sections[1].paragraphs, ["Paragraph."]);
});

test("a hyphen inside a sentence is not a bullet", () => {
	const sections = parseBody("Energy systems - and the people who use them - matter.");

	assert.deepEqual(sections[0].bullets, []);
	assert.equal(sections[0].paragraphs.length, 1);
});
