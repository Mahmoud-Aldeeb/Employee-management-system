import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { Lock } from "lucide-react";
import ProfileForm from "../components/ProfileForm";
import ChangePasswordModal from "../components/ChangePasswordModal";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import useFetch from "../hooks/useFetch";
import usePageTitle from "../hooks/usePageTitle";

const Settings = () => {
  usePageTitle("Settings");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // useFetch handles profile retrieval and loading state
  const {
    data: profile,
    loading,
    error,
    refetch,
  } = useFetch(() => api.get("/profile"), []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>
      {profile && <ProfileForm initialData={profile} onSuccess={refetch} />}
      {/* Change password trigger */}
      <div className="card max-w-md p-6 flex items-center justify-between mt-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-lg">
            <Lock className="size-5 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Password</p>
            <p className="text-sm text-slate-500">
              Update your account password
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="btn-secondary text-sm"
        >
          Change
        </button>
      </div>
      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default Settings;
