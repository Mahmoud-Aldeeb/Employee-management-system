import { useState, useMemo } from "react";
import { DEPARTMENTS } from "../assets/assets";
import { Plus, Search } from "lucide-react";
import EmployeeCard from "../components/EmployeeCard";
import EmployeeForm from "../components/EmployeeForm";
import api from "../api/axios";
import useFetch from "../hooks/useFetch";
import useDebounce from "../hooks/useDebounce";
import usePageTitle from "../hooks/usePageTitle";
import Modal from "../components/ui/Modal";

const Employees = () => {
  usePageTitle("Employees");

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [editEmployee, setEditEmployee] = useState(null);
  const [showCreateModel, setShowCreateModel] = useState(false);

  // useFetch handles loading state and axios request execution
  const {
    data: employees = [],
    loading,
    refetch,
  } = useFetch(() => {
    const url = selectedDept
      ? `/employees?department=${selectedDept}`
      : "/employees";
    return api.get(url);
  }, [selectedDept]);

  // useDebounce delays search query execution for better performance
  const debouncedSearch = useDebounce(search, 400);

  // useMemo caches filtered results to optimize render times
  const filtered = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list.filter((emp) =>
      `${emp.firstName} ${emp.lastName} ${emp.position}`
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase()),
    );
  }, [employees, debouncedSearch]);

  return (
    <div className="animate-fade-in">
      {/* ----- header ----- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members</p>
        </div>
        <button
          onClick={() => setShowCreateModel(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* ----- search bar ----- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="max-w-40"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((deptName) => (
            <option key={deptName} value={deptName}>
              {deptName}
            </option>
          ))}
        </select>
      </div>

      {/* ------ employee cards ------ */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No employees found
            </p>
          ) : (
            filtered.map((emp) => (
              <EmployeeCard
                key={emp._id || emp.id}
                employee={emp}
                onDelete={refetch}
                onEdit={(e) => setEditEmployee(e)}
              />
            ))
          )}
        </div>
      )}

      {/* Create Employee Modal */}
      <Modal
        open={showCreateModel}
        onClose={() => setShowCreateModel(false)}
        title="Add New Employee"
        subtitle="Create a user account and employee profile"
      >
        <EmployeeForm
          onSuccess={() => {
            setShowCreateModel(false);
            refetch();
          }}
          onCancel={() => setShowCreateModel(false)}
        />
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        open={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        title="Edit Employee"
        subtitle="Update employee details"
      >
        <EmployeeForm
          initialData={editEmployee}
          onSuccess={() => {
            setEditEmployee(null);
            refetch();
          }}
          onCancel={() => setEditEmployee(null)}
        />
      </Modal>
    </div>
  );
};

export default Employees;
