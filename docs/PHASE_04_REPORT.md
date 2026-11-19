# Phase 04 report

## 1. Executive summary

Phase 04 adds Supabase Authentication, profiles, business applications, membership, a private document bucket, and a restricted reviewer decision path. The application code and migration `20261119113107_identity_and_applications.sql` are in the repository. The migration has not been applied to the linked database, and Docker is not running, so the policies, storage rules, and live auth emails were not executed. Phase 04 is conditionally accepted.

The catalogue rule is unchanged: a product is public only when it is published, its business is approved, and its category is active. Approving a business does not update products. The Phase 03.1 visibility matrix has still not been executed with fixture rows.

## 2. Architecture changes

- Server actions in `src/features/auth`, `src/features/applications`, and `src/features/review`.
- Session checks in `src/features/auth/session.ts`. Protected pages call these on the server.
- The server Supabase client is typed with `AppDatabase` from `src/types/phase04.ts`.
- `src/types/database.ts` stays the generated catalogue types. `src/types/phase04.ts` is hand-written because the new migration is not applied. It is not generated output.
- The header account control is a link to `/login` or `/account`. Reviewers also see `/review`.
- `src/proxy.ts` still refreshes the session. It does not decide page permission.

## 3. Authentication implementation

Implemented:

- `/register` collects full name, email, password, confirmation, and acceptance of `/terms`.
- Passwords must be 10 to 72 characters and include a letter and a number. This is stricter than the local Supabase default of 6.
- `signUp` sends `full_name` and `terms_accepted` in user metadata once. The `handle_new_user` trigger copies the name into `profiles` and inserts the `customer` role. Later requests do not read metadata for permission.
- If Supabase returns no session, the person is sent to `/verify-email`. If it returns a session, they go to `/account`.
- `/login` uses `signInWithPassword`. An unconfirmed email is sent to `/verify-email`.
- `/forgot-password` calls `resetPasswordForEmail`. `/auth/callback` exchanges the code. `/reset-password` calls `updateUser` only when a session exists. A missing or failed code is treated as expired.
- `/account` can sign out. `/account/profile` edits name, optional phone, and optional country. Email stays on the Auth user.
- Redirects accept only a same-site path. Auth errors are mapped to short sentences. Internal error text is not shown.

Tested with limitations: form validation and redirect helpers passed as unit tests. A live registration, confirmation email, and password-reset email were not completed. Hosted Site URL, redirect allow-list, SMTP, and the confirmation switch were not changed and were not read from the dashboard.

## 4. Database schema changes

The new migration adds:

- `profiles`, keyed by the Auth user.
- `user_roles` with `customer`, `business_owner`, `reviewer`, and `admin`.
- `business_applications`, one per business, with the seven application statuses.
- `business_application_categories`, pointing at existing categories.
- `business_members` with `owner` or `representative`.
- `business_application_documents`.
- `business_application_events` for applicant-visible history.
- `business_application_internal_notes`, separate so applicants cannot select them.
- `businesses.created_by`. Select on that column is revoked from `anon` and `authenticated`.

Suspension stays on `businesses.approval_status`. It is not an application status.

## 5. Migration details

File: `supabase/migrations/20261119113107_identity_and_applications.sql`.

Created with `supabase migration new identity_and_applications`, then edited. It was not applied. `supabase db push` was not run. The linked database was not reset. Catalogue rows are untouched because this file does not drop or rewrite them.

`private.handle_new_user`, `private.enforce_application_change`, and `private.record_application_change` are security definer, with `search_path` empty, and execute is revoked from `public`, `anon`, and `authenticated`.

## 6. RLS policies and test evidence

RLS is enabled on every new table. Grants are limited. Applicants can read and edit their own open applications. They cannot set `approved` or `rejected`; the trigger rejects that change. Reviewers can read applications, applicant profiles for those applications, and businesses that have an application. Internal notes are reviewer-only. Memberships have no insert grant for authenticated users. The approval trigger inserts the owner row.

Not tested: anonymous, applicant, and reviewer sessions against a database. Docker is down, and the migration was not applied to the linked project. No fixture businesses or documents were created there.

## 7. Business application lifecycle

A signed-in user starts a draft. That creates a pending business they created and a draft application in their name. They can save, upload a document while the application is a draft or has information requested, submit, resubmit after an information request, and withdraw from draft, submitted, or information requested. Submission requires a description of at least 10 characters, a business email, a telephone number, a position, and the three declarations. The database trigger checks the same conditions.

## 8. Approval workflow

`/review` lists submitted, under-review, and information-requested applications for a reviewer or admin. The decision form can move a submitted application to under review, information requested, approved, or rejected, and an under-review application to the last three. The trigger records the event, the reviewer, and the time. Approval sets the business to `approved` only while it is `pending`, inserts an owner membership, and inserts `business_owner`. Rejection sets the business to `rejected` only while it is `pending`. The application row is kept. Products are not updated.

A normal account sees an access-denied page. There is no public way to become a reviewer. An operator grants it with:

```sql
insert into public.user_roles (user_id, role) values ('<user uuid>', 'reviewer');
```

## 9. Document storage

Private bucket `business-documents`. Allowed types are PDF, JPEG, PNG, and WebP. Maximum size is 10 MB. The object path is `{user id}/{application id}/{file}`. Upload is allowed only while the application is open. Download is a server route that reads the document row under RLS and redirects to a 60-second signed URL. Anonymous users are not granted storage access. This is not the product-images bucket.

