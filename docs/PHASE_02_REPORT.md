# Phase 02 report

Date: 19 November 2026. Phase 02 is the public website. The catalogue, accounts, and commerce flows were not started.

## What was implemented

The Phase 01 foundation demonstration is no longer the homepage. The public site has a header, announcement line, search dialog, account notice, mobile menu, footer, and an eight-section homepage.

The announcement is the official tagline, `site.announcement`. It is not a promotion. Set it to `null` to remove the strip.

Search accepts text, can be cleared, is labelled, and says that product search starts when the catalogue launches. It does not return results.

Account access says accounts are not open. On large screens that is a dialog. On smaller screens the same statement is in the menu, so the wordmark stays readable.

Shop, categories, businesses, and services are short pages that say the feature is not open. They do not list products, prices, businesses, or services.

## Routes

| Path | Page |
| --- | --- |
| `/` | Homepage |
| `/about` | About Smile, using only confirmed facts |
| `/contact` | States that contact channels are being prepared |
| `/shop` | Catalogue not open |
| `/categories` | Category browsing not open |
| `/businesses` | Directory not open |
| `/services` | Service listings not open |
| Other paths | Not-found page |

`/account` is not a page. Visiting it shows not-found.

## Components

Created:

- `src/components/layout/announcement-bar.tsx`
- `src/components/layout/container.tsx`
- `src/components/layout/desktop-nav.tsx`
- `src/components/layout/mobile-nav.tsx`
- `src/components/layout/search-dialog.tsx`
- `src/components/layout/account-notice.tsx`
- `src/components/home/hero-section.tsx`
- `src/components/home/marketplace-introduction.tsx`
- `src/components/home/category-discovery.tsx`
- `src/components/home/producer-section.tsx`
- `src/components/home/ecosystem-section.tsx`
- `src/components/home/trust-section.tsx`
- `src/components/home/business-participation.tsx`
- `src/components/home/closing-cta.tsx`
- `src/components/shared/link-button.tsx`
- `src/components/shared/coming-soon.tsx`
- `src/config/discovery.ts`

Reused: `SectionHeading`, `Dialog`, `Button` styles via `LinkButton`, `site` and `appRoutes`, the mark, and the existing tokens.

Refined: `SiteHeader`, `SiteFooter`, `DialogContent` (`align="end"` for the menu), `not-found`.

Removed from the public site: `src/components/foundation/foundation-panel.tsx`. The UI primitives remain.

## Technical improvements

- CI: `.github/workflows/ci.yml` checks out the repo, uses Node.js 22 with the npm cache, runs `npm ci`, typecheck, lint, and `npm run build`. It does not print secrets. The public pages do not call Supabase, so the build does not need credentials. The Phase 02 push succeeded on GitHub Actions: [run 44499629703](https://github.com/nutracueticals/Smile-Site/actions/runs/44499629703) for commit `a48ba06`.
- Node: Next.js 16.4.6 requires `>=20.9.0`. `package.json` engines match that. CI uses Node.js 22, which satisfies it.
- Proxy: `getUser()` still runs when the public environment is present. A missing session is ignored. A network failure is logged and the response continues. Any other thrown error is rethrown. Missing environment variables still skip the client.

## Imagery

`public/brand/canopy.svg` is an original drawing for the hero. It is not a product and not a photograph. Product files in `Products/` were not used. Nothing is hotlinked.

## Checks that were run

`npm run typecheck` — exit 0.

`npm run lint` — exit 0.

`npm run build` — exit 0, with `.env.local` moved aside for that run and restored afterwards. The build prerendered `/`, `/about`, `/contact`, `/shop`, `/categories`, `/businesses`, `/services`, and the not-found page. `.env.local` was confirmed present after the run. A later build of the finished tree also exited 0 with the local environment file present.

Browser, against `http://localhost:3000` while `npm run dev` was running:

- Homepage title “Smile Nutraceuticals”, one `h1`: “Nature's goodness. Connected.”
- About, contact, shop, and `/account` (not-found) rendered the expected copy.
- Search opened, accepted “moringa”, showed no results, cleared, and closed with Escape. Focus moved to the field.
- Mobile menu opened, focused Close, closed with Escape, and a Shop link reached `/shop`.
- Account copy is in the menu below the large breakpoint and in a dialog from the large breakpoint.
- No horizontal overflow at 360, 390, 430, 768, 1024, and 1440. At 1024 and 1440 the desktop navigation is shown and the menu button is hidden. Touch targets measured 44px.
- The Next.js issue overlay reported a hydration warning. The client/server diff was `data-cursor-ref` attributes added by the browser inspection tool, not a difference in the application markup.

## Known limitations

- There is no catalogue, cart, account, application form, or verified phone, email, address, or social account.
- Category themes are not links to category pages.
- The hero image is a drawing, not photography.
- CI has since been observed. The Phase 02 workflow run succeeded: https://github.com/nutracueticals/Smile-Site/actions/runs/44499629703
- Phase 03 has not been started.
