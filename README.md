# Smile Nutraceuticals

Web application for the Smile Nutraceuticals marketplace, developed by Altrastate Technologies Ltd.

The public site explains the marketplace and reads the product catalogue from Supabase. Personal accounts, business applications, and a restricted review queue are implemented. The identity migration has not been applied to the linked database, so those screens cannot save data until it is. Checkout is not open. The catalogue migration has been applied. No products are listed yet.

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
npm test
npm run build
```

## Documents

- [Phase 01 audit](docs/PHASE_01_AUDIT.md)
- [Phase 02 report](docs/PHASE_02_REPORT.md)
- [Phase 03 report](docs/PHASE_03_REPORT.md)
- [Phase 03.1 report](docs/PHASE_03_1_REPORT.md)
- [Phase 04 report](docs/PHASE_04_REPORT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Development standards](docs/DEVELOPMENT_STANDARDS.md)
- [Roadmap](docs/ROADMAP_20_PHASES.md)
