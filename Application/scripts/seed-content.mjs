/**
 * Loads a project's starting content into an empty database.
 *
 *   node scripts/seed-content.mjs [project]
 *
 * `project` defaults to `ACTIVE_PROJECT`, then to `iresi`. The data comes from
 * `scripts/seed/<project>.json`, which was extracted from the site the project
 * is replacing.
 *
 * ---------------------------------------------------------------------------
 * SAFE TO RE-RUN, AND IT WILL NOT OVERWRITE AN EDITOR'S WORK
 * ---------------------------------------------------------------------------
 * Every entry is keyed by its slug and inserted only when that slug is absent.
 * So running this against a live database adds anything missing and leaves
 * everything else exactly as the editor left it. It is not an "update" — if the
 * seed file and the database disagree about an entry that already exists, the
 * database wins, because somebody edited it on purpose.
 *
 * Images referenced by the seed are read from `public/` and stored in `media`,
 * the same table the admin uploads into, so an editor can replace or delete
 * them afterwards like any other image.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadEnv } from "./load-env.mjs";

loadEnv();

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectKey = process.argv[2] || process.env.ACTIVE_PROJECT || "iresi";
const seedPath = join(root, "scripts", "seed", `${projectKey}.json`);

if (!existsSync(seedPath)) {
  console.error(`No seed data for "${projectKey}" (looked for ${seedPath}).`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const seed = JSON.parse(readFileSync(seedPath, "utf8"));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/** Stores a file from `public/` in `media` and returns its id, or null if absent. */
