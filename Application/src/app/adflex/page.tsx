import type { Metadata } from "next";
import Link from "next/link";
import { adflexContent, resolveNavigation } from "@/projects/adflex/content";
import { canonical } from "@/lib/site";
import { getNextUpcomingEvent } from "@/lib/repo";
import { ADFLEX_SITE, ADFLEX_HOME, IRESI_LINK } from "@/projects/adflex/site";
import { AdflexHeader } from "@/components/adflex/AdflexHeader";
import { AdflexHero } from "@/components/adflex/AdflexHero";
import { SectionShell } from "@/components/adflex/SectionShell";
import { TechnologyCard } from "@/components/adflex/TechnologyCard";
import { PartnerCard } from "@/components/adflex/PartnerCard";
import { PilotSection } from "@/components/adflex/PilotSection";
import { AdflexFooter } from "@/components/adflex/AdflexFooter";
import { EventAnnouncement } from "@/components/adflex/EventAnnouncement";
import styles from "./home.module.css";

/**
 * `absolute` because this page sits two layouts deep. The ADFLEX layout's
 * `title.default` would otherwise be slotted into the *root* layout's template
 * and come out as "ADFLEX — Local Energy Flexibility – IRESI at Maynooth
 * University". Child routes are unaffected: they carry their own title and use
 * the ADFLEX layout's template, which is nearer.
 *
 * The canonical address is added here because the root deliberately declares
 * none for anyone to inherit.
 */
export const metadata: Metadata = {
	title: { absolute: adflexContent.meta.title },
	...canonical("/adflex"),
};

/**
 * The ADFLEX public website: one scrolling page of sections. Project Outcomes
 * and Contact each live on their own route — see `src/app/outcomes` and
 * `src/app/contact`.
 *
 * Section order matches the navigation order defined in
 * `src/content/adflex.ts`. All copy comes from that file.
 */
export default async function HomePage() {
  const {
    brand,
    navigation,
    hero,
    about,
    technologies,
    consortium,
    pilot,
  } = adflexContent;

  const nav = resolveNavigation(navigation, { onHome: true });

  /*
   * The next published event that has not happened yet, announced at the bottom
   * of the page. `safeRead` inside means this is `null` with no database, so
   * the home page is unchanged on a deployment that has none.
   */
  const upcomingEvent = await getNextUpcomingEvent(ADFLEX_SITE);
  const aboutGlimpse = about.items.find((item) => item.id === about.home.itemId);

  return (
    <>
      <AdflexHeader
        logo={brand.logo}
        navigation={nav}
        homePath={ADFLEX_HOME}
        trailingLink={IRESI_LINK}
      />

      <main id="main-content">
        <AdflexHero id="home" content={hero} />

        {/* A glimpse of one About item only — the verbatim opening sentence of
            its full text, which lives on /about. The item's own title is not
            repeated here because the section heading already names it. */}
        {/* Split layout: this section is short, and stacked it left most of the
            width empty under a single paragraph. */}
        <SectionShell
          id={about.home.itemId}
          eyebrow={about.eyebrow}
          title={about.home.heading}
          layout="split"
        >
          {aboutGlimpse ? (
            <p className={styles.aboutLead}>{aboutGlimpse.summary}</p>
          ) : null}
          <p className={styles.aboutActions}>
            <Link className="adflex-cta" href={about.cta.href}>
              {about.cta.label}
            </Link>
          </p>
        </SectionShell>

        <SectionShell
          id="technologies"
          eyebrow="What we are building"
          title={technologies.title}
          intro={technologies.intro}
          introFigure={technologies.introFigure}
          tone="band"
        >
          <div className={styles.cardGrid}>
            {technologies.items.map((technology, index) => (
              <TechnologyCard
                key={technology.id}
                technology={technology}
                index={index + 1}
                // The first row can be in view on a tall desktop screen.
                priority={index < 2}
              />
            ))}
          </div>
        </SectionShell>

        {/* Light band: the partner logos need a light ground. */}
        <SectionShell
          id="consortium"
          eyebrow="Who is involved"
          title={consortium.title}
          intro={consortium.intro}
          tone="soft"
        >
          <div className={styles.partnerGrid}>
            {consortium.partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </SectionShell>

        <PilotSection id="pilot" content={pilot} />
      </main>
      <AdflexFooter logo={brand.logo} />

      {upcomingEvent ? <EventAnnouncement event={upcomingEvent} /> : null}
    </>
  );
}
