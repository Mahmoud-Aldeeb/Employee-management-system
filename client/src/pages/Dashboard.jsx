import { useEffect } from "react";
import Loading from "../components/Loading";
import EmployeeDashboard from "../components/EmployeeDashboard";
import AdminDashboard from "../components/AdminDashboard";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import useFetch from "../hooks/useFetch";
import usePageTitle from "../hooks/usePageTitle";

const Dashboard = () => {
  usePageTitle("Dashboard");
  const { data, loading, error } = useFetch(() => api.get("/dashboard"), []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) return <Loading />;
  if (!data) {
    return (
      <p className="text-center text-slate-500 py-12">
        Failed to load dashboard
      </p>
    );
  }
  if (data.role === "ADMIN") {
    return <AdminDashboard data={data} />;
  } else {
    return <EmployeeDashboard data={data} />;
  }
};

export default Dashboard;
