import { useMemo, useEffect } from "react";
import Loading from "../components/Loading";
import PayslipList from "../components/payslip/PayslipList";
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import useFetch from "../hooks/useFetch";
import usePageTitle from "../hooks/usePageTitle";

const Payslips = () => {
  usePageTitle("Payslips");
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // useFetch handles retrieving payslips record list
  const {
    data: payload,
    loading,
    error,
    refetch: fetchPayslips,
  } = useFetch(() => api.get("/payslips"), []);

  const payslips = payload?.data || [];

  // useFetch fetches employees for admin to populate creation form
  const { data: rawEmployees = [] } = useFetch(
    () => (isAdmin ? api.get("/employees") : Promise.resolve({ data: [] })),
    [isAdmin],
  );

  // useMemo caches active non-deleted employee records list
  const employees = useMemo(() => {
    const list = Array.isArray(rawEmployees) ? rawEmployees : [];
    return list.filter((e) => !e.isDeleted);
  }, [rawEmployees]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Payslips</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Generate and manage employee payslips"
              : "Your payslip history"}
          </p>
        </div>
        {isAdmin && (
          <GeneratePayslipForm
            employees={employees}
            onSuccess={fetchPayslips}
          />
        )}
      </div>
      <PayslipList payslips={payslips} isAdmin={isAdmin} />
    </div>
  );
};

export default Payslips;
