# Phase 03.1 report

## Executive summary

Phase 03 was audited against the repository, the linked database, and the running site. The catalogue schema matches the migration. Database types are now generated from that schema. Anonymous visitors can read the six categories and cannot write catalogue rows or upload a PNG. Search no longer builds a filter from unsanitised text, and a page past an empty result no longer looks like a database failure.

Phase 03 is conditionally accepted. The six-row public visibility matrix was not executed, because that requires fixture businesses and products. Docker is not running, and those rows were not created in the linked database.

## Starting commit

`8118ddf9bf89ec5e5ce162741052bb2c35602924` — Add the public catalogue backed by Supabase.

## Files inspected

`package.json`, `README.md`, `docs/ROADMAP_20_PHASES.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/PHASE_02_REPORT.md`, `docs/PHASE_03_REPORT.md`, `src/types/database.ts`, `src/lib/supabase/`, `src/lib/env.ts`, `src/features/catalogue/`, `src/app/shop/`, `src/app/categories/`, `src/components/ui/product-card.tsx`, `supabase/migrations/20261119095711_catalogue_foundation.sql`, and `.github/workflows/ci.yml`.

## Issues discovered

- Product search interpolated a search string into a PostgREST `.or()` filter. Sanitising the URL reduced the risk, but the query function still trusted its caller.
- Requesting a page past an empty result made PostgREST return “Requested range not satisfiable”. The shop showed that as “The catalogue could not be loaded.”
- Equal product names or publication times had no final tie-break, so page order was not guaranteed.
- `src/types/database.ts` was hand-written. It matched the migration, but it was not generated and its relationships were empty.
- `docs/PHASE_02_REPORT.md` still said GitHub Actions had not been observed.
- There is no automated test runner in the Phase 03 commit.

No schema defect required a new migration. The applied migration already has the business, category, product, and image tables, the expected enums, foreign keys, slug checks, one-primary-image uniqueness, the private bucket, and select-only grants.

A category can still point at another category in a cycle longer than one step. The self-parent check exists. That is a data-integrity limit, not a public visibility hole, and it was left unchanged.

## Changes implemented

- `src/features/catalogue/search.ts` accepts a search term only after sanitising, and builds a combined filter only from that term plus UUID category ids.
- `listProducts` sanitises inside the query, uses the parameterised text-search call when no category name matches, orders by id after the requested sort, and treats an unsatisfiable page range as an empty page.
- A page past the results links back to the first page instead of pretending the catalogue failed.
- `src/types/database.ts` was replaced with the types generated from the linked project.
- `tsx` runs the catalogue tests. CI runs them after lint and before the production build.

No new SQL migration was added. `supabase db push` was not run.

## Database type generation

Succeeded against the linked project:

```bash
supabase gen types typescript --linked --schema public
```

The generated `Database` type includes `businesses`, `categories`, `products`, and `product_images`, both enums, and the foreign keys from categories to themselves, products to businesses and categories, and images to products. `private.set_updated_at` is not in the public API types, which matches the unexposed `private` schema. `npm run typecheck` passed with these types.

The first generation attempt failed with `LegacyGenTypesNetworkError`. The retry succeeded.

## RLS results

Reviewed in `20261119095711_catalogue_foundation.sql`. Public select requires a published product, an approved business, and an active category. Archived and draft products are not published. There are no insert, update, or delete policies. Grants are select-only.

Executed with the publishable key, as an anonymous client, against the linked database. No rows were created.

| Check | Result |
| --- | --- |
| Read active categories | Passed. The six category slugs were returned. |
| Read products | Passed. Zero rows. |
| Read businesses | Passed. Zero rows. There are no businesses, so this does not prove that a pending business is hidden. |
| Read product images | Passed. Zero rows. |
| Insert a category | Denied. `permission denied for table categories`. |
| Insert a business, including an approved status | Denied. |
| Insert a product | Denied. |
| Insert a product image row | Denied. |
| Update a category | Denied. |
| Upload `image/png` to `product-images` | Denied. `new row violates row-level security policy`. |
| List `product-images` | Passed as an empty listing. Zero objects. |

Visibility matrix:

| Business | Product | Category | Expected | Result |
| --- | --- | --- | --- | --- |
| Approved | Published | Active | Visible | Not tested. No fixture row. |
| Pending | Published | Active | Hidden | Not tested. No fixture row. |
| Rejected | Published | Active | Hidden | Not tested. No fixture row. |
| Suspended | Published | Active | Hidden | Not tested. No fixture row. |
| Approved | Draft | Active | Hidden | Not tested. No fixture row. |
| Approved | Published | Inactive | Hidden | Not tested. No fixture row. |

Docker Desktop’s engine is not running, so a local Supabase database was not started. Fixture rows were not inserted into the linked database.

## Storage

The `product-images` bucket exists and is private. An anonymous PNG upload is rejected by row level security. A text upload is also rejected, by the bucket mime-type limit, before the image check. No product image file exists, so a signed URL for a real object was not tested. Product pages still use the letter fallback when `src` is null. Alternative text is used when an image source exists, and the product name is the fallback.

## Search, filtering, and routes

| Check | Result |
| --- | --- |
| `/shop` | Empty catalogue. The category filter lists the six categories. Previously verified after the migration and unchanged by this pass except for the query hardening. |
| `/shop?q=moringa` | No published products match. The query stays in the field and the URL. |
| `/shop?q=moringa&page=9` | Before the fix, the page said the catalogue could not be loaded. After the fix, it says no products match. |
| `/categories/not-a-category` | Not-found page. |
| `/categories/natural-foods` | Empty category state. Verified when the migration was applied. |
| `/shop/not-a-product` | Not-found page. Verified when the migration was applied. |
| Category filtering, newest sort, and alphabetical sort against product rows | Not tested. There are no products. |
| Pagination across more than one page of products | Not tested. The page-number parser and the out-of-range state are covered by unit tests. |

## Automated tests

`npm test` runs 13 tests in `src/features/catalogue/catalogue.test.ts`. All passed. They cover sanitising, long input, category slugs, sort values, invalid pages, repeated parameters, catalogue URLs, the search-filter boundary, and page-range state. They do not replace the database visibility tests.

## Typecheck, lint, and build

`npm run typecheck` passed after the generated types and query changes. `npm run lint` passed. `npm test` passed, 13 tests. `npm run build` passed on Next.js 16.4.6. Shop, product, and category routes remain dynamic.

## CI

Phase 02 run, success: https://github.com/nutracueticals/Smile-Site/actions/runs/44499629703 for `a48ba06`.

Phase 03 run, success: https://github.com/nutracueticals/Smile-Site/actions/runs/44510021582 for `8118ddf`.

The Phase 03.1 workflow run does not exist until this commit is pushed. CI now includes `npm test`.

## Documentation

Updated `docs/PHASE_02_REPORT.md`, `docs/PHASE_03_REPORT.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP_20_PHASES.md`, and `README.md`. Phase 04 is still the next phase. Phase 03.1 is recorded as verification of Phase 03, not as a new roadmap phase.

## Remaining limitations

- The visibility matrix has not been executed with fixture data.
- Signed image URLs have not been tested with a stored file.
- Sorting and multi-page results have not been tested with product rows.
- A longer category parent cycle is still possible.
- Local Docker is unavailable.

## Phase 04

Phase 04 was not started. There is no registration, login, application, or approval screen.

## Recommendation

Conditionally accepted.

The public catalogue, category seed, generated types, anonymous write denial, and private image bucket are in place. Phase 03 should not be treated as fully accepted until the visibility matrix is run in a local or isolated database with temporary businesses and products, then removed.
