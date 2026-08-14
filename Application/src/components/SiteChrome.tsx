import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/**
 * The IRESI site's header, main landmark and footer.
 *
 * Used by `(site)/layout.tsx` for every IRESI page, and separately by the root
 * `not-found.tsx` — an unmatched URL is caught at the root, below the layout
 * that would otherwise supply this, so the 404 page has to ask for it itself.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
	return (
		<>
			<a className="skipLink" href="#content">
				Skip to content
			</a>
			<SiteHeader />
			<main id="content">{children}</main>
			<SiteFooter />
		</>
	);
}
