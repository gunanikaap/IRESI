# IRESI

Repository for the [IRESI Centre](https://www.iresi.eu) website — Maynooth University.

The website source lives in **[`Application/`](Application/)**. See
[`Application/README.md`](Application/README.md) for setup, content editing and deployment
instructions.

```bash
cd Application
npm install
npm run dev
```

## What this is

A static rebuild of the IRESI website, replacing the previous WordPress/Elementor installation.
It builds to plain HTML, CSS and images with no database or server runtime, and preserves the
existing `iresi.eu` URLs so the new build can go live behind the same domain.
