"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./tabs.module.css";

export type Tab = { href: string; label: string; badge?: ReactNode };

/**
 * Admin navigation.
 *
 * The tabs are passed in rather than listed here, so the set of content types a
 * project manages is decided by the layout — a project with no publications
 * simply does not pass that tab.
 */
export function AdminTabs({ tabs }: { tabs: Tab[] }) {
	const pathname = usePathname();

	// Longest match wins, so /admin/projects does not also light up /admin.
	const active = tabs.reduce<string | null>((best, tab) => {
		const matches = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
		if (!matches) return best;
		return best && best.length >= tab.href.length ? best : tab.href;
	}, null);

	return (
		<nav className={styles.tabs} aria-label="Admin sections">
			<ul>
				{tabs.map((tab) => (
					<li key={tab.href}>
						<Link href={tab.href} aria-current={active === tab.href ? "page" : undefined}>
							{tab.label}
							{tab.badge}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
