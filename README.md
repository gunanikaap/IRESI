# IRESI

Repository for the [IRESI Centre](https://www.iresi.eu) website platform — Maynooth University.

The application lives in **[`Application/`](Application/)**. See
[`Application/README.md`](Application/README.md) for setup, configuration, content editing and
deployment, and [`Application/handover/ACCESS-NEEDED.md`](Application/handover/ACCESS-NEEDED.md)
for what the team still needs to provide before it can be deployed.

```bash
cd Application
npm install
npm run dev
```

## What this is

A replacement for the IRESI WordPress site, built as a **platform rather than a single site**.
Following the review meeting of 12 August 2026, IRESI is the parent and projects such as ADFLEX
run underneath it, sharing one codebase, one admin and one login. Each project supplies its own
identity, navigation, theme and content as configuration.

The existing `iresi.eu` URLs are preserved so the new build can go live behind the same domain.
