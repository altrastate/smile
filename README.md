# Smile Nutraceuticals

Web application for the Smile Nutraceuticals marketplace, developed by Altrastate Technologies Ltd.

The public site explains the marketplace and reads the product catalogue from Supabase. Personal accounts, business applications, a restricted review queue, and a producer workspace are implemented. The catalogue, identity, application, and producer migrations are applied to the linked project `wptcofcimxqkznqdpjbr`. Checkout is not open. No products are listed yet.

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

## Local Supabase

Docker and the Supabase CLI run the local stack. This project does not use the default ports, because another local stack already uses them. From `supabase/config.toml`: API `54421`, database `54422`, Studio `54423`, and mail capture `54424`.

```bash
npx supabase start
```

Local email confirmation is captured by the local mail service. That does not send mail from the hosted project. Do not commit `.env.local` or the local keys printed by `npx supabase status`.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run test:e2e
npm run build
```

`npm test` is the unit suite. `npm run test:db` needs the local stack and talks to Postgres as the disposable identities. `npm run test:e2e` starts the app against that same local stack. CI runs all three. None of them uses the hosted project.

## Documents

- [Phase 01 audit](docs/PHASE_01_AUDIT.md)
- [Phase 02 report](docs/PHASE_02_REPORT.md)
- [Phase 03 report](docs/PHASE_03_REPORT.md)
- [Phase 03.1 report](docs/PHASE_03_1_REPORT.md)
- [Phase 04 report](docs/PHASE_04_REPORT.md)
- [Phase 04.1 report](docs/PHASE_04_1_REPORT.md)
- [Phase 05 report](docs/PHASE_05_REPORT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Development standards](docs/DEVELOPMENT_STANDARDS.md)
- [Roadmap](docs/ROADMAP_20_PHASES.md)
