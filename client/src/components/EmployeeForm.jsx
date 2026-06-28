import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS } from "../assets/assets";
import { Loader2Icon } from "lucide-react";

const EmployeeForm = ({ initialData, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!initialData;
  const handleSubmit = async (e) => {
    e.preventDefault();
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-3xl animate-fade-in"
    >
      {/* Personal Information */}
      <div className="card p-5 sm:p-6">
        <h3 className="font-medium mb-6 pb-4 border-b">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          <div>
            <label htmlFor="firstName" className="block mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              required
              defaultValue={initialData?.firstName}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block mb-2">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              required
              defaultValue={initialData?.lastName}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="text"
              name="phone"
              required
              defaultValue={initialData?.phone}
            />
          </div>
          <div>
            <label htmlFor="joinDate" className="block mb-2">
              Join Date
            </label>
            <input
              id="joinDate"
              type="date"
              name="joinDate"
              required
              defaultValue={
                initialData?.joinDate
                  ? new Date(initialData.joinDate).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="bio" className="block mb-2">
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={initialData?.bio}
              rows={3}
              className="resize-none"
              placeholder="Brief description..."
            />
          </div>
        </div>
      </div>

      {/* employment Details */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">
          Employment Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          <div>
            <label htmlFor="department" className="block mb-2">
              Department
            </label>
            <select
              id="department"
              name="department"
              defaultValue={initialData?.department || ""}
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((deptName) => (
                <option key={deptName} value={deptName}>
                  {deptName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="position" className="block mb-2">
              Position
            </label>
            <input
              id="position"
              type="text"
              name="position"
              required
              defaultValue={initialData?.position}
            />
          </div>
          <div>
            <label htmlFor="basicSalary" className="block mb-2">
              Basic Salary
            </label>
            <input
              id="basicSalary"
              type="text"
              name="basicSalary"
              required
              min="0"
              defaultValue={initialData?.basicSalary || 0}
            />
          </div>
          <div>
            <label htmlFor="allowances" className="block mb-2">
              Allowances
            </label>
            <input
              id="allowances"
              type="number"
              name="allowances"
              required
              defaultValue={initialData?.allowances || 0}
            />
          </div>
          <div>
            <label htmlFor="deductions" className="block mb-2">
              Deductions
            </label>
            <input
              id="deductions"
              type="number"
              name="deductions"
              required
              defaultValue={initialData?.deductions || 0}
            />
          </div>
          {isEditMode && (
            <div>
              <label htmlFor="state" className="block mb-2">
                State
              </label>
              <select
                id="state"
                name="state"
                required
                defaultValue={initialData?.employmentStatus || 0}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>
      {/* Account Setup */}
      <div className="card p-5 sm:p-6">
        <h3 className="text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100">
          Account Setup
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-slate-700">
          <div className="sm:col-span-2">
            <label htmlFor="email" className="block mb-2">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              defaultValue={initialData?.email}
            />
          </div>

          {!isEditMode && (
            <div>
              <label htmlFor="password" className="block mb-2">
                Temporary Password
              </label>
              <input id="password" type="password" name="password" required />
            </div>
          )}
          {isEditMode && (
            <div>
              <label htmlFor="changePassword" className="block mb-2">
                Change Password
              </label>
              <input
                id="changePassword"
                type="password"
                name="changePassword"
                placeholder="Leave blank to keep current"
              />
            </div>
          )}
          <div>
            <label htmlFor="role" className="block mb-2">
              System Role
            </label>
            <select
              name="role"
              id="role"
              defaultValue={initialData?.user?.role || "EMPLOYEE"}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* buttons */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => (onCancel ? onCancel() : navigate(-1))}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center justify-center"
        >
          {loading && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
          {isEditMode ? "Update Employee" : "Create Employee"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
