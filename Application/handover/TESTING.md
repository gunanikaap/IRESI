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
| Username | `testeditor` |
| Password | `TestPassw0rd!local` |

The username is deliberately **not** an email address — nothing is ever sent to
it, so an email there would be a promise the site does not keep.

### If it is not running

Run these in your own terminal and **leave that terminal open** — the server
stops when the window closes.

```bash
docker start iresi-test-db          # the test database
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
npm run db:user -- testeditor "Test Editor"
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

**2. Contact form messages are not emailed.** They are stored in
**Admin → Messages** instead, because IRESI has not given us SMTP details yet.
That is expected, and the Messages page says so. Nothing is lost.

---

## Known gaps — please do not report these

These are already on the list. Reporting them costs you time and tells me
nothing new.

| Gap | Why |
| --- | --- |
| News and publications cannot be **written or edited** in the admin | Only publish/unpublish/delete work so far. The forms follow the same pattern as the project form and are the next piece of work. Both pages say so on screen |
| No SMTP / no emails sent | Waiting on credentials from IRESI |
| No sitemap, no canonical links | Waiting on the confirmed staging address |
| The team list, research topic pages, partner logos and standing page text are not editable in the admin | Deliberate — they change rarely and live in the code. See the README |
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

Remember: only publish/unpublish/delete work here for now.

- [ ] **News** list shows all 7 entries, with the one marked *hidden from the
      listing* flagged. That entry is deliberately reachable at its own address
      but kept off `/news-events` — check both
- [ ] Unpublish a news entry → it disappears from `/news-events`
- [ ] Publish it again → it comes back
- [ ] **Publications** list shows 12, grouped names shown against each
- [ ] Unpublish one → it disappears from the right researcher's group on
      `/publications`
- [ ] **Messages** is empty until you use the contact form (next section)

### 2.5 Contact form

- [ ] Fill in the form on `/contact` and send it
- [ ] You see a thank-you message
- [ ] It appears in **Admin → Messages** marked **new**
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
