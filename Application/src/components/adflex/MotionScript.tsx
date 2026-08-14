/**
 * Marks the document as JavaScript-capable before the first paint.
 *
 * The scroll-reveal styles start elements hidden, which is only safe if we know
 * something will reveal them. Every one of those rules is gated on the
 * `adflex-js` class this adds, so:
 *
 *   - without JavaScript, nothing is ever hidden and the page reads normally;
 *   - with JavaScript, the class is present during head parse, so elements are
 *     already in their pre-reveal state on the first frame and nothing flashes
 *     visible and then jumps.
 *
 * An effect could not do this: it runs after the first paint, which is exactly
 * the flash it exists to prevent. Kept tiny — it runs ahead of everything else
 * on every request.
 */

const script = `
(function () {
  try { document.documentElement.classList.add("adflex-js"); } catch (e) {}
})();
`;

export function MotionScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
