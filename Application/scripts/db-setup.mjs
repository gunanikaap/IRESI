/**
 * Applies any migrations the database has not seen yet.
 *
 *   npm run db:setup
 *
 * ---------------------------------------------------------------------------
 * HOW THIS WORKS, AND WHY IT REPLACED THE OLD ONE
 * ---------------------------------------------------------------------------
 * Every `.sql` file in `migrations/` is applied once, in filename order, and
 * recorded in a `schema_migrations` table. Re-running is a no-op.
 *
 * The version before this read one large `schema.sql` and split it into
 * statements with a hand-written parser, then ran them one at a time. Three
 * things were wrong with that, all raised in the external review of 9 August
 * 2026:
 *
 *  - **The parser was not a SQL parser.** It tracked quotes and `--` comments
 *    and said so in its own comments; a dollar-quoted function body would have
 *    been split down the middle. Whole files are now handed to Postgres, which
 *    has a real parser.
 *  - **Nothing was atomic.** A file that failed halfway left the database in a
 *    state no version described. Each file now runs inside a transaction, so it
 *    either lands completely or not at all.
 *  - **There was no record of what had run.** Idempotent `IF NOT EXISTS` blocks
 *    hid that, but only for changes that can be written idempotently, and a
 *    one-way data change cannot. Applied files are now recorded by name.
 *
 * ---------------------------------------------------------------------------
 * ADDING A MIGRATION
 * ---------------------------------------------------------------------------
 * Create `migrations/00N_short_name.sql`. Numbers are string-sorted, so keep
 * them zero-padded to three digits. Never edit a file that has already been
 * applied anywhere — write the next one instead, because the record is by
 * filename and an edited file will not re-run.
 */
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set.\n\n" +
      "Copy .env.example to .env.local and put your Postgres connection string in it.\n" +
      "See docs/ADMIN.md.",
  );
  process.exit(1);
}

const files = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`No .sql files in ${migrationsDir}.`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
    ? undefined
    : { rejectUnauthorized: false },
});

try {
  await client.connect();

  // The ledger itself, created outside the per-file transactions because every
  // one of them needs to read it.
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query("SELECT filename FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.filename));

  let ran = 0;
  for (const filename of files) {
    if (applied.has(filename)) continue;

    const sql = await readFile(join(migrationsDir, filename), "utf8");

    /*
     * The whole file in one transaction, as one query.
     *
     * `pg` sends a parameterless query over the simple query protocol, which
     * accepts multiple statements — so Postgres does the parsing, including
     * dollar-quoted bodies, and BEGIN/COMMIT makes the file all-or-nothing.
     */
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw new Error(`${filename} failed and was rolled back:\n  ${error.message}`);
    }

    console.log(`  applied ${filename}`);
    ran++;
  }

  if (ran === 0) {
    console.log("Database is up to date; nothing to apply.");
  } else {
    console.log(`\n${ran} migration${ran === 1 ? "" : "s"} applied.`);
  }

  const { rows: tables } = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = current_schema()
     ORDER BY table_name`,
  );
  console.log("\nTables now present:");
  for (const row of tables) console.log("  -", row.table_name);
  console.log("\nNext: create an editor account with  npm run db:user");
} catch (error) {
  console.error("Could not apply migrations:\n", error.message);
  process.exit(1);
} finally {
  await client.end();
}
