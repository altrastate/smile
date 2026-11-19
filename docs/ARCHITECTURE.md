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

## Public site

Phase 02 replaced the foundation demonstration with the public site. The homepage is composed from server components under `src/components/home`. The shell is under `src/components/layout`. Search, the mobile menu, and the account notice are the client pieces, because they open and close.

Implemented pages:

| Path | What it is |
| --- | --- |
| `/` | Homepage |
| `/about` | About Smile |
| `/contact` | Contact status. No address, telephone, or email is published |
| `/shop`, `/categories`, `/businesses`, `/services` | Shop and categories read the catalogue. Businesses and services are still not open |
| Any other path | `not-found` |

`/account` and the later auth, business, and admin paths stay unimplemented. The header Account control says that accounts are not open. On smaller screens that note is inside the menu.

Discovery themes in `src/config/discovery.ts` use the same slugs as the six categories inserted by the catalogue migration. They are not product records. The future path is: a producer publishes a product in Supabase, and the public marketplace reads that record. Do not add a hardcoded product list beside that.

## Folder structure

```text
src/
  app/                  routes, root layout, global styles
  components/
    home/               homepage sections
    layout/             announcement, header, navigation, footer
    shared/             links and the not-yet-open state
    ui/                 reusable controls
  config/               site facts, discovery themes, route contract
  features/             product modules, added per phase
  lib/
    env.ts              public environment validation
    errors.ts           error normalisation
    supabase/           browser client, server client, session proxy
  types/database.ts     generated database types
  validation/           Zod schemas
  proxy.ts              session refresh before rendering
public/brand/           logo, mark, and the homepage drawing
supabase/               CLI config and future migrations
docs/                   architecture, design, standards, roadmap
.github/workflows/      CI
Products/               source photography, not a catalogue
```

## Routing

Public, authentication, customer, business, and admin paths are listed in `src/config/routes.ts`. A route is linked only when `implemented` is true. `primaryNavigation()` is the header list.

Protected areas are not gated yet because those pages do not exist. When they do, the server must check the user with `getUser()` and row-level security, not with a client-side flag.

## Supabase

Project ref: `wptcofcimxqkznqdpjbr`. API URL: `https://wptcofcimxqkznqdpjbr.supabase.co`.

Required public variables, validated in `src/lib/env.ts`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The legacy anon key is not used. `.env.example` names the variables. `.env.local` is gitignored and holds the local values.

`src/proxy.ts` calls `auth.getUser()` when the public variables are present so a later session cookie stays fresh. A missing session is the normal state of a public visitor and is not logged as a failure. If the variables are missing, the proxy continues and the page still renders. If the auth request fails because the network or the auth host is unavailable, the error is logged and the public page still renders. Other thrown errors propagate. A Supabase call made without the variables throws a clear error instead of failing silently.

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

No business tables were created in Phase 01. Phase 03 adds the catalogue migration `supabase/migrations/20261119095711_catalogue_foundation.sql`. It has been applied to the linked project `wptcofcimxqkznqdpjbr`. Local Docker was not used.

The migration creates:

| Table | Role in Phase 03 | Left for a later phase |
| --- | --- | --- |
| `businesses` | Public name, slug, and approval status (`pending`, `approved`, `rejected`, `suspended`) so a product can be attributed | Profiles, applications, ownership, and the approval workflow (Phase 04) |
| `categories` | Name, slug, description, optional parent, display order, active flag. Six root categories are inserted | No separate category admin |
| `products` | Catalogue record belonging to one business and one category, with publication status `draft`, `published`, or `archived` | Producer editing (Phase 05), variants and prices (Phase 07) |
| `product_images` | Storage path, alt text, order, and one primary image | Upload interface (Phase 05) |

A product is publicly readable only when it is `published`, its business is `approved`, and its category is active. Business approval does not publish that business's products. Anonymous and authenticated roles can select those rows and cannot insert, update, or delete them. The `product-images` bucket is private. A storage select policy allows a file to be read only when a visible `product_images` row points at it. There is no public upload policy.

`private.set_updated_at` maintains `updated_at`. That function is not in an exposed schema.

`src/types/database.ts` matches this migration. It was written by hand because `supabase gen types` needs a database, and none was available. Regenerate it after the migration is applied:

```bash
supabase gen types typescript --local > src/types/database.ts
```

Apply the migration only in an environment that has been approved. Do not run `supabase db push` against the linked project unless that approval is explicit.

## What this phase does not include

The public catalogue reads Supabase. Accounts, dashboards, checkout, payments, networking, and administration screens are not implemented. The catalogue migration has been applied to the linked database. The six categories exist. No products are listed yet.
