# Web

Next.js 16 frontend (App Router, Cache Components) for the Employee Management System.

## Scripts

| Command                              | Description                                                        |
| ------------------------------------ | ------------------------------------------------------------------ |
| `npm run dev`                        | Development server on port 3000                                    |
| `npm run build` / `npm start`        | Production build and server                                        |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript                                              |
| `npm test`                           | Unit and component tests (Vitest, Testing Library, MSW)            |
| `npm run e2e`                        | Playwright end-to-end tests (starts MongoDB, the API and this app) |

Environment: `API_URL` points to the NestJS API. Requests to `/api/*` are rewritten to it (see `next.config.ts`).

## Structure

```text
app/
  (auth)/login/...     login pages
  (app)/               signed-in area with the sidebar layout
    (admin)/           admin-only pages (employees, analytics, audit log)
  (print)/             printable payslip
components/            UI grouped by feature (employees, attendance, leave, payslips, analytics, audit-log)
hooks/                 TanStack Query hooks, one file per resource
lib/                   API client, date helpers, CSV export, shared constants
types/                 API types
tests/                 Vitest tests and MSW handlers
e2e/                   Playwright tests
proxy.ts               redirects visitors without a session cookie to /login
```

## Conventions

- **Data fetching:** client-side with TanStack Query. Mutations call `invalidateAppData` so every page stays in sync.
- **Forms:** React Hook Form with Zod schemas; messages mirror the API rules.
- **Auth:** the `session` query is the single source of truth. `proxy.ts` is only an optimistic redirect; real authorization happens in the API.
- **Cache Components:** components that read client-side data sit under a `Suspense` boundary.
- **Responsive:** every page is covered by a mobile Playwright check for horizontal overflow.

## Audit log

Admins can review every administrative action at `/audit-log`: employee changes, salary updates, leave decisions, payslips, admin sign-ins and password changes. Each entry shows who did it, to whom, when (Cairo time) and the values before and after. Passwords and secrets are never stored. Filters (event type, search, date range) and pagination run on the server (`GET /api/audit-logs`). Entries expire after 180 days, and demo visitors only see demo events.
