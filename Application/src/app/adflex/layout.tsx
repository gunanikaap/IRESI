import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { adflexContent } from "@/projects/adflex/content";
import { MotionScript } from "@/components/adflex/MotionScript";
import { RevealObserver } from "@/components/adflex/RevealObserver";
import "@/projects/adflex/tokens.css";
import "@/projects/adflex/site.css";

/**
 * The ADFLEX site, served from a subpath of the IRESI deployment.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A LAYOUT AND NOT A SECOND DEPLOYMENT
 * ---------------------------------------------------------------------------
 * One process, one database, one admin, one login — the shape agreed for the
 * platform. Everything ADFLEX-specific is contained by this layout: its own
 * typefaces, its own tokens, its own header and footer (each page renders
 * those itself), and the `.adflex-scope` wrapper that every ADFLEX style is
 * written against. Nothing below this route can affect an IRESI page, and the
 * IRESI theme class on `<html>` sets only `--color-*` names that no ADFLEX rule
 * reads.
 *
 * ---------------------------------------------------------------------------
 * WHAT MOVED, COMPARED WITH THE ADFLEX REPOSITORY'S ROOT LAYOUT
 * ---------------------------------------------------------------------------
 * A nested layout cannot write to `<html>` or `<head>`, so three things sit
 * differently:
 *
 *   - the font variables are on the scope wrapper rather than on `<html>`.
 *     Custom properties inherit, so every descendant still sees them;
 *   - `MotionScript` renders here rather than in `<head>`. It is a synchronous
 *     inline script, so it still runs during parse, before any ADFLEX markup
 *     below it is painted — which is the property that matters;
 *   - `suppressHydrationWarning` moved to the root layout's `<html>`, because
 *     that is the element `MotionScript` adds its class to.
 */

const sora = Sora({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-display",
	display: "swap",
});

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

/*
 * ADFLEX's own title template, replacing the IRESI one inherited from the root
 * layout. Metadata merges from the root down, so without this every ADFLEX page
 * would be titled "… – IRESI at Maynooth University".
 */
export const metadata: Metadata = {
	title: {
		default: adflexContent.meta.title,
		template: "%s — ADFLEX",
	},
	description: adflexContent.meta.description,
	applicationName: "ADFLEX",
	openGraph: {
		type: "website",
		siteName: "ADFLEX",
		locale: "en_IE",
		title: adflexContent.meta.title,
		description: adflexContent.meta.description,
	},
};

export default function AdflexLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<MotionScript />
			<div className={`adflex-scope ${sora.variable} ${inter.variable}`}>
				<a className="adflex-skip-link" href="#main-content">
					{adflexContent.meta.skipLinkLabel}
				</a>
				{children}
			</div>
			<RevealObserver />
		</>
	);
}
