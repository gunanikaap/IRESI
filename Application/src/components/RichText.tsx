import type { ReactNode } from "react";

/**
 * Turns the inline marks that page copy uses into React nodes.
 *
 * ---------------------------------------------------------------------------
 * STILL NOT A MARKDOWN RENDERER
 * ---------------------------------------------------------------------------
 * `Prose` explains why there is no markdown library here, and that stands. But
 * the news copy carried over from the original site is full of links — the
 * posts credit people and organisations, and every one of those credits was
 * rendering to the reader as literal `[Amy Fahy](https://…)`. Three marks earn
 * their keep, and no more:
 *
 *   `[text](https://…)`  a link
 *   `**text**`           strong
 *   `*text*`             emphasis
 *   `#Hashtag`           the trailing tags the posts end on
 *
 * The output is React elements, never `dangerouslySetInnerHTML`, so there is no
 * HTML-injection surface: text that looks like markup stays text. Link targets
 * are restricted to http(s) and mailto, which keeps `javascript:` out of an
 * `href` even if a body is ever edited by someone who tries it.
 */

/*
 * `**` before `*`, or the emphasis branch matches the inside of a strong run and
 * leaves its outer asterisks on the page — which is what the seminar and
 * entrepreneurship posts were doing to their `**Date:**` labels.
 */
const INLINE =
	/\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|(#[A-Za-z0-9_]+)/g;

function safeHref(url: string): string | null {
	const trimmed = url.trim();
	if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
	// A root-relative path is fine; anything else — a scheme we did not name —
	// is dropped and the link renders as plain text.
	if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
	return null;
}

export default function RichText({ text }: { text: string }): ReactNode {
	const nodes: ReactNode[] = [];
	let last = 0;
	let key = 0;

	for (const match of text.matchAll(INLINE)) {
		const at = match.index;
		if (at > last) nodes.push(text.slice(last, at));
		last = at + match[0].length;

		const [, linkText, linkUrl, strong, emphasis, hashtag] = match;

		if (linkText !== undefined) {
			const href = safeHref(linkUrl);
			nodes.push(
				href ? (
					<a key={key++} href={href} target="_blank" rel="noopener noreferrer">
						{linkText}
					</a>
				) : (
					linkText
				),
			);
		} else if (strong !== undefined) {
			nodes.push(
				<strong key={key++}>
					<RichText text={strong} />
				</strong>,
			);
		} else if (emphasis !== undefined) {
			// Recursed, because the posts end on an emphasised line of hashtags and
			// the outer match would otherwise swallow them. It terminates: neither
			// the strong nor the emphasis pattern can contain a `*`, so the inner
			// pass has none to match.
			nodes.push(
				<em key={key++}>
					<RichText text={emphasis} />
				</em>,
			);
		} else if (hashtag !== undefined) {
			nodes.push(
				<span key={key++} className="hashtag">
					{hashtag}
				</span>,
			);
		}
	}

	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}
