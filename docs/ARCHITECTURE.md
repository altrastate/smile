# Architecture

Smile Nutraceuticals is a Next.js application with a single Supabase project as its backend. Android and iOS clients are out of scope. They will use this same project later.

## Decisions

- Next.js 16 App Router and TypeScript strict mode. There was no existing application to preserve.
- Tailwind CSS 4 holds the design tokens. Component styling uses those tokens rather than one-off values.
- Supabase Auth, Postgres, and Storage are the backend. Phase 01 connects the clients and does not create tables.
- Zod validates input at the boundary where data is accepted.
- Radix UI is used only where focus behaviour is easy to get wrong: dialog, dropdown menu, tabs, and tooltip. Checkbox, radio, and select are native controls.
- npm is the package manager. No lockfile existed before this phase.
- Routes are declared in `src/config/routes.ts`. A route is not linked until its page exists and `implemented` is true.

## Request boundaries

| Path | May do | Must not do |
| --- | --- | --- |
| `src/app` | Compose a route, read server data, set metadata | Hold reusable business rules or large interface markup |
| `src/components` | Shared visual components | Call Supabase or decide permissions |
| `src/features` | One product area, added when that phase starts | Own URL structure |
| `src/lib/supabase/server.ts` | Server-side data access with the publishable key and the user session | Run in the browser |
| `src/lib/supabase/client.ts` | Browser access with the publishable key | Read the service-role key |
| `src/proxy.ts` | Refresh the auth session cookie | Enforce permissions for pages that do not exist yet |

Sensitive work belongs in Server Components, server functions, or the database. The browser receives the publishable key only.

There is no service-role client in this phase. When one is required, it lives in a `server-only` module, reads `SUPABASE_SERVICE_ROLE_KEY`, and is never imported by a client component. Authorization data belongs in `app_metadata`, not in user-editable `user_metadata`.

## Folder structure

```text
src/
  app/                  routes, root layout, global styles
  components/
    foundation/         Phase 01 design-system screen
    layout/             header and footer
    ui/                 reusable controls
  config/               site facts and the route contract
  features/             product modules, added per phase
  lib/
    env.ts              public environment validation
    errors.ts           error normalisation
    supabase/           browser client, server client, session proxy
  types/database.ts     generated database types
  validation/           Zod schemas
  proxy.ts              session refresh before rendering
public/brand/           logo served to the app
supabase/               CLI config and future migrations
docs/                   architecture, design, standards, roadmap
Products/               source photography, not a catalogue
```

## Routing

Public, authentication, customer, business, and admin paths are listed in `src/config/routes.ts`. Only `/` is implemented. Any other path renders `not-found`, which states that the page is not in this release.

Protected areas are not gated yet because those pages do not exist. When they do, the server must check the user with `getUser()` and row-level security, not with a client-side flag.

## Supabase

Project ref: `wptcofcimxqkznqdpjbr`. API URL: `https://wptcofcimxqkznqdpjbr.supabase.co`.

Required public variables, validated in `src/lib/env.ts`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The legacy anon key is not used. `.env.example` names the variables. `.env.local` is gitignored and holds the local values.

`src/proxy.ts` calls `auth.getUser()` when those variables are present so a later session cookie stays fresh. If they are missing, the proxy continues and the foundation page still renders. A Supabase call made without them throws a clear error instead of failing silently.

### Types and migrations

`src/types/database.ts` matches the current empty `public` schema. After the first real migration, regenerate it:

```bash
supabase gen types typescript --linked > src/types/database.ts
```

Create a migration only through the CLI, then edit that file:

```bash
supabase migration new <name>
```

Do not invent migration filenames. Do not use `apply_migration` to iterate on a local schema. Apply SQL while exploring, run advisors, then `supabase db pull <name> --local --yes` when the change should be kept. Every table in an exposed schema gets row-level security and policies that match the real access model. Views in Postgres 15+ should use `security_invoker`. `security definer` functions stay out of exposed schemas.

### Database plan

No business tables are created in Phase 01. The remote `public` schema is empty, and it stays empty.

Later phases add tables only when that phase needs them:

| Phase | Data |
| --- | --- |
| 03 | Categories and public product reads |
| 04 | Profiles, business applications, approval status |
| 05–07 | Producer catalogue, inventory, variants, prices |
| 08–11 | Carts, orders, payments, delivery records |
| 12–14 | Directory profiles, quotations, services |
| 15–17 | Moderation records, notifications, country and currency |

Orders, payments, and delivery are separate concerns. A payment row is not a substitute for an order, and a direct vendor payment must be distinguishable from a platform-mediated payment. Business accounts require administrator approval before they can trade. Those rules are recorded here so later phases do not invent a different split.

Storage buckets for product images come with the catalogue, not before there are product records.

## What this phase does not include

Shop, accounts, dashboards, checkout, payments, networking, and administration screens are not implemented. Phase 02 has not been started.
