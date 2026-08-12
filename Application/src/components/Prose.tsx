import type { ContentSection } from "@/projects/iresi/content";

/**
 * Renders the heading/paragraph/bullet sections that page copy is stored as.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO MARKDOWN RENDERER HERE
 * ---------------------------------------------------------------------------
 * The copy carried over from WordPress only ever uses headings, paragraphs and
 * bullets, so it is stored already split into those three things. A markdown
 * library would add a dependency, a parse step and an HTML-injection surface to
 * render what a `<p>` renders. If genuinely rich content is needed later this
 * is the one component to change.
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
						<p key={paragraph.slice(0, 40)}>{paragraph}</p>
					))}
					{section.bullets.length > 0 && (
						<ul>
							{section.bullets.map((bullet) => (
								<li key={bullet.slice(0, 40)}>{bullet}</li>
							))}
						</ul>
					)}
				</section>
			))}
		</div>
	);
}
