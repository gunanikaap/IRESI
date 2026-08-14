import Image from "next/image";
import type { Partner } from "@/projects/adflex/content";
import styles from "./PartnerCard.module.css";

type PartnerCardProps = {
  partner: Partner;
};

/**
 * Partner card: the organisation's logo, and nothing else.
 *
 * The supplied logos are very different shapes — three wide wordmarks and one
 * tall crest — so the plate is a fixed box that each logo is fitted into. That
 * is what keeps a row of them optically level; sizing to the artwork instead
 * would leave them at four different visual weights.
 *
 * ---------------------------------------------------------------------------
 * THE NAME MOVED INTO `alt`, AND THAT IS NOT A DETAIL
 * ---------------------------------------------------------------------------
 * The name and the one-line role used to be rendered as text under the logo,
 * and `alt` was empty precisely because of that — repeating the name would have
 * announced it twice. The client asked for logos alone on 6 August 2026, which
 * changes what `alt` has to do: with no text beneath, an empty `alt` would
 * leave a screen reader with four unlabelled pictures and no way to know who is
 * in the consortium at all.
 *
 * So the logo now carries `partner.name`. A partner with no logo yet falls back
 * to their name as real text rather than to bare initials, because initials on
 * their own tell a first-time reader nothing.
 */
export function PartnerCard({ partner }: PartnerCardProps) {
  return (
    // `adflex-light` pins the light palette. The consortium section is light
    // today, but its `tone` is a prop — if it ever becomes a deep band these
    // cards must not follow, because the partner logos are supplied with opaque
    // light backgrounds and cannot sit on a dark colour.
    <article className={`${styles.card} adflex-light`}>
      <div className={styles.plate}>
        {partner.logo ? (
          <Image
            className={styles.logo}
            src={partner.logo.src}
            alt={partner.name}
            width={partner.logo.width}
            height={partner.logo.height}
            sizes="200px"
          />
        ) : (
          <p className={styles.fallbackName}>{partner.name}</p>
        )}
      </div>
    </article>
  );
}
