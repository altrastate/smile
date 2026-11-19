# Phase 05 report

## 1. Phase 05 objective

Give an approved producer a workspace where they can maintain the public storefront and create, edit, publish, unpublish, and archive their own listings. The public catalogue rules stay in place. Business approval does not publish products.

## 2. Repository starting commit

`1c8c1c2845c77992bb3364daab6ccc4ee5f837a8`

## 3. Final implementation commit

Implementation commit: `df9408982fd1856713cbe4bf64210cba5105ac9d`

https://github.com/nutracueticals/Smile-Site/commit/df9408982fd1856713cbe4bf64210cba5105ac9d

Message: `Implement Phase 05 producer dashboard and storefront management`

The listing pages under `src/app/dashboard/products` were left out of that commit because `.gitignore` used `Products/`, and Windows treats that as the same as `products/`. The ignore is now anchored to `/Products/`, and the listing pages are committed with it.

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

Applied locally and on the linked project: `supabase/migrations/20261119131559_producer_storefront.sql`.

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

Success for `a5eb4623e7b450e716644c3529e4d2fa1e929451`:

https://github.com/nutracueticals/Smile-Site/actions/runs/44534349957

That commit contains the producer workspace, the listing pages, and the ignore-rule correction. Install, typecheck, lint, test, and build are the CI steps.

## 14. Browser testing results

The dashboard and listing forms need the unapplied migrations, so sign-in, draft creation, upload, publish, and cross-business checks were not run against Supabase.

An anonymous visit to `/dashboard` redirects to `/login?next=%2Fdashboard`. On that login page, horizontal overflow was 0 at 360, 390, 430, 768, 1024, and 1440. `/shop` still says no products are published. A direct storefront address with no matching business returns the normal not-found page.

## 15. Known limitations

Sections 20–23 replace the status below. The limitations that remain are listed there.

- Email delivery to an external mailbox remains unverified.
- A producer can restore an archived listing to draft, not directly back to published.
- The public business directory is still closed. Only a direct storefront address is open.
- Image upload is storage plus a database function, not one database transaction. A failed database insert removes the object, and a failed removal is recorded in `product_image_orphans`.

## 16. Outstanding Phase 04 and Phase 04.1 dependencies

Phase 05 SQL uses `business_members`, `business_applications`, `business_kind`, and `auth.uid()`. Those objects come from:

1. `20261119113107_identity_and_applications.sql`
2. `20261119124504_application_history_guards.sql`
3. `20261119124532_application_transactions.sql`

Those migrations, the producer migration, and the category-cycle migration are applied locally and on the linked project.

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

## 20. Verification on 19 November 2026

Local Docker Supabase is running with the ports in `supabase/config.toml` (API 54421, database 54422, Studio 54423, mail 54424). A clean local reset applied every migration, including `20261119140843_category_parent_cycle.sql`. The database suite then passed: 18 tests, 0 failed. That suite uses separate authenticated identities. It covers catalogue visibility, application isolation, illegal transitions, self-approval, transaction rollback, concurrent review decisions, producer isolation, storage authorization, and local auth mail. It does not use the hosted project.

The browser suite passed once: register, confirm through the local mail capture, submit an application, approve it as a different reviewer, edit the storefront, create and edit a listing, upload and remove an image, publish, confirm the public page, unpublish to a 404, publish again, archive to a 404, then confirm the workspace stays closed for a suspended producer, an approved manufacturer, a pending producer, a user with no business, a reviewer opening another business's listing, and an anonymous visitor. Widths 360, 390, 430, 768, 1024, and 1440 were checked on the login page and the shop page.

Unit tests: 39 passed, 0 failed. Typecheck, lint, and the production build passed locally.

The linked project `wptcofcimxqkznqdpjbr` already had `20261119095711` only. It had 6 categories, 0 businesses, 0 products, and 0 images. A schema dump was written outside the repository before the push. `supabase db push` then applied the five remaining migrations. After the push, the same row counts remained, row-level security was enabled on the public tables, both storage buckets were private, the application and producer functions were present, anonymous clients could read category names and could not select `contact_email`, and the public product list was empty. No hosted test account was created.

## 21. Corrections found during verification

- Column `REVOKE` did not remove `contact_email` or `created_by` while the table `SELECT` grant remained. The grants are now limited to the public columns.
- Security-invoker wrappers could not see `private` until `authenticated` had usage on that schema. Execute stays limited to the wrapper targets.
- `producer_may_store_image` used variable names that collided with columns, so an image upload failed.
- A category parent cycle longer than a self-parent was not rejected.
- A React 19 submit button dropped `name="intent"`, so submitting an application saved a draft.
- A producer whose only business was suspended saw a business chooser instead of the suspension message.
- `app/shop/loading.tsx` started the response before `notFound()`, so an unpublished product stayed HTTP 200. Those loading files were removed, and missing catalogue records call `notFound()` from metadata as well.

## 22. Remaining limitations

- Local mail is captured by the local mail service. Real SMTP delivery was not tested.
- Storage enforces the declared content type and size. The application checks the file signature before upload. A direct Storage API call that declares `image/jpeg` and sends other bytes is not rejected by the bucket.
- The hosted project was not given fixture accounts, documents, or products. The permission matrix remains a local result.
- An archived listing returns to draft before it can be published again.

## 23. Final readiness recommendation

The local permission matrix, the producer browser flow, the hosted schema update, and CI are done. The verification commit is `f0bb9b98f5b5d8d458ee941d9f9f8d39b487bea4`. CI run: https://github.com/nutracueticals/Smile-Site/actions/runs/44561033712. The verify, database, and browser jobs succeeded. Phase 05 is closed. Phase 06 was not started.
