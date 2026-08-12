import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { partners, partnersPage } from "@/projects/iresi/content";
import { canonical } from "@/lib/site";
import shared from "../shared.module.css";

export const metadata: Metadata = {
	title: "Partners",
	description:
		"IRESI collaborates with leading industry and research partners across Europe to advance sustainable energy innovation.",
	...canonical("/partners"),
};

export default function PartnersPage() {
	return (
		<>
			<PageHero title="Partners" subtitle={partnersPage.subtitle} />

			<section className="section">
				<div className={`container ${shared.splitGrid}`}>
					<div>
						{partnersPage.paragraphs.map((paragraph) => (
							<p key={paragraph.slice(0, 40)}>{paragraph}</p>
						))}
						<h2 className={shared.sectionHeading}>{partnersPage.collaborationHeading}</h2>
						<p>{partnersPage.collaborationText}</p>
					</div>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={partnersPage.leadImage} alt="" width={800} height={533} loading="lazy" />
				</div>
			</section>

			<section className="section section--alt">
				<div className="container">
					<h2>Our Industry Partners</h2>
					<ul className={shared.logoGrid}>
						{partners.industry.map((partner) => (
							<li key={partner.name}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={partner.logo} alt={partner.name} loading="lazy" />
							</li>
						))}
					</ul>

					<h2 className={shared.sectionHeading}>Our Research Partners</h2>
					<ul className={shared.logoGrid}>
						{partners.research.map((partner) => (
							<li key={partner.name}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={partner.logo} alt={partner.name} loading="lazy" />
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="section">
				<div className={`container ${shared.narrow}`}>
					<h2>{partnersPage.joinHeading}</h2>
					<p className="lead">{partnersPage.joinText}</p>
					<Link className="button" href="/contact">
						Get in touch
					</Link>
				</div>
			</section>
		</>
	);
}
