import "server-only";

/**
 * Upload validation.
 *
 * The rule here is that the browser is not trusted about anything. `file.type`
 * is whatever the client claimed, and a filename extension is just text, so
 * both are checked against the file's actual leading bytes before the data goes
 * anywhere near the database.
 */

import sharp from "sharp";

import { MAX_UPLOAD_BYTES, MAX_UPLOAD_TOTAL_BYTES, mb } from "./upload-limits";
import { readDimensions } from "./image-size";

export type UploadResult =
  | {
      ok: true;
      filename: string;
      mime: string;
      data: Buffer;
      /** Null when the header could not be read; the renderer falls back. */
      width: number | null;
      height: number | null;
    }
  | { ok: false; error: string };

/**
 * Reads the real format from the file's magic bytes.
 *
 * Returns null for anything that is not one of the four raster formats we
 * accept — which is what stops an HTML or SVG file being stored and later
 * served back from our own origin. An SVG is a script execution vector, so it
 * is deliberately not in the list.
 */
function sniffMime(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // WebP: "RIFF" .... "WEBP"
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  // GIF: "GIF87a" or "GIF89a"
  const gif = bytes.toString("ascii", 0, 6);
  if (gif === "GIF87a" || gif === "GIF89a") {
    return "image/gif";
  }

  return null;
}

/** Strips anything that is not a plain filename. Never used as a filesystem path, but it is displayed. */
function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "image";
  return base.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "image";
}

