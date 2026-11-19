# Phase 03 report

Smile Nutraceuticals now has a public catalogue that reads Supabase. The shop, category pages, search, and product pages are wired to that schema. Migration `20261119095711_catalogue_foundation.sql` has been applied to the linked project. The six categories are live. No products, businesses, prices, or images were invented, so the shop is an empty catalogue.

## What was implemented

- Public catalogue queries in `src/features/catalogue/`. Pages compose the result. Components do not call Supabase.
- `/shop` lists published products with search, category, sort, and page parameters.
- `/shop/[slug]` loads one published product and returns not-found when the database confirms the slug is absent.
- `/categories` and `/categories/[slug]` read active categories. The six discovery themes are the seed taxonomy inside the migration, not hardcoded product cards.
- The header search dialog submits `/shop?q=`. The shop and category toolbars are the same GET form.
- Product cards show name, category, business, optional summary, and an image or a letter fallback. Prices and stock are not shown.
- A minimal `businesses` row is the public identity a product belongs to. It is not an account, an application, or an approval workflow.

## Routes

| Route | Behaviour |
| --- | --- |
| `/shop` | Catalogue listing. Dynamic. |
| `/shop/[slug]` | Product detail, or not-found when the query succeeds and the product is absent. |
| `/categories` | Active categories from Supabase. |
| `/categories/[slug]` | One category and its published products. |
| `/`, `/about`, `/contact` | Unchanged public pages. About copy now says the shop exists and no products are listed yet. |
| `/businesses`, `/services` | Still honest “not open” pages. No directory was built. |

`src/config/routes.ts` marks `/shop/[slug]` and `/categories/[slug]` as implemented. Homepage discovery links go to `/categories/[slug]`.

## Components and modules

Created:

- `src/features/catalogue/queries.ts` — server-only reads, signed image URLs, error states.
- `src/features/catalogue/params.ts` — search sanitising and URL parameters.
- `src/features/catalogue/components.tsx` — toolbar, grid, pagination, empty and unavailable states, image fallback.
- `src/app/shop/loading.tsx`, `src/app/categories/loading.tsx`
- `src/app/shop/[slug]/page.tsx`, `src/app/categories/[slug]/page.tsx`

Updated:

- `src/app/shop/page.tsx`, `src/app/categories/page.tsx`
- `src/components/ui/product-card.tsx`
- `src/components/layout/search-dialog.tsx` and `site-header.tsx`
- `src/components/home/category-discovery.tsx`, `trust-section.tsx`
- `src/config/discovery.ts`, `src/config/routes.ts`
- `src/types/database.ts`, `next.config.ts`
- `src/app/about/page.tsx`

## Database

Migration: `supabase/migrations/20261119095711_catalogue_foundation.sql`, created with `supabase migration new catalogue_foundation`.

| Table | Purpose |
| --- | --- |
| `businesses` | `id`, `display_name`, unique `slug`, `approval_status` (`pending`, `approved`, `rejected`, `suspended`), timestamps. No owner and no application fields. |
| `categories` | Name, unique slug, description, optional `parent_id`, display order, `is_active`, timestamps. |
| `products` | Belongs to one business and one category. Slug is unique. Publication status is `draft`, `published`, or `archived`. `published_at` is required when published. Includes brand, manufacturer, type, ISO country code, ingredients, and a stored `search_vector`. |
| `product_images` | Storage path, alt text, display order, one primary image per product. |

The migration inserts the six category rows only. It does not insert businesses or products.

`private.set_updated_at` maintains `updated_at`. The `private` schema is not in the API schemas.

## RLS and public visibility

Row level security is enabled on all four tables. `anon` and `authenticated` receive `select` only. Insert, update, and delete are revoked.

A public product read requires all of the following:

1. `publication_status = published`
2. The related business is `approved`
3. The related category is `is_active`

Approving a business does not publish its products. Inactive categories are not publicly readable. Image rows are readable only when the parent product row is visible under the product policy. The `product-images` bucket is private, limited to 5 MB and jpeg, png, or webp. Storage select is allowed only when a `product_images.storage_path` matches the object name. There is no upload policy.

