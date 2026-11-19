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

There is no service-role client. Privileged application changes run inside `private` security-definer functions, as the signed-in user. Roles live in `public.user_roles`. Do not read `user_metadata` to grant a role. `reviewer` and `admin` are inserted by an operator, not by registration.

## Public site

Phase 02 replaced the foundation demonstration with the public site. The homepage is composed from server components under `src/components/home`. The shell is under `src/components/layout`. Search and the mobile menu are client pieces, because they open and close. The header account link goes to `/account` when a session exists and to `/login` otherwise.

Implemented pages:

| Path | What it is |
| --- | --- |
| `/` | Homepage |
| `/about` | About Smile |
| `/contact` | Contact status. No address, telephone, or email is published |
| `/shop`, `/categories`, `/businesses`, `/services` | Shop and categories read the catalogue. Businesses and services are still not open |
| `/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email` | Account access. Email links return through `/auth/callback` |
| `/account`, `/account/profile`, `/account/applications` | Signed-in account, profile, and application list |
| `/business/apply`, `/business/apply/[applicationId]`, `/business/application-submitted` | Draft, edit, and submission confirmation |
| `/review`, `/review/applications/[applicationId]` | Reviewer queue and decision. Other signed-in users see access denied |
| `/terms` | Short account terms for registration |
| Any other path | `not-found` |

Protected pages call `requireUser()` or `requireReviewer()` on the server. A missing session redirects to `/login`. An unconfirmed email redirects to `/verify-email`. The proxy still only refreshes the session cookie. It is not the permission check.

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
  features/             auth, applications, review, catalogue
  lib/
    env.ts              public environment validation
    errors.ts           error normalisation
    supabase/           browser client, server client, session proxy
  types/
    database.ts         generated catalogue types
    phase04.ts          hand-written identity types, not generated
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

Protected pages check the user with `getUser()` and the database policies. A client-side flag is not the boundary.

## Supabase

Project ref: `wptcofcimxqkznqdpjbr`. API URL: `https://wptcofcimxqkznqdpjbr.supabase.co`.

Required public variables, validated in `src/lib/env.ts`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The legacy anon key is not used. `.env.example` names the variables. `.env.local` is gitignored and holds the local values.

`src/proxy.ts` calls `auth.getUser()` when the public variables are present so a later session cookie stays fresh. A missing session is the normal state of a public visitor and is not logged as a failure. If the variables are missing, the proxy continues and the page still renders. If the auth request fails because the network or the auth host is unavailable, the error is logged and the public page still renders. Other thrown errors propagate. A Supabase call made without the variables throws a clear error instead of failing silently.

### Types and migrations

`src/types/database.ts` is generated from the local schema after the Phase 05 migrations. The hand-written supplements are gone. Regenerate after a schema change with `npx supabase gen types typescript --local --schema public`. The generator types `p_years_operating` as `number`. That integer argument stores null when the field is blank, so the file keeps `number | null` for that argument.

Create a migration only through the CLI, then edit that file:

```bash
supabase migration new <name>
```

Do not invent migration filenames. Do not use `apply_migration` to iterate on a local schema. Apply SQL while exploring, run advisors, then `supabase db pull <name> --local --yes` when the change should be kept. Every table in an exposed schema gets row-level security and policies that match the real access model. Views in Postgres 15+ should use `security_invoker`. `security definer` functions stay out of exposed schemas.

### Database plan

No business tables were created in Phase 01. Phase 03 adds the catalogue migration `supabase/migrations/20261119095711_catalogue_foundation.sql`. It is applied locally and on the linked project `wptcofcimxqkznqdpjbr`.

The migration creates:

| Table | Role in Phase 03 | Left for a later phase |
| --- | --- | --- |
| `businesses` | Public name, slug, and approval status (`pending`, `approved`, `rejected`, `suspended`) so a product can be attributed | Phase 04 adds `created_by`. Anonymous and authenticated clients cannot select that column or the contact columns |
| `categories` | Name, slug, description, optional parent, display order, active flag. Six root categories are inserted | No separate category admin |
| `products` | Catalogue record belonging to one business and one category, with publication status `draft`, `published`, or `archived` | Variants and prices (Phase 07) |
| `product_images` | Storage path, alt text, order, and one primary image | Phase 05 adds the producer upload path |

Phase 04 adds `supabase/migrations/20261119113107_identity_and_applications.sql`. Phase 04.1 adds `20261119124504_application_history_guards.sql` and `20261119124532_application_transactions.sql`. Phase 05 adds `20261119131559_producer_storefront.sql`. A later migration, `20261119140843_category_parent_cycle.sql`, rejects a category parent cycle. All of these are applied locally and on the linked project. They do not replace the catalogue migration. Approval still does not update `products`.

An approved producer manages listings through database functions. Those functions create drafts, edit listing text, and change publication among `draft`, `published`, and `archived`. Unpublishing returns a listing to `draft` and keeps `published_at`, so the workspace can show it as unpublished. Publishing does not change `businesses.approval_status`. Direct insert, update, and delete on `products` and `product_images` stay revoked. Storefront text is added to `businesses`. Contact email and telephone are not granted to anonymous or authenticated table reads. `producer_workspaces()` returns them only to the signed-in member.

Creating, saving, and deciding an application each go through one database function, so the business, application, categories, membership, note, and history row change together or not at all. The privileged functions live in `private`. `public` wrappers are security invoker because the Data API only exposes `public`. Direct inserts and updates on businesses, applications, categories, memberships, events, and internal notes are revoked from `authenticated`. Document uploads still use storage and a document row, with a recovery row if the file cannot be removed after a failed insert.

A product is publicly readable only when it is `published`, its business is `approved`, and its category is active. Business approval does not publish that business's products. Anonymous and authenticated roles can select those rows and cannot insert, update, or delete them. The `product-images` and `business-documents` buckets are private. A storage select policy allows a product file to be read only when a visible `product_images` row points at it. There is no public upload policy. The visibility matrix was executed locally with disposable identities. It was not repeated by inserting rows into the hosted project.

Catalogue queries sanitise search text before it reaches Supabase. Product text uses the parameterised text-search filter. A category-name match is included only with category ids that are UUIDs. Listing order ends with the product id. A page past the result set is returned as an empty page.

`private.set_updated_at` maintains `updated_at`. That function is not in an exposed schema.

Regenerate `src/types/database.ts` from the local schema after a schema change. Do not run `supabase db push` against the linked project unless that approval is explicit. The Phase 05 push is already applied.

## What this phase does not include

The public catalogue, accounts, business applications, review, and the producer workspace read the linked Supabase project. Checkout, payments, networking, and the full administration console are not implemented. The six categories exist. No products are listed yet. Phase 06 has not been started.
