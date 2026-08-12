import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy — what Middleware was called before Next.js 16.
 *
 * ---------------------------------------------------------------------------
 * THIS IS NOT THE SECURITY BOUNDARY
 * ---------------------------------------------------------------------------
 * It does one cheap thing: bounce a visitor with no session cookie away from
 * `/admin` so they get a login page instead of a flash of an empty dashboard.
 * It does **not** verify the cookie's signature, and it cannot — a forged
 * cookie of any shape gets past it.
 *
 * The real checks are `requireUser()` on every admin page and `requireEditor()`
 * at the top of every Server Action in `src/app/admin/actions.ts`. Next's own
 * guidance is explicit that proxy should be used for optimistic checks only and
 * never as the authorisation layer, because Server Actions are reachable by
 * direct POST without any page load passing through here.
 *
 * Deleting this file would cost a little polish and no security at all.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("adflex_admin");

  if (!hasSessionCookie) {
    const login = new URL("/admin/login", request.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // The login page itself is excluded, or a signed-out visitor is redirected to
  // a page that redirects them again, forever.
  matcher: ["/admin", "/admin/((?!login).*)"],
};
