import { project } from "@/projects";

/**
 * The name of the admin session cookie.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS ITS OWN MODULE
 * ---------------------------------------------------------------------------
 * Two places need the name and they cannot share a module that touches the
 * database. `auth.ts` is `server-only` and imports `pg` and `node:crypto`;
 * `proxy.ts` runs in the proxy runtime, where importing any of that fails.
 *
 * Keeping it here means the name is defined once. It was defined twice for
 * about ten minutes, and the result was a proxy that bounced every signed-in
 * editor straight back to the login page — the two copies had drifted the
 * moment the cookie was renamed away from ADFLEX's.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS NAMED AFTER THE PROJECT
 * ---------------------------------------------------------------------------
 * Cookies are scoped to a host, not a path. If IRESI ends up at `iresi.eu` and
 * ADFLEX at `iresi.eu/adflex` — one of the two options the team is choosing
 * between — a single shared name would mean signing into one silently signs you
 * out of the other. Naming it after the project costs nothing under the
 * subdomain option and prevents a confusing bug under the subpath one.
 */
export const SESSION_COOKIE = `${project.key}_admin`;
