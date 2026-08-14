"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageSize, MediaRef } from "@/lib/repo";
import styles from "./Gallery.module.css";

/**
 * The images attached to a finding or a news entry.
 *
 * ---------------------------------------------------------------------------
 * HOW THE LAYOUT IS DECIDED
 * ---------------------------------------------------------------------------
 * Two inputs, and neither is guessed:
 *
 * **The chosen size** (`small` / `medium` / `large`) sets how much room the
 * images get — a narrow column beside the text, a wider one, or a wide block
 * above it. That is the editor's call, stored on the entry.
 *
 * **The number of images** sets how many go across, via `columnsFor` below.
 * That count is then capped by how wide the column actually is, using container
 * queries in the stylesheet — so the same gallery is three across in a wide
 * block and one across in a narrow one, without the component knowing anything
 * about screen sizes.
 *
 * Each image is drawn **at its own aspect ratio**, from the pixel dimensions
 * read out of the file on upload. Nothing is cropped and nothing is padded.
 * Images stored before dimensions were recorded fall back to a 3:2 box.
 */

/**
 * How many images should sit across a full-width row, for a given total.
 *
 * Chosen to avoid a last row holding a single stranded image, which is what
 * makes a gallery look unfinished. Three go three-across rather than two-plus-
 * one; four go two-by-two rather than three-plus-one; nine go three-by-three.
 *
 *   1→1  2→2  3→3  4→2x2  5→3+2  6→3+3  7→4+3  8→4+4  9→3x3  10+→4
 *
 * A shorter last row is fine — the stylesheet centres it — so the only thing
 * being avoided here is a row of one.
 */
export function columnsFor(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count === 4) return 2;
  if (count <= 6) return 3;
  if (count <= 8) return 4;
  if (count === 9) return 3;
  return 4;
}

/**
 * A magnifier with a plus in it.
 *
 * This was four bracket corners, which is the generic "fullscreen" mark and
 * reads as "expand this panel" rather than "look at this picture closely". A
 * magnifier says what the control does without a label.
 */
function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.4 15.4 21 21" />
        <path d="M10.5 7.8v5.4M7.8 10.5h5.4" />
      </g>
    </svg>
  );
}

