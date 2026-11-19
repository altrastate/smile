# Phase 01 audit

Audit date: 19 November 2026. This document records the repository as it existed before the Phase 01 application foundation was added. Later documents describe what was then established.

## What was inspected

- Every file in the workspace, including `supabase/config.toml`, `supabase/.gitignore`, and the linked-project files under `supabase/.temp`.
- Remote project `wptcofcimxqkznqdpjbr` through the authenticated Supabase connection: project status, public tables, migrations, API URL, and publishable keys.
- Local Supabase CLI 2.116.0, already logged in and linked to that project.
- Node.js 24.13.1 and npm 11.8.0.
- The brand mark at `logo.png`, and three of the nine photographs in `Products/`.
- Git metadata. The folder is not its own repository.

## Findings

### Application

There was no web application. No `package.json`, framework, routes, components, styling system, environment example, deployment config, authentication code, or tests.

Nothing working had to be preserved, because no application behaviour existed.

### Supabase

| Item | State |
| --- | --- |
| Project | Nutracueticals Site, ref `wptcofcimxqkznqdpjbr` |
| Organization | Nutracueticals Organization (`bnkrgscrzcekfhyefzul`) |
| Region | eu-west-2 |
| Status | Active and healthy |
| Postgres | 17.12 |
| API URL | `https://wptcofcimxqkznqdpjbr.supabase.co` |
| Public tables | None |
| Remote migrations | None |
| Local migrations | None |
| Auth implementation | None in the repository |

`supabase/config.toml` is the CLI default from `supabase init`, with `project_id = "Nutraceuticals_Site"` and `db.major_version = 17`, which matches the remote database. Local Auth `site_url` is `http://127.0.0.1:3000`. `additional_redirect_urls` contains `https://127.0.0.1:3000`. That local config was left unchanged.

The seed block referenced `./seed.sql`, and that file did not exist. Phase 01 turns seeding off so a later local reset does not depend on a missing file. No seed data was invented.

A publishable key and a legacy anon key both exist on the project. The application uses the publishable key only. The service-role key was not copied into the repository.

### Design assets

`logo.png` is the Smile Nutraceuticals mark: a green leaf over an open hand, the wordmark, and the line “Harnessing the power of nature for health care”. The artwork sits on a solid black field, so it cannot be placed directly on ivory without a visible black tile. A transparent SVG is still needed before a light editorial header can use the mark cleanly.

`Products/` holds nine JPEG photographs of packaged products. They are source photography only. They have no prices, stock records, or verified catalogue entries, so Phase 01 does not present them as products for sale.

### Git and deployment

The workspace is an untracked folder inside a Git repository rooted above this project, in the user profile. It has no remote, no CI, and no hosting configuration of its own. That parent repository is a risk: a broad `git add` from the profile could pick up this project, including local secrets, together with unrelated files.

## Strengths

- The remote database is healthy, empty, and on Postgres 17, so schema work can start from a clean migration history.
- The CLI is linked to the same project the application will use.
- The logo and product photography are real assets, not placeholders.
- Local Auth config already expects a site on port 3000.

## Weaknesses

- No application architecture, type safety, design system, or route structure.
- No environment contract. Credentials were only available from the Supabase account, not from the repo.
- The logo’s black background limits how it can be used on the ivory palette.
- Product photographs are not named, priced, or tied to records.
- The folder is not an independent Git repository.

## Risks

- Building later phases inside page files would be hard to unwind. The foundation has to separate routes, features, and data access now.
- Using the legacy anon key, or ever shipping the service-role key to the browser, would weaken the API boundary.
- Treating the product photographs as a live catalogue would invent commercial data.
- Committing `.env.local`, or committing from the parent profile repository, could expose credentials.

## Recommendations carried into Phase 01

1. Create a Next.js, TypeScript, and Tailwind application in this folder without discarding the Supabase project or the image assets.
2. Keep route files thin and put shared UI in `src/components`.
3. Add browser and server Supabase clients, public environment validation, and a session-refresh proxy. Do not add tables.
4. Implement the Smile visual system in CSS tokens and reusable controls.
5. Leave future marketplace routes unimplemented instead of filling them with placeholder screens.
6. Give the project its own Git repository before the first commit. That step needs a deliberate decision and was not done in this phase.
