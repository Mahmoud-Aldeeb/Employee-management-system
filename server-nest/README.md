# Server

NestJS 12 REST API for the Employee Management System.

## Scripts

| Command                                | Description                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run start:dev`                    | Watch mode                                                                                        |
| `npm run build` / `npm run start:prod` | Production build and server                                                                       |
| `npm run seed`                         | Create the admin user (`ADMIN_EMAIL`, `ADMIN_PASSWORD`); `npm run seed:reset` resets its password |
| `npm run test:e2e`                     | API integration tests against an in-memory MongoDB replica set                                    |

## Modules

`auth` · `users` · `employees` · `profile` · `attendance` · `leave` · `payslips` · `dashboard` · `analytics` · `inngest` · `mail`

## Endpoints

| Area       | Endpoints                                                                                  | Access                       |
| ---------- | ------------------------------------------------------------------------------------------ | ---------------------------- |
| Auth       | `POST /api/auth/login`, `/refresh`, `/logout`, `/change-password`, `GET /api/auth/session` | public / signed in           |
| Employees  | `GET`, `POST /api/employees`, `PUT`, `DELETE /api/employees/:id`                           | admin                        |
| Profile    | `GET`, `POST /api/profile`                                                                 | signed in                    |
| Attendance | `POST /api/attendance` (clock in/out), `GET /api/attendance`                               | employee                     |
| Leave      | `POST`, `GET /api/leave`, `PATCH /api/leave/:id`                                           | signed in / admin for status |
| Payslips   | `GET /api/payslips`, `GET /api/payslips/:id`, `POST /api/payslips`                         | owner or admin / admin       |
| Dashboard  | `GET /api/dashboard`                                                                       | signed in                    |
| Analytics  | `GET /api/analytics`                                                                       | admin                        |
| Jobs       | `/api/inngest`                                                                             | Inngest                      |
| Leave      | `GET /api/leave/balance`, `GET /api/leave/calendar?month=YYYY-MM&department=`              | employee / signed in         |

## Security

- httpOnly cookies; refresh tokens stored as SHA-256 hashes, rotated and revoked on logout and password change
- bcrypt password hashing, Helmet, DTO validation with unknown fields rejected
- Role guard on admin routes; payslips are owner-only
- Login rate limit per email (`express-rate-limit`)

## Notes

- Nest 12 packages are ESM-only (`"type": "module"`, imports end with `.js`).
- Writes that span two collections (create/update employee with its user) run in MongoDB transactions, so a replica set is required.
- Deployed on Vercel (zero-config NestJS). Environment variables are listed in the root README.
