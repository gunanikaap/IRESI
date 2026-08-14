"use client";

import { useEffect } from "react";

/**
 * Reveals anything marked `data-reveal` as it scrolls into view.
 *
 * One observer for the whole document rather than a client component wrapped
 * around every section. The site is otherwise entirely static, and this keeps
 * it that way: server components add a `data-reveal` attribute — a string in
 * the markup — and no part of the page tree has to become client-rendered to
 * animate.
 *
 * Elements are revealed once and then unobserved. Content that has already been
 * read should not fade out again when it scrolls away, and re-animating on
 * every pass is the thing that makes scroll effects tiring.
 *
 * Mounted once in the root layout.
 */
export function RevealObserver() {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!nodes.length) return;

    // If the reader asks for reduced motion, show everything immediately and
    // never observe. The CSS already covers this, but doing it here too means
    // no work is scheduled at all.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach((n) => n.setAttribute("data-reveal", "shown"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "shown");
          observer.unobserve(entry.target);
        }
      },
      {
        // Fires a little before the element's top edge reaches the viewport
        // bottom, so the movement finishes as it arrives rather than starting
        // once it is already fully on screen.
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.05,
      },
    );

    nodes.forEach((n) => observer.observe(n));

    // Anything already on screen at load — the hero, mostly — should not wait
    // for a scroll that may never come.
    return () => observer.disconnect();
  }, []);

  return null;
}
