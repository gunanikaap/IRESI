import "server-only";

import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { queryOne } from "./db";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "adflex_admin";

/** Eight hours. Long enough for a working day, short enough to matter. */
const SESSION_TTL_SECONDS = 8 * 60 * 60;

const SCRYPT_KEYLEN = 64;

export type AdminUser = {
  id: number;
  /** What is typed into the login box. Not an email address — see migration 003. */
  username: string;
  name: string;
};

/* --------------------------------------------------------------------------
 * Passwords
 * ----------------------------------------------------------------------- */

/**
 * Hashes with scrypt from `node:crypto` — no bcrypt or argon2 dependency.
 *
 * scrypt is memory-hard and is in Node's standard library, which is the whole
 * reason it is used here: the alternative is a native module that has to
 * compile on every deploy target. Stored as `scrypt$<salt hex>$<hash hex>` so
 * the format is self-describing if it ever needs to change.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/**
 * Verifies a password against a stored hash.
 *
 * Compared with `timingSafeEqual`, not `===`. A byte-by-byte string comparison
 * returns faster on an early mismatch, and that timing difference is a usable
 * signal. Returns false rather than throwing on a malformed stored value, so a
 * corrupt row locks one account out instead of erroring the login route.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    if (expected.length !== SCRYPT_KEYLEN) return false;

    const actual = await scrypt(password, salt, SCRYPT_KEYLEN);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------------
 * Session token
 * ----------------------------------------------------------------------- */

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to at least 32 characters. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return secret;
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url");

/**
 * A signed, stateless token: `<payload>.<hmac>`.
 *
 * The payload is readable by anyone holding the cookie — it carries a user id
 * and an expiry, nothing secret. The HMAC is what makes it unforgeable.
 */
function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

/**
 * `sv` is the account's `session_version` at the moment of signing in.
 *
 * It is what makes a password change end existing sessions. Without it the
 * cookie says only "user 1, valid until 5pm", which stays true after the
 * password it was obtained with has been replaced — and the reason anyone
 * changes a password in a hurry is to end sessions they do not control.
 */
export function createSessionToken(userId: number, sessionVersion: number): string {
  const payload = b64url(
    JSON.stringify({
      uid: userId,
      sv: sessionVersion,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    }),
  );
  return `${payload}.${sign(payload)}`;
}

type SessionClaims = { uid: number; sv: number };

/** Returns the claims in a valid, unexpired token, or `null`. */
export function readSessionToken(token: string | undefined): SessionClaims | null {
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  // Length check first: `timingSafeEqual` throws on a length mismatch, and a
  // forged token is exactly where a differing length shows up.
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof claims.uid !== "number" || typeof claims.exp !== "number") return null;
    // A token minted before `sv` existed has none. Rejected rather than waved
    // through, so the change takes effect on deploy instead of eight hours later.
    if (typeof claims.sv !== "number") return null;
    if (claims.exp * 1000 < Date.now()) return null;
    return { uid: claims.uid, sv: claims.sv };
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------------------
 * Session
 * ----------------------------------------------------------------------- */

/**
 * The signed-in editor, or `null`.
 *
 * The token proves the cookie was issued by this server. It does **not** prove
 * the account still exists, so this re-reads the row every time. That is one
 * indexed lookup, and it is what makes deleting a user take effect immediately
 * rather than whenever their eight hours happen to run out.
 */
export async function getCurrentUser(): Promise<AdminUser | null> {
  let claims: { uid: number; sv: number } | null;
  try {
    const store = await cookies();
    claims = readSessionToken(store.get(SESSION_COOKIE)?.value);
  } catch {
    // Missing or malformed SESSION_SECRET. Treated as signed out rather than a
    // crash, so a misconfigured deploy shows a login page instead of a 500.
    return null;
  }
  if (claims === null) return null;

  try {
    const row = await queryOne<AdminUser & { session_version: number }>(
      "SELECT id, username, name, session_version FROM admin_users WHERE id = $1",
      [claims.uid],
    );
    if (!row) return null;

    /*
     * The version in the cookie has to match the one on the account.
     *
     * `npm run db:user` bumps the column whenever it sets a password, so every
     * cookie issued before that stops working here — on the next request, not
     * whenever its eight hours happen to run out.
     */
    if (row.session_version !== claims.sv) return null;

    return { id: row.id, username: row.username, name: row.name };
  } catch (error) {
    console.error("[adflex] session lookup failed:", error);
    return null;
  }
}

/**
 * The guard for every admin page.
 *
 * `src/proxy.ts` also redirects signed-out visitors away from `/admin`, but
 * that is an optimistic check and **is not the security boundary**. It only
 * looks for the presence of a cookie; this verifies the signature and that the
 * account still exists.
 *
 * It **redirects rather than throwing**. Throwing produced a 500 error page
 * whenever a session expired, a cookie was cleared, or the database blinked —
 * all of which are ordinary, and all of which should land an editor on the
 * login form, not on a stack trace.
 */