Server queries repeat the same filters. They are not the security boundary; the policies are. After the migration was applied, an anonymous insert into `categories` was denied and left no row. Unpublished products and unapproved businesses were not inserted, so those policy paths were not exercised with sample rows.

## Search, filters, and pagination

- Search text is limited to letters, numbers, spaces, and hyphens, and to 80 characters.
- `/shop?q=moringa` is the shareable search URL. Sort is `newest` (default) or `name`. Category is a slug. Page defaults to 1, maximum 500. Page size is 12.
- Changing the toolbar filters submits a new GET without a page parameter, so pagination starts again.
- Search uses the stored `simple` tsvector (`websearch`). If the query also matches a category name, those category ids are included.
- A category page filters to that category only, not its descendants.
- Header search and the page form are one system. Clearing the header field goes to `/shop`.
- No price, stock, rating, or popularity filters.

## Images

Image files are storage paths, not blobs on the product row. After a product passes the public filters, the server creates a one-hour signed URL. `next/image` is allowed to load signed URLs from the project host and uses `unoptimized` so the token is kept. A missing image is a letter tile. `canopy.svg` is not used as a product image. Nothing was uploaded, and the `Products/` folder was not imported.

## Error states

The pages distinguish:

- Database not configured, when the public Supabase environment is missing.
- Database not available yet, when PostgREST reports a missing relation or schema cache. This is the current live state.
- Catalogue could not be loaded, for any other query failure. The error is logged. It is not shown as an empty catalogue.
- No published products, no matches, and a category with no products, when a query succeeds with zero rows.
- Product or category not found, when the query succeeds and the slug is absent. An invalid slug is treated as not found without a query.

## Verification actually performed

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed after the final TypeScript edits. |
| `npm run lint` | Passed after the final edits. |
| `npm run build` | Passed on Next.js 16.4.6. `/shop`, `/shop/[slug]`, `/categories`, and `/categories/[slug]` are dynamic. The build ran before the last about-copy and form-key edits; those edits were typechecked and linted afterward. |
| `/shop` in the browser | Shows the empty catalogue: “No published products are in the catalogue yet.” The category filter lists the six categories. |
| `/shop?q=moringa` | Query is kept in the URL and the search field. The page says no published products match. |
| `/categories` and `/categories/natural-foods` | The six categories render from the database. Natural foods says the category has no published products yet. |
| `/shop/not-a-product` | Not-found page. |
| `/about`, `/businesses` | About remains a public page. Businesses still says the directory is not open. |
| Mobile menu | Opens and lists Shop, Categories, Businesses, Services, and About. |
| Overflow at 360, 390, 430, 768, 1024, and 1440 | No horizontal overflow on the category page (`scrollWidth` did not exceed the viewport). |

Not run, and not claimed:

- Sorting or pagination across more than one page. There are no product rows.
- A product detail page for an existing product.
- Rendering a stored product image. Only the letter fallback is available.
- Row level security for unpublished products and unapproved businesses. Those rows were not created. An anonymous insert into `categories` was denied. Phase 03.1 repeated the anonymous write checks and recorded them in `docs/PHASE_03_1_REPORT.md`.
- Local `supabase db reset`, advisors, or `supabase gen types`. Docker is not running.
- GitHub Actions. No workflow run was inspected.

No test products were inserted into the remote project.

## Blockers

Docker is still unavailable, so the migration was applied to the linked project rather than a local database. Phase 03.1 later generated `src/types/database.ts` from that linked schema. See `docs/PHASE_03_1_REPORT.md`.

## Deferred

Phase 04 adds profiles, registration, business applications, documents, ownership, and the approval workflow on top of `businesses`. Phase 05 adds producer product editing and image upload. Phase 07 adds variants, prices, and stock. None of those screens were started.

## Applied

`supabase db push --linked` applied `20261119095711_catalogue_foundation.sql` to project `wptcofcimxqkznqdpjbr`. The private `product-images` bucket exists. The shop is empty until a published product belongs to an approved business.
