import Link from "next/link";
import { EmptyState } from "./EmptyState";
import styles from "./AwaitingContent.module.css";

/**
 * Shown when the database could not be read.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS NOT THE "NOTHING PUBLISHED YET" MESSAGE
 * ---------------------------------------------------------------------------
 * A failed read returns an empty list, and an empty list is what a page shows
 * when the project genuinely has published nothing. Using one message for both
 * meant a database that blinked told every visitor that an SEAI-funded project
 * had no news, no events and no outputs. That is a false statement about the
 * project, in the project's own voice, and the standing rule on these routes is
 * that we do not make those.
 *
 * So this says what is actually true — the content exists and cannot be reached
 * right now — and invites the reader to come back. It deliberately does not
 * apologise at length or show an error code: a visitor can do nothing with a
 * stack trace, and the operator has the real reason in the server log.
 *
 * `role="status"` rather than `alert`: it is worth announcing to a screen reader
 * that the page is in a temporary state, but not worth interrupting whatever is
 * being read to do it.
 */
export function TemporarilyUnavailable({ what }: { what: string }) {
  return (
    <div className={styles.body}>
      <div className="adflex-container" role="status">
        <EmptyState
          heading="Temporarily unavailable"
          body={`${what} cannot be loaded at the moment. This is a temporary problem at our end, not a change to the project — please try again shortly.`}
          headingLevel="h2"
        />

        <p className={styles.contact}>
          If it persists,{" "}
          <Link className="adflex-link" href="/contact">
            let the project team know
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
