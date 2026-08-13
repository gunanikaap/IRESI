import type { Metadata } from "next";
import EnquiryForm from "@/components/EnquiryForm";
import { partners, partnersPage } from "@/projects/iresi/content";
import { project } from "@/projects";
import { canonical } from "@/lib/site";
import styles from "./partners.module.css";

export const metadata: Metadata = {
	title: "Partners",
	description:
		"IRESI collaborates with leading industry and research partners across Europe to advance sustainable energy innovation.",
	...canonical("/partners"),
};

/**
 * Logos come at every shape and weight — a wide wordmark beside a square crest,
 * a dark logo beside a pale one. Rather than stretch them to a common size,
 * each sits in a white tile of fixed height and is scaled to fit inside it, so
 * the tiles line up even though the artwork does not.
 */
function LogoGrid({ items }: { items: readonly { name: string; logo: string }[] }) {
	return (
		<ul className={styles.logoGrid}>
			{items.map((partner) => (
				<li key={partner.name} className={styles.logoTile}>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={partner.logo} alt={partner.name} loading="lazy" />
					<span className={styles.logoName}>{partner.name}</span>
				</li>
			))}
		</ul>
	);
}

export default function PartnersPage() {
	return (
		<>
			{/*
			 * The lead photograph is the banner rather than a picture beside the
			 * intro text. It was doing the same job lower down the page and it is
			 * a better banner than a flat gradient.
			 */}
			<section className={styles.hero}>
				<div className="container">
					<h1>Partners</h1>
				</div>
			</section>

			{/*
			 * "Empowering Sustainable Energy Together" leads the page body, which is
			 * where the live site has it — not stacked under the title in the
			 * banner.
			 */}
			<section className="section">
				<div className={`container ${styles.intro}`}>
					<h2 className={styles.introHeading}>{partnersPage.subtitle}</h2>
					{partnersPage.paragraphs.map((paragraph) => (
						<p key={paragraph.slice(0, 40)} className={styles.introLead}>
							{paragraph}
						</p>
					))}

					<h3 className={styles.subHeading}>{partnersPage.collaborationHeading}</h3>
					<p>{partnersPage.collaborationText}</p>
				</div>
			</section>

			<section className="section section--alt">
				<div className="container">
					<div className={styles.groupHead}>
						<span className="eyebrow">Industry</span>
						<h2>Our industry partners</h2>
					</div>
					<LogoGrid items={partners.industry} />

					<div className={`${styles.groupHead} ${styles.groupHeadSpaced}`}>
						<span className="eyebrow">Research</span>
						<h2>Our research partners</h2>
					</div>
					<LogoGrid items={partners.research} />
				</div>
			</section>

			{/*
			 * Join our network, as on the live site: a photograph behind a panel
			 * with the enquiry form in it. It posts to the same action and the same
			 * mailbox as the contact page — only the subject differs, so a
			 * partnership approach is recognisable in the inbox.
			 */}
			<section className="section" id="join">
				<div className="container">
					<div className={styles.join}>
						<div className={styles.joinInner}>
							<h2>{partnersPage.joinHeading}</h2>
							<p className={styles.joinLead}>{partnersPage.joinText}</p>

							<div className={styles.joinForm}>
								<EnquiryForm
									contactEmail={project.contactEmail}
									origin="partners"
									organisation
									phone
									subject={false}
									onDark
									compact
									submitLabel="Send"
								/>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