export function Gallery({
  images,
  size,
  className,
}: {
  images: MediaRef[];
  size: ImageSize;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggersRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const trackRef = useRef<HTMLUListElement>(null);
  /** Which slide is showing, for the counter and the dots. */
  const [slide, setSlide] = useState(0);

  /**
   * Reads the current slide back out of the scroller.
   *
   * Deliberately derived from `scrollLeft` rather than tracked as the source of
   * truth: the scroller can be moved by a swipe, a trackpad, the scrollbar or
   * the buttons, and only one of those goes through this component. Measuring
   * what actually happened keeps the counter honest whichever it was.
   */
  const onTrackScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth || 1;
    setSlide(Math.max(0, Math.min(images.length - 1, Math.round(track.scrollLeft / width))));
  }, [images.length]);

  const scrollToSlide = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }, []);

  /**
   * Only ever asks the dialog to close.
   *
   * Everything that has to happen afterwards — clearing the index, returning
   * focus — lives in `onClose`, because a `<dialog>` can also be dismissed by
   * Escape, which does not come through here. Doing the tidying in both places
   * meant Escape left focus on `<body>`, so a keyboard user had to tab from the
   * top of the page again.
   */
  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const open = (index: number) => {
    setOpenIndex(index);
    dialogRef.current?.showModal();
  };

  const step = useCallback(
    (by: number) => {
      setOpenIndex((current) =>
        current === null ? null : (current + by + images.length) % images.length,
      );
    },
    [images.length],
  );

  // Arrow keys move through the set. Escape is handled by <dialog> itself.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex, step]);

  if (images.length === 0) return null;

  const current = openIndex === null ? null : images[openIndex];

  return (
    /* The wrapper is the container-query context. An element cannot respond to
       its own container query, so the list inside asks this one how wide it is. */
    <div className={[styles.wrap, styles[size], className].filter(Boolean).join(" ")}>
      {/*
       * One image across, swipeable, once there is more than one.
       *
       * The gallery used to tile every image into a grid, which meant four
       * images each rendered at a quarter of the column — too small to read a
       * chart in, and nothing like the size a single image gets. Now every
       * image is shown at the same full width of its column and the set is
       * swiped through instead.
       *
       * The scroller is the whole mechanism: `scroll-snap-type` in the
       * stylesheet does the paging, so touch swipe, trackpad, shift-scroll and
       * the scrollbar all work with no JavaScript at all. The buttons below
       * scroll it for anyone using a mouse, and `tabindex=0` makes it a focus
       * stop so arrow keys page through it too.
       */}
      <ul
        ref={trackRef}
        className={styles.gallery}
        data-cols={columnsFor(images.length)}
        data-count={images.length}
        {...(images.length > 1
          ? {
              tabIndex: 0,
              role: "group" as const,
              "aria-label": `${images.length} images — scroll or use the arrows`,
            }
          : {})}
        onScroll={images.length > 1 ? onTrackScroll : undefined}
      >
        {images.map((image, index) => (
          <li key={image.id} className={styles.item}>
            {/*
             * A link, not a button, and that is deliberate. It points at the
             * image itself, so with JavaScript unavailable it still opens the
             * full-size file rather than doing nothing. The click handler takes
             * over when JavaScript is there.
             */}
            <a
              ref={(node) => { triggersRef.current[index] = node; }}
              className={styles.trigger}
              href={`/media/${image.id}`}
              aria-label={
                image.alt
                  ? `View “${image.alt}” at full size`
                  : `View image ${index + 1} of ${images.length} at full size`
              }
              onClick={(event) => {
                // Leave modified clicks alone so "open in new tab" still works.
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                open(index);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- served from
                  the database at /media/[id]; next/image needs a build-time known
                  source or a configured loader, and this route has neither. */}
              <img
                className={styles.image}
                src={`/media/${image.id}`}
                alt={image.alt}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
                style={
                  image.width && image.height
                    ? { aspectRatio: `${image.width} / ${image.height}` }
                    : undefined
                }
                data-unsized={image.width && image.height ? undefined : ""}
                loading="lazy"
                decoding="async"
              />
              <span className={styles.expand} aria-hidden="true">
                <ExpandIcon />
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/*
       * Controls for anyone not swiping. They scroll the track rather than
       * holding their own state, so the track stays the single source of truth
       * for which image is showing.
       *
       * The dots are buttons, not decoration — jumping straight to the fourth
       * of six is a real thing to want, and a row of undifferentiated dots that
       * cannot be clicked is a common and pointless piece of theatre.
       */}
      {images.length > 1 ? (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.step}
            onClick={() => scrollToSlide(Math.max(0, slide - 1))}
            disabled={slide === 0}
            aria-label="Previous image"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <ol className={styles.dots}>
            {images.map((image, index) => (
              <li key={image.id}>
                <button
                  type="button"
                  className={`${styles.dot} ${index === slide ? styles.dotCurrent : ""}`}
                  aria-label={`Go to image ${index + 1} of ${images.length}`}
                  aria-current={index === slide ? "true" : undefined}
                  onClick={() => scrollToSlide(index)}
                />
              </li>
            ))}
          </ol>

          <button
            type="button"
            className={styles.step}
            onClick={() => scrollToSlide(Math.min(images.length - 1, slide + 1))}
            disabled={slide === images.length - 1}
            aria-label="Next image"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        className={styles.lightbox}
        aria-label="Image viewer"
        // The single exit point, whether it was closed by the button, the
        // backdrop, or Escape.
        onClose={() => {
          const index = openIndex;
          setOpenIndex(null);
          if (index !== null) triggersRef.current[index]?.focus();
        }}
        // With showModal() the backdrop belongs to the dialog element, so a
        // click on it targets the dialog. That is how "click outside to close"
        // is detected without an overlay element of our own.
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        {current ? (
          <div className={styles.lightboxBody}>
            <div className={styles.lightboxBar}>
              <span className={styles.lightboxCount}>
                {images.length > 1 ? `${openIndex! + 1} of ${images.length}` : null}
              </span>
              <button type="button" className={styles.lightboxClose} onClick={close}>
                Close
              </button>
            </div>

            <div className={styles.lightboxStage}>
              {images.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                  onClick={() => step(-1)}
                  aria-label="Previous image"
                >
                  <span aria-hidden="true">‹</span>
                </button>
              ) : null}

              {/* eslint-disable-next-line @next/next/no-img-element -- as above */}
              <img
                className={styles.lightboxImage}
                src={`/media/${current.id}`}
                alt={current.alt}
                width={current.width ?? undefined}
                height={current.height ?? undefined}
              />

              {images.length > 1 ? (
                <button
                  type="button"
                  className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                  onClick={() => step(1)}
                  aria-label="Next image"
                >
                  <span aria-hidden="true">›</span>
                </button>
              ) : null}
            </div>

            {current.alt ? (
              <p className={styles.lightboxCaption}>{current.alt}</p>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
