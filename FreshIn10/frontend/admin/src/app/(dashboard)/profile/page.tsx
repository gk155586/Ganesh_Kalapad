"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Clock, Key, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import adminApi from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setEditForm({ name: u.name || "", email: u.email || "" });
    }
    // Fetch fresh from API
    adminApi.get("/api/users/profile")
      .then(({ data }) => {
        setUser(data);
        setEditForm({ name: data.name || "", email: data.email || "" });
        localStorage.setItem("adminUser", JSON.stringify(data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateProfile = async () => {
    setEditLoading(true);
    try {
      const { data } = await adminApi.put("/api/users/profile", editForm);
      setUser(data);
      localStorage.setItem("adminUser", JSON.stringify(data));
      toast.success("Profile updated successfully!");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to update profile");
    } finally { setEditLoading(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { toast.error("Passwords don't match"); return; }
    if (pwForm.newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPwLoading(true);
    try {
      await adminApi.put("/api/users/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      toast.success("Password changed successfully!");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to change password");
    } finally { setPwLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {[1, 2].map((i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
      </div>
    );
  }

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "A";
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-black text-gray-900">My Profile</h1>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-3xl">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                <Shield className="w-3 h-3" />{user?.isMainAdmin ? "Main Admin" : user?.role || "ADMIN"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3 h-3" />Joined {joinedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          {[
            { icon: User, label: "Full Name", value: user?.name },
            { icon: Mail, label: "Email", value: user?.email },
            { icon: Shield, label: "Role", value: user?.isMainAdmin ? "Main Admin" : user?.role || "ADMIN" },
            { icon: CheckCircle, label: "Status", value: user?.isActive ? "Active" : "Inactive" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Edit Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Edit Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email Address</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button onClick={updateProfile} disabled={editLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm">
            {editLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : "Save Changes"}
          </button>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-500" />Change Password
        </h3>
        <div className="space-y-3">
          {[
            { key: "current", label: "Current Password" },
            { key: "newPw", label: "New Password" },
            { key: "confirm", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{label}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={pwForm[key as keyof typeof pwForm]}
                  onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {key === "confirm" && (
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={changePassword} disabled={pwLoading || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold rounded-xl text-sm">
            {pwLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Changing…</> : "Change Password"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
