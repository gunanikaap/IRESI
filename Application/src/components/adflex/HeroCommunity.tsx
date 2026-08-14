import styles from "./HeroCommunity.module.css";

/**
 * The hero illustration: a small energy community, drawn as simply as it can be.
 *
 * Six things, and nothing else:
 *
 *   a house with a solar panel   the homes taking part
 *   two buildings beside it      the community around them
 *   one arc passing over them    energy shared across the community
 *   one point on that arc        the Digital Spine coordinating it
 *   one light travelling         flexibility actually moving
 *   a ground line                somewhere for all of it to stand
 *
 * The restraint is the design. Five heroes before this one each explained more
 * of the system than the last, and each ended up reading as an engineering
 * diagram sitting next to a headline. The supplied system diagram is directly
 * below and does the explaining; this only has to say what the project is about
 * and look calm doing it.
 *
 * Wide rather than square on purpose. It sits beside the copy at desktop width
 * and above the fold on a phone, and a tall illustration in that slot pushes the
 * whole hero down a screen and a half.
 *
 * Decorative: `aria-hidden`, no client-side JavaScript, and both animations are
 * behind `prefers-reduced-motion`.
 */

/**
 * The arc. Shared by the visible stroke, the faint echo above it and the
 * travelling light, so the three can never drift out of register — giving any
 * one of them its own copy is the usual way a layered stroke effect breaks.
 *
 * Its apex is (280, 112.5) and its ends sit at y=282, just above the ground
 * line at y=300 — so it rises out of open ground on both sides rather than
 * touching a building, which is what keeps it from reading as wiring.
 */
const ARC = "M 44 282 C 150 56, 410 56, 516 282";

/** Window grids, as `[x, y]` pairs. Both are centred on their own building. */
const grid = (cols: number[], rows: number[]) =>
  rows.flatMap((y) => cols.map((x) => [x, y] as const));

const WINDOWS_TALL = grid([271, 301], [188, 216, 244, 272]);
const WINDOWS_MID = grid([365, 391], [232, 262]);

/**
 * A building: rounded at the top, square at the bottom.
 *
 * `rx` on a plain `<rect>` rounds all four corners, and a rounded bottom edge
 * is exactly what makes a shape read as a card lying on a surface rather than a
 * building standing on one. The two look identical in code and completely
 * different on screen.
 */
function block(x: number, y: number, w: number, h: number, r = 3) {
  return `M ${x} ${y + h} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h} Z`;
}

export function HeroCommunity() {
  return (
    <svg
      className={styles.svg}
      viewBox="0 40 560 300"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="hc-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--adflex-brand-green)" stopOpacity="0.13" />
          <stop offset="100%" stopColor="var(--adflex-brand-green)" stopOpacity="0" />
        </radialGradient>

        {/* Both the arc and the ground line fade out at their ends. Nothing in
            the drawing has a hard cut-off edge, which is most of why it reads
            as a vignette rather than as a cropped diagram.

            `userSpaceOnUse` on both, and on the ground line it is mandatory:
            a horizontal path has a zero-height bounding box, so the default
            `objectBoundingBox` gradient never resolves and the line renders
            completely invisible with nothing reported anywhere. */}
        <linearGradient id="hc-arc" gradientUnits="userSpaceOnUse" x1="44" y1="0" x2="516" y2="0">
          <stop offset="0%" stopColor="var(--adflex-brand-green)" stopOpacity="0" />
          <stop offset="26%" stopColor="var(--adflex-brand-green)" stopOpacity="0.95" />
          <stop offset="74%" stopColor="#046b60" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#046b60" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="hc-ground" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="540" y2="0">
          <stop offset="0%" stopColor="var(--adflex-brand-slate)" stopOpacity="0" />
          <stop offset="18%" stopColor="var(--adflex-brand-slate)" stopOpacity="0.75" />
          <stop offset="82%" stopColor="var(--adflex-brand-slate)" stopOpacity="0.75" />
          <stop offset="100%" stopColor="var(--adflex-brand-slate)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <ellipse cx="280" cy="212" rx="252" ry="150" fill="url(#hc-glow)" />

      {/* ---- Arc ------------------------------------------------------- */}
      {/* A faint echo above the arc. One line is a connector; two reading as
          one movement is a sweep. It is the cheapest thing in the drawing and
          does the most for how settled it looks. */}
      <path className={styles.echo} d={ARC} transform="translate(0 -30)" />
      <path className={styles.arc} d={ARC} />

      {/* ---- The community --------------------------------------------- */}
      {/* The ground line goes down first, so the buildings sit on it. Without a
          visible ground the three of them read as rounded cards floating in
          space, which is exactly how the first version looked. */}
      <path className={styles.ground} d="M 20 300 H 540" />

      {/* Set 12 units left of the drawing's centre. The two green blocks are far
          heavier than the pale house, so a geometrically centred row sat
          visibly right of centre under the arc. */}
      <g className={styles.town}>
        {/* House. A pitched roof, because the solar panel needs a slope to lie
            on: proud of a flat roof it needs a stand and a shadow to not look
            dropped there, which is three shapes to say the same thing. */}
        <rect className={styles.houseBody} x="131" y="232" width="96" height="68" />
        <path className={styles.roof} d="M 179 186 L 239 232 L 119 232 Z" />
        <rect className={styles.door} x="168" y="268" width="22" height="32" rx="4" />
        <rect className={styles.window} x="145" y="248" width="18" height="18" rx="3" />
        <rect className={styles.window} x="195" y="248" width="18" height="18" rx="3" />

        {/* Solar panel, lying along the right-hand pitch and proud of it by its
            own thickness. The light frame is what stops it reading as a dark
            bracket dropped on the roof. */}
        <path
          className={styles.panel}
          d="M 191 195.2 L 230.6 225.6 L 236.7 217.7 L 197.1 187.3 Z"
        />
        <path
          className={styles.panelCells}
          d="M 204.2 205.3 L 210.3 197.4 M 217.4 215.4 L 223.5 207.5"
        />

        {/* Two community buildings in two depths of the brand green. The window
            grids are the only detail on either: a single glazing strip read as
            a progress bar, and a bare rectangle reads as a rectangle. */}
        <path className={styles.blockDeep} d={block(251, 170, 84, 130)} />
        {WINDOWS_TALL.map(([x, y]) => (
          <rect key={`t${x}-${y}`} className={styles.pane} x={x} y={y} width="12" height="12" rx="2.5" />
        ))}

        <path className={styles.blockMid} d={block(351, 214, 66, 86)} />
        {WINDOWS_MID.map(([x, y]) => (
          <rect key={`m${x}-${y}`} className={styles.pane} x={x} y={y} width="12" height="12" rx="2.5" />
        ))}
      </g>

      {/* ---- The travelling light -------------------------------------- */}
      {/* Drawn as a second copy of the arc rather than as a dash pattern on the
          first: one path cannot be both a continuous line and a moving pulse. */}
      <path className={styles.pulse} d={ARC} pathLength={100} />

      {/* ---- The coordinating point ------------------------------------ */}
      <g className={styles.node} transform="translate(280 112)">
        <circle className={styles.nodePulse} r="13" />
        <circle className={styles.nodePlate} r="13" />
        <circle className={styles.nodeRing} r="13" />
        <circle className={styles.nodeCore} r="4.6" />
      </g>
    </svg>
  );
}
