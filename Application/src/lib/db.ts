import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { Pool, type PoolClient } from "pg";

/**
 * The Postgres connection.
 *
 * ---------------------------------------------------------------------------
 * THE SITE MUST BUILD AND RENDER WITH NO DATABASE
 * ---------------------------------------------------------------------------
 * This is the rule the rest of the data layer is shaped around, and it is not
 * a nicety. `next build` runs in CI and on Netlify without `DATABASE_URL`, a
 * reviewer clones the repo and runs `npm run dev` before any database exists,
 * and a hosted database can be down while the public site is up.
 *
 * So: nothing here connects at import time, `isDatabaseConfigured()` is a plain
 * environment check that never touches the network, and every read in
 * `src/lib/repo/` is wrapped so a failure degrades to the empty state the
 * public pages already have rather than a 500. What must NOT be wrapped is a
 * write — a save that silently does nothing is worse than an error.
 */

/** True when a connection string exists. Does not prove the database is up. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

declare global {
  var __adflexPool: Pool | undefined;
}

/**
 * One pool per process, cached on `globalThis`.
 *
 * Without the global, `next dev`'s hot reload creates a new pool on every edit
 * and leaks connections until the database refuses new ones — which presents as
 * the site mysteriously dying after twenty file saves.
 */
export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in — see docs/ADMIN.md.",
    );
  }

  if (!globalThis.__adflexPool) {
    globalThis.__adflexPool = new Pool({
      connectionString,
      // Neon and Supabase both terminate unencrypted connections. `rejectUnauthorized`
      // is off because both serve certificates from a chain Node does not carry by
      // default; the connection is still encrypted. A local database gets no TLS at all.
      ssl: /localhost|127\.0\.0\.1/.test(connectionString)
        ? undefined
        : { rejectUnauthorized: false },
      // Serverless hosts open a pool per instance, so a generous max multiplies
      // into the database's connection limit rather than staying local. Five is
      // right for Neon's and Supabase's pooled endpoints; `PGPOOL_MAX` exists
      // so a host with a tighter limit can be tuned without a code change.
      max: Number(process.env.PGPOOL_MAX) || 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalThis.__adflexPool;
}

/* --------------------------------------------------------------------------
 * Transactions
 * ----------------------------------------------------------------------- */

/**
 * The client the current transaction is using, if there is one.
 *
 * ---------------------------------------------------------------------------
 * WHY AsyncLocalStorage AND NOT A CLIENT PARAMETER
 * ---------------------------------------------------------------------------
 * Saving an entry is several statements — insert the images, insert the row,
 * link them — and until now each took its own connection from the pool, so a
 * failure partway left the earlier ones committed. The editor saw an error and
 * the database had already changed. Raised in the external review of 9 August
 * 2026, correctly.
 *
 * The usual fix is to thread a client through every repo function, which means
 * touching all forty of them and every caller, and leaves the trap open for the
 * forty-first. Instead `withTransaction` puts one client in async-local storage
 * for the duration of the callback, and `query` below prefers it. Existing code
 * is unchanged and correct: anything called inside the callback joins the
 * transaction automatically, anything outside behaves exactly as before.
 *
 * The store is per async context, so two requests running at once cannot see
 * each other's client.
 */
const transactionStore = new AsyncLocalStorage<PoolClient>();

/**
 * Runs `work` inside a single transaction, on one connection.
 *
 * Commits when it returns and rolls back if it throws, then rethrows — the
 * caller still has to report the failure, and now it is reporting a failure
 * where nothing was written rather than one where some of it was.
 *
 * Not nestable. A `withTransaction` inside another joins the outer one rather
 * than opening a second, because savepoints would be the only correct answer and
 * nothing here needs partial rollback.
 */
export async function withTransaction<T>(work: () => Promise<T>): Promise<T> {
  const existing = transactionStore.getStore();
  if (existing) return work();

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await transactionStore.run(client, work);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    // A rollback that itself fails must not replace the real error, which is the
    // one that says what actually went wrong.
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Runs a parameterised query. Never interpolate user input into the text.
 *
 * Uses the current transaction's client when there is one, so a repo function
 * needs no knowledge of whether it is inside a transaction.
 */
export async function query<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const client = transactionStore.getStore();
  const result = client
    ? await client.query<T>(text, params as unknown[])
    : await getPool().query<T>(text, params as unknown[]);
  return result.rows;
}

/** The first row, or `null`. */
export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Wraps a **read** so the public site survives a database that is missing or
 * down, returning `fallback` instead of throwing.
 *
 * Only ever use this for reads. A write wrapped in this would report success
 * while losing the editor's work.
 *
 * Callers that show something to a visitor should use `safeReadStatus` instead —
 * see the note there. This plain version is for reads whose fallback needs no
 * explanation, like "is this image public" (no) or "which address" (the default).
 */
export async function safeRead<T>(
  read: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  return (await safeReadStatus(read, fallback, label)).data;
}

/**
 * The same read, but saying whether the answer is real or a fallback.
 *
 * ---------------------------------------------------------------------------
 * WHY "NOTHING PUBLISHED" WAS THE WRONG THING TO SAY
 * ---------------------------------------------------------------------------
 * A failed read used to return an empty list, and an empty list is what a page
 * shows when the project genuinely has not published anything. So a database
 * that was down for a minute told every visitor that an SEAI-funded project had
 * no news, no events and no outputs — a false statement about the project, made
 * confidently, in its own voice. The external review of 9 August 2026 reproduced
 * it by stopping the database after publishing a news item, and was right to
 * call it out.
 *
 * `degraded` lets the page tell the two apart: nothing yet, or nothing *right
 * now*. Everything else is unchanged — the read still never throws, and the
 * failure is still logged for whoever has to fix it.
 */
export type ReadStatus<T> = { data: T; degraded: boolean };

export async function safeReadStatus<T>(
  read: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<ReadStatus<T>> {
  // Not configured at all is not a degradation: it is a site built without a
  // database, which is a supported way to run the public pages.
  if (!isDatabaseConfigured()) return { data: fallback, degraded: false };
  try {
    return { data: await read(), degraded: false };
  } catch (error) {
    // Logged, not swallowed silently: the page degrades but the operator can
    // still see why in the server output.
    console.error(`[adflex] database read failed (${label}):`, error);
    return { data: fallback, degraded: true };
  }
}