async function storeImage(publicPath, alt) {
  const file = join(root, "public", publicPath.replace(/^\//, ""));
  if (!existsSync(file)) {
    console.warn(`  ! missing image ${publicPath}`);
    return null;
  }
  const bytes = readFileSync(file);
  const mime = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
  const { rows } = await client.query(
    `INSERT INTO media (filename, mime, byte_size, data, alt)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [publicPath.split("/").pop(), mime, bytes.length, bytes, alt ?? ""],
  );
  return rows[0].id;
}

/** Renders the converter's {heading, paragraphs, bullets} back into stored text. */
function sectionsToText(sections = []) {
  return sections
    .map((section) => {
      const parts = [];
      if (section.heading) parts.push(`## ${section.heading}`);
      parts.push(...section.paragraphs);
      if (section.bullets?.length) parts.push(section.bullets.map((b) => `- ${b}`).join("\n"));
      return parts.join("\n\n");
    })
    .join("\n\n");
}

async function seedProjects() {
  let added = 0;
  for (const p of seed.projects ?? []) {
    const existing = await client.query("SELECT 1 FROM projects WHERE slug = $1", [p.slug]);
    if (existing.rowCount) continue;

    await client.query(
      `INSERT INTO projects
         (slug, title, page_title, summary, intro, tags, body, card_image, hero_image,
          website, website_label, vimeo_id, external_only, gallery, published, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15)`,
      [
        p.slug,
        p.title,
        p.pageTitle,
        p.summary,
        (p.intro ?? []).join("\n"),
        (p.tags ?? []).join("\n"),
        sectionsToText(p.sections),
        p.cardImage,
        p.image,
        p.website,
        "See Platform",
        p.vimeoId,
        Boolean(p.externalOnly),
        (p.gallery ?? []).join("\n"),
        p.order ?? 0,
      ],
    );
    added++;
  }
  return added;
}

async function seedPublications() {
  let added = 0;
  for (const p of seed.publications ?? []) {
    const existing = await client.query("SELECT 1 FROM publications WHERE title = $1", [p.title]);
    if (existing.rowCount) continue;

    await client.query(
      `INSERT INTO publications
         (title, authors, venue, year, url, journal, volume, pages, publisher,
          description, date_text, researcher_slug, published, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13)`,
      [
        p.title,
        (p.authors ?? []).join(", "),
        p.journal ?? "",
        p.year ?? null,
        p.link,
        p.journal,
        p.volume,
        p.pages,
        p.publisher,
        p.description,
        p.date,
        p.researcher,
        p.order ?? 0,
      ],
    );
    added++;
  }
  return added;
}

async function seedNews() {
  let added = 0;
  for (const n of seed.news ?? []) {
    const existing = await client.query("SELECT 1 FROM news_items WHERE slug = $1", [n.slug]);
    if (existing.rowCount) continue;

    const { rows } = await client.query(
      `INSERT INTO news_items
         (kind, slug, title, summary, body, author, published_on, unlisted, legacy_paths, published)
       VALUES ('news',$1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING id`,
      [
        n.slug,
        n.title,
        n.summary,
        sectionsToText(n.sections),
        n.author,
        n.date,
        Boolean(n.unlisted),
        (n.legacyPaths ?? []).join("\n"),
      ],
    );
    const newsId = rows[0].id;

    // The hero image first, then the gallery, skipping a repeat of the hero.
    const images = [n.image, ...(n.gallery ?? []).filter((g) => g !== n.image)].filter(Boolean);
    for (const [position, path] of images.entries()) {
      const mediaId = await storeImage(path, n.title);
      if (mediaId) {
        await client.query(
          "INSERT INTO news_images (news_id, media_id, position) VALUES ($1,$2,$3)",
          [newsId, mediaId, position],
        );
      }
    }
    added++;
  }
  return added;
}

/**
 * The team page.
 *
 * Portraits are stored as `photo_path` rather than uploaded into `media`: the
 * files are already served from `public/images/team`, and copying thirty-six of
 * them into the database to look identical would be work for its own sake. An
 * editor who replaces someone's photograph through the admin uploads a real
 * `media` row, and `photo_media_id` then takes precedence.
 */
async function seedTeam() {
  const people = JSON.parse(
    readFileSync(join(root, "src/projects/iresi/data/team.json"), "utf8"),
  );
  let added = 0;
  for (const person of people) {
    const { rows } = await client.query(
      "SELECT id FROM team_members WHERE project_key = $1 AND name = $2",
      [projectKey, person.name],
    );
    if (rows.length > 0) continue;
    await client.query(
      `INSERT INTO team_members
         (project_key, name, role, photo_path, email, linkedin, sort_order, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [projectKey, person.name, person.role ?? "", person.photo ?? null,
       person.email ?? null, person.linkedin ?? null, person.order ?? 0],
    );
    added++;
  }
  return added;
}

/**
 * The About page's scrolling photographs.
 *
 * These *are* uploaded into `media`, unlike the portraits: the point of putting
 * them here is that an editor can add and remove them, and a list that mixed
 * database rows with hard-coded paths could not be reordered as one.
 */
async function seedAboutImages() {
  /*
   * Checked one picture at a time, by filename, rather than "does this slot have
   * anything in it".
   *
   * The whole-slot check meant that once an editor had added a single photograph
   * of their own, this could never restore the originals — which mattered on
   * 14 August 2026, when a bug in the orphan sweep deleted all sixteen and the
   * two the editor had uploaded were enough to make the seed skip the lot.
   */
  const { rows: present } = await client.query(
    `SELECT m.filename
     FROM page_images pi JOIN media m ON m.id = pi.media_id
     WHERE pi.project_key = $1 AND pi.slot = 'about-collage'`,
    [projectKey],
  );
  const have = new Set(present.map((row) => row.filename));

  const { rows: last } = await client.query(
    `SELECT COALESCE(MAX(sort_order), -1) AS n
     FROM page_images WHERE project_key = $1 AND slot = 'about-collage'`,
    [projectKey],
  );
  let position = Number(last[0].n) + 1;

  let added = 0;
  for (let i = 1; i <= 16; i++) {
    const path = `/images/about/collage-${i}.jpg`;
    if (have.has(path.split("/").pop())) continue;

    const mediaId = await storeImage(path, "Life at the IRESI Centre");
    if (mediaId === null) continue;
    await client.query(
      `INSERT INTO page_images (project_key, slot, media_id, sort_order)
       VALUES ($1, 'about-collage', $2, $3)`,
      [projectKey, mediaId, position],
    );
    position++;
    added++;
  }
  return added;
}

try {
  await client.connect();
  await client.query("BEGIN");

  const projects = await seedProjects();
  const publications = await seedPublications();
  const news = await seedNews();
  const team = await seedTeam();
  const aboutImages = await seedAboutImages();

  await client.query("COMMIT");
  console.log(
    `Seeded "${projectKey}": ${projects} projects, ${publications} publications, ` +
      `${news} news entries, ${team} team members, ${aboutImages} About photographs.`,
  );
  if (projects + publications + news + team + aboutImages === 0) {
    console.log("Nothing was added — every entry already exists.");
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Seed failed, nothing was written:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
