# Smile Nutraceuticals

Web foundation for the Smile Nutraceuticals marketplace, developed by Altrastate Technologies Ltd.

Phase 01 establishes the application architecture, the design system, and the Supabase client structure. The marketplace itself is not built yet.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase publishable key for project `wptcofcimxqkznqdpjbr`

## Setup

```bash
npm install
```

Copy `.env.example` to `.env.local`.

Fill `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Do not put the service-role key in a `NEXT_PUBLIC_` variable.

```bash
npm run dev
```

The foundation screen is at `http://127.0.0.1:3000`.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Documents

- [Phase 01 audit](docs/PHASE_01_AUDIT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Development standards](docs/DEVELOPMENT_STANDARDS.md)
- [Roadmap](docs/ROADMAP_20_PHASES.md)
