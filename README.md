# Smile Nutraceuticals

Web application for the Smile Nutraceuticals marketplace, developed by Altrastate Technologies Ltd.

The public site explains the marketplace. The catalogue, accounts, and checkout are not open.

Repository: https://github.com/nutracueticals/Smile-Site

## Requirements

- Node.js 20.9 or newer. Next.js 16.4.6 declares `>=20.9.0`. CI uses Node.js 22.
- npm
- A Supabase publishable key is optional for the public pages. It is required before any database call.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local`.

Fill `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` when a database call is needed. Do not put the service-role key in a `NEXT_PUBLIC_` variable.

```bash
npm run dev
```

The site is at `http://127.0.0.1:3000`.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Documents

- [Phase 01 audit](docs/PHASE_01_AUDIT.md)
- [Phase 02 report](docs/PHASE_02_REPORT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Development standards](docs/DEVELOPMENT_STANDARDS.md)
- [Roadmap](docs/ROADMAP_20_PHASES.md)
