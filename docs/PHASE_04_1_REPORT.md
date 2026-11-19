# Phase 04.1 report

## 1. Executive summary

Phase 04.1 hardens the authentication and business-application work. Creating an application, saving it, and recording a reviewer decision are each one database function, so a failed step rolls back the others. Status changes stay in the database trigger. A reviewer cannot decide their own application. Document uploads are checked against file signatures, and a failed database insert tries to remove the stored object.

The linked database was inspected and was not changed. It still has only the catalogue migration. Docker is not running, so the permission matrix was not executed against Postgres. Phase 04 is not fully accepted.

## 2. Starting commit hash

`74fa5bc` — `Keep the production build working when Supabase env is absent.`

## 3. Final commit hash

Implementation commit: `2592323c40f8a0acbf316587e13c3d20f3f9ca93`

https://github.com/nutracueticals/Smile-Site/commit/2592323c40f8a0acbf316587e13c3d20f3f9ca93

Message: `Harden Phase 04 authentication and business approval workflows`

## 4. Problems identified

- `startApplication` inserted a business and then an application. A failed application insert could leave a business with no application.
- Saving an application updated the business, updated the application, deleted categories, and inserted categories as separate requests. Category errors were ignored.
- A reviewer note was inserted before the status update. A failed decision could leave a note without the decision.
- Upload checks trusted the browser MIME type and did not record a failed cleanup.
- A person who was both applicant and reviewer could pass the reviewer branch of the trigger, including on their own application.
- Reviewers could change application content while recording a decision.
- History tables could be updated if a later grant allowed it. There was no immutability trigger.
- The identity migration is committed and not applied. Generated types still describe only the catalogue.

## 5. Files changed

- `supabase/migrations/20261119124504_application_history_guards.sql`
- `supabase/migrations/20261119124532_application_transactions.sql`
- `src/features/applications/actions.ts`
- `src/features/applications/documents.ts`
- `src/features/applications/documents.test.ts`
- `src/features/applications/policies.test.ts`
- `src/features/review/actions.ts`
- `src/types/phase04.ts`
- `src/app/business/apply/[applicationId]/documents/[documentId]/route.ts`
- `src/app/business/apply/[applicationId]/page.tsx`
- `src/app/account/layout.tsx`
- `src/app/business/layout.tsx`
- `src/app/review/layout.tsx`
- `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP_20_PHASES.md`, `package.json`

## 6. Database migrations added or modified

Added, not applied:

- `20261119124504_application_history_guards.sql`
- `20261119124532_application_transactions.sql`

The Phase 03 and Phase 04 migration files were not rewritten. Catalogue policies were not dropped. No `update` of `products` was added.

## 7. Database functions and triggers introduced

- `private.reject_history_change` blocks updates and deletes of application events and internal notes.
- `private.enforce_application_change` was replaced. An applicant who also has a reviewer role is treated only as the applicant on their own application. A reviewer decision copies the previous business content forward and may change status and the applicant-visible message.
- `private.start_business_application` inserts the pending business, owner membership, draft application, and a `created` history row.
- `private.save_business_application` updates the business name, application, and category links.
- `private.withdraw_business_application` sets `withdrawn` for the owner.
- `private.decide_business_application` checks the reviewer role, refuses the applicant, writes an optional internal note, and updates status.
- Public functions of the same names are security invoker wrappers. The Data API exposes `public` only, so the privileged bodies stay in `private` with `search_path` empty.
- Direct insert, update, and delete on businesses, applications, categories, memberships, events, and internal notes are revoked from `authenticated`.

These functions were not executed.

## 8. RLS policies reviewed and tested

Reviewed in SQL: existing Phase 04 policies, plus insert and reviewer-read policies on `business_document_orphans`.

Not tested against a database. No anonymous, applicant, or reviewer session was created. Docker could not connect to `dockerDesktopLinuxEngine`. The linked project was not used as a test fixture.

## 9. Storage security improvements

- PDF, JPEG, PNG, and WebP are recognised from magic bytes. HTML and executables are rejected by that check. The 10 MB limit is enforced on the byte length.
- The object name is `{user id}/{application id}/{random id}.{ext}`. Download refuses any other path shape.
- If the document row insert fails, the object is removed. If removal fails, a row is inserted in `business_document_orphans` and the user is not told the upload succeeded. If that recovery insert also fails, the server logs the application id only.
- The bucket definition remains private. It does not exist on the linked project yet: `storage.buckets` has one row, the catalogue image bucket.

