/**
 * Upload limits, shared by the server validator and the client form.
 *
 * Separate from `upload.ts` purely because that file is `server-only` — it
 * reads file bytes and must never be bundled into the browser. The admin form
 * still needs to *state* the limit to the editor, so the numbers live here
 * where both sides can import them.
 *
 * The client uses these for the `accept` attribute and the hint text. Neither
 * is a check: `src/lib/upload.ts` re-derives the real format from the file's
 * magic bytes and enforces the size again on the server.
 */

/** 5 MB. Comfortable for a photograph, small enough that the database is not an object store. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * 20 MB across everything chosen in one save.
 *
 * ---------------------------------------------------------------------------
 * THIS EXISTS BECAUSE THE PER-FILE LIMIT IS NOT ENOUGH ON ITS OWN
 * ---------------------------------------------------------------------------
 * A Server Action receives every chosen file in one request body, so what the
 * framework sees is the **sum**, not the largest file. Checking only per-file
 * let three 3 MB photographs through the form and straight into Next's own
 * body limit, which fails with a runtime error page rather than a message an
 * editor can act on. That is exactly the failure the per-file check was added
 * to prevent, one level up.
 *
 * `serverActions.bodySizeLimit` in next.config.ts must stay comfortably above
 * this, so this check — with its readable message — is always the one that
 * fires. If you raise one, raise the other.
 *
 * The ceiling is a real constraint, not a formality: the whole body is buffered
 * in memory before the action runs, and on a serverless host that memory is
 * charged and capped.
 */
export const MAX_UPLOAD_TOTAL_BYTES = 20 * 1024 * 1024;

/** For messages: "5 MB", "20 MB". */
export const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/**
 * SVG is deliberately absent. It can carry script, and these files are served
 * back from our own origin at /media/[id].
 */
export const ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const ACCEPT_ATTRIBUTE = ACCEPTED_MIME.join(",");

/**
 * The document extensions an editor may attach to an outcome.
 *
 * Here rather than in `upload.ts` for the same reason as everything else in
 * this file: the admin form needs it for the `accept` attribute and cannot
 * import a `server-only` module. `upload.ts` holds the real check, which reads
 * the file's leading bytes; this is only what the file picker offers.
 */
export const DOCUMENT_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.doc,.ppt,.xls";

/**
 * A human-readable size for a download link.
 *
 * Rounded generously — the point is "is this a quick click or a big download",
 * not an exact byte count.
 */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** The extension, upper-cased, for a download link: "PDF", "DOCX". */
export function fileKind(filename: string): string {
  const extension = filename.split(".").pop() ?? "";
  return extension ? extension.toUpperCase() : "FILE";
}