export async function readUpload(file: File | null): Promise<UploadResult | null> {
  // No file chosen is not an error — the image is optional on every form.
  if (!file || file.size === 0) return null;

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB — please resize it and try again.`,
    };
  }

  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffMime(data);

  if (!mime) {
    return {
      ok: false,
      error: "That file is not a PNG, JPEG, WebP or GIF image. (SVG is not accepted.)",
    };
  }

  const processed = await processImage(data, mime);

  return {
    ok: true,
    filename: safeFilename(file.name),
    mime: processed.mime,
    data: processed.data,
    width: processed.width,
    height: processed.height,
  };
}

/* --------------------------------------------------------------------------
 * Image processing
 * ----------------------------------------------------------------------- */

/**
 * The widest an image is ever stored at.
 *
 * The site never draws one wider than about half the content column, so 1600
 * covers that at 2× on a high-density screen with room to spare. A 4000px phone
 * photograph carries no visible detail past this and roughly ten times the
 * bytes.
 */
const MAX_STORED_WIDTH = 1600;

/**
 * Resizes an oversized image and strips everything that is not pixels.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * Both halves were raised in the external review of 9 August 2026:
 *
 *  - **Weight.** Uploads were stored exactly as chosen and served exactly as
 *    stored, so a 5 MB photograph was a 5 MB download even in a 500px box. On a
 *    phone, on a conference wifi, that is the difference between a page and a
 *    spinner.
 *  - **Metadata.** A photograph off a phone carries EXIF: GPS coordinates, the
 *    device, the date and time. Publishing a picture of a pilot site should not
 *    publish the location of whoever took it. `sharp` drops all of it unless
 *    asked to keep it, so re-encoding removes the problem rather than managing
 *    it.
 *
 * The orientation tag is the one piece worth reading before discarding it —
 * `rotate()` with no argument bakes it into the pixels, so a photograph taken
 * sideways stays the right way up once the tag is gone.
 *
 * ---------------------------------------------------------------------------
 * GIFs ARE LEFT ALONE, DELIBERATELY
 * ---------------------------------------------------------------------------
 * Re-encoding an animated GIF through this would flatten it to one frame, and an
 * animation silently becoming a still is worse than an unoptimised file. They
 * are rare here and already size-capped.
 *
 * Failure is not fatal. If `sharp` cannot read something it says it can, the
 * original bytes are stored and the upload still works — the point is to make
 * the common case smaller and safer, not to add a new way for a save to fail.
 */
async function processImage(
  data: Buffer,
  mime: string,
): Promise<{ data: Buffer; mime: string; width: number | null; height: number | null }> {
  const fallback = () => {
    const size = readDimensions(data, mime);
    return { data, mime, width: size?.width ?? null, height: size?.height ?? null };
  };

  if (mime === "image/gif") return fallback();

  try {
    const image = sharp(data, { failOn: "none" });
    const meta = await image.metadata();

    // An animated WebP has more than one page, and the same argument as GIF
    // applies to it.
    if ((meta.pages ?? 1) > 1) return fallback();

    let pipeline = image.rotate();
    if ((meta.width ?? 0) > MAX_STORED_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_STORED_WIDTH, withoutEnlargement: true });
    }

    // Same format out as in, so nothing downstream has to learn a new mime and
    // a PNG diagram does not become a lossy photograph.
    if (mime === "image/png") pipeline = pipeline.png({ compressionLevel: 9 });
    else if (mime === "image/webp") pipeline = pipeline.webp({ quality: 82 });
    else pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });

    const { data: out, info } = await pipeline.toBuffer({ resolveWithObject: true });

    // Re-encoding a small, already-optimised file can make it bigger. Keeping
    // the larger one would be a loss, so the original wins — but only when no
    // resize was needed, because a resized image must not keep its old pixels.
    if (out.byteLength >= data.byteLength && (meta.width ?? 0) <= MAX_STORED_WIDTH) {
      return { data, mime, width: info.width, height: info.height };
    }

    return { data: out, mime, width: info.width, height: info.height };
  } catch (error) {
    console.error("[adflex] image processing failed, storing the original:", error);
    return fallback();
  }
}

/* --------------------------------------------------------------------------
 * Documents
 * ----------------------------------------------------------------------- */

/**
 * The document types an editor may attach to an outcome.
 *
 * Keyed by extension because the modern Office formats are all ZIP archives and
 * share one magic number — see `sniffDocument`. `magic` is the leading-byte
 * signature the file must actually have.
 */
const DOCUMENT_TYPES = {
  pdf:  { mime: "application/pdf", magic: "pdf", label: "PDF" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: "zip", label: "Word" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", magic: "zip", label: "PowerPoint" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", magic: "zip", label: "Excel" },
  doc:  { mime: "application/msword", magic: "ole", label: "Word (legacy)" },
  ppt:  { mime: "application/vnd.ms-powerpoint", magic: "ole", label: "PowerPoint (legacy)" },
  xls:  { mime: "application/vnd.ms-excel", magic: "ole", label: "Excel (legacy)" },
} as const;

/*
 * The `accept` attribute for the file picker lives in `upload-limits.ts`, not
 * here, because the admin form is a client component and cannot import this
 * `server-only` module. Keep the two in step: this object is the check, that
 * string is only what the picker offers.
 */

/** The leading-byte family a buffer belongs to, or null. */
function magicFamily(bytes: Buffer): "pdf" | "zip" | "ole" | null {
  if (bytes.length < 8) return null;
  // "%PDF-"
  if (bytes.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  // ZIP local file header — every .docx/.pptx/.xlsx is a ZIP archive.
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
    return "zip";
  }
  // OLE2 compound file — the pre-2007 .doc/.ppt/.xls container.
  if (
    bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 && bytes[5] === 0xb1 && bytes[6] === 0x1a && bytes[7] === 0xe1
  ) {
    return "ole";
  }
  return null;
}

/**
 * Decides a document's type from its bytes *and* its extension.
 *
 * ---------------------------------------------------------------------------
 * WHY THE EXTENSION IS PART OF THE CHECK HERE, AND NOT FOR IMAGES
 * ---------------------------------------------------------------------------
 * An image's format is unambiguous from its first bytes, so `sniffMime` ignores
 * the name entirely — which is right, because a name is attacker-controlled
 * text. Documents are not so tidy: .docx, .pptx and .xlsx are all ZIP archives
 * with byte-identical headers, and the three legacy formats all sit in the same
 * OLE2 container. Telling them apart from bytes alone means parsing the archive
 * for `[Content_Types].xml`, which is a lot of machinery to choose a MIME label.
 *
 * So the bytes decide the *family* — is this really a ZIP, an OLE file or a PDF
 * — and the extension picks which member of that family to record. A renamed
 * .exe is still refused, because its magic matches nothing; the worst a wrong
 * extension can do is mislabel one Office document as another.
 *
 * This only holds because the files are never served back as HTML: `/files/[id]`
 * sends them as attachments with `nosniff`. See the note there.
 */
function sniffDocument(bytes: Buffer, filename: string): { mime: string } | null {
  const extension = filename.toLowerCase().split(".").pop() ?? "";
  const type = DOCUMENT_TYPES[extension as keyof typeof DOCUMENT_TYPES];
  if (!type) return null;
  if (magicFamily(bytes) !== type.magic) return null;
  return { mime: type.mime };
}

export type DocumentUpload = {
  filename: string;
  mime: string;
  data: Buffer;
  byteSize: number;
};

/**
 * Reads every document from one multi-file field.
 *
 * Same shape and same all-or-nothing rule as `readUploads`: one bad file
 * refuses the whole save rather than storing the rest and silently dropping it.
 */
export async function readDocuments(
  files: File[],
): Promise<{ ok: true; documents: DocumentUpload[] } | { ok: false; error: string }> {
  const chosen = files.filter((file) => file.size > 0);

  const total = chosen.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_UPLOAD_TOTAL_BYTES) {
    return {
      ok: false,
      error: `Those ${chosen.length} files come to ${(total / 1024 / 1024).toFixed(1)} MB together. The limit is ${mb(MAX_UPLOAD_TOTAL_BYTES)} per save — add them in two goes.`,
    };
  }

  const documents: DocumentUpload[] = [];

  for (const file of chosen) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        error: `“${file.name}” is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${mb(MAX_UPLOAD_BYTES)} per file.`,
      };
    }

    const data = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffDocument(data, file.name);
    if (!sniffed) {
      return {
        ok: false,
        error: `“${file.name}” is not one of the accepted document types (${Object.values(DOCUMENT_TYPES).map((t) => t.label).filter((v, i, a) => a.indexOf(v) === i).join(", ")}), or its contents do not match its extension.`,
      };
    }

    documents.push({
      filename: safeFilename(file.name),
      mime: sniffed.mime,
      data,
      byteSize: data.byteLength,
    });
  }

  return { ok: true, documents };
}

/**
 * Reads every file from one multi-file field.
 *
 * Stops at the first bad file and reports it, rather than storing the good ones
 * and quietly dropping the rest — a partial save an editor did not ask for is
 * harder to notice than an outright refusal.
 *
 * **Checks the combined size as well as each file.** Every chosen file arrives
 * in one Server Action request body, so a batch can be far larger than any
 * single file in it. Without this the framework's own body limit was the thing
 * that refused the upload, and it does that with a runtime error page rather
 * than something an editor can act on.
 */
export async function readUploads(
  files: File[],
): Promise<{ ok: true; uploads: Extract<UploadResult, { ok: true }>[] } | { ok: false; error: string }> {
  const chosen = files.filter((file) => file.size > 0);

  const total = chosen.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_UPLOAD_TOTAL_BYTES) {
    return {
      ok: false,
      error: `Those ${chosen.length} images come to ${(total / 1024 / 1024).toFixed(1)} MB together. The limit is ${mb(MAX_UPLOAD_TOTAL_BYTES)} per save — add them in two goes, or resize them first.`,
    };
  }

  const uploads: Extract<UploadResult, { ok: true }>[] = [];

  for (const file of chosen) {
    const result = await readUpload(file);
    if (!result) continue;
    if (!result.ok) return { ok: false, error: `${file.name}: ${result.error}` };
    uploads.push(result);
  }

  return { ok: true, uploads };
}
