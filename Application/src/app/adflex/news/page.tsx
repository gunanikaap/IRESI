import type { Metadata } from "next";
import { adflexContent, resolveNavigation } from "@/projects/adflex/content";
import { canonical } from "@/lib/site";
import { AdflexHeader } from "@/components/adflex/AdflexHeader";
import { AdflexFooter } from "@/components/adflex/AdflexFooter";
import { PageHero } from "@/components/adflex/PageHero";
import { AwaitingContent } from "@/components/adflex/AwaitingContent";
import { TemporarilyUnavailable } from "@/components/adflex/TemporarilyUnavailable";
import { NewsList } from "@/components/adflex/PublishedList";
import listStyles from "@/components/adflex/PublishedList.module.css";
import newsStyles from "./news.module.css";
import { isEvent, listPublishedNewsStatus } from "@/lib/repo";
import { ADFLEX_SITE, ADFLEX_HOME, IRESI_LINK } from "@/projects/adflex/site";

const { brand, navigation, news } = adflexContent;

export const metadata: Metadata = {
  title: news.title,
  description: news.pageDescription,
  ...canonical("/adflex/news"),
};

/**
 * News & Events.
 *
 * One route, not two. News and Events were separate pages until 30 July 2026;
 * both were empty, so the navigation offered a visitor two dead ends instead of
 * one.
 *
 * Editor-managed since 31 July 2026. `AwaitingContent` is still here and still
 * the default: the read goes through `safeRead`, so a missing database, an
 * unreachable one, or nothing published yet all show the same honest empty
 * state. **It must stay that way** — the standing rule on this route is that a
 * placeholder post or an invented event date reads as real the moment someone
 * lands on it, and on a publicly funded project site that is a false statement
 * rather than a design detail.
 */
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const nav = resolveNavigation(navigation, { onHome: false });
  const { data: items, degraded } = await listPublishedNewsStatus(ADFLEX_SITE);

  /*
   * News and events are stored in one table and shown in two sections.
   *
   * They are genuinely different things to a reader — an event is something to
   * turn up to on a date, a news post is something that already happened — and
   * interleaving them by date buried the next event among older announcements.
   *
   * A section only appears when it has entries, so the page never shows an
   * "Events" heading above nothing.
   */
  // Both event kinds sit under one Events heading; an upcoming one is still an
  // event to a reader, and splitting them would give the page three sections.
  const events = items.filter((item) => isEvent(item.kind));
  const posts = items.filter((item) => item.kind === "news");

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
        <PageHero eyebrow={news.eyebrow} title={news.title} />

        {items.length > 0 ? (
          <div className={newsStyles.body}>
            {/*
              * Events lead, then News. Fixed, not a setting — a switch for this
              * was built on 8 August 2026 and removed the next day: the useful
              * thing to arrange turned out to be entries within a list, not the
              * lists themselves, which is what the Order field does.
              *
              * Within Events, upcoming ones come first and events already held
              * follow. Both stay under one heading: an upcoming event is still
              * an event to a reader, and a third heading would split the page
              * into three lists that are often one or two entries each.
              */}
            <div className="adflex-container">
              {events.length > 0 ? (
                <section className={listStyles.section} aria-labelledby="events-heading">
                  <h2 id="events-heading" className={listStyles.sectionTitle}>
                    Events
                  </h2>
                  <div className={listStyles.sectionList}>
                    <NewsList items={events} />
                  </div>
                </section>
              ) : null}

              {posts.length > 0 ? (
                <section className={listStyles.section} aria-labelledby="news-heading">
                  <h2 id="news-heading" className={listStyles.sectionTitle}>
                    News
                  </h2>
                  <div className={listStyles.sectionList}>
                    <NewsList items={posts} />
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        ) : degraded ? (
          <TemporarilyUnavailable what="News and events" />
        ) : (
          <AwaitingContent page={news} />
        )}
      </main>
      <AdflexFooter logo={brand.logo} />
    </>
  );
}

