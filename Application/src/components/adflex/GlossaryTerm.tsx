"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./GlossaryTerm.module.css";

type GlossaryTermProps = {
  term: string;
  definition: string;
  /**
   * Render the term only, and describe it with a node the caller owns.
   *
   * The built-in popup floats over whatever is beneath it. In a hero tagline
   * that is the rest of the sentence, so hovering the word hides the copy you
   * were reading. Callers that would rather give the definition its own
   * reserved space pass the id of that element here; this component then
   * renders just the button and points `aria-describedby` at it, so there is
   * still exactly one copy of the definition in the DOM.
   *
   * The button carries `data-glossary-term` and a live `aria-expanded`, which
   * is what the caller's stylesheet keys the reveal off.
   */
  descriptionId?: string;
};

/** Keeps the popup this far from the viewport edge. */
const EDGE_MARGIN = 16;

/**
 * A term inside running text that reveals its definition.
 *
 * Deliberately not a hover-only tooltip. A definition that only appears on
 * hover is unreachable on a touch screen and invisible to keyboard and
 * screen-reader users, so this:
 *
 * - is a real `<button>`, so it is tabbable and works on tap as well as hover;
 * - opens on hover, on focus and on click, and closes on Escape;
 * - keeps the popup inside the hovered element, so moving the pointer onto the
 *   definition does not dismiss it;
 * - always carries the definition as the button's accessible description,
 *   whether or not the popup is visible on screen.
 *
 * There is exactly one copy of the definition in the DOM. A node referenced by
 * `aria-describedby` is included in the description even while it is hidden, so
 * the closed popup still describes the button — and because it is hidden, a
 * screen reader moving through the sentence does not read the definition a
 * second time.
 */
export function GlossaryTerm({
  term,
  definition,
  descriptionId: externalDescriptionId,
}: GlossaryTermProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLSpanElement>(null);
  const ownDescriptionId = useId();
  const ownsPopup = externalDescriptionId === undefined;
  const descriptionId = externalDescriptionId ?? ownDescriptionId;

  /**
   * The popup is anchored to a word, so where it lands depends on where that
   * word happens to fall on its line — which changes with viewport width and
   * font metrics. CSS cannot express "stay inside the viewport" for an element
   * anchored mid-sentence, so nudge it back once it is on screen.
   *
   * This writes to the node rather than to state: the value is a measurement of
   * the DOM, it is only ever read by the DOM, and routing it through a render
   * would mean a second pass for no benefit.
   */
  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    if (!isOpen) {
      popup.style.left = "";
      return;
    }

    // Cleared first so the measurement is of the natural position, not of a
    // position that already includes a previous nudge.
    popup.style.left = "";
    const rect = popup.getBoundingClientRect();
    // `clientWidth`, not `window.innerWidth`: innerWidth grows with horizontal
    // overflow, so measuring against it would size the correction using the
    // very overflow being corrected, and undershoot.
    const viewport = document.documentElement.clientWidth;
    const overflowRight = rect.right - (viewport - EDGE_MARGIN);
    const overflowLeft = EDGE_MARGIN - rect.left;

    // `left`, not a transform: a transform moves the element visually but
    // leaves its layout box where it was, so the page would still report — and
    // scroll — the horizontal overflow.
    if (overflowRight > 0) popup.style.left = `${-overflowRight}px`;
    else if (overflowLeft > 0) popup.style.left = `${overflowLeft}px`;
  }, [isOpen]);

  return (
    <span
      className={styles.wrap}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className={styles.term}
        data-glossary-term=""
        aria-describedby={descriptionId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsOpen(false);
        }}
      >
        {term}
      </button>

      {ownsPopup ? (
        <span
          ref={popupRef}
          id={descriptionId}
          role="tooltip"
          className={`${styles.popup} ${isOpen ? styles.popupOpen : ""}`}
        >
          {definition}
        </span>
      ) : null}
    </span>
  );
}
