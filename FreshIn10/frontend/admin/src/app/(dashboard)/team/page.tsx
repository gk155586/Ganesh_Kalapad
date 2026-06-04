"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, ShieldCheck, Truck, Eye, EyeOff, Loader2, CheckCircle, Trash2, RefreshCw, MoreVertical, Bell } from "lucide-react";
import adminApi from "@/lib/api";
import { formatDateTime } from "@freshin10/utils";
import toast from "react-hot-toast";
import { PartnerDetailsModal } from "@/components/team/PartnerDetailsModal";

type Role = "ADMIN" | "DELIVERY" | "DELIVERY_PARTNER";

export default function AdminTeamPage() {
  const [role, setRole] = useState<Role>("DELIVERY");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    vehicleType: "BIKE", vehicleNo: "", licenseNo: "",
  });

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const { data } = await adminApi.get("/api/admin/team");
      setMembers(data);
    } catch {
      toast.error("Failed to fetch team");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
      };
      if (role === "DELIVERY") {
        payload.vehicleType = form.vehicleType;
        payload.vehicleNo = form.vehicleNo;
        payload.licenseNo = form.licenseNo;
      }
      const { data } = await adminApi.post("/api/admin/team", payload);
      setSuccess({ ...data, password: form.password });
      setForm({ name: "", email: "", password: "", vehicleType: "BIKE", vehicleNo: "", licenseNo: "" });
      toast.success(`${role === "ADMIN" ? "Admin" : "Delivery Partner"} account created!`);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your team? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/api/admin/team/${id}`);
      toast.success(`${name} has been removed`);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove member. You may not have permission.");
    }
  };

  const handleNotifyTeamMember = async (id: string, name: string) => {
    const msg = prompt(`Enter notification message for ${name}:`);
    if (!msg) return;
    try {
      await adminApi.post("/api/admin/users/notify", {
        userId: id,
        title: "Admin Notification",
        message: msg,
        type: "SYSTEM"
      });
      toast.success("Notification sent!");
    } catch {
      toast.error("Failed to send notification");
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    DELIVERY: "bg-orange-100 text-orange-700",
    DELIVERY_PARTNER: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Team Management</h1>
        <p className="text-gray-500 text-sm mt-1">Create and manage admin or delivery partner accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Create Form ── */}
        <div className="space-y-4">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "DELIVERY", label: "Delivery Partner", desc: "Can log in to delivery app", icon: Truck, color: "orange" },
              { key: "ADMIN", label: "Sub-Admin", desc: "Full access to admin panel", icon: ShieldCheck, color: "purple" },
            ] as any[]).map(({ key, label, desc, icon: Icon, color }) => (
              <button key={key} onClick={() => setRole(key as Role)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  role === key
                    ? color === "orange" ? "border-orange-500 bg-orange-50" : "border-purple-500 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color === "orange" ? "bg-orange-100" : "bg-purple-100"}`}>
                  <Icon className={`w-4 h-4 ${color === "orange" ? "text-orange-600" : "text-purple-600"}`} />
                </div>
                <p className="font-bold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-green-600" />
              Create {role === "ADMIN" ? "Sub-Admin" : "Delivery Partner"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    placeholder="John Doe"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                    placeholder="user@example.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password * (min 8 chars)</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {role === "DELIVERY" && (
                <div className="bg-orange-50 rounded-xl p-3 space-y-2 border border-orange-100">
                  <p className="text-xs font-semibold text-orange-800">Vehicle Details</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option>BIKE</option><option>SCOOTER</option><option>CYCLE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle No.</label>
                      <input value={form.vehicleNo} onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                        placeholder="MH12AB1234"
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">License No.</label>
                      <input value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                        placeholder="DL-XXXXXX"
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><UserPlus className="w-4 h-4" />Create Account</>}
              </button>
            </form>

            {/* Success Card */}
            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-green-900 text-sm">Account Created!</p>
                      <div className="mt-2 bg-white rounded-lg p-3 space-y-1.5 border border-green-200 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Email:</span><span className="font-semibold">{success.email}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Password:</span><span className="font-mono font-bold">{success.password}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Login at:</span>
                          <span className="font-semibold text-green-700">
                            {success.role === "ADMIN" ? "localhost:3001/login" : "localhost:3002/login"}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setSuccess(null)} className="mt-2 text-xs text-green-700 hover:underline">Dismiss</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Team Members List ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Current Team</h2>
            <button onClick={fetchMembers} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {membersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-10">
              <UserPlus className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No team members yet</p>
              <p className="text-xs text-gray-400 mt-1">Create one using the form</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const partner = member.deliveryPartner;
                const isMainAdmin = member.isMainAdmin || member.email === "admin@gmail.com";
                return (
                  <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={() => partner && setSelectedPartnerId(partner.id)}
                    className={`rounded-xl border border-gray-100 overflow-hidden transition-all ${partner ? "cursor-pointer hover:border-green-200 hover:shadow-md active:scale-[0.98]" : ""}`}>
                    {/* Header row */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${member.role === "ADMIN" ? "bg-purple-100" : "bg-orange-100"}`}>
                        {member.role === "ADMIN" ? <ShieldCheck className="w-4 h-4 text-purple-600" /> : <Truck className="w-4 h-4 text-orange-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
                          {member.name}
                          {isMainAdmin && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md border border-purple-200">Main Admin</span>}
                        </p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[member.role]}`}>
                          {isMainAdmin ? "Main Admin" : member.role === "ADMIN" ? "Sub Admin" : "Delivery"}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                        {partner && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${partner.isVerified ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {partner.isVerified ? "Approved" : "Pending"}
                          </span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleNotifyTeamMember(member.id, member.name); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 flex-shrink-0" title="Send Notification">
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        {!isMainAdmin && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (member && member.id) {
                                handleDelete(member.id, member.name || "Member");
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 flex-shrink-0" 
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                      </div>
                    </div>
                    {/* Detail rows */}
                    <div className="px-3 py-2.5 space-y-1.5 text-xs">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">User ID:</span>
                          <span className="font-mono text-gray-600 truncate max-w-28 text-right">{member.id.slice(0, 12)}…</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Phone:</span>
                          <span className="font-semibold text-gray-700">{member.phone || "—"}</span>
                        </div>
                        {partner && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Vehicle:</span>
                              <span className="font-semibold text-gray-700">{partner.vehicleNo || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Status:</span>
                              <span className={`font-semibold ${partner.isVerified ? "text-blue-600" : "text-yellow-600"}`}>
                                {partner.isVerified ? "Approved ✓" : "Requires Approval"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {partner && (
                        <div className="pt-1 text-[10px] font-black text-green-600 flex items-center gap-1 uppercase tracking-widest">
                          <MoreVertical className="w-3 h-3" /> Click to Manage Full Profile & Payouts
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedPartnerId && (
          <PartnerDetailsModal
            partnerId={selectedPartnerId}
            onClose={() => setSelectedPartnerId(null)}
            onUpdate={fetchMembers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
