import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  heading: string;
  body: string;
  /**
   * Heading level, so the block fits whatever it is nested in without skipping
   * a level. `h3` suits a card inside a section that already has an `h2`;
   * a page that places this directly under its `h1` should pass `h2`.
   */
  headingLevel?: "h2" | "h3";
};

/**
 * Intentional empty state, used where content genuinely does not exist yet.
 * It must never be replaced with placeholder publications, dates, DOIs,
 * download buttons or statistics.
 */
export function EmptyState({
  heading,
  body,
  headingLevel: Heading = "h3",
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Heading className={styles.heading}>{heading}</Heading>
      <p className={styles.body}>{body}</p>
    </div>
  );
}
