"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ImageAsset, NavigationItem } from "@/projects/adflex/content";
import { NavLink } from "./NavLink";
import styles from "./AdflexHeader.module.css";

type AdflexHeaderProps = {
  logo: ImageAsset;
  /**
   * Navigation items with hrefs already resolved for the current route — see
   * `resolveNavigation`. When empty the header shows no collapsible menu.
   */
  navigation: readonly NavigationItem[];
  /** Where the logo links to. Anchor on the home page, the home path elsewhere. */
  homeHref?: string;
  /**
   * The address of the site's home page.
   *
   * Was hardcoded as `/` while ADFLEX was served from its own root. It is now
   * at `/adflex`, and with the constant left in, the Home item was never marked
   * as current — so the home page was the one page whose navigation showed no
   * current item at all.
   */
  homePath?: string;
  /** Optional extra link rendered at the end of the navigation. */
  trailingLink?: { label: string; href: string };
  /** Accessible name for the nav landmark. */
  navLabel?: string;
};

const MENU_ID = "adflex-primary-navigation";

/**
 * Sticky site header: official logo on a white surface, navigation on the
 * right. Below the breakpoint a full navigation collapses behind a real
 * button that reports its state with `aria-expanded`, closes on Escape and
 * closes after a link is chosen.
 */
export function AdflexHeader({
  logo,
  navigation,
  homeHref = "#home",
  homePath = "/",
  trailingLink,
  navLabel = "Primary",
}: AdflexHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  /**
   * Condenses the header once the page has moved.
   *
   * At the top of a page the header sits on the hero band with no separation;
   * once content scrolls underneath it needs an edge, or the logo and the copy
   * behind it run together. Read through `requestAnimationFrame` so the scroll
   * handler itself does no layout work, and `passive` so it never delays the
   * scroll.
   */
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setIsScrolled(window.scrollY > 8);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /**
   * Which link represents the page you are on.
   *
   * Only route items qualify. The in-page anchors (Technologies, Consortium,
   * Pilot) are all on the home page, so marking them by pathname would flag
   * four links at once — knowing which section is in view needs scroll
   * tracking, which is a different feature. "Home" is the exception: it is an
   * anchor, but it is also what `/` means.
   */
  const isCurrent = (item: NavigationItem) => {
    if (item.id === "home") return pathname === homePath;
    if (item.kind !== "route") return false;
    return pathname === item.href;
  };

  const items: NavigationItem[] = [
    ...navigation,
    ...(trailingLink
      ? [
          {
            id: "trailing",
            label: trailingLink.label,
            kind: "route" as const,
            href: trailingLink.href,
          },
        ]
      : []),
  ];

  // A single trailing link always fits, so it is never hidden behind a toggle.
  const isCollapsible = navigation.length > 0;

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}
    >
      <div className={`adflex-container ${styles.inner}`}>
        <a className={styles.logoLink} href={homeHref}>
          <Image
            className={styles.logo}
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            sizes="(max-width: 720px) 160px, 220px"
            priority
          />
        </a>

        <nav
          className={styles.nav}
          aria-label={navLabel}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
        >
          {isCollapsible ? (
            <button
              type="button"
              className={`${styles.toggle} ${isOpen ? styles.toggleOpen : ""}`}
              aria-expanded={isOpen}
              aria-controls={MENU_ID}
              onClick={() => setIsOpen((open) => !open)}
            >
              {/* Drawn in CSS rather than pulled from an icon package — three
                  bars that fold into a cross. Decorative: the button's text
                  carries the meaning. */}
              <span className={styles.toggleIcon} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {isOpen ? "Close" : "Menu"}
            </button>
          ) : null}

          <ul
            id={MENU_ID}
            className={[
              styles.navList,
              isCollapsible ? styles.navListCollapsible : "",
              isOpen ? styles.navListOpen : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {items.map((item) => {
              const current = isCurrent(item);
              return (
                <li key={item.id}>
                  <NavLink
                    className={`${styles.navLink} ${current ? styles.navLinkCurrent : ""}`}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={current ? "page" : undefined}
                  >
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
