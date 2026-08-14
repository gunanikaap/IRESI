/*
 * ADFLEX site content, ported from the ADFLEX repository.
 *
 * Two things changed on the way in, both because ADFLEX is served from a
 * subpath of this deployment rather than from its own root:
 *
 *   - asset paths are under /adflex/images, so the two sites' public trees
 *     cannot collide;
 *   - internal hrefs are rebased onto /adflex, baked in here rather than
 *     prefixed at render time so that no consumer has to remember a helper.
 *
 * Nothing else is edited. Keeping this a near-copy is what makes it possible to
 * diff against the ADFLEX repository when its copy changes.
 */
/**
 * Single source of truth for all ADFLEX project copy.
 *
 * Every paragraph on the public website comes from this file. Copy is taken
 * from the supplied `ADFLEX_Website_content.pdf` (see docs/CONTENT-SOURCE.md).
 * No ADFLEX facts, statistics, partner details, publications or funding
 * details may be added here unless they have been supplied and approved.
 *
 * To change the website copy, edit this file only — components read it through
 * props and must not hard-code project paragraphs.
 */

export type NavigationItem = {
  /**
   * Stable id. For a `section` item this is also the id of the section element
   * on the home page.
   */
  id: string;
  label: string;
  /**
   * `section` — an anchor on the home page, e.g. `#technologies`.
   * `route` — a page of its own, e.g. `/contact`.
   */
  kind: "section" | "route";
  href: string;
};

export type ImageAsset = {
  src: string;
  alt: string;
  /** Intrinsic pixel size of the supplied file, used to preserve aspect ratio. */
  width: number;
  height: number;
};

export type HeroContent = {
  tags: readonly string[];
  headline: string;
  tagline: string;
  /**
   * A term inside `tagline` that carries its definition inline.
   *
   * `term` must appear verbatim in `tagline`; the hero splits the tagline
   * around its first occurrence. If it does not match, the tagline still
   * renders in full, just without the interactive term.
   */
  glossary: { term: string; definition: string };
  cta: { label: string; href: string };
  /**
   * Optional second action, shown beside the primary one as a quieter button.
   * Omit it rather than inventing somewhere for it to go.
   */
  secondaryCta?: { label: string; href: string };
  /**
   * The system diagram. Its labels are not repeated as visible text — `alt`
   * is therefore the only place the diagram's parts are named, so keep it
   * complete if the image ever changes.
   */
  diagram: ImageAsset & { caption: string };
};

export type AboutItem = {
  id: string;
  title: string;
  /**
   * The glimpse shown on the home page. This must stay a verbatim extract from
   * the opening of `body` — shorten by cutting, never by rewriting, so the home
   * page and the About page cannot drift apart or introduce unapproved wording.
   */
  summary: string;
  /** The full supplied paragraph, shown on /about. */
  body: string;
};

export type AboutContent = {
  /**
   * Small uppercase label above the heading on /about. Stored in sentence case;
   * `.adflex-eyebrow` applies the uppercasing.
   */
  eyebrow: string;
  /** Heading for the /about page. */
  title: string;
  /** Meta description for the /about route. */
  pageDescription: string;
  /** What the home page shows: its own heading, and which item to glimpse. */
  home: { heading: string; itemId: string };
  /** Link from the home page glimpse through to the full page. */
  cta: { label: string; href: string };
  items: readonly AboutItem[];
};

export type Technology = {
  id: string;
  name: string;
  description: string;
  /**
   * Illustrative image shown at the top of the card. Optional, so a technology
   * can be added before its artwork exists.
   *
   * `alt` is empty by design: these are illustrations of a concept that the
   * card's own heading and description already state in full, so describing
   * them again would only add noise for screen-reader users. If a future image
   * carries information that is not in the text, give it real alt text.
   */
  image?: ImageAsset;
};

export type Partner = {
  id: string;
  /**
   * The organisation's name.
   *
   * Not rendered as visible text since the consortium cards became logos only,
   * but **not decorative either**: `PartnerCard` uses it as the logo's `alt`,
   * so it is the only thing a screen reader has to identify the partner. Keep
   * it accurate.
   *
   * There is deliberately no `role` field. The one-line roles were taken off
   * the cards on 6 August 2026 at the client's request; the supplied wording is
   * preserved in a comment beside `partners` below. Restoring them means adding
   * the field *and* rendering it again — an orphan field that silently rendered
   * nowhere would be worse than none.
   */
  name: string;
  /**
   * The partner's official logo. Add this only when the partner (or the project
   * coordinator) has supplied the file and confirmed it may be used. Put the
   * file in `public/images/partners/` and record its intrinsic pixel size here
   * so the aspect ratio is preserved. Never use a logo taken from a web search
   * or a search-result thumbnail.
   */
  logo?: ImageAsset;
};

export type ConsortiumContent = {
  title: string;
  /**
   * There is no `introFigure` here on purpose. The emphasised phrase was the
   * partner count ("three partners"), removed on 6 August 2026 at the client's
   * request. A count in the intro has to be re-edited every time the consortium
   * changes, which is exactly what went stale when IRESI was added.
   */
  intro: string;
  partners: readonly Partner[];
};

export type PilotAsset = {
  id: string;
  /** Named in the supplied pilot description. */
  label: string;
  /**
   * Optional icon. `alt` is empty by design — the label sits next to it, so
   * announcing the icon as well would only repeat the label.
   */
  icon?: ImageAsset;
};

