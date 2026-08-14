"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { project } from "@/projects";
import styles from "./SiteHeader.module.css";

/**
 * The site header, built entirely from the active project's `nav` config.
 *
 * Nothing here knows which project it is rendering. Swapping `ACTIVE_PROJECT`
 * swaps the logo, the links and the theme without touching this file.
 */
export default function SiteHeader() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	// Normalised so "/team" and "/team/" both mark Team as current.
	const path = pathname.replace(/\/+$/, "") || "/";
	const isCurrent = (href: string) =>
		href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

	return (
		<header className={styles.header}>
			<div className={`container ${styles.inner}`}>
				<Link className={styles.brand} href="/" aria-label={`${project.name} home`}>
					{/* eslint-disable-next-line @next/next/no-img-element -- the logo is a
					    fixed-height PNG served from /public; next/image would add a request
					    to an optimiser for no benefit at this size. */}
					<img src={project.logo.header} alt={project.name} width={252} height={56} />
				</Link>

				<button
					className={styles.toggle}
					type="button"
					aria-expanded={open}
					aria-controls="primary-nav"
					aria-label="Toggle navigation menu"
					onClick={() => setOpen((v) => !v)}
				>
					<span />
					<span />
					<span />
				</button>

				{/* Closing on click rather than on a pathname effect: the menu should
				    shut when someone chooses something, and reacting to the new path
				    instead means a render pass that React rightly warns about. */}
				<nav
					id="primary-nav"
					className={`${styles.nav} ${open ? styles.navOpen : ""}`}
					aria-label="Primary"
					onClick={(event) => {
						if ((event.target as HTMLElement).closest("a")) setOpen(false);
					}}
				>
					<ul>
						{project.nav.map((link) => (
							<li key={link.href} className={link.children ? styles.hasChildren : undefined}>
								<Link href={link.href} aria-current={isCurrent(link.href) ? "page" : undefined}>
									{link.label}
								</Link>
								{link.children && (
									<ul className={styles.submenu}>
										{link.children.map((child) => (
											<li key={child.href}>
												<Link
													href={child.href}
													aria-current={isCurrent(child.href) ? "page" : undefined}
												>
													{child.label}
												</Link>
											</li>
										))}
									</ul>
								)}
							</li>
						))}
					</ul>
				</nav>
			</div>
		</header>
	);
}
