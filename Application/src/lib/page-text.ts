import type { ContentSection } from "@/projects/iresi/content";

/**
 * Turns stored page text into the sections `<Prose>` renders.
 *
 * ---------------------------------------------------------------------------
 * THE FORMAT
 * ---------------------------------------------------------------------------
 * Three block-level marks, and `RichText` handles what happens inside a line:
 *
 *   `## Heading`     starts a new section
 *   `- point`        a bullet (`*` works too)
 *   anything else    a paragraph
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS LINE-AWARE AND NOT BLANK-LINE-AWARE
 * ---------------------------------------------------------------------------
 * It used to split the text on blank lines and only then look for `##` and `-`
 * at the start of each block. Content converted from WordPress always had blank
 * lines between blocks, so it worked — but nobody types that way. An editor
 * writing
 *
 *     ## Main text
 *     - a bullet point
 *     Paragraph one
 *
 * got the whole thing as one paragraph with the marks printed literally, which
 * is exactly what the first entry written through the admin looked like.
 *
 * Marks are now recognised at the start of any line. Consecutive plain lines
 * still join into one paragraph, which is what the converted content relies on:
 * its paragraphs are soft-wrapped across several lines and must not become
 * several paragraphs.
 *
 * ---------------------------------------------------------------------------
 * WHY A BULLET LIST CAN START A NEW SECTION
 * ---------------------------------------------------------------------------
 * A section renders its paragraphs and then its bullets, so text written *after*
 * a list would otherwise jump above it. When a paragraph follows bullets, this
 * closes the section and opens a new one with no heading — sections render in
 * order, so the page reads in the order it was typed.
 */

type Draft = { heading: string | null; paragraphs: string[]; bullets: string[] };

const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;

function isEmpty(draft: Draft): boolean {
	return draft.heading === null && draft.paragraphs.length === 0 && draft.bullets.length === 0;
}

export function parseBody(body: string): ContentSection[] {
	const sections: ContentSection[] = [];

	let current: Draft = { heading: null, paragraphs: [], bullets: [] };
	// Lines of the paragraph being built, joined with spaces when it closes.
	let paragraph: string[] = [];

	const closeParagraph = () => {
		if (paragraph.length > 0) {
			current.paragraphs.push(paragraph.join(" "));
			paragraph = [];
		}
	};

	const closeSection = () => {
		closeParagraph();
		if (!isEmpty(current)) sections.push(current);
		current = { heading: null, paragraphs: [], bullets: [] };
	};

	for (const raw of body.split(/\r?\n/)) {
		const line = raw.trim();

		if (!line) {
			closeParagraph();
			continue;
		}

		const heading = HEADING.exec(line);
		if (heading) {
			closeSection();
			current.heading = heading[1].trim();
			continue;
		}

		const bullet = BULLET.exec(line);
		if (bullet) {
			closeParagraph();
			current.bullets.push(bullet[1].trim());
			continue;
		}

		// A paragraph after a list belongs below it, so the list closes the
		// section and this starts a fresh one.
		if (current.bullets.length > 0 && paragraph.length === 0) closeSection();

		paragraph.push(line);
	}

	closeSection();
	return sections;
}
