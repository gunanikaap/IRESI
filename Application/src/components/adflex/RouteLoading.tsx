import { adflexContent, resolveNavigation } from "@/projects/adflex/content";
import { ADFLEX_HOME, IRESI_LINK } from "@/projects/adflex/site";
import { AdflexHeader } from "./AdflexHeader";
import { AdflexFooter } from "./AdflexFooter";
import { PageHero } from "./PageHero";
import styles from "./RouteLoading.module.css";

/**
 * The shell shown while a database-backed route is being rendered.
 *
 * `/outcomes` and `/news` stopped being prerendered when their content moved
 * into Postgres, so a click on either now waits for a server round trip. With
 * no `loading.tsx` the browser sits on the old page for that whole time and the
 * site reads as unresponsive — the click appears to have done nothing.
 *
 * The header, hero and footer are rendered for real, because they are known
 * before any query runs. Only the part that depends on the database is a
 * placeholder.
 *
 * ---------------------------------------------------------------------------
 * WHY THE FOOTER IS RENDERED HERE TOO
 * ---------------------------------------------------------------------------
 * It was missing, and that made this shell substantially shorter than the page
 * it stands in for — so the document grew when the content arrived and the
 * whole layout jumped, which is the thing a loading shell exists to prevent.
 * With it, the placeholder and the finished page come out within a few pixels
 * of each other.
 *
 * The height mismatch also used to break scrolling: opening these routes from a
 * scrolled page left the reader part-way down them. That turned out to be a
 * Next scroll-handler bug rather than a height problem, and is fixed by
 * `experimental.appNewScrollHandler` — see the long note in `next.config.ts`.
 * Rendering the footer is worth doing on its own merits regardless.
 */
export function RouteLoading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  const nav = resolveNavigation(adflexContent.navigation, { onHome: false });

  return (
    <>
      {/*
       * These props must match what the real pages pass, exactly.
       *
       * They did not, and it was visible: this shell rendered the header with
       * no trailing IRESI link and with the logo pointing at `/`. Clicking
       * through to News or Outcomes swapped one header for a slightly different
       * one for the length of the load, so the items shifted sideways under the
       * pointer — which reads as hover randomly failing in the header.
       */}
      <AdflexHeader
        logo={adflexContent.brand.logo}
        navigation={nav}
        homeHref={ADFLEX_HOME}
        homePath={ADFLEX_HOME}
        trailingLink={IRESI_LINK}
      />
      <main id="main-content">
        <PageHero eyebrow={eyebrow} title={title} />
        <div className={styles.body}>
          <div className="adflex-container">
            {/* Announced politely rather than assertively: it is a progress
                note, and it must not interrupt whatever a screen reader is
                already saying about the page it just left. */}
            <p className={styles.status} role="status">
              Loading…
            </p>
            <div className={styles.skeleton} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </main>
      <AdflexFooter logo={adflexContent.brand.logo} />
    </>
  );
}
