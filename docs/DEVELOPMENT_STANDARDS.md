# Development standards

## Language and types

- TypeScript `strict` is on. Do not use `any` to silence a type.
- Export the props of a shared component when another module needs to construct them.
- Prefer a named function over a file that mixes several unrelated components.

## Validation and errors

- Parse external input with Zod before using it. The public Supabase environment is parsed in `src/lib/env.ts`.
- Convert unknown failures with `toAppError`. Log the original error on the server when there is a server log, and show the user a specific message.
- Do not catch an error and continue as if the action succeeded.

## Data access

- The browser may use the publishable key only.
- Server code that acts as the signed-in user uses `src/lib/supabase/server.ts`.
- Do not read `user_metadata` to make an authorization decision. Read `public.user_roles`.
- Do not insert `reviewer` or `admin` from application code. An operator inserts those rows.
- Do not add a table in an exposed schema without row-level security and a policy that matches the real rule.
- Do not add a table in an exposed schema without row-level security and a policy that matches the real rule.
- Do not commit `.env.local`, service-role keys, or database passwords.

## Interface

- Interactive controls do the thing their label says. If the action does not exist yet, do not render the control.
- Do not add a button, card, or chart that has no behaviour.
- Do not invent prices, reviews, certificates, stock counts, or company statistics.
- Meet a 44px target on controls used with a thumb. Keep text at 16px or larger in form fields.
- Support keyboard use and a visible focus style.

## Dependencies

Add a package only when the platform cannot reasonably provide the behaviour. Current reasons:

- `next`, `react`, `react-dom` — application framework.
- `tailwindcss` — design tokens and layout.
- `zod` — input validation.
- `@supabase/supabase-js` and `@supabase/ssr` — database and auth clients.
- `server-only` — stop server modules from being imported by client code.
- `@radix-ui/react-dialog`, `dropdown-menu`, `tabs`, `tooltip` — focus and keyboard behaviour.
- `clsx` and `tailwind-merge` — conditional classes without fighting Tailwind.

## Files

- Routes stay in `src/app`.
- Shared visuals stay in `src/components/ui`.
- A feature folder is created when the feature is actually being built.
- Update `src/config/routes.ts` in the same change that adds or removes a page.

## Checks

Before a phase is called complete, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Record the result. Do not report a check that was not run.
