import Link from "next/link";
import type { AwaitingContentPage } from "@/projects/adflex/content";
import { EmptyState } from "./EmptyState";
import styles from "./AwaitingContent.module.css";

type AwaitingContentProps = {
  page: AwaitingContentPage;
};

/**
 * Body for a route that exists structurally but has no approved content yet —
 * News and Events.
 *
 * It states plainly that nothing is published rather than showing sample
 * entries. A placeholder news post or a specimen privacy policy reads as real
 * the moment someone lands on it, and on a publicly funded project site that is a
 * false statement, not a design detail.
 *
 * The `h2` sits directly under the page `h1` from `PageHero`, so `EmptyState`
 * is told to render at that level rather than its default `h3`.
 */
export function AwaitingContent({ page }: AwaitingContentProps) {
  return (
    <div className={styles.body}>
      <div className="adflex-container">
        <EmptyState heading={page.heading} body={page.body} headingLevel="h2" />

        {/* Points at the contact page rather than opening a mail client.
            A bare `mailto:` assumes a configured desktop mail app, which most
            visitors on a phone or in webmail do not have — the link appeared to
            do nothing. The contact page carries the same address as visible,
            copyable text *and* the form, so it works either way. */}
        <p className={styles.contact}>
          In the meantime,{" "}
          <Link className="adflex-link" href="/contact">
            get in touch with the project team
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
