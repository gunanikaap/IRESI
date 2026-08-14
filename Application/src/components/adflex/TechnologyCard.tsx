import Image from "next/image";
import type { Technology } from "@/projects/adflex/content";
import styles from "./TechnologyCard.module.css";

type TechnologyCardProps = {
  technology: Technology;
  /** 1-based position, shown as a plain numeric mark. No icon library. */
  index: number;
  /**
   * The first cards on the page are above the fold on wide screens, so their
   * images are worth loading eagerly.
   */
  priority?: boolean;
};

export function TechnologyCard({
  technology,
  index,
  priority = false,
}: TechnologyCardProps) {
  return (
    <article className={styles.card}>
      {technology.image ? (
        <div className={styles.media}>
          {/* alt is empty on purpose — the image illustrates what the heading
              and description below already say in full. */}
          <Image
            className={styles.image}
            src={technology.image.src}
            alt={technology.image.alt}
            width={technology.image.width}
            height={technology.image.height}
            sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 560px"
            priority={priority}
          />
        </div>
      ) : null}

      <div className={styles.body}>
        {/* Decorative: both marks repeat list position only, so they are hidden
            from assistive technology. The oversized one is a watermark behind
            the copy; the small one keeps the number legible. */}
        <span className={styles.ghost} aria-hidden="true">
          {String(index).padStart(2, "0")}
        </span>
        <p className={styles.mark} aria-hidden="true">
          {String(index).padStart(2, "0")}
        </p>
        <h3 className={styles.name}>{technology.name}</h3>
        <p className={styles.description}>{technology.description}</p>
      </div>
    </article>
  );
}
