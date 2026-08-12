import { project } from "@/projects";

/**
 * Where this site is published.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS RETURNS `null` INSTEAD OF A DEFAULT
 * ---------------------------------------------------------------------------
 * Canonical links, Open Graph URLs and a sitemap all have to be absolute, and
 * an absolute URL is a claim about where the site lives. Where this will be
 * staged has not been confirmed — it is item 1.4 on the access list — and
 * guessing is worse than having none: a wrong `<link rel="canonical">` tells
 * search engines the real page is somewhere that does not exist.
 *
 * So when `NEXT_PUBLIC_SITE_URL` is unset the site omits the things that need
 * it — no canonical tag, no absolute Open Graph URL, an empty sitemap and a
 * robots.txt with no `Sitemap:` line. Everything else works exactly as before.
 * Set the variable and all four light up together.
 */
export function siteUrl(): URL | null {
	const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
	if (!raw) return null;

	try {
		const url = new URL(raw);
		// A canonical host has to be reachable from outside; anything else is a
		// misconfiguration worth failing quietly rather than publishing.
		if (url.protocol !== "https:" && url.protocol !== "http:") return null;
		return url;
	} catch {
		return null;
	}
}

/** Absolute URL for `path`, or `null` when no site URL is configured. */
export function absoluteUrl(path: string): string | null {
	const base = siteUrl();
	return base ? new URL(path, base).toString() : null;
}

/**
 * A `Metadata.alternates` fragment naming this page's canonical address, or
 * nothing at all.
 *
 * Next resolves a relative canonical against `metadataBase`, and that is only
 * set once a site URL is configured. Without it the page emits
 * `<link rel="canonical" href="/about">` — a relative canonical, which the
 * specification does not allow and which crawlers treat as malformed. That is
 * worse than no canonical, so the tag is omitted until there is a real host.
 *
 * Every indexable page calls this, including the home page. The root layout
 * sets no canonical of its own precisely so a page that does not call it ends
 * up with none, rather than inheriting the home page's address as its own.
 */
export function canonical(path: string): { alternates?: { canonical: string } } {
	const url = absoluteUrl(path);
	return url ? { alternates: { canonical: url } } : {};
}

/* --------------------------------------------------------------------------
 * CONTACT FORM EMAIL
 * ----------------------------------------------------------------------- */

/**
 * Where contact form messages are delivered, taken from the active project.
 *
 * One address, one purpose. This is **not** the admin login — signing in uses a
 * username and nothing is ever sent to it. It is **not** the mailbox the site
 * authenticates to either; that is `MAIL_SENDER` below, and it has to be filled
 * in explicitly even when it happens to be the same address.
 *
 * Earlier versions let one constant stand in for all three. It made the site
 * look like it would email the admin account, which it never did, and it meant
 * changing where enquiries go silently changed who could sign in.
 */
export const CONTACT_EMAIL = project.contactEmail;

/**
 * The mailbox the site signs into to send, and its server.
 *
 * ---------------------------------------------------------------------------
 * NOT FILLED IN YET — WAITING ON IRESI
 * ---------------------------------------------------------------------------
 * The site needs SMTP submission details: host, port, the mailbox to sign in
 * as, and a password. `mail.iresi.eu` resolves to `m-rb.th.seeweb.it`, so the
 * host is very likely `mail.iresi.eu` on port 587 — but **confirm it with
 * whoever administers IRESI's mail rather than assuming.** Items 3.1–3.5 on the
 * access list.
 *
 * `address` is filled in even when it is the same as `CONTACT_EMAIL`. There is
 * no "leave it blank and it defaults" shortcut, on purpose: a default would
 * make `CONTACT_EMAIL` quietly do a second job, which is what this file was
 * organised to stop. The `From:` header follows this address, because a message
 * must be sent as an address its mailbox is authorised to send as — that is
 * what SPF and DMARC check.
 *
 * While any of these is empty the contact form works exactly as it always has:
 * every message goes to the admin dashboard instead of a mailbox, and the
 * Messages page says which state it is in.
 */
export const MAIL_SENDER = {
	address: "",
	host: "",
	port: 587,
};
