"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

type Tab = {
  href: string;
  label: string;
  /** Rendered after the label. Used for the unread-message count. */
  badge?: React.ReactNode;
};

/**
 * The admin section tabs.
 *
 * A client component only because knowing which tab you are on needs
 * `usePathname()`. The layout around it stays a Server Component, so nothing
 * else moves to the client for this.
 *
 * `.tabCurrent` was written for exactly this and never wired up, so all four
 * tabs looked identical on every screen and there was no `aria-current` for a
 * screen reader either. The public header has done both since it was built;
 * this brings the admin in line with it.
 */
export function AdminTabs({ tabs }: { tabs: readonly Tab[] }) {
  const pathname = usePathname();

  /*
   * Exact match, not `startsWith`. "/" as a prefix matches every admin route,
   * so a prefix test would light up Overview on all four pages. None of these
   * has child routes, so exact is also complete.
   */
  const isCurrent = (href: string) => pathname === href;

  return (
    <nav aria-label="Admin sections">
      <ul className={styles.tabs}>
        {tabs.map((tab) => {
          const current = isCurrent(tab.href);
          return (
            <li key={tab.href}>
              <Link
                className={`${styles.tab} ${current ? styles.tabCurrent : ""}`}
                href={tab.href}
                aria-current={current ? "page" : undefined}
              >
                {tab.label}
                {tab.badge}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
