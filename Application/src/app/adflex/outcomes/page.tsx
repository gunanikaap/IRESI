import type { Metadata } from "next";
import { adflexContent, resolveNavigation } from "@/projects/adflex/content";
import { canonical } from "@/lib/site";
import { AdflexHeader } from "@/components/adflex/AdflexHeader";
import { AdflexFooter } from "@/components/adflex/AdflexFooter";
import { EmptyState } from "@/components/adflex/EmptyState";
import { PageHero } from "@/components/adflex/PageHero";
import { FindingList, PublicationList } from "@/components/adflex/PublishedList";
import listStyles from "@/components/adflex/PublishedList.module.css";
import { listPublishedFindingsStatus, listPublishedPublicationsStatus } from "@/lib/repo";
import { ADFLEX_SITE, ADFLEX_HOME, IRESI_LINK } from "@/projects/adflex/site";
import styles from "./outcomes.module.css";

const { brand, navigation, outcomes } = adflexContent;

export const metadata: Metadata = {
  title: outcomes.title,
  description: outcomes.pageDescription,
  ...canonical("/adflex/outcomes"),
};

/**
 * Project Outcomes.
 *
 * Editor-managed since 31 July 2026 — findings and publications are written in
 * `/admin/outcomes` and stored in Postgres, so publishing one has to show here
 * without a redeploy. That is why the route renders per request rather than
 * being prerendered.
 *
 * **The empty state is the default, not a fallback.** Both reads go through
 * `safeRead`, so no database, an unreachable database and nothing published yet
 * all land in the same place: the honest "not final" message this page has
 * always shown. The old rule still holds exactly as written — no placeholder
 * publications, dates, DOIs or download links. The difference is only that real
 * ones now arrive from an editor instead of a commit.
 */
export const dynamic = "force-dynamic";

export default async function OutcomesPage() {
  const nav = resolveNavigation(navigation, { onHome: false });

  const [findingsRead, publicationsRead] = await Promise.all([
    listPublishedFindingsStatus(ADFLEX_SITE),
    listPublishedPublicationsStatus(ADFLEX_SITE),
  ]);

  const findings = findingsRead.data;
  const publications = publicationsRead.data;
  const hasContent = findings.length > 0 || publications.length > 0;
  // Either read failing means the page cannot claim the project has published
  // nothing — see TemporarilyUnavailable.
  const degraded = findingsRead.degraded || publicationsRead.degraded;

  return (
    <>
      <AdflexHeader
        logo={brand.logo}
        navigation={nav}
        homeHref={ADFLEX_HOME}
        homePath={ADFLEX_HOME}
        trailingLink={IRESI_LINK}
      />

      <main id="main-content">
        <PageHero eyebrow="Findings and papers" title={outcomes.title} />

        <div className={styles.body}>
          <div className="adflex-container">
            {hasContent ? (
              <>
                {findings.length > 0 ? (
                  <section className={listStyles.section} aria-labelledby="findings-heading">
                    {/* h2 under the page h1, and h3 for each entry inside the
                        lists — the heading order has to stay unbroken now that
                        this page has real sections in it. */}
                    <h2 id="findings-heading" className={listStyles.sectionTitle}>
                      Project findings
                    </h2>
                    <div className={listStyles.sectionList}>
                      <FindingList findings={findings} />
                    </div>
                  </section>
                ) : null}

                {publications.length > 0 ? (
                  <section className={listStyles.section} aria-labelledby="publications-heading">
                    <h2 id="publications-heading" className={listStyles.sectionTitle}>
                      Publications
                    </h2>
                    <div className={listStyles.sectionList}>
                      <PublicationList publications={publications} />
                    </div>
                  </section>
                ) : null}
              </>
            ) : degraded ? (
              <EmptyState
                heading="Temporarily unavailable"
                body="Project outcomes cannot be loaded at the moment. This is a temporary problem at our end, not a change to the project — please try again shortly."
                headingLevel="h2"
              />
            ) : (
              /* h2 because it sits directly under the page h1 — using the
                 default h3 here would skip a heading level. */
              <EmptyState
                heading={outcomes.heading}
                body={outcomes.body}
                headingLevel="h2"
              />
            )}
          </div>
        </div>
      </main>

      <AdflexFooter logo={brand.logo} />
    </>
  );
}


