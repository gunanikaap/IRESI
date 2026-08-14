# IRESI platform — testing guide

For Gunanika, 13 August 2026. Work through this at your own pace and note
anything that looks wrong in the table at the end.

---

## Before you start

The site is already running. If it is still up from when this was written:

**Website:** <http://localhost:3100>
**Admin:** <http://localhost:3100/admin>

**Admin sign-in**

| | |
| --- | --- |
| Login | `admin@iresi.eu` |
| Password | `IresiAdmin2026!` |

> **This is a local test credential and must not be reused on the deployed
> site.** It exists so this document is usable against a throwaway database on
> your own machine. Set a real one before the site is public, with
> `npm run db:user -- admin@iresi.eu "IRESI Administrator"`.

The login accepts an email address, and this is the one the team asked for — but
it is an **identifier, not an address**. Nothing is ever sent to it: there is no
password reset by email, no notification and no verification. A forgotten
password is reset by re-running `npm run db:user`, which is the only reset there
is.

An older account, `testeditor` / `TestPassw0rd!`, also works if you have it
saved.

### If it is not running

Run these in your own terminal and **leave that terminal open** — the server
stops when the window closes.

```bash
docker start iresi-test-db iresi-mailpit   # database and mail catcher
cd d:\IRESI\Application
npx next start -p 3100
```

You only need `npm run build` first if you have changed any code.

