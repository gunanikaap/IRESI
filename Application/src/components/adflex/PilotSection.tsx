import Image from "next/image";
import type { PilotContent } from "@/projects/adflex/content";
import { FigureText } from "./FigureText";
import { SectionShell } from "./SectionShell";
import styles from "./PilotSection.module.css";

type PilotSectionProps = {
  id: string;
  content: PilotContent;
};

/**
 * Pilot section.
 *
 * Stacked rather than split into two columns: banner, then the narrative, then
 * the assets. The narrative and the seven-item asset list are wildly different
 * lengths, so sitting them side by side left one column running far past the
 * other. Stacking removes the mismatch and gives the assets room to breathe as
 * a grid instead of a cramped sidebar.
 *
 * Only information present in the supplied pilot description is shown — no
 * pilot statistics or results are invented.
 */
export function PilotSection({ id, content }: PilotSectionProps) {
  return (
    <SectionShell
      id={id}
      eyebrow="Where it is being proven"
      title={content.title}
      // The place name belongs to "Pilot", so it sits inside the head. Given
      // its own block below it read as a second, competing heading.
      lead={<h3 className={styles.subtitle}>{content.subtitle}</h3>}
      tone="band"
    >
      {/* Image beside the narrative rather than as a full-width banner. At full
          width it ran 626px tall and swamped the section; here it is a little
          over half that, and the two columns finish within a few pixels of each
          other. */}
      <div className={styles.split}>
        {content.image ? (
          <figure className={styles.banner}>
            {/* alt is empty on purpose — this illustrates the kind of community
                the pilot covers, which the paragraph beside it states in
                full. */}
            <Image
              className={styles.bannerImage}
              src={content.image.src}
              alt={content.image.alt}
              width={content.image.width}
              height={content.image.height}
              sizes="(max-width: 900px) 100vw, 620px"
            />
          </figure>
        ) : null}

        <p className={styles.text}>
          <FigureText text={content.body} figure={content.bodyFigure} />
        </p>
      </div>

      <div className={styles.assetsBlock}>
        <h3 className={styles.assetsTitle}>Assets and programmes involved</h3>
        <ul className={styles.assetGrid}>
          {content.assets.map((asset) => (
            <li key={asset.id} className={styles.asset}>
              {asset.icon ? (
                // A small 3:2 thumbnail beside the label, not a square glyph:
                // the supplied files are 1536×1024 artworks on their own opaque
                // grounds, and three of the seven are wide scenes that a square
                // centre crop cuts off at both ends.
                <span className={styles.assetMedia}>
                  <Image
                    className={styles.assetImage}
                    src={asset.icon.src}
                    alt={asset.icon.alt}
                    width={asset.icon.width}
                    height={asset.icon.height}
                    // Matches the rendered box. It was asking for 270px-wide
                    // renditions of images now painted at 104px.
                    sizes="(max-width: 520px) 84px, 104px"
                  />
                </span>
              ) : null}
              <span className={styles.assetLabel}>{asset.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
