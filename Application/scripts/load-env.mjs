import { readFileSync, existsSync } from "node:fs";

/**
 * Reads `.env.local` (then `.env`) into `process.env`.
 *
 * Next loads these itself, but these scripts run under plain `node`, which does
 * not. Rather than add dotenv for twenty lines, this parses the subset of the
 * format the project actually uses: `KEY=value`, `#` comments, blank lines, and
 * optional surrounding quotes.
 *
 * Existing environment variables always win, so a value exported in the shell
 * or injected by a host is never overwritten by a stale local file.
 */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;

    for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const eq = line.indexOf("=");
      if (eq < 1) continue;

      const key = line.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;

      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}