export type PilotContent = {
  title: string;
  subtitle: string;
  body: string;
  /**
   * A phrase inside `body` given typographic emphasis — see `FigureText`.
   * Must appear verbatim in `body`. This is the community size, the only hard
   * number ADFLEX has supplied.
   */
  bodyFigure?: string;
  /** Assets and programmes named in the supplied pilot description. */
  assets: readonly PilotAsset[];
  /**
   * Illustrative image for the section. Optional.
   *
   * `alt` is empty by design: it is an illustration of the kind of community
   * the pilot covers, and the paragraph beside it already states that in full.
   * It is not a photograph of the pilot site — see docs/CONTENT-SOURCE.md.
   */
  image?: ImageAsset;
};

export type OutcomesContent = {
  title: string;
  /** Meta description for the /outcomes route. */
  pageDescription: string;
  heading: string;
  body: string;
};

export type ContactDetails = {
  title: string;
  /** Short lead shown under the heading on the contact page. */
  intro: string;
  /** Meta description for the /contact route. */
  pageDescription: string;
  email: string;
  organisation: string;
  addressLines: readonly string[];
};

export type BrandAssets = {
  logo: ImageAsset;
};

/**
 * A route that exists structurally but has no approved content yet.
 *
 * These render a visible, deliberate empty state — never dummy items. A
 * placeholder news post or a specimen privacy policy is a false statement about
 * a publicly funded research project the moment anyone reads it, so the page
 * says plainly that the content is not published rather than pretending it is.
 */
export type AwaitingContentPage = {
  slug: string;
  /** Small uppercase label above the heading. */
  eyebrow: string;
  title: string;
  /** Meta description for the route. */
  pageDescription: string;
  /** Heading of the empty state. */
  heading: string;
  /** Body of the empty state. */
  body: string;
};

/**
 * One block of a legal document.
 *
 * Legal text is structured rather than stored as one blob of markup, so the
 * supplied wording stays plain data that can be checked against the source
 * document line by line. There is no Markdown or HTML parsing anywhere in this
 * file: a string here is exactly the string that renders.
 *
 * Email addresses and bare `www.` domains inside `text` are turned into links
 * at render time — see `LegalDocument`. Nothing else is interpreted.
 */
export type LegalBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  /** Bulleted where `ordered` is absent, numbered where it is true. */
  | { kind: "list"; ordered?: boolean; items: readonly string[] }
  | { kind: "table"; caption: string; head: readonly string[]; rows: readonly (readonly string[])[] };

/**
 * A legal page whose wording has been supplied.
 *
 * `blocks` must reproduce the supplied document verbatim. Wording here is not
 * ours to edit, shorten or tidy: if something in it is wrong or out of date,
 * that is a question for whoever carries the liability, not a code change.
 * Square-bracketed placeholders in the source are left exactly as supplied so
 * they stay visible rather than being quietly invented — see docs/OPEN-ITEMS.md.
 */
export type LegalPage = {
  slug: string;
  eyebrow: string;
  title: string;
  pageDescription: string;
  /** Shown above the text, naming the source document and its status. */
  status: string;
  blocks: readonly LegalBlock[];
};

export type AdflexContent = {
  meta: { title: string; description: string; skipLinkLabel: string };
  /** Copy for the 404 page. States what happened and offers a way back. */
  notFound: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: { label: string; href: string };
  };
  brand: BrandAssets;
  navigation: readonly NavigationItem[];
  hero: HeroContent;
  about: AboutContent;
  technologies: {
    title: string;
    intro: string;
    /**
     * A phrase inside `intro` given typographic emphasis — see `FigureText`.
     * Must appear verbatim in `intro`.
     */
    introFigure?: string;
    items: readonly Technology[];
  };
  consortium: ConsortiumContent;
  pilot: PilotContent;
  outcomes: OutcomesContent;
  contact: ContactDetails;
  /** News and events, on one route. Merged from two on 30 July 2026. */
  news: AwaitingContentPage;
  /**
   * Privacy, cookies and terms. Rendered by the `/legal/[slug]` route.
   *
   * Filled on 30 July 2026 from the supplied ADFLEX_Legal_Pages_Draft_v2.docx.
   * The wording is reproduced verbatim, including its square-bracketed
   * placeholders — see docs/OPEN-ITEMS.md for what is still outstanding in it.
   */
  legal: {
    eyebrow: string;
    pages: readonly LegalPage[];
  };
  /**
   * Contact form. Built as a reviewable template; there is no backend, so the
   * fields and the submit control are disabled and the page says so.
   */
  contactForm: {
    title: string;
    pendingNote: string;
    submitLabel: string;
    fields: readonly {
      id: string;
      label: string;
      type: "text" | "email" | "textarea";
      autoComplete?: string;
    }[];
  };
  /**
   * Footer. Deliberately small: every section of the site is reachable from
   * the header, so the footer carries identity, funding attribution and the
   * legal links rather than repeating the navigation.
   */
  footer: {
    /**
     * Funding programme, grant number and disclaimer. Not supplied or
     * approved, so the row is not rendered at all — see docs/OPEN-ITEMS.md.
     * Filling this in publishes it; no layout change is needed.
     */
    funding: {
      /** The approved statement, verbatim. Do not paraphrase it. */
      statement: string;
      /** Approved emblem artwork. Omit until an approved file is supplied. */
      emblem?: ImageAsset;
    } | null;
    linkedin: {
      label: string;
      /**
       * Supplied by the project team. While it is `null` the block renders as
       * plain text instead of a link, so the site never ships a dead one.
       */
      href: string | null;
    };
    /** Follows "© <year> " on the legal line. */
    copyright: string;
    /**
     * The organisation behind ADFLEX, linked from the legal line. Optional, so
     * the line renders as the copyright alone if it is ever removed.
     */
    organisation?: { label: string; href: string };
  };
};

