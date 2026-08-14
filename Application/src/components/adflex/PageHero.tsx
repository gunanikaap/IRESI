import styles from "./PageHero.module.css";

type PageHeroProps = {
  /** Small uppercase label above the heading. Decorative, never a heading. */
  eyebrow?: string;
  title: string;
  /** Optional lead paragraph under the heading. */
  lead?: string;
};

/**
 * Opening band for the simple routes — About, Contact, Project Outcomes.
 *
 * Deep, like the home page hero, so a visitor arriving on a sub-page lands in
 * the same site rather than on a plain white page. Shared rather than repeated
 * per route, so the three cannot drift apart.
 *
 * Carries the page's single `h1`.
 */
export function PageHero({ eyebrow, title, lead }: PageHeroProps) {
  return (
    <div className={`${styles.hero} adflex-band`}>
      <div className="adflex-container">
        {eyebrow ? <p className="adflex-eyebrow">{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </div>
    </div>
  );
}
