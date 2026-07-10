import { Toaster } from "react-hot-toast";
import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loading from "./components/Loading";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginForm from "./components/LoginForm";
import Layout from "./pages/Layout";

const LoginLanding = lazy(() => import("./pages/LoginLanding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Leave = lazy(() => import("./pages/Leave"));
const Payslips = lazy(() => import("./pages/Payslips"));
const Settings = lazy(() => import("./pages/Settings"));
const PrintPayslip = lazy(() => import("./pages/PrintPayslip"));

const App = () => {
  return (
    <>
      <Toaster />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginLanding />} />
          <Route
            path="/login/admin"
            element={
              <LoginForm
                role="admin"
                title="Admin Portal"
                subtitle="Sign in to manage the organization"
              />
            }
          />
          <Route
            path="/login/employee"
            element={
              <LoginForm
                role="employee"
                title="Employee Portal"
                subtitle="Sign in to access your account"
              />
            }
          />

          {/* Protected routes for all logged in users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leave" element={<Leave />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/settings" element={<Settings />} />
              {/* Admin only routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/employees" element={<Employees />} />
              </Route>
            </Route>

            <Route path="/print/payslips/:id" element={<PrintPayslip />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
