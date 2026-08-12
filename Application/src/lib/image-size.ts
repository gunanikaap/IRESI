import "server-only";

/**
 * Reads pixel dimensions straight out of an image's header bytes.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS RATHER THAN A DEPENDENCY
 * ---------------------------------------------------------------------------
 * The public pages need each uploaded image's real width and height. Without
 * them every image had to be poured into a fixed 3:2 box — which either cropped
 * it (`cover`, so a chart lost its axis labels) or letterboxed it (`contain`,
 * so a portrait photograph sat in a wide grey field). With the real ratio the
 * image is simply drawn at its own shape, and the space is still reserved
 * before it loads so nothing shifts.
 *
 * Every accepted format carries its dimensions within the first few dozen bytes
 * of the file, so this is header parsing, not decoding — no `sharp`, no native
 * module that has to compile on every deploy target, and nothing that has to
 * hold a decoded bitmap in memory.
 *
 * It returns null rather than throwing on anything it does not recognise. A
 * missing size degrades to a sensible default in the renderer; it must never
 * fail an editor's upload.
 */

export type Dimensions = { width: number; height: number };

/** PNG: IHDR is always the first chunk, width and height big-endian at 16. */
function png(bytes: Buffer): Dimensions | null {
  if (bytes.length < 24) return null;
  if (bytes.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** GIF: logical screen descriptor, little-endian, immediately after the header. */
function gif(bytes: Buffer): Dimensions | null {
  if (bytes.length < 10) return null;
  return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
}

/**
 * JPEG: walk the segment chain to a Start Of Frame marker.
 *
 * There is no fixed offset — a JPEG can carry any number of EXIF, ICC and
 * comment segments first — so each segment's length is used to skip to the
 * next. The SOF markers hold the dimensions; DHT, DRI and the rest do not.
 * C4, C8 and CC are excluded because they are Huffman tables, arithmetic
 * coding conditioning and the like, sitting in the same numeric range.
 */
function jpeg(bytes: Buffer): Dimensions | null {
  let offset = 2; // past SOI

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      // Not on a marker boundary: fill bytes are legal, anything else is not.
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    // Standalone markers with no payload.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
      offset += 2;
      continue;
    }

    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2) return null;

    const isSOF =
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isSOF) {
      // SOF payload: precision (1), then **height then width** — the reverse of
      // every other format here, which is the easy mistake to make.
      if (offset + 9 >= bytes.length) return null;
      return {
        width: bytes.readUInt16BE(offset + 7),
        height: bytes.readUInt16BE(offset + 5),
      };
    }

    // Start of Scan: image data follows, no dimensions after this point.
    if (marker === 0xda) return null;

    offset += 2 + length;
  }

  return null;
}

/**
 * WebP: three container variants, each storing the size differently.
 *
 * VP8  — lossy, 14-bit dimensions after a 3-byte start code.
 * VP8L — lossless, 14-bit each packed into a little-endian 32-bit field.
 * VP8X — extended, 24-bit minus-one values, used for animation and alpha.
 */
function webp(bytes: Buffer): Dimensions | null {
  if (bytes.length < 30) return null;
  const format = bytes.toString("ascii", 12, 16);

  if (format === "VP8X") {
    return {
      width: (bytes.readUIntLE(24, 3) & 0xffffff) + 1,
      height: (bytes.readUIntLE(27, 3) & 0xffffff) + 1,
    };
  }

  if (format === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  if (format === "VP8 ") {
    // Frame header starts at 20; the 3-byte start code is 9D 01 2A.
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }

  return null;
}

export function readDimensions(bytes: Buffer, mime: string): Dimensions | null {
  let size: Dimensions | null = null;

  try {
    if (mime === "image/png") size = png(bytes);
    else if (mime === "image/jpeg") size = jpeg(bytes);
    else if (mime === "image/gif") size = gif(bytes);
    else if (mime === "image/webp") size = webp(bytes);
  } catch {
    // A truncated or malformed header reads past the end of the buffer. That is
    // a broken image, not a broken upload — fall through to null.
    return null;
  }

  if (!size) return null;

  // A zero or absurd dimension means the header was misread. Treated as unknown
  // rather than stored, because a bad ratio is worse on the page than none.
  const sane =
    Number.isInteger(size.width) && Number.isInteger(size.height) &&
    size.width > 0 && size.height > 0 &&
    size.width <= 30000 && size.height <= 30000;

  return sane ? size : null;
}
