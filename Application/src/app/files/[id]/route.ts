import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFileBytes, isFilePublic } from "@/lib/repo";
import { project } from "@/projects";

/**
 * Serves an uploaded document from the database.
 *
 * Served only when the document is attached to something published, or the
 * request comes from a signed-in editor. Ids are sequential, so without that
 * test a draft outcome's report could be read by anyone counting upwards, and a
 * document whose entry had been deleted stayed readable for ever — the same pair
 * of faults the external review found on /media, and they were the same fault.
 *
 * ---------------------------------------------------------------------------
 * ALWAYS AN ATTACHMENT, NEVER INLINE
 * ---------------------------------------------------------------------------
 * `Content-Disposition: attachment` means the browser downloads the file rather
 * than rendering it in the tab. That is the whole defence here: anything served
 * inline from our own origin runs in our origin, and `readDocuments` decides a
 * document's type partly from its extension, so a file could in principle be
 * mislabelled. Downloading removes the question entirely.
 *
 * The practical cost is that a PDF downloads instead of previewing in the
 * browser's viewer. For a project site publishing reports that is the ordinary
 * expectation, and it is the safe default; a viewer would need the type decided
 * from bytes alone before it would be worth revisiting.
 *
 * The filename is quoted and stripped of quotes and control characters, so it
 * cannot break out of the header and inject one of its own.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/files/[id]">,
) {
  const { id } = await context.params;

  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // 404 rather than 403 for a refusal: "forbidden" would confirm something
  // exists at that id, which sequential numbering already makes easy to probe.
  const isPublic = await isFilePublic(numeric);
  if (!isPublic && (await getCurrentUser()) === null) {
    return new NextResponse("Not found", { status: 404 });
  }

  let row: { data: Buffer; mime: string; filename: string } | null;
  try {
    row = await getFileBytes(numeric);
  } catch (error) {
    console.error(`[${project.key}] file read failed:`, error);
    return new NextResponse("File unavailable", { status: 503 });
  }

  if (!row) return new NextResponse("Not found", { status: 404 });

  const safeName = row.filename.replace(/["\\\r\n]/g, "_") || "download";

  return new NextResponse(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.data.byteLength),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      // The bytes never change: editing an entry's files attaches a new row
      // rather than overwriting this one. A document served only because an
      // editor is signed in must not be left in a shared cache.
      "Cache-Control": isPublic
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
