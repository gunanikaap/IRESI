import type { Metadata } from "next";
import { Montserrat, Work_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { project } from "@/projects";
import { siteUrl } from "@/lib/site";
import "./globals.css";

/**
 * Fonts are self-hosted rather than fetched from Google at page load.
 *
 * `next/font` downloads them at build time and serves them from this origin, so
 * a visitor's browser never contacts a third party to render the page. The
 * WordPress site called out to fonts.googleapis.com on every view, which for an
 * EU research centre is a GDPR question nobody had answered.
 */
const montserrat = Montserrat({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-heading-loaded",
	display: "swap",
});

const workSans = Work_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-body-loaded",
	display: "swap",
});

const base = siteUrl();

export const metadata: Metadata = {
	// `metadataBase` is only set once a real host is configured. Without it Next
	// would resolve relative canonicals into malformed relative tags — see
	// `canonical()` in src/lib/site.ts.
	...(base ? { metadataBase: base } : {}),
	// Matches the title format the live site uses — "Renewables – IRESI at
	// Maynooth University" — so search results keep the same shape when the
	// domain is repointed at this build.
	title: {
		default: `${project.name} at ${project.institution}`,
		template: `%s – ${project.name} at ${project.institution}`,
	},
	description: project.description,
	openGraph: {
		siteName: project.name,
		type: "website",
	},
	twitter: { card: "summary_large_image" },
	icons: { icon: "/favicon.svg", apple: project.logo.footer },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="en"
			className={`${project.themeClass} ${montserrat.variable} ${workSans.variable}`}
		>
			<body>
				<a className="skipLink" href="#content">
					Skip to content
				</a>
				<SiteHeader />
				<main id="content">{children}</main>
				<SiteFooter />
			</body>
		</html>
	);
}