If it says `EADDRINUSE`, something is already on that port — either the site is
already running (check <http://localhost:3100>), or pick another port with
`-p 3200`.

### If the database has been wiped

```bash
docker rm -f iresi-test-db
docker run -d --name iresi-test-db -e POSTGRES_PASSWORD=testpw -e POSTGRES_DB=iresi -p 55432:5432 postgres:16-alpine
cd d:\IRESI\Application
npm run db:setup
npm run db:seed
npm run db:user -- admin@iresi.eu "IRESI Administrator"
```

### When you are finished

```bash
docker stop iresi-test-db     # keeps the data for next time
docker rm -f iresi-test-db    # throws it away entirely
```

---

## Two things that will look like bugs and are not

**1. Editing the database directly does not update the listing pages.**
The listings (`/projects`, `/news-events`, the home page) are pre-rendered for
speed and are regenerated when you save something *through the admin*. If you
change a row with SQL, the individual page updates but the listing keeps showing
the last build. **Always test through the admin**, not the database.

**2. Contact form messages are emailed to a local catcher, not to IRESI.**
A throwaway mail server (Mailpit) is running for testing. Messages sent through
the contact form go there and are visible at **<http://localhost:8025>** — they
never reach a real inbox, which is what makes it safe to test with. They are
also kept in **Admin → Messages**.

With the real IRESI SMTP details in place, the same messages would go to
`info@iresi.eu`. Nothing about the site changes; only five environment
variables do.

---

## Known gaps — please do not report these

These are already on the list. Reporting them costs you time and tells me
nothing new.

Before that, one trap that is **not** a site fault and will waste an hour if you
hit it: **never run two `npx next start` processes from the same folder.** They
share one `.next` directory, and the second build renames the stylesheets the
first one is still serving — every page then loads unstyled with 404s in the
console. Stop one before starting the other. It cost me an hour during this
build, twice.

| Gap | Why |
| --- | --- |
| **IRESI publications** cannot be written or edited | Only publish/unpublish/delete work there, and the page says so on screen. Everything else — news, projects, team, photographs, and all three ADFLEX types — has a full form |
| **Projects, Publications and Messages are not in the admin menu** | Removed at the team's request on 14 Aug 2026. The pages still work if you type the address — `/admin/projects`, `/admin/publications`, `/admin/messages` — and the overview links to Messages while email is unconfigured. Putting any of them back is one line |
| ADFLEX's News and Outcomes pages are **empty** | Its own database was not migrated into this one — there was no access to it. Both pages show their proper empty state, and content can be added through the admin |
| Real IRESI email is not connected | Sending works and is tested, but against a local catcher. Only the real host, address and password are missing — items 3.1–3.5 on the access list |
| No sitemap, no canonical links | Waiting on the confirmed staging address |
| Research topic pages, partner logos and standing page text are not editable in the admin | Deliberate — they change rarely and live in the code. See the README. The team list and the About photographs **are** editable now |
| "50+ Scientific Publications" on the home page while the page lists 12 | Carried over from the current live site. Flagged for the team to confirm |
| The homepage stat says "EU-Funded" | Also carried over from the live IRESI site. Worth confirming with Paend |

---

## What "correct" means here

The reference is the **current live site, <https://www.iresi.eu>**. Where this
rebuild differs, that is either a bug or a deliberate improvement. If you are not
sure which, note it — I would rather look at ten of those than miss one.

Open the live site side by side while you work through Part 1.

---

# Part 1 — Public website

### 1.1 Pages load

Visit each and confirm it opens without an error.

- [ ] `/` — home
- [ ] `/about-us` — Who We Are
- [ ] `/team` — Team
- [ ] `/partners` — Partners
- [ ] `/projects` — Projects listing
- [ ] `/publications` — Publications
- [ ] `/news-events` — News & Events
- [ ] `/research` — Research hub
- [ ] `/contact` — Contact
- [ ] A made-up address like `/does-not-exist` shows a proper 404 page, not a crash

### 1.2 The URLs that must not break

These are the addresses the current WordPress site publishes. They have to keep
working when the domain is repointed, or every existing link and search result
breaks.

Project pages:

- [ ] `/renew`
- [ ] `/res4city`
- [ ] `/flow`
- [ ] `/sherlock`
- [ ] `/streacs`
- [ ] `/ai-effect`
- [ ] `/resskill`
- [ ] `/nexsys`
- [ ] `/adflex`

Research topic pages:

- [ ] `/renewables`
- [ ] `/transport`
- [ ] `/buildings`
- [ ] `/electricity-and-power-system`
- [ ] `/engage-research`
- [ ] `/green-upskilling`
- [ ] `/heating-and-cooling-systems`

Two projects deliberately have **no page** because they live on someone else's
website — their cards link straight out:

- [ ] `/lero` gives a 404 (correct — its card links to lero.ie)
- [ ] `/co-creative-lab` gives a 404 (correct — its card links to co-creativelab.eu)

### 1.3 Content accuracy — compare with the live site

- [ ] **Home** — headline, the five statistics, the "Who We Are" text, the four
      "Our Focus" cards, four project cards, partner logos, closing call to action
- [ ] **Team** — 36 people. Check a few names, job titles and photos against
      <https://www.iresi.eu/team/>. Email and LinkedIn icons work
- [ ] **Projects** — 11 cards. Each has the right picture and summary
- [ ] **A project page** (try `/renew`) — title, four descriptor chips, opening
      paragraph, the Vimeo demo video, and the Objective / Impact / Our Role sections
- [ ] **Publications** — 12 papers under three researchers (Fabiano Pallonetto,
      Muhammad Waseem, Amy Fahy), each with authors, date, journal, volume, pages,
      publisher, abstract, and a working "Read" link to Google Scholar
- [ ] **News & Events** — 6 posts listed. Opening one shows its pictures
- [ ] **Partners** — 13 logos, split into industry and research
- [ ] **About Us** — the four fact chips, the six sections, the photo collage

### 1.4 Specific things I would like a second pair of eyes on

- [ ] **Team names and job titles.** Several were stored oddly in WordPress
      ("aisling mcanrew", "dr amr mahfouz") and I corrected the capitalisation and
      spelling. Please check I have not corrected something into being wrong
- [ ] **Team email addresses.** About a dozen were stored as broken links in
      WordPress and I repaired them. Click a few and check the address that opens
      looks right
- [ ] **Dr Ciara Fitzgerald has no LinkedIn icon.** The live site links her name
      to Swarit's LinkedIn profile, which is clearly a mistake, so I left it out
      rather than guess. Can you find the right one?
- [ ] **LERO's card links to lero.ie.** On the live site that card links nowhere
      at all. Is lero.ie right?
- [ ] **Punctuation and accents** — é, ü, €, em dashes. The previous rebuild had
      these corrupted throughout, so it is worth a look

### 1.5 On a phone

Open the site on your phone, or narrow the browser window to about 400px.

- [ ] The menu collapses to a hamburger button and opens when tapped
- [ ] The "About" dropdown (Who We Are / Team) is reachable
- [ ] Tapping a link closes the menu
- [ ] No page scrolls sideways
- [ ] Text is readable without zooming; images fit
- [ ] The team grid, project cards and footer stack sensibly

---

# Part 2 — Admin

### 2.1 Getting in, and staying out

- [ ] Signed out, going to `/admin` sends you to the sign-in page
- [ ] Same for `/admin/projects`, `/admin/news`, `/admin/messages`
- [ ] A wrong password gives a clear message and does **not** say whether the
      username exists
- [ ] The correct details sign you in and land you on the Overview
- [ ] "Sign out" works, and `/admin` sends you back to sign-in afterwards
- [ ] Getting the password wrong repeatedly eventually says to wait fifteen
      minutes *(this is per-account and per-computer, so it will affect your next
      sign-in attempt — the limit clears on its own, or restart the server)*

### 2.2 Overview

- [ ] Greets you by name
- [ ] The counts match what is on the site: 11 projects, 7 news, 12 publications
- [ ] The warning about contact email not being configured is shown
- [ ] The explanation of what can and cannot be edited here makes sense to you

### 2.3 Projects — the main event

This is the part the meeting cared about most: **can someone publish content
without a developer?** Please be picky.

**Create**

- [ ] **Add a project** → the form opens
- [ ] Every field says whether it is **required** or **optional**
- [ ] Every field has a line explaining what it is for, in plain language
- [ ] Press **Create project** with everything empty → it refuses and tells you
      which fields it needs, rather than failing silently
- [ ] Put a capital letter or a space in the web address → it explains the rule
- [ ] Type `renew` as the web address → it tells you that address is taken
- [ ] **Importantly:** when it refuses, everything you typed is still there. It
      must never blank the form
- [ ] Fill it in properly, attach a picture, and save
- [ ] It appears in the list marked **Draft**
- [ ] It does **not** yet appear on `/projects` — drafts are invisible to visitors

**Publish**

- [ ] Press **Publish** → the label changes to Published
- [ ] The project now appears on `/projects`
- [ ] Its own page works at the address you gave it
- [ ] Your picture shows on both the card and the page

**Edit**

- [ ] Open **Edit** → every field is filled in with what you saved
- [ ] Change the summary, save, and confirm the change shows on the public page
- [ ] Edit **without** choosing a new picture → the existing picture survives

**External-only**

- [ ] Create a project with **"Link straight to the project website"** ticked and
      a website filled in
- [ ] Publish it. Its card links out to that website
- [ ] Its own address gives a 404 — correct, it has no page of its own

**Delete**

- [ ] Press **Delete** → a dialogue appears explaining what will be lost
- [ ] **Cancel** → nothing happens
- [ ] **Delete project** → it goes, and its public page 404s

**Ordering**

- [ ] Give a project position `1` and check it moves to the front of `/projects`

### 2.4 News, publications, messages

- [ ] **News** list shows all 7 entries, with the one marked *hidden from the
      listing* flagged. That entry is deliberately reachable at its own address
      but kept off `/news-events` — check both
- [ ] **Add news or an event** → write a news post, tick *Publish this*, save →
      it appears on `/news-events`
- [ ] Add one again choosing **Event — still to come**: the date, time, place and
      booking fields appear. Save without a date → it is refused with a message
      naming the field, and nothing you typed is lost
- [ ] **Edit** an existing entry, change the title, save → the change shows on
      the public page, and its photographs are still attached (choosing no new
      files must leave the existing ones alone)
- [ ] Unpublish a news entry → it disappears from `/news-events`
- [ ] Publish it again → it comes back
- [ ] **Publications** list shows 12, grouped names shown against each
- [ ] Unpublish one → it disappears from the right researcher's group on
      `/publications`
- [ ] **Messages** is empty until you use the contact form (next section)

### 2.5 Team and photographs

- [ ] **Team** lists 36 people in the same order as `/team`
- [ ] **Add a person** with a name, a role and a photograph → they appear on
      `/team` in the position you gave them
- [ ] **Hide** somebody → they disappear from `/team` but stay in this list
- [ ] **Edit** somebody and save *without* choosing a new photograph → their
      existing photograph is still there. This is the one that would be easy to
      get wrong
- [ ] **Photographs** shows the 16 About-page pictures. Add one, move it up,
      remove it → the strip on `/about-us` follows

### 2.6 ADFLEX

The same login opens both sites. ADFLEX is the last tab, set apart by a rule.

- [ ] **ADFLEX** tab → the overview says its content is separate from IRESI's
- [ ] **News & events** → empty, with an explanation
- [ ] Add an ADFLEX news post and publish it → it appears on `/adflex/news`
- [ ] It does **not** appear on `/news-events`, and does not appear in IRESI's
      own News list in the admin. This separation is the thing most worth
      checking — if it is wrong, the two sites' content is mixed
- [ ] Conversely, none of IRESI's 7 news entries appear under ADFLEX

### 2.7 Contact form

- [ ] The page shows the **map of Maynooth University** at the bottom
- [ ] Fill in the form on `/contact` and send it
- [ ] You see a thank-you message
- [ ] **The message arrives at <http://localhost:8025>** — check the sender,
      subject and body are what you typed, and that Reply-To is your address
- [ ] It also appears in **Admin → Messages** marked **new**
- [ ] **Reply** opens your email program addressed to the sender
- [ ] **Mark read** removes the "new" badge and the count in the top bar
- [ ] **Delete** asks first, then removes it
- [ ] Sending six or more messages quickly is eventually refused *(the limit is
      about five an hour from one computer)*
- [ ] Submitting with fields empty gives a readable message

---

# Part 3 — Anything else

- [ ] Does anything look visually broken, misaligned or unfinished?
- [ ] Is any wording confusing, especially in the admin?
- [ ] Would someone non-technical at IRESI be able to add a project using only
      what is on screen? **This is the question that matters most.**
- [ ] Anything present on the live site that is missing here?

---

# Record what you find

Copy this table into your reply, or just write freely — whichever is easier.

| # | Where | What you did | What happened | What you expected | How bad |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | blocking / annoying / cosmetic |
| 2 | | | | | |
| 3 | | | | | |

**"How bad" guide**

- **Blocking** — cannot be launched like this
- **Annoying** — works, but an editor would struggle or be confused
- **Cosmetic** — looks wrong, nothing breaks

Screenshots help a lot for anything visual. So does the exact address of the page
you were on.

---

## One last thing

If something behaves oddly, it is worth reloading once before writing it down —
and if you have been switching between the admin and the public site quickly, a
hard reload (Ctrl+F5) rules out a cached page. I chased two "bugs" during
development that turned out to be a stale server and a caching quirk, so it is
worth thirty seconds before you write it up.
