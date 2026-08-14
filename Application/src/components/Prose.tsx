import type { ContentSection } from "@/projects/iresi/content";
import RichText from "./RichText";

/**
 * Renders the heading/paragraph/bullet sections that page copy is stored as.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO MARKDOWN RENDERER HERE
 * ---------------------------------------------------------------------------
 * The copy carried over from WordPress only ever uses headings, paragraphs and
 * bullets, so it is stored already split into those three things. A markdown
 * library would add a dependency, a parse step and an HTML-injection surface to
 * render what a `<p>` renders.
 *
 * Inline marks *within* a paragraph — links, emphasis, hashtags — are handled
 * by `RichText`, which builds React elements rather than HTML. See its note for
 * why those three and nothing else.
 */
export default function Prose({
	sections,
	className,
}: {
	sections: readonly ContentSection[];
	className?: string;
}) {
	return (
		<div className={className ? `prose ${className}` : "prose"}>
			{sections.map((section, i) => (
				<section key={section.heading ?? `s${i}`}>
					{section.heading && <h2>{section.heading}</h2>}
					{section.paragraphs.map((paragraph) => (
						<p key={paragraph.slice(0, 40)}>
							<RichText text={paragraph} />
						</p>
					))}
					{section.bullets.length > 0 && (
						<ul>
							{section.bullets.map((bullet) => (
								<li key={bullet.slice(0, 40)}>
									<RichText text={bullet} />
								</li>
							))}
						</ul>
					)}
				</section>
			))}
		</div>
	);
}
