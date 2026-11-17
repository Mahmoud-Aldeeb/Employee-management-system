# Employee Management System

![Server CI](https://github.com/<USER>/<REPO>/actions/workflows/server-ci.yml/badge.svg)
![Web CI](https://github.com/<USER>/<REPO>/actions/workflows/web-ci.yml/badge.svg)

An HR portal for managing employees, attendance, leave requests and payslips, with separate Admin and Employee experiences.

Live demo: [<web URL>](https://employee-management-system-rust-seven.vercel.app/login) 

## Features

- **Role-based access:** admin and employee portals, protected on both the client and the API
- **Employees:** create, edit and soft-delete employees with login accounts, department filter, CSV export
- **Attendance:** clock in/out with Africa/Cairo day boundaries, table and calendar views
- **Leave:** requests with validation, admin approval workflow, reminders
- **Payslips:** generated per month with the net salary calculated on the server, printable view, owner-only access
- **Analytics:** attendance, leave and working-hours charts
- **Background jobs (Inngest):** automatic check-out, pending-leave reminders, daily attendance reminders

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query, React Hook Form + Zod, Recharts |
| Backend | NestJS, TypeScript, Mongoose / MongoDB, Passport JWT, class-validator, Helmet, Throttler |
| Auth | httpOnly cookies: short-lived access token + rotating refresh token |
| Jobs / email | Inngest, Nodemailer |
| Testing | Vitest + Testing Library + MSW, Supertest API tests, Playwright (desktop and mobile) |
| CI/CD | GitHub Actions, Vercel |

## Architecture

```text
Browser ──► Next.js (web) ──/api/* rewrite──► NestJS (server-nest) ──► MongoDB
```

- The browser only talks to the Next.js origin. `/api/*` is proxied to the NestJS API, so cookies are first-party and no CORS setup is needed.
- Tokens never touch `localStorage`. An expired access token is renewed silently from the refresh cookie; refresh tokens are rotated and revoked on logout.
- Passwords are hashed with bcrypt, request bodies are validated with DTOs, and unknown fields are rejected.
- Dates for attendance are handled in the Africa/Cairo time zone on the server.

## Repository structure

```text
web/          Next.js frontend (+ unit, component and Playwright tests)
server-nest/  NestJS API (+ API integration tests)
.github/      CI workflows
```

## Getting started

Requirements: Node.js 22, a MongoDB database (Atlas works; transactions need a replica set).

```bash
# API
cd server-nest
cp .env.example .env        # fill in the values
npm install
npm run seed                # creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD
npm run start:dev

# Web (new terminal)
cd web
cp .env.example .env.local  # API_URL=http://localhost:4000
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

| App | Variable | Purpose |
| --- | --- | --- |
| server-nest | `MONGODB_URL` | MongoDB connection string |
| server-nest | `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets (32+ characters) |
| server-nest | `CLIENT_URL` | Frontend origin |
| server-nest | `SMTP_*`, `SENDER_EMAIL`, `ADMIN_EMAIL` | Email delivery |
| server-nest | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by the seed script |
| server-nest | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Background jobs |
| web | `API_URL` | NestJS API origin used by the `/api` rewrite |

## Testing

```bash
cd server-nest && npm run test:e2e    # API tests against an in-memory MongoDB
cd web && npm test                    # unit + component tests
cd web && npm run e2e                 # Playwright (builds and starts the whole stack)
```

## Version history

The original JavaScript implementation (Express + React/Vite) is preserved under the [`legacy-mern-js`](https://github.com/<USER>/<REPO>/tree/legacy-mern-js) tag.
