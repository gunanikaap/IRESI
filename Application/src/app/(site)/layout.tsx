import SiteChrome from "@/components/SiteChrome";
import "../globals.css";

/**
 * The IRESI site's chrome.
 *
 * This used to be part of the root layout, which was fine while the deployment
 * served one site. It moved down here when ADFLEX arrived at `/adflex`: a root
 * layout wraps *every* route, so IRESI's header and footer would have bracketed
 * the ADFLEX pages too. The root layout now holds only what genuinely belongs
 * to the document — `<html>`, `<body>`, the fonts — and each site brings its
 * own chrome.
 *
 * The group name is in parentheses, so it contributes nothing to a URL. Every
 * address below this directory is exactly what it was before the move.
 *
 * `globals.css` is imported here rather than in the root layout so it reaches
 * IRESI's routes and no others — see the note there for what happened when it
 * was document-wide.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
	return <SiteChrome>{children}</SiteChrome>;
}
