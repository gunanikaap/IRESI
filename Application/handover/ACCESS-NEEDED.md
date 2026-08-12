# What I need before IRESI and ADFLEX can be deployed and their email tested

13 August 2026. One list covering **both** projects, so the right access can be
requested once rather than a permission at a time.

This supersedes the ADFLEX-only list of 12 August: the review meeting agreed
that IRESI is the parent platform and ADFLEX runs underneath it, so the two now
need the same hosting, the same database decision and the same mailbox.

Each item says **what is blocked without it**, so anything slow can be worked
around rather than waited on.

---

## The one question that changes everything else

**Can the machine that will host this run Node.js 20 or newer?**

The current IRESI website is WordPress, which means PHP hosting, and PHP hosting
frequently cannot run Node at all. There is a hint about which provider that is:
`mail.iresi.eu` resolves to `m-rb.th.seeweb.it`, so IRESI's mail — and very
likely its web hosting — sits with Seeweb.

This matters more than any other item on the list because of what the meeting
decided. A shared admin with one login, editors managing projects and news
without a developer, and a contact form that actually sends email all require a
running Node application and a PostgreSQL database. If the existing host cannot
provide those, that is a decision for the team, not something I can work around:

- **If it can run Node** — everything proceeds as planned.
- **If it cannot** — we need either a small separate host for the application
  (a modest VPS or a managed platform), or we drop back to a statically built
  site with no admin. I would rather find this out this week than after a failed
  deployment.

---

## 1. Hosting and deployment

No new domain should be bought for this; the plan is to deploy under existing
IRESI infrastructure.

| # | What I need | Blocked without it |
| --- | --- | --- |
| 1.1 | Where the current IRESI website is hosted — provider and plan | Cannot judge whether it can run a Node application at all |
| 1.2 | **Whether that host can run Node.js 20+** | The whole deployment approach. See above |
| 1.3 | Login to the hosting control panel, or a deploy key / CI credentials | Deploying anything |
| 1.4 | Where this should be staged — the exact address it will answer on | The canonical URL, the sitemap, and any SSO redirect later |
| 1.5 | Whether ADFLEX sits at a **subdomain** (`adflex.iresi.eu`) or a **path** (`iresi.eu/adflex`) | Routing and internal links. A path is more work and should be decided before, not after |
| 1.6 | DNS access if a subdomain is chosen — or the name of whoever can add records | Pointing the subdomain anywhere |
| 1.7 | Confirmation that the new IRESI site will eventually replace the WordPress site on `iresi.eu` itself | Nothing immediately. The URLs are already preserved for it |

## 2. Database

| # | What I need | Blocked without it |
| --- | --- | --- |
| 2.1 | Whether **PostgreSQL 14+** can be provided on that host, or a managed one is preferred | The admin, and all editor-managed content. The public pages render without it, but every project, publication and news entry lives there |
| 2.2 | The connection details once it exists (host, port, database, user, password) | Same |
| 2.3 | **One database shared by all IRESI projects, or one per project?** | Nothing today — the code deliberately does not assume either — but it shapes the schema, so the sooner the better |
| 2.4 | Who takes backups, and how often | Nothing technical. A question somebody should answer before real content goes in |

On 2.3: the platform currently resolves which project it is serving from an
`ACTIVE_PROJECT` setting, and one deployment serves one project. That works
under either answer. If the team chooses one shared database, adding a project
column is a migration and one module changes.

## 3. Email — SMTP

The meeting singled this out: instructions on their own do not count as
finished. It has to be configured, deployed, sent and confirmed received.

| # | What I need | Blocked without it |
| --- | --- | --- |
| 3.1 | The SMTP **host name** and **port** of the existing IRESI mail account | The contact form cannot send. Every message falls back to the admin dashboard |
| 3.2 | The **username** for that mailbox | Same |
| 3.3 | The **password** — an app password if the mailbox uses multi-factor authentication | Same |
| 3.4 | The address messages should be **sent from**. It usually has to be the mailbox itself, or one it is permitted to send as | Same |
| 3.5 | Confirmation that **`info@iresi.eu`** is where enquiries should arrive | Nothing — it is what both sites are set to. Worth confirming rather than assuming |

On 3.3: if the mailbox is Microsoft 365 with MFA, an ordinary password will not
work — it needs an app password, and the tenant must allow them. This is the
step that has already stalled once. If app passwords are disabled, the
alternative is a service account or an SMTP relay, and that is an IT decision.

**Please do not put any of these in an email or a chat message.** The password
belongs in the hosting provider's environment settings. If it is easier to send
it, use whatever secure route the team normally uses and I will put it there —
but the ideal is that I never see it.

## 4. Repository

| # | What I need | Blocked without it |
| --- | --- | --- |
| 4.1 | Whether an **IRESI GitHub organisation** exists, and if not, whether to create one | Both projects stay in a personal account, which the meeting asked to move away from |
| 4.2 | Permission to transfer or mirror both repositories into it | Same |
| 4.3 | The GitHub usernames of everyone who should have access — **Paolo** was named | They cannot see the code |

Paolo can be added to both current repositories straight away; that does not
need to wait for the organisation.

## 5. Content and sign-off

Not access, but outstanding, and each is a visible gap.

| # | What I need | Blocked without it |
| --- | --- | --- |
| 5.1 | Confirmation of IRESI's **funding statement** wording, if it should carry one | Nothing. ADFLEX's reads "Funded by SEAI."; IRESI's footer currently has none |
| 5.2 | **Legal pages** — Privacy, Cookies, Terms — reviewed by someone who can approve them | Nothing technically. A compliance risk while the site collects contact details |
| 5.3 | Whether the homepage claim of **"50+ Scientific Publications"** should stay while the page lists 12 | Nothing. Carried over from the current site; flagging it rather than changing it |
| 5.4 | A LinkedIn/X account list to confirm the footer links are current | Nothing. The existing links were carried over as-is |

---

## What is *not* waiting on anybody

So this list is not read as "everything is blocked". It is not.

- Every public IRESI page builds and renders now, on a local machine, with no
  database and no credentials.
- The platform structure, the per-project configuration and theming, the content
  model and the database migrations are all done and version-controlled.
- Lint, build and type-check all pass.

The blocked items are deployment, real email delivery, the database the admin
needs, and repository ownership.
