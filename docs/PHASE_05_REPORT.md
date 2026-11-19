# Phase 05 report

## 1. Phase 05 objective

Give an approved producer a workspace where they can maintain the public storefront and create, edit, publish, unpublish, and archive their own listings. The public catalogue rules stay in place. Business approval does not publish products.

## 2. Repository starting commit

`1c8c1c2845c77992bb3364daab6ccc4ee5f837a8`

## 3. Final implementation commit

Recorded after the implementation commit is created. The message is `Implement Phase 05 producer dashboard and storefront management`.

## 4. Architecture changes

The workspace uses the existing businesses, products, categories, and product_images tables. New behaviour goes through `private` functions with `public` security-invoker wrappers, the same split used in Phase 04.1. `src/types/phase05.ts` extends the hand-written database type. It is not generated.

## 5. New and modified routes

- `/dashboard`
- `/dashboard/storefront`
- `/dashboard/products`
- `/dashboard/products/new`
- `/dashboard/products/[productId]/edit`
- `/dashboard/settings`
- `/businesses/[slug]` for the public storefront of one approved business

`/businesses` remains the closed directory page. Manufacturer, supplier, cart, order, and price management routes were not added.

## 6. Database changes

Added, not applied: `supabase/migrations/20261119131559_producer_storefront.sql`.

It adds public storefront columns to `businesses`, a path check on `product_images`, `product_image_orphans`, and functions for workspace lookup, storefront update, product create, product update, publication change, and image attach or remove. It also adds a select policy so an approved producer can read their own unpublished listings.

## 7. Storage changes

The `product-images` bucket stays private and keeps its 5 MB JPEG, PNG, and WebP limit. New insert and delete policies allow an approved producer to write only an object whose path is `{business id}/{product id}/{random id}.{jpg|png|webp}` for a product they can manage. Public reads still require a visible image row.

## 8. Authorization and RLS implementation

`private.assert_producer` requires `auth.uid()`, a membership, business kind `producer`, and approval `approved`. Pending, rejected, suspended, and non-producer businesses fail that check. The functions do not accept an applicant id from the browser. Storefront update cannot set `approval_status`. Product update cannot change `business_id` or publication status. Publication is a separate function with an allow-list of transitions. Contact email and telephone are revoked from anonymous and authenticated table selects.

This was reviewed in SQL and covered by unit tests of the decision rules. It was not executed against Postgres.

## 9. Product lifecycle behaviour

The database statuses remain `draft`, `published`, and `archived`. A draft with no `published_at` is shown as Draft. A draft that still has `published_at` is shown as Unpublished. Publish, unpublish, archive, and restore-to-draft are the allowed moves. Archive requires a confirmation checkbox. A published listing is publicly visible only when the existing catalogue rule also passes: published, business approved, and category active. The publication function refuses an inactive category. It does not approve the business.

## 10. Storefront management behaviour

An approved producer can change the display name, description, country, city, district, website, contact email, and telephone. The slug is not changed, so the public address stays stable. The public page shows name, description, place, website, and up to 24 published listings. It does not show email or telephone. Logo and cover image were not added because the business table did not have them. Completion on the overview counts description, country, city, and website.

## 11. Tests written

`src/features/dashboard/dashboard.test.ts` covers eligibility, storefront completion, publication labels and transitions, form validation, image signatures and paths, and a source check that the new migration does not drop catalogue policies or publish products from business approval. The source check is not an integration test.

## 12. Tests executed

```bash
npm test
```

38 tests, 38 passed, 0 failed. That includes the previous catalogue, auth, application, and document tests.

Not executed: anonymous, producer A, producer B, pending, suspended, reviewer, and administrator sessions against Postgres. Docker was not available. The linked project was not used as a fixture.

## 13. CI results

Recorded after the commit is pushed.

## 14. Browser testing results

The dashboard and listing forms need the unapplied migrations, so sign-in, draft creation, upload, publish, and cross-business checks were not run against Supabase.

An anonymous visit to `/dashboard` redirects to `/login?next=%2Fdashboard`. On that login page, horizontal overflow was 0 at 360, 390, 430, 768, 1024, and 1440. `/shop` still says no products are published. A direct storefront address with no matching business returns the normal not-found page.

## 15. Known limitations

- The four identity and producer migrations are committed and not applied.
- Generated types still describe the catalogue schema only.
- Email delivery remains unverified from Phase 04.
- A producer can restore an archived listing to draft, not directly back to published.
- The public business directory is still closed. Only a direct storefront address is open.
- Image upload is storage plus a database function, not one database transaction. A failed database insert removes the object, and a failed removal is recorded in `product_image_orphans`.

## 16. Outstanding Phase 04 and Phase 04.1 dependencies

Phase 05 SQL uses `business_members`, `business_applications`, `business_kind`, and `auth.uid()`. Those objects come from:

1. `20261119113107_identity_and_applications.sql`
2. `20261119124504_application_history_guards.sql`
3. `20261119124532_application_transactions.sql`

Until those are applied, `/dashboard` tells a signed-in user that the workspace is not available.

## 17. Migration instructions

Do not run `supabase db push` against the linked project without explicit approval. Apply, in order, on a disposable database first:

1. `20261119095711_catalogue_foundation.sql` if that database does not already have it
2. `20261119113107_identity_and_applications.sql`
3. `20261119124504_application_history_guards.sql`
4. `20261119124532_application_transactions.sql`
5. `20261119131559_producer_storefront.sql`

Then regenerate types:

```bash
supabase gen types typescript --linked --schema public > src/types/database.ts
```

Retire `src/types/phase04.ts` and `src/types/phase05.ts` only after the generated file includes the new tables and functions. Grant a reviewer with the existing operator insert into `user_roles`. Do not insert demonstration businesses into the linked project.

## 18. Security findings

The workspace does not use user metadata for authorization and does not read a service-role key. Cross-business changes depend on `assert_producer`, which was not executed with two real users. A signed-in member can call the public functions with their own session. Forged business and product ids fail closed once the functions exist. Internal reviewer notes are not selected by the workspace. Contact fields are omitted from the public storefront query.

## 19. Features deliberately deferred to later phases

Manufacturer and supplier workspaces, inventory, variants, pricing, cart, checkout, orders, payments, delivery, the business directory, wholesale, service providers, a full admin console, and notifications were not built.

## 20. Final readiness recommendation

Conditionally accepted. The producer workspace and the publication rules are implemented and unit-tested. Phase 05 is not fully accepted until the identity and producer migrations are applied on an approved database and the permission matrix is executed there.

Phase 06 was not started.
