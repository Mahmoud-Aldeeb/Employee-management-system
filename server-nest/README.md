# Server

NestJS 12 REST API for the Employee Management System.

## Scripts

| Command                                | Description                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run start:dev`                    | Watch mode                                                                                        |
| `npm run build` / `npm run start:prod` | Production build and server                                                                       |
| `npm run seed`                         | Create the admin user (`ADMIN_EMAIL`, `ADMIN_PASSWORD`); `npm run seed:reset` resets its password |
| `npm run test:e2e`                     | API integration tests against an in-memory MongoDB replica set                                    |
| `npm run typecheck`                    | Type-check without emitting (`nest build` does not type-check, but Vercel does)                   |
| `npm run check`                        | Lint, type-check, API tests and build, the same gate used before every push                       |

## Modules

`auth` · `users` · `sessions` · `employees` · `salaries` · `profile` · `attendance` · `leave` · `payslips` · `dashboard` · `analytics` · `audit` · `demo` · `inngest` · `mail` · `health` · `docs`

## Endpoints

| Area       | Endpoints                                                                                  | Access                           |
| ---------- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| Auth       | `POST /api/auth/login`, `/refresh`, `/logout`, `/change-password`, `GET /api/auth/session` | public / signed in               |
| Employees  | `GET`, `POST /api/employees`, `PUT`, `DELETE /api/employees/:id`                           | admin                            |
| Profile    | `GET`, `POST /api/profile`                                                                 | signed in                        |
| Attendance | `POST /api/attendance` (clock in/out), `GET /api/attendance`                               | employee                         |
| Leave      | `POST`, `GET /api/leave`, `PATCH /api/leave/:id`                                           | signed in / admin for status     |
| Payslips   | `GET /api/payslips`, `GET /api/payslips/:id`, `POST /api/payslips`                         | owner or admin / admin           |
| Dashboard  | `GET /api/dashboard`                                                                       | signed in                        |
| Analytics  | `GET /api/analytics`                                                                       | admin                            |
| Jobs       | `/api/inngest`                                                                             | Inngest                          |
| Leave      | `GET /api/leave/balance`, `GET /api/leave/calendar?month=YYYY-MM&department=`              | employee / signed in             |
| Audit      | `GET /api/audit-logs?action=&search=&from=&to=&page=&limit=`                               | admin                            |
| Demo       | `GET /api/demo/status`, `POST /api/demo/login`                                             | public (login needs `DEMO_MODE`) |
| Health     | `GET /api/health`                                                                          | public                           |
| Docs       | `GET /api/docs` (Swagger UI)                                                               | public                           |

## Security

- httpOnly cookies; refresh tokens stored as SHA-256 hashes, rotated and revoked on logout and password change
- bcrypt password hashing, Helmet, DTO validation with unknown fields rejected
- Role guard on admin routes; payslips are owner-only
- Login rate limit per email (`express-rate-limit`)
- Audit entries never contain a password or secret: only an allow-list of fields is compared, and they expire after 180 days

## Notes

- Nest 12 packages are ESM-only (`"type": "module"`, imports end with `.js`).
- Employee, salary, leave-decision and payslip writes run in MongoDB transactions together with their audit entry, so a replica set is required.
- Deployed on Vercel (zero-config NestJS). Environment variables are listed in the root README.
