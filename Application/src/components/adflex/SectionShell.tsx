import type { ReactNode } from "react";
import { FigureText } from "./FigureText";
import styles from "./SectionShell.module.css";

type SectionShellProps = {
  /** Stable section id, kept in sync with the navigation ids in content. */
  id: string;
  title: string;
  /** Small uppercase label above the heading. Decorative, never a heading. */
  eyebrow?: string;
  /**
   * Optional prominent line directly under the heading, inside the head block.
   * Use for something that belongs to the heading — a subject or place name —
   * so it sits tight to it instead of drifting away below the head's margin.
   */
  lead?: ReactNode;
  /** Optional short lead paragraph shown under the section heading. */
  intro?: string;
  /** A phrase inside `intro` to pick out typographically — see `FigureText`. */
  introFigure?: string;
  /**
   * Band treatment. `default` sits on the page colour, `soft` on the soft
   * surface, and `band` is the emphasis band. `band` rebinds the colour tokens,
   * so anything inside it follows without needing styles of its own — and it
   * carries no theme logic, so it works in both themes from one rule.
   */
  tone?: "default" | "soft" | "band";
  /**
   * `stacked` puts the heading above the content. `split` sets the heading
   * beside it, which suits a short section that would otherwise leave most of
   * the width empty.
   */
  layout?: "stacked" | "split";
  children: ReactNode;
};

/**
 * Standard section wrapper: landmark, container, heading and vertical rhythm.
 * `scroll-margin-top` keeps anchored sections clear of the sticky header.
 */
export function SectionShell({
  id,
  title,
  eyebrow,
  lead,
  intro,
  introFigure,
  tone = "default",
  layout = "stacked",
  children,
}: SectionShellProps) {
  const headingId = `${id}-heading`;
  const toneClass =
    tone === "soft" ? styles.soft : tone === "band" ? "adflex-band" : "";

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`${styles.section} ${toneClass}`}
    >
      <div
        className={`adflex-container ${layout === "split" ? styles.split : ""}`}
      >
        {/* The head reveals as one block and the content follows a beat later,
            so a section reads as heading-then-detail rather than as everything
            arriving at once. */}
        <div
          className={layout === "split" ? styles.headSplit : styles.head}
          data-reveal=""
        >
          {eyebrow ? <p className="adflex-eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId} className={styles.title}>
            {title}
          </h2>
          {lead ? <div className={styles.lead}>{lead}</div> : null}
          {intro ? (
            <p className={styles.intro}>
              <FigureText text={intro} figure={introFigure} />
            </p>
          ) : null}
        </div>
        <div
          className={styles.content}
          data-reveal=""
          style={{ "--adflex-reveal-delay": "110ms" } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