export const adflexContent = {
  meta: {
    title: "ADFLEX — Local Energy Flexibility",
    description:
      "ADFLEX develops and validates a digital framework that helps Sustainable Energy Communities in mixed-use buildings provide flexibility and take part in local energy markets, piloted in Ringsend, Dublin.",
    skipLinkLabel: "Skip to main content",
  },

  /*
   * Deliberately plain. A 404 is usually a moved page or a mistyped address,
   * not a fault the reader caused, so the copy says what happened and points
   * back to the site rather than apologising or being clever about it.
   */
  notFound: {
    eyebrow: "Page not found",
    title: "We could not find that page",
    lead: "The address may have changed, or it may have been typed incorrectly. The main sections of the ADFLEX website are in the navigation above.",
    cta: { label: "Go to the ADFLEX home page", href: "/adflex" },
  },

  brand: {
    logo: {
      src: "/adflex/images/adflex/adflex-logo.png",
      alt: "ADFLEX — Local Energy Flexibility",
      width: 3790,
      height: 1148,
    },
  },

  // Navigation order must match the visible order of the sections on the home
  // page, with any `route` items in the position they belong in the journey.
  navigation: [
    { id: "home", label: "Home", kind: "section", href: "#home" },
    { id: "about", label: "About", kind: "route", href: "/adflex/about" },
    {
      id: "technologies",
      label: "Technologies",
      kind: "section",
      href: "#technologies",
    },
    { id: "consortium", label: "Consortium", kind: "section", href: "#consortium" },
    { id: "pilot", label: "Pilot", kind: "section", href: "#pilot" },
    {
      id: "outcomes",
      label: "Outcomes",
      kind: "route",
      href: "/adflex/outcomes",
    },
    // The label matches the page heading. It is the longest item in the bar, so
    // re-measure the 1080px collapse breakpoint in AdflexHeader.module.css if
    // anything else is added.
    { id: "news", label: "News and Events", kind: "route", href: "/adflex/news" },
    // The ADFLEX contact page was removed on 13 August 2026, and the navigation
    // item with it: this deployment already has a contact page at /contact,
    // reachable from the IRESI link at the end of this bar. Two forms writing to
    // the same mailbox is a maintenance cost with no reader benefit.
  ],

  hero: {
    // SEAI, not EU. The supplied legal text states it plainly: "ADFLEX is a
    // research project funded by SEAI under the National Energy RD&D Funding
    // Programme". The earlier "EU-Funded Project" tag was wrong.
    tags: ["SEAI-Funded Project", "Energy Flexibility", "Digital Integration"],
    headline:
      "ADFLEX — Advanced Demonstrators for Flexibility and Local Energy Exchange in Sustainable Energy Communities",
    tagline:
      "Turning community buildings into flexumers, prosumers and flexible energy users, who together help balance a smarter, cleaner grid.",
    // The supplied copy asked for this definition as muted text on its own line
    // beneath the tagline, explicitly "not a tooltip or footnote, since those
    // get missed". It was moved inline at the client's request after the first
    // build — see docs/CONTENT-SOURCE.md. The wording itself is unchanged.
    glossary: {
      term: "flexumers",
      definition:
        "A flexumer is a household or building that both uses and shares its energy flexibility with the grid.",
    },
    // Project Outcomes lives at /outcomes, so this is a route rather than an
    // anchor. The label is the supplied wording and is unchanged.
    // Was "See Pilot Results" → /outcomes. That page is still the empty
    // "awaiting content" state, so the hero's main action promised results and
    // delivered nothing. Both actions now point at sections that have real
    // content today.
    cta: { label: "Explore the pilot", href: "#pilot" },
    secondaryCta: { label: "How ADFLEX works", href: "#technologies" },
    diagram: {
      // Kept as PNG rather than re-encoded to JPEG like the photographic
      // imagery: this diagram carries fine light text on a dark background,
      // where JPEG ringing would show. next/image still serves it as WebP.
      src: "/adflex/images/adflex/adflex-system-concept.png",
      alt: "ADFLEX system concept. Digital Spine middleware sits at the centre, linked to rooftop solar PV and battery, a heat pump, an immersion heater and an EV charger, and to a digital twin, an aggregator in a market role, ESB Networks as distribution system operator, and the main grid. Red arrows show power flow and blue arrows show data and control signals.",
      width: 1672,
      height: 941,
      caption:
        "Red arrows represent power flow. Blue arrows represent data and control signals.",
    },
  },

  // /about shows every item in full. The home page shows a glimpse of just one
  // of them — `home.itemId` — and links through.
  //
  // Every item keeps a `summary` even though only one is currently shown, so
  // the home page can be pointed at a different item without new copy. Each
  // summary is the verbatim opening sentence of its own `body`: shorten by
  // cutting, never by rewriting.
  about: {
    // Rendered uppercase by `.adflex-eyebrow`, so it is stored in sentence case
    // like every other eyebrow on the site.
    eyebrow: "The project",
    title: "About ADFLEX",
    pageDescription:
      "What ADFLEX sets out to do, the impact it aims for, and the Digital Spine and digital twin that make it possible.",
    home: { heading: "Objective of ADFLEX", itemId: "objective" },
    cta: { label: "Know more about ADFLEX", href: "/adflex/about" },
    items: [
      {
        id: "objective",
        title: "Objective",
        summary:
          "ADFLEX addresses a central challenge for the energy transition: helping Sustainable Energy Communities in mixed-use buildings provide flexibility and take part in local energy markets.",
        body: "ADFLEX addresses a central challenge for the energy transition: helping Sustainable Energy Communities in mixed-use buildings provide flexibility and take part in local energy markets. The project develops and validates a digital framework that coordinates heat pumps, electric vehicles, solar PV and smart meters, tested in a real pilot in Ringsend, Dublin, rather than in simulation alone.",
      },
      {
        id: "impact",
        title: "Impact",
        summary:
          "By giving distribution and transmission system operators real-time visibility into local load and generation, ADFLEX supports the wider EU push to cut emissions and absorb more renewable energy onto the grid.",
        body: "By giving distribution and transmission system operators real-time visibility into local load and generation, ADFLEX supports the wider EU push to cut emissions and absorb more renewable energy onto the grid. The project’s outcome is a blueprint that other Sustainable Energy Communities across Europe can adopt and adapt, not a one-off pilot result.",
      },
      {
        id: "our-role",
        title: "Our role",
        summary:
          "At the core of ADFLEX is the Digital Spine, a middleware layer that lets home devices like heat pumps and EV chargers talk to grid operators using a shared, open language, so equipment from different manufacturers can work together without custom setup for each one.",
        body: "At the core of ADFLEX is the Digital Spine, a middleware layer that lets home devices like heat pumps and EV chargers talk to grid operators using a shared, open language, so equipment from different manufacturers can work together without custom setup for each one. Alongside it, a digital twin, a virtual copy of the pilot buildings and network, lets the team test and fine-tune flexibility strategies before anything changes on-site, reducing the risk of disruption to residents.",
      },
    ],
  },

  technologies: {
    title: "Technologies",
    intro:
      "Four building blocks make local energy flexibility workable for a community rather than only for a single building.",
    introFigure: "Four building blocks",
    items: [
      {
        id: "digital-spine",
        name: "Digital Spine middleware",
        description:
          "The data backbone of the project. It connects heat pumps, EV chargers, batteries and PV systems to grid stakeholders through standards-based, interoperable data exchange, so devices from different manufacturers can be coordinated without custom integration work for each one.",
        image: {
          src: "/adflex/images/technologies/digital-spine.png",
          alt: "",
          width: 1672,
          height: 941,
        },
      },
      {
        id: "digital-twin",
        name: "Digital twin",
        description:
          "A virtual replica of the pilot buildings and local network, used to model how changes in heating, charging or storage behaviour affect both resident comfort and grid load, before those changes are rolled out physically.",
        image: {
          src: "/adflex/images/technologies/digital-twin.png",
          alt: "",
          width: 1672,
          height: 941,
        },
      },
      {
        id: "smart-tariffs",
        name: "Smart tariffs and dynamic pricing",
        description:
          "Pricing mechanisms that let flexibility translate into a tangible benefit for residents, giving communities a reason to shift consumption in response to grid conditions rather than just a technical capability to do so.",
        image: {
          src: "/adflex/images/technologies/smart-tariffs.png",
          alt: "",
          width: 1672,
          height: 941,
        },
      },
      {
        id: "data-spaces",
        name: "Shared data standards and data spaces",
        description:
          "ADFLEX uses data spaces, secure, agreed environments for exchanging energy data, so information from the pilot can be trusted, compared and reused by other communities, grid operators and researchers working on flexibility elsewhere.",
        image: {
          src: "/adflex/images/technologies/data-spaces.png",
          alt: "",
          width: 1672,
          height: 941,
        },
      },
    ],
  },

  consortium: {
    title: "Consortium",
    // The count and its `introFigure` emphasis were removed on 6 August 2026 at
    // the client's request. Only the number is gone; the rest of the approved
    // sentence is untouched. Dropping it also means the line no longer has to
    // be edited every time a partner joins or leaves — which it would have, the
    // moment IRESI was added.
    intro:
      "ADFLEX brings together partners spanning research, technical delivery and energy market expertise:",
    //
    // ---------------------------------------------------------------------
    // LOGOS ONLY, FROM 6 AUGUST 2026
    // ---------------------------------------------------------------------
    // The client asked for the partner names and the one-line roles to come off
    // the cards, leaving the logos to speak for themselves. The `name` field
    // stays and is now **load-bearing for accessibility**: it is the `alt` text
    // of the logo. Before this it was correct for `alt` to be empty, because the
    // name was rendered as real text right beneath the picture; with that text
    // gone, an empty `alt` would leave a screen reader with four unlabelled
    // images and no way to know who is in the consortium. `PartnerCard` reads
    // `name` for exactly that, so it must stay accurate.
    //
    // The supplied roles are kept below, commented out rather than deleted, so
    // restoring them is a one-line change and the approved wording is not lost.
    // They were supplied by the project team on 30 July 2026:
    //   Maynooth University — Project coordinator, building the Digital Spine
    //     middleware
    //   University College Dublin (UCD) — Modelling the digital twin and
    //     communication gateway in the lab
    //   Arden Energy — Implementing flexibility on the ground in the Ringsend
    //     pilot
    // No role has been supplied for IRESI, and none is guessed at here.
    //
    // Partner descriptions, URLs and countries have never been supplied — do
    // not add them without approved source material.
    //
    // Logos live in public/images/partners/ and were supplied for the project.
    // `width`/`height` are each file's intrinsic pixel size, so the aspect
    // ratio is preserved.
    //
    // Array order is display order, left to right. IRESI leads at the client's
    // request (6 August 2026); the other three keep the order they were
    // supplied in.
    partners: [
      // Supplied 6 August 2026. The file as delivered was a 1672x941 export with
      // the mark floating in a large white field, so it has been trimmed to the
      // mark per the logo rules in README.md, and its near-white background
      // snapped to pure white — the export came from a lossy source and its
      // "white" was really 248-255 with compression speckle, which showed as a
      // grey rectangle on the card. The mark's own colours are untouched.
      // `width`/`height` are the trimmed file's intrinsic size.
      {
        id: "iresi",
        name: "IRESI",
        logo: {
          src: "/adflex/images/partners/iresi.png",
          alt: "",
          width: 1094,
          height: 291,
        },
      },
      {
        id: "maynooth-university",
        name: "Maynooth University",
        logo: {
          src: "/adflex/images/partners/maynooth-university.png",
          alt: "",
          width: 436,
          height: 197,
        },
      },
      {
        id: "university-college-dublin",
        name: "University College Dublin (UCD)",
        logo: {
          src: "/adflex/images/partners/university-college-dublin.png",
          alt: "",
          width: 182,
          height: 263,
        },
      },
      {
        id: "arden-energy",
        name: "Arden Energy",
        logo: {
          src: "/adflex/images/partners/arden-energy.png",
          alt: "",
          width: 302,
          height: 71,
        },
      },
    ],
  },

  pilot: {
    title: "Pilot",
    subtitle: "Ringsend Sustainable Energy Community, Dublin",
    bodyFigure: "around 9,000 residents",
    body: "The pilot covers Ringsend and Irishtown, a community of around 9,000 residents southeast of Dublin city centre, already recognised as a decarbonisation demonstration zone by Dublin City Council. It includes a mix of domestic homes with heat pumps, EVs and solar PV, plus a commercial building with an EV charger, solar PV, heat pump and combined heat and power unit. These assets are being coordinated through the Digital Spine and Arden Energy's platform, working alongside ESB Networks' Beat the Peak programme, allowing the community to demonstrate flexibility in practice rather than on paper, and giving the project real operational data to refine the underlying models.",
    // Icons are illustrative. Each `alt` is empty because the label beside it
    // already names the asset.
    assets: [
      {
        id: "heat-pumps",
        label: "Heat pumps",
        icon: { src: "/adflex/images/pilot-icons/heat-pumps.png", alt: "", width: 1536, height: 1024 },
      },
      {
        id: "ev-charging",
        label: "Electric vehicles and EV charging",
        icon: { src: "/adflex/images/pilot-icons/ev-charging.png", alt: "", width: 1536, height: 1024 },
      },
      {
        id: "solar-pv",
        label: "Solar PV",
        icon: { src: "/adflex/images/pilot-icons/solar-pv.png", alt: "", width: 1536, height: 1024 },
      },
      {
        id: "combined-heat-and-power",
        label: "Combined heat and power",
        icon: {
          src: "/adflex/images/pilot-icons/combined-heat-and-power.png",
          alt: "",
          width: 1536,
          height: 1024,
        },
      },
      {
        id: "digital-spine",
        label: "Digital Spine",
        icon: { src: "/adflex/images/pilot-icons/digital-spine.png", alt: "", width: 1536, height: 1024 },
      },
      {
        id: "arden-energy-platform",
        label: "Arden Energy’s platform",
        icon: {
          src: "/adflex/images/pilot-icons/arden-energy-platform.png",
          alt: "",
          width: 1536,
          height: 1024,
        },
      },
      {
        id: "esb-networks",
        label: "ESB Networks’ Beat the Peak programme",
        icon: { src: "/adflex/images/pilot-icons/esb-networks.png", alt: "", width: 1536, height: 1024 },
      },
    ],
    image: {
      src: "/adflex/images/pilot/ringsend-pilot.png",
      alt: "",
      width: 1672,
      height: 941,
    },
  },

  // Falls back to an intentional empty state at /outcomes when nothing has been
  // published through the admin. Do not replace it with placeholder
  // publications, deliverables, dates, DOIs or downloads.
  //
  // Renamed from "Outputs" to "Outcomes" on 6 August 2026 at the client's
  // request — heading, navigation label and the route itself. The content key
  // was `results` before that, a third name for the same thing; it is now
  // `outcomes` so the code, the URL and the page all agree.
  //
  // `body` is the supplied paragraph and still opens "Results and publications"
  // — left verbatim because it is approved copy, and not ours to reword.
  outcomes: {
    title: "Project Outcomes",
    pageDescription:
      "Project outcomes from ADFLEX, updated as findings, deliverables and papers become available.",
    heading: "Project findings are still being finalised",
    body: "Results and publications from ADFLEX are still being finalised as the project progresses through its pilot phase. This section will be updated as findings, deliverables and papers become available.",
  },

  // A dedicated ADFLEX contact has not been confirmed. These are the standard
  // IRESI contact details supplied with the website copy — replace the values
  // here and both the contact section and the footer will follow.
  contact: {
    title: "Contact",
    intro: "For questions about ADFLEX, please get in touch.",
    pageDescription:
      "Contact details for the ADFLEX project at Maynooth University.",
    email: "info@iresi.eu",
    organisation: "Maynooth University",
    addressLines: ["Maynooth, Co. Kildare", "Ireland"],
  },

  // --- Structure built, content pending ---------------------------------
  // Everything below renders a visible empty state rather than sample items.
  // See docs/OPEN-ITEMS.md.

  // News and events were two routes until 30 July 2026. They were merged into
  // one, because both were empty and two empty pages in the navigation gave a
  // visitor two dead ends instead of one.
  news: {
    slug: "news",
    eyebrow: "Project updates",
    title: "News & Events",
    pageDescription:
      "News, updates and events from the ADFLEX project, published as the work progresses.",
    heading: "Nothing published yet",
    body: "This is where ADFLEX will publish project news and updates, and list events, talks and workshops. Nothing has been published or scheduled so far — entries will appear here as the project progresses.",
  },

  // Transcribed verbatim from ADFLEX_Legal_Pages_Draft_v2.docx, supplied by the
  // client on 30 July 2026 (replacing a v1 PDF the same day; the only change
  // between them is the cookies provider table). Wording is not ours to edit.
  // The square-bracketed placeholders still in it ([www.adflex.ie / adflex
  // domain TBC] and [month/year]) are left exactly as they are, so they stay
  // visible rather than being quietly filled in with a guess.
  // See docs/OPEN-ITEMS.md.
  legal: {
    eyebrow: "Legal",
    pages: [
      {
        slug: "privacy",
        eyebrow: "Legal",
        title: "Privacy Policy",
        pageDescription:
          "How the ADFLEX project website handles personal data.",
        status:
          "Draft v2, supplied by the project team. Not yet finalised — the site address and the review date are still marked as to be confirmed.",
        blocks: [
          { kind: "heading", text: "1. Introduction" },
          {
            kind: "paragraph",
            text: "This Privacy Policy explains what information the ADFLEX project website collects, why, how it is treated, where it may be transferred to, and how you can access, update or delete it. Our aim is to comply with the General Data Protection Regulation (Regulation (EU) 2016/679, “GDPR”). This Policy covers all users residing in the European Economic Area or elsewhere.",
          },
          {
            kind: "paragraph",
            text: "ADFLEX is a research project funded by SEAI under the National Energy RD&D Funding Programme, coordinated by Maynooth University in partnership with University College Dublin and Arden Energy.",
          },

          { kind: "heading", text: "2. Data collection" },
          {
            kind: "paragraph",
            text: "We collect information about you at the following points when you use the ADFLEX website:",
          },
          {
            kind: "list",
            ordered: true,
            items: [
              "When you send a message through the contact form or by direct email",
              "When you subscribe to the project newsletter or updates, if offered",
              "When you visit and browse the website",
            ],
          },
          {
            kind: "paragraph",
            text: "2.1 Contact form / email: we collect your email address, name, subject, and message content. We usually retain these messages for archive and follow-up purposes.",
          },
          {
            kind: "paragraph",
            text: "2.2 Newsletter subscription: we ask only for your email address.",
          },
          {
            kind: "paragraph",
            text: "2.3 Website visits: information is collected via cookies, described in the Cookies Policy.",
          },

          { kind: "heading", text: "3. How we use your data" },
          { kind: "paragraph", text: "We may use your information to:" },
          {
            kind: "list",
            ordered: true,
            items: [
              "Respond to your enquiry",
              "Inform you of project news, results, or relevant events, if you have subscribed to updates",
              "Provide any other service you have specifically requested",
            ],
          },
          {
            kind: "paragraph",
            text: "Your information is used only for purposes directly related to the ADFLEX project and website, and is never shared with third parties for marketing purposes.",
          },

          { kind: "heading", text: "4. Legal basis" },
          { kind: "paragraph", text: "Your data is processed only where:" },
          {
            kind: "list",
            ordered: true,
            items: [
              "You have given consent, by sending a message or submitting a form, or",
              "Processing is required to comply with a legal obligation (for example, reporting requirements under ADFLEX’s SEAI funding agreement, using aggregated, non-identifying statistics only)",
            ],
          },
          {
            kind: "paragraph",
            text: "Your data will not be used for other purposes without informing you in advance or, where required, obtaining your consent.",
          },

          { kind: "heading", text: "5. Data retention" },
          {
            kind: "paragraph",
            text: "Your personal data is kept only for as long as necessary for the purposes described above. As a general rule, this is the duration of the ADFLEX project plus one additional year. ADFLEX runs for 36 months, so data is retained for approximately 4 years from collection, unless a shorter period applies or you request earlier deletion. After this period, your data is removed.",
          },

          { kind: "heading", text: "6. Sharing your information" },
          {
            kind: "paragraph",
            text: "Your information is shared only where required by law, for example if requested by police or a supervisory authority investigating a suspected illegal act, or where SEAI requires aggregated, anonymised reporting on website engagement as part of ADFLEX’s funding obligations.",
          },

          { kind: "heading", text: "7. Your rights" },
          { kind: "paragraph", text: "At any time, you can request:" },
          {
            kind: "list",
            ordered: true,
            items: [
              "Access to your personal data",
              "Correction of your personal data",
              "Objection to, restriction of, or cancellation of processing",
              "Portability of your data, in a structured, readable format",
              "Deletion of your data (“right to be forgotten”)",
            ],
          },
          {
            kind: "paragraph",
            text: "To exercise these rights, contact Ann McKeon, Data Protection Officer, at ann.mckeon@mu.ie (or dataprotection@mu.ie). You will be asked to confirm your identity. You will be informed of the outcome of your request within 30 days.",
          },
          {
            kind: "paragraph",
            text: "You also have the right to complain to the Data Protection Commission (www.dataprotection.ie) if you are unhappy with how your data has been handled.",
          },

          { kind: "heading", text: "8. Contact" },
          {
            kind: "paragraph",
            text: "ADFLEX’s Data Protection Officer is Ann McKeon (ann.mckeon@mu.ie). If you have questions about this Policy or wish to exercise your rights, please get in touch.",
          },
          {
            kind: "paragraph",
            text: "Last reviewed: [month/year] — version 1.0",
          },
        ],
      },
      {
        slug: "cookies",
        eyebrow: "Legal",
        title: "Cookies Policy",
        pageDescription:
          "How the ADFLEX project website uses cookies and similar technologies.",
        status:
          "Draft v2, supplied by the project team. Not yet finalised — the site address and the review date are still marked as to be confirmed.",
        blocks: [
          {
            kind: "paragraph",
            text: "This document explains the technologies (“Trackers”) used on the ADFLEX website to help it function and, where you consent, to help us understand how it is used.",
          },

          {
            kind: "heading",
            text: "What type of cookies are used, and why?",
          },
          {
            kind: "paragraph",
            text: "This Website uses its own (“first-party”) cookies, set by Maynooth University, and may use third-party cookies where content from other services is embedded (for example, an embedded video or social media post).",
          },
          {
            kind: "paragraph",
            text: "Technical (necessary): cookies that let you browse the Site and use its features, such as session identification, security, and remembering your cookie preferences. These are necessary and are not subject to consent.",
          },
          {
            kind: "paragraph",
            text: "Analytics: cookies that let us count visitors and understand how the Site’s content is used, so we can improve it. These require your consent. (Tool to be confirmed once the site is built, e.g. Matomo or Google Analytics — to be listed here by name once chosen, following the same practice as ADFLEX’s sister project RESSKILL.)",
          },
          {
            kind: "paragraph",
            text: "External social networks / embedded content: cookies set by third parties if social media posts or videos are embedded on the Site (for example LinkedIn or YouTube). These require your consent and are only present if such content is actually embedded.",
          },

          { kind: "heading", text: "Who sets cookies on this website?" },
          {
            kind: "table",
            caption: "Cookie providers, types and purposes",
            head: ["Provider", "Type", "Purpose"],
            rows: [
              [
                "Maynooth University (adflex domain)",
                "Technical/Necessary",
                "Core site functionality; excluded from consent requirement",
              ],
              [
                "Matomo Analytics",
                "Analytics",
                "Visitor statistics and usage measurement; requires consent",
              ],
              [
                "LinkedIn Ireland",
                "External/Social",
                "Enables interaction with embedded LinkedIn content; requires consent",
              ],
            ],
          },

          { kind: "heading", text: "Managing your cookie preferences" },
          {
            kind: "paragraph",
            text: "When you first visit the Site, a cookie notice lets you accept all cookies, or click Configure to choose which categories to accept or reject. Necessary cookies cannot be rejected. You can also manage or delete cookies through your browser settings at any time.",
          },

          { kind: "heading", text: "International data transfers" },
          {
            kind: "paragraph",
            text: "If any third-party tool used on the Site (for example certain analytics or embedded content providers) transfers data outside the European Economic Area, this will be disclosed here once the specific tools are confirmed, along with the safeguard relied upon (e.g. user consent, or an EU adequacy decision).",
          },
          {
            kind: "paragraph",
            text: "For further information not specific to cookies, see the ADFLEX Privacy Policy.",
          },
          {
            kind: "paragraph",
            text: "Last reviewed: [month/year] — version 1.0",
          },
        ],
      },
      {
        slug: "terms",
        eyebrow: "Legal",
        title: "Terms of Use",
        pageDescription: "Terms of use for the ADFLEX project website.",
        status:
          "Draft v2, supplied by the project team. Not yet finalised — the site address and the review date are still marked as to be confirmed.",
        blocks: [
          { kind: "heading", text: "Purpose" },
          {
            kind: "paragraph",
            text: "These Terms of Use (hereinafter “Policy” or “Terms”) regulate the terms and conditions under which any user may access and use the website with the URL [www.adflex.ie / adflex domain TBC] (hereinafter “Site” or “Website”), owned by Maynooth University (hereinafter “MU”), coordinator of the ADFLEX project.",
          },
          {
            kind: "paragraph",
            text: "Any individual who accesses and views the contents and services of the Site will be considered a user of this website, if they are over eighteen years old and are not incapable of accepting and committing to these terms and conditions. MU will not be liable for any actions taken on this Site by any person who is under age or legally incapacitated.",
          },

          { kind: "heading", text: "Acceptance of this Policy" },
          {
            kind: "paragraph",
            text: "The user who accesses and uses this Website does so under their sole and exclusive responsibility, and by viewing the information and content hosted on the Site and browsing it, the user accepts these Terms. Where this Policy is replaced by another, in whole or in part, the new terms will be understood to have been accepted in the same way. The user should periodically check this Policy for updates.",
          },

          { kind: "heading", text: "Rights and obligations of the user" },
          { kind: "paragraph", text: "The user may:" },
          {
            kind: "list",
            items: [
              "Access the contents and services of the website free of charge and without prior registration, provided they have an internet connection and a browser",
              "Use the services and content available for exclusive private use",
              "Download a single copy of the Site for offline viewing for personal, non-commercial purposes",
              "Make correct and lawful use of the Site, in accordance with current legislation, morality, good customs and public order",
            ],
          },
          { kind: "paragraph", text: "The user may not:" },
          {
            kind: "list",
            items: [
              "Access or use the Site’s services and content for illegal actions, or in a manner contrary to this Policy, current legislation, or the rights of MU or third parties",
              "Use the services and content to promote, sell, hire or disclose advertising or information about themselves or third parties without MU’s prior written permission",
              "Use any computer virus, code, or software that may damage or alter the Site’s content, programs or systems",
              "Reproduce, distribute, copy, publicly communicate or transform this Website, in whole or in part, without MU’s prior written consent",
              "Use ADFLEX’s name, logo, or any identifying sign subject to intellectual or industrial property rights without prior written permission",
            ],
          },

          { kind: "heading", text: "Rights of MU" },
          { kind: "paragraph", text: "MU reserves the right to:" },
          {
            kind: "list",
            items: [
              "Modify or remove, unilaterally and without notice, the content, services, or access conditions of this Site",
              "Determine the language(s) in which the Site is available",
              "End the provision of any service or content on the Site",
              "Seek compensation for improper or illegal use of the Site",
              "Take legal action to protect the rights of MU or third parties providing content through the Site",
            ],
          },
          {
            kind: "paragraph",
            text: "MU is not liable for damages arising from connectivity issues, interruptions to the Site, or the quality, availability or content of third-party services linked from the Site, including where caused by force majeure.",
          },

          { kind: "heading", text: "Intellectual property" },
          {
            kind: "paragraph",
            text: "The content and services offered through this Website, including text, graphics, images, diagrams, videos and website code, are protected by intellectual and industrial property law. Copyright and economic exploitation rights belong to MU or, where applicable, to third parties (including project partners UCD and Arden Energy, and funder SEAI). Use of the Site does not transfer, waive or assign any of these rights.",
          },

          { kind: "heading", text: "Hyperlinks" },
          {
            kind: "paragraph",
            text: "Links to this Website may only be made to the Site’s home page, must not “frame” or distort the Site’s presentation, and must not imply any relationship, sponsorship or endorsement by MU unless explicitly agreed in writing.",
          },

          { kind: "heading", text: "Duration" },
          {
            kind: "paragraph",
            text: "Access to and content on this Website is offered for an indefinite duration, but MU may suspend or terminate access, services or content at any time.",
          },
        ],
      },
    ],
  },

  contactForm: {
    title: "Send a message",
    pendingNote:
      "This form is a template and is not connected yet, so it cannot send anything. Please use the email address above to get in touch.",
    submitLabel: "Send message",
    fields: [
      { id: "name", label: "Your name", type: "text", autoComplete: "name" },
      { id: "email", label: "Email address", type: "email", autoComplete: "email" },
      { id: "subject", label: "Subject", type: "text" },
      { id: "message", label: "Message", type: "textarea" },
    ],
  },

  footer: {
    // Confirmed 30 July 2026: the funder is SEAI. Published 31 July 2026 at the
    // client's instruction, deliberately as the shortest true statement.
    //
    // The programme name (National Energy RD&D Funding Programme) is named in
    // the supplied legal text but has not been approved as footer wording, and
    // the grant number and the disclaimer have never been supplied at all —
    // see docs/OPEN-ITEMS.md. Neither is guessed at here. Extending this
    // statement later needs no layout change: add to `statement`.
    //
    // The SEAI logo was supplied on 6 August 2026. The file as delivered was a
    // 1672x941 export with the mark floating in a large white field; it has
    // been trimmed to the mark, which is what README.md requires of logo
    // artwork and what keeps it from rendering at a fraction of its box. No
    // pixel of the mark itself was altered. `width`/`height` are the trimmed
    // file's intrinsic size, so the aspect ratio is preserved.
    //
    // `alt` carries the funder's name because this logo is the only place the
    // footer names SEAI in full — the statement beside it says just "SEAI".
    funding: {
      statement: "Funded by SEAI.",
      emblem: {
        src: "/adflex/images/funded-logo/seai-logo.png",
        alt: "Sustainable Energy Authority of Ireland",
        width: 1552,
        height: 415,
      },
    },
    linkedin: {
      label: "Follow us on LinkedIn",
      /*
       * Supplied 6 August 2026 as
       *   https://www.linkedin.com/company/112635173/admin/dashboard/
       *
       * That is the **page admin dashboard**, not the public page. It is
       * reachable only by someone signed in as an administrator of the company
       * page; every public visitor following it lands on a LinkedIn sign-in or
       * an error, which is exactly the dead link this field exists to avoid.
       *
       * The public address of the same page is the company URL without the
       * `/admin/dashboard/` suffix, which is what is used here. Worth replacing
       * with the page's vanity URL (e.g. /company/adflex-project/) once the
       * page has one — a numeric id works but tells a reader nothing.
       */
      href: "https://www.linkedin.com/company/112635173/",
    },
    copyright: "ADFLEX Project. All rights reserved.",
    // ADFLEX is an IRESI project; the legal line links back to them.
    organisation: { label: "Visit IRESI", href: "https://www.iresi.eu/" },
  },
} as const satisfies AdflexContent;

/**
 * Resolves navigation hrefs for the route that is rendering them.
 *
 * Section anchors only resolve on the home page, so every other route needs
 * them prefixed with `/`. Route items are already absolute and are left alone.
 * Pages call this once and pass the result to the header and footer, which stay
 * presentational.
 */
export function resolveNavigation(
  items: readonly NavigationItem[],
  { onHome }: { onHome: boolean },
): NavigationItem[] {
  return items.map((item) =>
    item.kind === "section" && !onHome
      ? { ...item, href: `/adflex${item.href}` }
      : { ...item },
  );
}