Storage access was not tested against Supabase.

## 10. Authentication verification

Reviewed the existing registration, login, recovery, callback, and session code. `safeNextPath` still rejects external, protocol-relative, and encoded-slash redirects. Unit tests for that passed. Missing public environment variables still skip the session lookup, and account, business, and review routes are `force-dynamic` so a build without those variables does not freeze a login redirect.

Live registration, duplicate accounts, bad passwords, unverified users, expired links, and email delivery were not run. No production auth setting was changed.

## 11. Application workflow verification

The server actions call the new functions. The trigger still allows only draft or information-requested to submitted, and draft, submitted, or information-requested to withdrawn. That was checked by reading the replacement trigger and by the existing transition unit tests. It was not executed in Postgres.

## 12. Reviewer workflow verification

The decision function and the trigger together refuse a self-decision, keep internal notes in their own table, and change business approval only inside the existing approval trigger when the new status is approved or rejected. Information requested does not take that branch. Products are not updated. This was reviewed in SQL and not executed.

## 13. Test commands executed

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm run build` was also run with `.env.local` moved aside, then the file was restored.

The linked migration list was read. It contains only `20261119095711`.

## 14. Test results

`npm test`: 28 tests, 28 passed, 0 failed.

That includes catalogue unit tests, auth validation, transition helpers, document signatures, and source checks that the new SQL does not update products and does not swallow exceptions. Those source checks are not integration tests.

`npm run typecheck` passed. `npm run lint` passed. Both production builds passed.

Browser, on the running dev server: `/register` at 360 and 1440, and `/login` at 390, 430, 768, and 1024. Horizontal overflow was 0 at each width. The register form exposed name, email, password, confirmation, terms, and the create button. `/shop` still says no products are published. Draft save, review, and upload were not clicked because they need the unapplied migration.

## 15. CI result and link

The workflow for this commit does not exist until the commit is pushed. The previous passing run is https://github.com/nutracueticals/Smile-Site/actions/runs/44518687938 for `74fa5bc`.

## 16. Database environment used

Read-only inspection of hosted project `wptcofcimxqkznqdpjbr`. Tables present: `businesses`, `categories`, `products`, `product_images`. Six categories. No products. No Phase 04 tables. No migration was applied. Local Docker was unavailable.

## 17. Whether the Phase 04 migration was applied

No. `list_migrations` returned only `20261119095711` catalogue_foundation. The two Phase 04.1 migrations were not applied either.

## 18. Whether actual email delivery was verified

No. Hosted Site URL, redirect allow-list, confirmation switch, and SMTP were not read and not changed.

## 19. Whether actual storage access was verified

No. The business-documents bucket is defined in the unapplied migration. Signature checks were unit-tested in memory.

## 20. Outstanding limitations

- Apply `20261119113107`, then `20261119124504`, then `20261119124532` only with explicit approval. Do not use `supabase db push` until that approval is given.
- Run the permission matrix with anonymous, applicant A, applicant B, and reviewer sessions in a disposable database. Docker is the intended place. Do not create those fixtures in the hosted project.
- Confirm email delivery after Site URL, `https://<origin>/auth/callback`, and SMTP are set.
- Upload and download a real PDF and a mismatched file against the private bucket.
- Regenerate types after the migrations are applied:

```bash
supabase gen types typescript --linked --schema public > src/types/database.ts
```

`src/types/phase04.ts` remains a hand-written supplement until then.

- `src/types/database.ts` was not regenerated because the linked schema did not change.

## 21. Required manual Supabase configuration

1. Approve and apply the three identity migrations in filename order.
2. Set the Site URL and allow `{origin}/auth/callback` for registration and password recovery.
3. Turn on email confirmations if accounts must be verified before use, and configure SMTP. Local `supabase/config.toml` still has confirmations off and does not change the hosted project.
4. Grant a reviewer with:

```sql
insert into public.user_roles (user_id, role) values ('<user uuid>', 'reviewer');
```

5. Regenerate database types.
6. Build production with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` present. No service-role key is required.

## 22. Final Phase 04 acceptance recommendation

Conditionally accepted. The application paths are transactional in SQL and the unit checks passed. Phase 04 is not fully accepted until those migrations are applied in an approved database and the permission, storage, and email checks are run there.

Phase 05 was not started.
