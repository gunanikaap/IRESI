import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type NavLinkProps = {
  href: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Set to "page" on the link matching the current route. */
  "aria-current"?: "page";
  children: ReactNode;
};

/**
 * Small internal helper shared by the header and footer — not a UI-library
 * component.
 *
 * **Anything with a fragment in it stays a plain `<a>`.** Only fragment-less
 * routes go through `next/link`.
 *
 * Two reasons, and the second is a real bug rather than a preference:
 *
 * 1. For a same-page anchor the browser handles the jump, so the
 *    `scroll-behavior` and `prefers-reduced-motion` rules in globals.css still
 *    apply.
 * 2. For a cross-route anchor — `/#technologies` from `/about`, which is what
 *    `resolveNavigation` produces off the home page — `next/link` **appends**
 *    the fragment instead of replacing it if a previous client navigation
 *    commits between two clicks. Clicking Technologies and then Home about
 *    300ms apart landed on `/#technologies#home`. Faster than that and both
 *    clicks queue before the first commits, so last-one-wins hides it; that is
 *    why it looks intermittent. A plain `<a>` is a normal browser navigation
 *    and the URL is always exactly the href.
 *
 * The cost is a full page load when jumping from a sub-page into a home-page
 * section, which is the correct trade for a URL that cannot come out wrong.
 */
export function NavLink({
  href,
  className,
  onClick,
  "aria-current": ariaCurrent,
  children,
}: NavLinkProps) {
  if (href.includes("#")) {
    return (
      <a
        className={className}
        href={href}
        onClick={onClick}
        aria-current={ariaCurrent}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      className={className}
      href={href}
      onClick={onClick}
      aria-current={ariaCurrent}
    >
      {children}
    </Link>
  );
}