export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/* --------------------------------------------------------------------------
 * Login throttling
 * ----------------------------------------------------------------------- */

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Three independent counters, not one combined key.
 *
 * ---------------------------------------------------------------------------
 * WHY THE OLD ONE DID NOT WORK
 * ---------------------------------------------------------------------------
 * It counted against a single key of `<ip>:<account>`, which reads like a limit
 * on both and is a limit on neither. A different account name is a different key
 * with a fresh count, so one machine could keep guessing for ever by varying it;
 * and one account could be attacked from many machines for the same reason.
 * Raised in the external review of 9 August 2026, correctly.
 *
 * Each dimension now has its own counter and its own ceiling, and a request is
 * refused if **any** of them is over:
 *
 *  - **user** — the tightest. Guessing one account's password is the attack
 *    that matters, and a real person does not fail eight times on their own
 *    account.
 *  - **ip** — looser, because a university NAT puts a whole building behind one
 *    address and a shared limit that is too tight locks out bystanders.
 *  - **ip+user** — the original pair, kept because it is the cheapest signal
 *    that one machine is working on one account.
 *
 * ---------------------------------------------------------------------------
 * STILL IN MEMORY, AND STILL A SPEED BUMP
 * ---------------------------------------------------------------------------
 * Per-instance, so it does not stop a distributed attempt and it resets on
 * redeploy. Moving it to a shared store is the right answer and needs a decision
 * about hosting first — the review says Redis or the edge, and either is fine.
 * The shape here does not change when that happens: the same three keys, read
 * and written somewhere shared.
 */
const LIMITS: ReadonlyArray<{ prefix: string; max: number }> = [
  { prefix: "user", max: 8 },
  { prefix: "ip", max: 30 },
  { prefix: "pair", max: 8 },
];

/** The three keys a sign-in attempt counts against. */
function keysFor(ip: string, username: string): string[] {
  const who = username.toLowerCase();
  return [`user:${who}`, `ip:${ip}`, `pair:${ip}:${who}`];
}

function overLimit(key: string, now: number): boolean {
  const record = attempts.get(key);
  if (!record || now - record.first > WINDOW_MS) return false;
  const limit = LIMITS.find((entry) => key.startsWith(`${entry.prefix}:`));
  return record.count >= (limit?.max ?? 8);
}

export function tooManyAttempts(ip: string, username: string): boolean {
  const now = Date.now();
  return keysFor(ip, username).some((key) => overLimit(key, now));
}

/**
 * Drops records whose window has closed.
 *
 * Without this the map only ever grows: the keys come from the request, so
 * anyone posting the login form with a fresh account name each time adds an entry
 * that is never read again and never removed — `tooManyAttempts` ignores an
 * expired record but does not delete it, and `clearAttempts` only fires on a
 * *successful* sign-in, which an attacker never reaches. A few million failed
 * attempts is not a hard thing to send.
 *
 * Sweeping on write keeps it to the number of genuinely active windows, with no
 * timer to own and nothing to clean up on shutdown.
 */
function pruneExpired(now: number): void {
  for (const [key, record] of attempts) {
    if (now - record.first > WINDOW_MS) attempts.delete(key);
  }
}

export function recordFailedAttempt(ip: string, username: string): void {
  const now = Date.now();
  pruneExpired(now);

  for (const key of keysFor(ip, username)) {
    const record = attempts.get(key);
    if (!record || now - record.first > WINDOW_MS) {
      attempts.set(key, { count: 1, first: now });
      continue;
    }
    record.count += 1;
  }
}

/**
 * Clears the counters after a correct password.
 *
 * The **ip** counter is deliberately left alone. One person signing in
 * successfully says nothing about the other attempts coming from the same
 * address, and on a shared network clearing it would hand an attacker a reset
 * button: fail twenty times, sign in once with an account they do own, start
 * again.
 */
export function clearAttempts(ip: string, username: string): void {
  const who = username.toLowerCase();
  attempts.delete(`user:${who}`);
  attempts.delete(`pair:${ip}:${who}`);
}

/* --------------------------------------------------------------------------
 * Contact form throttling
 * ----------------------------------------------------------------------- */

const submissions = new Map<string, { count: number; first: number }>();
const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MAX = 5;

/**
 * Caps how often one address can post the contact form.
 *
 * The honeypot catches the simplest bots and nothing else: a script that fills
 * only the visible fields walks straight past it, and the form is the one
 * unauthenticated write on the site. Five an hour is far above what a person
 * doing an ordinary thing will hit — the same visitor sending a second message
 * to add something they forgot is two, not six — and far below what makes the
 * form useful to send from.
 *
 * Counted per IP only. There is no account to key on, and keying on the
 * submitted email address would be worse than useless: it is typed by the sender
 * and changing it costs a keystroke.
 *
 * The same in-memory caveat as the login limiter applies, and the same answer:
 * per-instance, resets on redeploy, and the shape does not change when it moves
 * to a shared store.
 */
export function tooManySubmissions(ip: string): boolean {
  const now = Date.now();
  const record = submissions.get(ip);
  if (!record || now - record.first > CONTACT_WINDOW_MS) return false;
  return record.count >= CONTACT_MAX;
}

export function recordSubmission(ip: string): void {
  const now = Date.now();
  for (const [key, record] of submissions) {
    if (now - record.first > CONTACT_WINDOW_MS) submissions.delete(key);
  }

  const record = submissions.get(ip);
  if (!record || now - record.first > CONTACT_WINDOW_MS) {
    submissions.set(ip, { count: 1, first: now });
    return;
  }
  record.count += 1;
}
