import type { Site } from "@/lib/repo";

/**
 * The key that scopes ADFLEX's rows in the shared database.
 *
 * Every ADFLEX page passes this to the repository reads. One constant rather
 * than the string `"adflex"` typed out in five places, so a page that forgets it
 * is a missing argument — which falls back to the platform's own content and is
 * obvious on the page — rather than a typo that silently matches nothing and
 * renders an empty site.
 *
 * It matches `adflex.key` in ./config.ts, and migrations/007_site_scope.sql
 * explains why the column exists at all.
 */
export const ADFLEX_SITE: Site = "adflex";

/**
 * The way back to the parent site.
 *
 * ADFLEX is one of IRESI's projects and is served from inside its deployment,
 * so a reader who arrives on an ADFLEX page needs a way out that is not the
 * back button. It renders as the last item of the ADFLEX navigation, through
 * the header's own `trailingLink` prop, so it takes that component's styling
 * rather than introducing any of its own.
 *
 * Lives here rather than in `content.ts` because it is not part of the ADFLEX
 * site — it is a consequence of where the ADFLEX site is hosted. Keeping the
 * two apart is what lets the content module stay a near-copy of the ADFLEX
 * repository's.
 */
export const IRESI_LINK = { label: "IRESI", href: "/" } as const;

/** Where the ADFLEX logo links to. Its home page, not the deployment's root. */
export const ADFLEX_HOME = "/adflex";
