import type { NextConfig } from "next";

/**
 * Response headers for every route.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO CONTENT-SECURITY-POLICY HERE
 * ---------------------------------------------------------------------------
 * A useful CSP for an App Router site needs a per-request nonce threaded
 * through `proxy.ts` and onto Next's own inline bootstrap scripts. Done wrong
 * it either blocks hydration outright or degrades to `'unsafe-inline'`, which
 * is a CSP in name only. It is worth doing properly and it is not a five-line
 * change, so it is recorded as a follow-up rather than half-added here. The one
 * route that serves attacker-supplied bytes — `/media/[id]` — already sets its
 * own strict `default-src 'none'; sandbox` policy, which is where it matters
 * most.
 *
 * The four below have no such trade-off: they are inert for a site that frames
 * nothing, embeds nothing and asks for no device permissions.
 */
const securityHeaders = [
  // Stops a browser second-guessing a declared Content-Type — the defence
  // against a stored file being sniffed as HTML and executed.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the full URL to ourselves, origin only to anyone else. Keeps admin
  // paths and query strings out of third-party referer logs.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here is meant to be framed, and the admin least of all.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // The site asks for none of these, so nothing is given up by refusing them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  /**
   * `X-Powered-By: Next.js` on every response names the framework and, by
   * extension, the CVE list worth trying. It buys nothing.
   */
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  experimental: {
    /**
     * Fixes scrolling to the top when a route is opened from a scrolled page.
     *
     * -----------------------------------------------------------------------
     * THE BUG THIS TURNS OFF
     * -----------------------------------------------------------------------
     * Scroll part-way down the home page, click "News and Events" or
     * "Outputs", and you land part-way down the page you just opened — on
     * `/news` the heading ended up 75px above the top of the screen. Every
     * other route was fine.
     *
     * Those two are the only routes with a `loading.tsx`. On a navigation that
     * goes through a loading boundary, Next's default scroll handler never
     * scrolls to the top at all: the browser carries the old scroll offset
     * over, clamped to the placeholder's height, and the handler does not fire.
     * Chrome's scroll anchoring then drags the offset further down as the real
     * content grows the document.
     *
     * `appNewScrollHandler` is Next's own rewrite of that handler — the
     * default-path source in `layout-router.js` names it as the fix. With it
     * on, the scroll goes to 0 within ~40ms of the click, and back/forward
     * scroll restoration still works, which was the thing worth not breaking.
     *
     * -----------------------------------------------------------------------
     * IT IS AN EXPERIMENTAL FLAG, SO: WHEN YOU UPGRADE NEXT
     * -----------------------------------------------------------------------
     * `next` is pinned exactly (`16.2.12`, no caret), so this cannot change
     * underneath us on an install. On a Next upgrade, check whether the flag
     * still exists — if the behaviour has become the default, drop this line;
     * if it has been renamed, follow it. Either way re-test the case above,
     * because nothing here will fail a build if it silently stops working.
     */
    appNewScrollHandler: true,
    serverActions: {
      /**
       * Raised from Next's 1 MB default so image uploads reach our own checks.
       *
       * **This must stay above `MAX_UPLOAD_TOTAL_BYTES`, not
       * `MAX_UPLOAD_BYTES`.** A Server Action receives every chosen file in one
       * request body, so the number that matters is the total, not the largest
       * file. This was 6 MB — sized for a single 5 MB image — and stayed that
       * way when multi-image upload was added, so three 3 MB photographs
       * tripped the framework limit and produced a runtime error page instead
       * of a readable message.
       *
       * 22 MB leaves ~2 MB of headroom over the 20 MB total for multipart
       * boundaries, part headers and the other form fields, which keeps
       * `readUploads()` — and its readable error — the thing that refuses an
       * oversized batch.
       *
       * Raise `MAX_UPLOAD_TOTAL_BYTES` and this together, or neither.
       */
      bodySizeLimit: "22mb",
    },
  },
};

export default nextConfig;