Not tested against storage. The bucket does not exist until the migration is applied.

## 10. Routes and interface components

| Route | Purpose |
| --- | --- |
| `/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email` | Account access |
| `/auth/callback` | Exchange the Supabase code |
| `/account`, `/account/profile`, `/account/applications` | Signed-in account |
| `/business/apply`, `/business/apply/[applicationId]`, `/business/application-submitted` | Application |
| `/review`, `/review/applications/[applicationId]` | Reviewer decisions |
| `/terms` | Account terms used by registration |

The pages use the existing forest, ivory, beige, and charcoal tokens, Fraunces headings, and Source Sans 3. No testimonials, counts, or verification badges were added. `/businesses` and `/services` remain the existing not-open pages. Producer and manufacturer dashboards were not built.

## 11. Security measures

- Permission is checked in server actions and in the database trigger, not by hiding a button.
- Roles are not taken from the browser or from user metadata.
- Applicants cannot change `applicant_id` or `business_id`.
- Business `approval_status` is not in the authenticated update grant. Only `display_name` and `slug` can be updated, and only while the business is pending and created by that user.
- Document paths are scoped to the signed-in user. Another applicant's row is hidden by RLS, so the signed-URL route returns 404.
- Redirect targets cannot be external.
- Auth and save failures use fixed messages.
- No service-role key is read by the app. No password is stored in an application table.

Rate limiting of Auth emails is the Supabase project limit. This phase does not add a separate limiter. That is a limitation.

## 12. Tests actually executed

`npm test` passed: 23 tests, 0 failed.

- Catalogue parameter, URL, search, and pagination tests from Phase 03.1: passed.
- Registration, password confirmation, safe redirects, and auth error mapping: passed.
- Applicant and reviewer transition helpers: passed.
- A file read of the two migrations confirms the catalogue visibility policy is still present and the identity migration does not drop policies or update `products`: passed.

Not tested:

- Live registration, login, logout, session persistence, and email delivery.
- RLS as anonymous, applicant, and reviewer.
- Draft, submit, resubmit, reject, and approve against a database.
- Document upload, signed URLs, wrong file types, and oversized files.
- The catalogue visibility matrix with fixture rows.

## 13. CI result

The first Phase 04 run failed at the build: https://github.com/nutracueticals/Smile-Site/actions/runs/44517679668. CI has no public Supabase variables, and the header asked for a session on every page. The header now skips that lookup when the variables are absent. Earlier successful runs remain Phase 02 `https://github.com/nutracueticals/Smile-Site/actions/runs/44499629703` and Phase 03 `https://github.com/nutracueticals/Smile-Site/actions/runs/44510021582`.

Locally, before the commit: `npm run typecheck` passed, `npm run lint` passed, `npm test` passed with 23 tests, and `npm run build` passed on Next.js 16.4.6. The new routes are dynamic.

In the browser, against the running dev server: `/register` showed the account form; a short password returned `/register?error=invalid` with the validation message and did not create an account. `/account` and `/review` redirected to `/login` with a same-site `next` path. The desktop header shows Log in. The homepage, shop, and category pages still render. Live sign-up, email delivery, draft saving, review decisions, and document upload were not exercised because the identity migration is not applied and no production account was created.

## 14. Known limitations

- The identity migration is not applied, so account and application pages tell a signed-in user that the tables are unavailable.
- Hosted email confirmation, redirect URLs, and SMTP are not confirmed.
- Reviewer and admin roles cannot be granted from the application.
- Invitations for extra business members are not implemented.
- There is no notification centre. Status text is on the application page. The history stores the applicant-visible message, and the row copy is cleared after the event is written.
- The visibility matrix from Phase 03.1 is still not executed.

## 15. Environment configuration required

No new environment variables. The app uses:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is not used.

Before the identity features work on the hosted project, someone must:

1. Apply `20261119113107_identity_and_applications.sql` with explicit approval. This phase did not.
2. Set the Supabase Site URL and add `/auth/callback` on that origin to the redirect allow-list.
3. Decide whether email confirmations are on, and configure SMTP if messages must actually be delivered.
4. Regenerate `src/types/database.ts` and retire `src/types/phase04.ts`.
5. Grant reviewer with the SQL in section 8.

Local `supabase/config.toml` has `enable_confirmations = false`, `minimum_password_length = 6`, site URL `http://127.0.0.1:3000`, and an email rate limit of 2. That file does not change the hosted project. The app still asks for confirmation and handles both an immediate session and a pending email.

## 16. Deferred functionality

Phase 05 and later are not started. Not implemented: producer and manufacturer dashboards, product editing, inventory, pricing, cart, checkout, orders, payments, delivery, the business directory, wholesale, the service directory, the full admin console, the notification centre, and a mobile API.

## 17. Commit

Implementation commit: `9c1d72c35f2d2b720c3722fdbe900ce65db285f7`

Message: `Implement Phase 04 authentication and business approval workflows`

https://github.com/nutracueticals/Smile-Site/commit/9c1d72c35f2d2b720c3722fdbe900ce65db285f7

## Verdict

Conditionally accepted.

The identity model, policies, and screens are in the repository and the unit checks passed. Phase 04 is not fully accepted until the migration is applied in an approved environment and the auth, RLS, storage, and catalogue-regression checks are run there.
