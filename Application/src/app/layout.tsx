import type { Metadata } from "next";
import { Montserrat, Work_Sans } from "next/font/google";
import { project } from "@/projects";
import { siteUrl } from "@/lib/site";

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
	icons: {
		icon: [
			{ url: project.logo.icon.small, sizes: "32x32", type: "image/png" },
			{ url: project.logo.icon.large, sizes: "192x192", type: "image/png" },
		],
		apple: project.logo.icon.apple,
	},
};

/**
 * The document, and nothing else.
 *
 * Each site brings its own chrome *and its own stylesheet* — `(site)/layout.tsx`
 * for IRESI, `adflex/layout.tsx` for ADFLEX — because a root layout wraps every
 * route and this deployment now serves two sites.
 *
 * `globals.css` is imported by the IRESI layout rather than here, and that is
 * load-bearing. Its element rules (`h1…h5`, `a`, `p`) have specificity 0,0,1,
 * while ADFLEX's own base styles are written with `:where()` at 0,0,0 on the
 * assumption that nothing else is styling bare elements. Loaded document-wide,
 * IRESI's rules silently won inside `.adflex-scope`: ADFLEX headings came out
 * in Montserrat, uppercase and IRESI navy, and every ADFLEX link took IRESI's
 * accent colour and hover. Keeping each stylesheet on its own routes is what
 * lets ADFLEX's CSS stay a byte-for-byte copy of its repository.
 *
 * `suppressHydrationWarning` is here because the ADFLEX layout's `MotionScript`
 * adds an `adflex-js` class to `<html>` before React hydrates. The server
 * cannot know whether JavaScript will run, so that class legitimately differs
 * between the server markup and the DOM. It is scoped to this one element and
 * does not extend to any child.
 *
 * `data-scroll-behavior="smooth"` is not decorative: globals.css sets
 * `scroll-behavior: smooth` on `<html>`, and without this attribute Next cannot
 * suspend that during a route change — so moving between pages scrolls the
 * whole document instead of jumping, which reads as the new page sliding into
 * place.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="en"
			className={`${project.themeClass} ${montserrat.variable} ${workSans.variable}`}
			data-scroll-behavior="smooth"
			suppressHydrationWarning
		>
			<body>{children}</body>
		</html>
	);
}
