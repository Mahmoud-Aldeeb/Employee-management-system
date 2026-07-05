# Employee Management System (EMS)

A full-stack **MERN** application for managing employees, attendance, leave requests, and payslips — with role-based access for **Admins** and **Employees**.

---

## Features

### For Admins
- Manage employee records (create, edit, deactivate)
- Filter employees by department
- Review and approve/reject leave applications
- Generate and manage employee payslips
- View organization-wide dashboard stats (total employees, today's attendance, pending leaves)

### For Employees
- Clock in / clock out with automatic working-hours calculation
- View personal attendance history
- Apply for leave (Sick, Casual, Annual) and track application status
- View payslip history
- Update profile information and change password
- Personal dashboard with attendance summary and latest payslip

### System-wide
- JWT-based authentication with role-based route protection (`ADMIN` / `EMPLOYEE`)
- Background jobs via **Inngest**:
  - Auto check-out reminder (and automatic "LATE" marking) if an employee forgets to check out
  - Reminder email to admins for leave applications pending over 24 hours
  - Daily cron job (8:00 AM Cairo time) that emails employees who haven't checked in and aren't on approved leave

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- Tailwind CSS
- Axios
- react-hot-toast
- lucide-react (icons)

**Backend**
- Node.js + Express 5
- MongoDB with Mongoose
- JWT (`jsonwebtoken`) for authentication
- bcrypt for password hashing
- Redis (Redis Cloud) via `ioredis`
- Inngest for scheduled/background jobs
- Nodemailer for transactional emails
- Multer (for potential file/form-data handling)

**Deployment**
- Backend: Vercel (Serverless Functions)
- Database: MongoDB Atlas
- Redis: Redis Cloud

---

## Project Structure

```
Employee-management-system/
├── server/                     # Backend (Express API)
│   ├── api/
│   │   └── index.js            # Vercel serverless entry point
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── payslipController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── auth.js             # protect / protectAdmin middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Employee.js
│   │   ├── Attendance.js
│   │   ├── LeaveApplication.js
│   │   └── Payslip.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── leaveRoutes.js
│   │   ├── payslipsRoutes.js
│   │   └── dashboardRoutes.js
│   ├── inngest/
│   │   └── index.js            # Background job functions
│   ├── server.js                # Express app entry point
│   ├── vercel.json
│   └── package.json
│
└── client/                      # Frontend (React + Vite)
    ├── src/
    │   ├── api/
    │   │   └── axios.js         # Axios instance with auth interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state (user, token, login/logout)
    │   ├── components/
    │   │   ├── attendance/
    │   │   ├── leave/
    │   │   ├── payslip/
    │   │   └── ...
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Employees.jsx
    │   │   ├── Attendance.jsx
    │   │   ├── Leave.jsx
    │   │   ├── Payslips.jsx
    │   │   └── Settings.jsx
    │   └── App.jsx
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Redis instance (local or [Redis Cloud](https://redis.io/try-free/))

### 1. Clone the repository
```bash
git clone https://github.com/Mahmoud-Aldeeb/Employee-management-system.git
cd Employee-management-system
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file inside `server/`:
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
COOKIE_NAME=ogs_mvp_session
FRONTEND_URL=http://localhost:5173
REDIS_URL=your_redis_connection_string
ADMIN_EMAIL=admin@example.com
ENCRYPTION_SECRET=replace-with-32-plus-random-characters
```

Run the backend in development mode:
```bash
npm run server
```
The API will be available at `http://localhost:4000`.

### 3. Frontend Setup
```bash
cd client
npm install
```

Create a `.env` file inside `client/`:
```env
VITE_BASE_URL=http://localhost:4000
```

Run the frontend:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## API Overview

All routes are prefixed with `/api`.

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Log in with email, password, and role type |
| GET | `/session` | Authenticated | Get the current logged-in user's session |
| POST | `/change-password` | Authenticated | Change the current user's password |

### Employees (`/api/employees`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | List all employees (optional `?department=` filter) |
| POST | `/` | Admin | Create a new employee + user account |
| PUT | `/:id` | Admin | Update an employee's details |
| DELETE | `/:id` | Admin | Delete an employee |

### Profile (`/api/profile`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get the logged-in employee's profile (returns a minimal admin profile if the user has no linked Employee record) |
| POST | `/` | Authenticated | Update the logged-in employee's bio |

### Attendance (`/api/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get the employee's attendance history |
| POST | `/` | Authenticated | Clock in or clock out (toggles automatically) |

### Leave (`/api/leave`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get leave applications (all for admin, own for employee) |
| POST | `/` | Authenticated | Submit a new leave application |
| PATCH | `/:id` | Admin | Approve or reject a leave application |

### Payslips (`/api/payslips`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get payslip history (all employees for admin, own history for employee) |
| GET | `/:id` | Authenticated | Get a single payslip by ID |
| POST | `/` | Admin | Generate a payslip for an employee |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get role-specific dashboard statistics |

---

## Background Jobs (Inngest)

| Job | Trigger | Description |
|---|---|---|
| `auto-check-out` | Event: `employee/check-out` | Sends a reminder email if an employee hasn't checked out after 9 hours; auto-marks attendance as "LATE" after 10 hours |
| `leave-application-reminder` | Event: `leave/pending` | Notifies the admin if a leave application is still pending after ~20 hours |
| `attendance-reminder-cron` | Cron: `0 6 * * *` (8:00 AM Cairo time) | Emails employees who haven't checked in and aren't on approved leave |

---

## Data Models

**User**
| Field | Type | Notes |
|---|---|---|
| `email` | String | Required, unique |
| `password` | String | Hashed with bcrypt |
| `role` | String | `ADMIN` \| `EMPLOYEE` (default: `EMPLOYEE`) |

**Employee**
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId (ref: `User`) | Required, unique |
| `firstName`, `lastName` | String | Required |
| `email`, `phone`, `position` | String | Required |
| `basicSalary`, `allowances`, `deductions` | Number | Default: `0` |
| `employmentStatus` | String | `ACTIVE` \| `INACTIVE` |
| `department` | String | One of the predefined departments |
| `joinDate` | Date | Required |
| `isDeleted` | Boolean | Soft-delete flag |
| `bio` | String | Optional |

**Attendance**
| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId (ref: `Employee`) | Required |
| `date`, `checkIn`, `checkOut` | Date | |
| `status` | String | e.g. `PRESENT`, `LATE` |
| `workingHours` | Number | Calculated on check-out |
| `dayType` | String | e.g. `Full Day`, `Half Day`, `Short Day` |

**LeaveApplication**
| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId (ref: `Employee`) | Required |
| `type` | String | `SICK` \| `CASUAL` \| `ANNUAL` |
| `startDate`, `endDate` | Date | Required |
| `reason` | String | Required |
| `status` | String | `PENDING` \| `APPROVED` \| `REJECTED` |

**Payslip**
| Field | Type | Notes |
|---|---|---|
| `employeeId` | ObjectId (ref: `Employee`) | Required |
| `month`, `year` | Number | Required |
| `basicSalary`, `allowances`, `deductions` | Number | |
| `netSalary` | Number | Calculated: `basicSalary + allowances - deductions` |

---

## Authentication Flow

1. User logs in via `/api/auth/login` with `email`, `password`, and `role_type`.
2. On success, the server returns a signed JWT (`token`) and the user object.
3. The frontend stores the token in `localStorage` and attaches it to every request as:
   ```
   Authorization: Bearer <token>
   ```
4. Protected routes use the `protect` middleware to verify the token and attach the decoded payload to `req.session`.
5. Admin-only routes additionally use the `protectAdmin` middleware.

---

## Deployment

The backend is configured for deployment on **Vercel** as a serverless function:
- `server/api/index.js` re-exports the Express `app` so Vercel can detect it as a function.
- `server/vercel.json` rewrites all incoming requests to that function.
- Environment variables must be configured manually in the Vercel dashboard (Vercel does not read `.env` files).

The frontend can be deployed separately (e.g., Vercel, Netlify) with `VITE_BASE_URL` pointing to the deployed backend URL.

---

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Full access: manage employees, approve leave, generate payslips, view org-wide dashboard |
| `EMPLOYEE` | Limited access: manage own attendance, leave requests, payslips, and profile |

---

## License

This project is licensed under the ISC License.

---

## Author

**Mahmoud Aldeeb**
