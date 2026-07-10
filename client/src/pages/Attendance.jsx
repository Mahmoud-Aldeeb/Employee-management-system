import { useEffect } from "react";
import Loading from "../components/Loading";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useFetch from "../hooks/useFetch";
import usePageTitle from "../hooks/usePageTitle";

const Attendance = () => {
  usePageTitle("Attendance");

  // useFetch handles retrieving attendance record history and employee details
  const {
    data: payload,
    loading,
    error,
    refetch,
  } = useFetch(() => api.get("/attendance"), []);

  const history = payload?.data || [];
  const isDeleted = payload?.employee?.isDeleted || false;

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) return <Loading />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecord = history.find(
    (r) => new Date(r.date).toDateString() === today.toDateString(),
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">
          Track your work hours and daily check-ins
        </p>
      </div>
      {isDeleted ? (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p className="text-rose-600">
            You can no longer clock in or out because your employee records have
            been marked as deleted.
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <CheckInButton todayRecord={todayRecord} onAction={refetch} />
        </div>
      )}

      <AttendanceStats history={history} />
      <AttendanceHistory history={history} />
    </div>
  );
};

export default Attendance;
