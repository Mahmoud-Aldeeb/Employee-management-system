import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import api from "../../api/axios";
import { toast } from "react-hot-toast";

const GeneratePayslipForm = ({ employees, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen)
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus className="size-4" /> Generate Payslip
      </button>
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      await api.post("/payslips", data);
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h3>Generate Monthly Payslip</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* select employee */}
          <div>
            <label
              htmlFor="employeeId"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Employee
            </label>
            <select name="employeeId" id="employeeId" required>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.position})
                </option>
              ))}
            </select>
          </div>
          {/* select month & year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium">
                Month
              </label>
              <select name="month" id="month">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option value={m} key={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium">
                Year
              </label>
              <input
                type="number"
                name="year"
                id="year"
                defaultValue={new Date().getFullYear()}
              />
            </div>
          </div>
          {/* Basic Salary */}
          <div>
            <label
              htmlFor="basicSalary"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Basic Salary
            </label>
            <input
              type="number"
              name="basicSalary"
              id="basicSalary"
              required
              placeholder="5000"
            />
          </div>

          {/* Allowances & Deductions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="allowances"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Allowances
              </label>
              <input
                type="number"
                name="allowances"
                id="allowances"
                defaultValue="0"
              />
            </div>
            <div>
              <label
                htmlFor="deductions"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Deductions
              </label>
              <input
                type="number"
                name="deductions"
                id="deductions"
                defaultValue="0"
              />
            </div>
          </div>
          {/* buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              disabled={loading}
              className="btn-primary flex items-center"
              type="submit"
            >
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneratePayslipForm;
