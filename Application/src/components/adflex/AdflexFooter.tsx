import Image from "next/image";
import {
  adflexContent,
  type AdflexContent,
  type ImageAsset,
} from "@/projects/adflex/content";
import styles from "./AdflexFooter.module.css";

type AdflexFooterProps = {
  logo: ImageAsset;
};

/**
 * The LinkedIn glyph, drawn inline rather than pulled from an icon package —
 * an external icon dependency is out of scope for this build.
 *
 * NOTE: this is a rendition of the mark, not LinkedIn's own artwork. LinkedIn
 * publishes official brand assets and its own usage rules; swap this for the
 * supplied file if the project wants to follow them to the letter. Decorative
 * here — the link's visible text carries the meaning.
 */
function LinkedInMark() {
  return (
    <svg
      className={styles.socialIcon}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

/**
 * Site footer on a white surface, so the supplied logo (which has an opaque
 * white background) is never placed on a dark colour.
 *
 * Deliberately minimal: identity and the project's LinkedIn. The site's
 * sections are all reachable from the header, so repeating them
 * here only made the footer tall. Between them sits a reserved row for the
 * funding statement and EU emblem, which renders as soon as
 * `footer.funding` is filled in and stays invisible until then.
 */
export function AdflexFooter({ logo }: AdflexFooterProps) {
  const year = new Date().getFullYear();
  /* Read through the declared contract rather than the `as const` literal.
     Both `funding` and `linkedin.href` are `null` today, and TypeScript narrows
     a const to its initialiser — so without this the two branches below type as
     unreachable and the file stops compiling the moment either value is filled
     in. The slots are meant to be filled in; that must not be a code change. */
  const { funding, linkedin, copyright, organisation } =
    adflexContent.footer as AdflexContent["footer"];

  return (
    <footer className={styles.footer}>
      <div className={`adflex-container ${styles.inner}`}>
        <Image
          className={styles.logo}
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          sizes="200px"
        />

        {/*
         * The funder credit sits between the two, so the top row reads
         * left to right as: whose site this is, who paid for it, where to
         * follow it.
         *
         * The statement comes before the mark in the markup as well as on
         * screen. A screen reader then reads "Funded by SEAI." followed by the
         * logo's alt, "Sustainable Energy Authority of Ireland" — a label and
         * then the name it stands for. The other order announces the full name
         * first and the sentence explaining it second.
         *
         * Still conditional: nothing renders until a statement is approved, and
         * the emblem is separately optional. See docs/OPEN-ITEMS.md.
         */}
        {funding ? (
          <div className={styles.funding}>
            <p className={styles.fundingLabel}>{funding.statement}</p>
            {funding.emblem ? (
              <Image
                className={styles.emblem}
                src={funding.emblem.src}
                alt={funding.emblem.alt}
                width={funding.emblem.width}
                height={funding.emblem.height}
                sizes="164px"
              />
            ) : null}
          </div>
        ) : null}

        {/* A link only once a URL exists. Until then the same block renders as
            plain text — not a link to nowhere, and not a control that looks
            active but is not. */}
        {linkedin.href ? (
          <a
            className={styles.social}
            href={linkedin.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            <LinkedInMark />
            {linkedin.label}
          </a>
        ) : (
          <p className={`${styles.social} ${styles.socialPending}`}>
            <LinkedInMark />
            {linkedin.label}
          </p>
        )}
      </div>

      <div className={`adflex-container ${styles.legal}`}>
        <p className={styles.copyright}>
          © {year} {copyright}
          {organisation ? (
            <>
              {/* A separator, not content: hidden from assistive technology so
                  a screen reader reads "…All rights reserved. Visit IRESI"
                  rather than announcing a vertical bar between them. */}
              <span className={styles.separator} aria-hidden="true">
                |
              </span>
              <a
                className={styles.legalLink}
                href={organisation.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {organisation.label}
              </a>
            </>
          ) : null}
        </p>
        {/*
         * The Privacy, Cookies and Terms links were removed on 13 August 2026:
         * the IRESI deployment publishes no equivalent documents, and linking
         * to policies from one site and not the other is worse than linking to
         * none. The supplied wording is still in `content.ts` under `legal`,
         * unrendered, so restoring the pages is a matter of putting the route
         * back rather than transcribing them again.
         */}
      </div>
    </footer>
  );
}
