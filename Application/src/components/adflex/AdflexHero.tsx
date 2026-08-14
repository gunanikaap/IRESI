import Image from "next/image";
import type { HeroContent } from "@/projects/adflex/content";
import { HeroCommunity } from "./HeroCommunity";
import { GlossaryTerm } from "./GlossaryTerm";
import { NavLink } from "./NavLink";
import styles from "./AdflexHero.module.css";

type AdflexHeroProps = {
  id: string;
  content: HeroContent;
};

/**
 * Splits the tagline around the first occurrence of the glossary term, so the
 * term can be rendered as an interactive element without the copy being stored
 * as pre-chopped fragments. Falls back to the plain tagline if the term is not
 * found, so a content typo degrades to plain text rather than losing a sentence.
 *
 * `trailing` is any punctuation sitting immediately after the term. The term
 * renders as an inline-block, which is an unbreakable box, so a comma following
 * it can wrap onto the next line on its own — which is what happened at this
 * measure. Pulling that punctuation out lets it be tied to the term with
 * `white-space: nowrap` instead of being left to strand.
 */
/**
 * The id tying the glossary term to its definition below the tagline.
 *
 * A constant rather than `useId()` because the hero is a Server Component and
 * there is exactly one on a page — the home page's `#home` section. If a second
 * hero with a glossary term ever appears on the same document, this has to
 * become a generated id or the two will collide.
 */
const GLOSSARY_DESCRIPTION_ID = "hero-glossary-definition";

function splitTagline(tagline: string, term: string) {
  const start = tagline.indexOf(term);
  if (start === -1) return null;
  const rest = tagline.slice(start + term.length);
  const trailing = rest.match(/^[,.;:!?)\]]+/)?.[0] ?? "";
  return {
    before: tagline.slice(0, start),
    trailing,
    after: rest.slice(trailing.length),
  };
}

/**
 * Hero: copy and call to action on the left, a decorative illustration on the
 * right, then the full-width project diagram with its caption below.
 *
 * Split rather than a single left column: at desktop width the text measure
 * tops out around 24ch, which left the right-hand half of the band empty. The
 * illustration fills it with a small energy community and one shared arc of
 * energy passing over it, without duplicating anything the diagram already
 * says. It is decorative and hidden from assistive technology; the supplied
 * diagram underneath is the one that carries the content.
 *
 * The standalone logo is deliberately not repeated here — it is already in the
 * header and inside the diagram itself.
 *
 * Reveal delays step down the left column so the tags, headline, tagline and
 * action arrive in reading order rather than all at once.
 */
export function AdflexHero({ id, content }: AdflexHeroProps) {
  const tagline = splitTagline(content.tagline, content.glossary.term);

  return (
    <section
      id={id}
      aria-labelledby="hero-heading"
      className={`${styles.hero} adflex-band`}
    >
      <div className={`adflex-container ${styles.split}`}>
        <div className={styles.copy}>
          <ul
            className={`adflex-tag-list ${styles.tags}`}
            data-reveal=""
            style={{ "--adflex-reveal-delay": "0ms" } as React.CSSProperties}
          >
            {content.tags.map((tag) => (
              <li key={tag} className="adflex-tag">
                {tag}
              </li>
            ))}
          </ul>

          <h1
            id="hero-heading"
            className={styles.headline}
            data-reveal=""
            style={{ "--adflex-reveal-delay": "80ms" } as React.CSSProperties}
          >
            {content.headline}
          </h1>

          <p
            className={styles.tagline}
            data-reveal=""
            style={{ "--adflex-reveal-delay": "160ms" } as React.CSSProperties}
          >
            {tagline ? (
              <>
                {tagline.before}
                {/* Term and its following punctuation kept on one line. */}
                <span className={styles.termGroup}>
                  <GlossaryTerm
                    term={content.glossary.term}
                    definition={content.glossary.definition}
                    descriptionId={GLOSSARY_DESCRIPTION_ID}
                  />
                  {tagline.trailing}
                </span>
                {tagline.after}
              </>
            ) : (
              content.tagline
            )}
          </p>

          {/*
           * The glossary definition, in its own reserved slot.
           *
           * It used to be a popup floating out of the word itself, which landed
           * on top of the next two lines of the tagline — hovering the term hid
           * the sentence you were reading it in.
           *
           * This element is always laid out; only its visibility changes. So
           * nothing is ever covered, and nothing moves when it appears or goes:
           * the actions below sit at the same place whether it is showing or
           * not. `visibility: hidden` rather than `display: none` is what
           * reserves that space, and a node referenced by `aria-describedby`
           * still describes the term either way.
           */}
          <p
            id={GLOSSARY_DESCRIPTION_ID}
            role="tooltip"
            className={styles.glossaryDefinition}
          >
            {content.glossary.definition}
          </p>

          <div
            className={styles.actions}
            data-reveal=""
            style={{ "--adflex-reveal-delay": "240ms" } as React.CSSProperties}
          >
            {/* NavLink so each action works whether it points at a section
                anchor or at a route of its own. */}
            <NavLink className="adflex-cta" href={content.cta.href}>
              {content.cta.label}
            </NavLink>
            {content.secondaryCta ? (
              <NavLink
                className="adflex-cta-quiet"
                href={content.secondaryCta.href}
              >
                {content.secondaryCta.label}
              </NavLink>
            ) : null}
          </div>
        </div>

        <div
          className={styles.figureCol}
          data-reveal=""
          style={{ "--adflex-reveal-delay": "160ms" } as React.CSSProperties}
        >
          <HeroCommunity />
        </div>
      </div>

      <div
        className={`adflex-container ${styles.diagramWrap}`}
        data-reveal=""
      >
        <figure className={styles.figure}>
          {/* Displayed at its full intrinsic ratio so no label is cropped, and
              no text is placed over it. */}
          <Image
            className={styles.diagram}
            src={content.diagram.src}
            alt={content.diagram.alt}
            width={content.diagram.width}
            height={content.diagram.height}
            sizes="(max-width: 1200px) 100vw, 1160px"
            priority
          />
          <figcaption className={styles.caption}>
            {content.diagram.caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
