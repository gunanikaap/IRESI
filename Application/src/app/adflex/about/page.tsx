import type { Metadata } from "next";
import { adflexContent, resolveNavigation } from "@/projects/adflex/content";
import { ADFLEX_HOME, IRESI_LINK } from "@/projects/adflex/site";
import { canonical } from "@/lib/site";
import { AdflexHeader } from "@/components/adflex/AdflexHeader";
import { AdflexFooter } from "@/components/adflex/AdflexFooter";
import { PageHero } from "@/components/adflex/PageHero";
import styles from "./about.module.css";

const { brand, navigation, about } = adflexContent;

export const metadata: Metadata = {
  title: about.title,
  description: about.pageDescription,
  ...canonical("/adflex/about"),
};

/**
 * The full About content. The home page shows the opening sentence of one item
 * and links here for the rest — both read from the same `about.items`, so they
 * cannot drift apart.
 *
 * Each item is an editorial row rather than a card: a numbered heading column
 * beside its paragraph. Three long paragraphs stacked as cards read as a wall;
 * the split gives each one a clear entry point.
 */
export default function AboutPage() {
  const nav = resolveNavigation(navigation, { onHome: false });

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
        <PageHero
          eyebrow={about.eyebrow}
          title={about.title}
          lead={about.pageDescription}
        />

        <div className={styles.body}>
          <div className="adflex-container">
            <div className={styles.items}>
              {about.items.map((item) => (
                <section
                  key={item.id}
                  id={item.id}
                  aria-labelledby={`${item.id}-heading`}
                  className={styles.item}
                >
                  <h2 id={`${item.id}-heading`} className={styles.itemTitle}>
                    {item.title}
                  </h2>
                  <p className={styles.itemBody}>{item.body}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      <AdflexFooter logo={brand.logo} />
    </>
  );
}


