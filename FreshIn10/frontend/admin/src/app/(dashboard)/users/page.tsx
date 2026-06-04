"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, UserCheck, UserX, Mail, Phone, ShoppingBag, ShieldCheck, Pencil, X, Trash2, Bell } from "lucide-react";
import adminApi from "@/lib/api";
import { formatDateTime } from "@freshin10/utils";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("CUSTOMER");
  const [editUser, setEditUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyUser, setNotifyUser] = useState<any>(null);
  const [notifyForm, setNotifyForm] = useState({ title: "", message: "", data: "" });
  const [userStats, setUserStats] = useState({ totalUsers: 0, activeUsers: 0, newUsers: 0 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (search) params.search = search;
      if (roleFilter !== "ALL") params.role = roleFilter;
      const [usersRes, statsRes] = await Promise.all([
        adminApi.get("/api/admin/users", { params }),
        adminApi.get("/api/admin/users/stats"),
      ]);
      setUsers(usersRes.data.users);
      setUserStats(statsRes.data);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, search === "" ? 0 : 400);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const toggleActive = async (userId: string, isActive: boolean, email: string) => {
    if (email === "admin@gmail.com") {
      toast.error("Cannot modify the main admin account status");
      return;
    }
    try {
      await adminApi.put(`/api/admin/users/${userId}/status`, { isActive: !isActive });
      toast.success(isActive ? "User deactivated" : "User activated");
      fetchUsers();
    } catch {
      toast.error("Failed to update user");
    }
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || "" });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.put(`/api/admin/team/${editUser.id}`, editForm);
      toast.success("User updated successfully");
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const handleDeleteUser = async (id: string, name: string, isMainAdmin: boolean) => {
    if (isMainAdmin) {
      toast.error("Cannot delete the main admin account");
      return;
    }
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE user ${name}?`)) return;
    try {
      await adminApi.delete(`/api/admin/users/${id}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post("/api/admin/users/notify", {
        ...notifyForm,
        userId: notifyUser?.id, // undefined means send to all
      });
      toast.success(notifyUser ? "Notification sent to user" : "Notification sent to all users");
      setShowNotifyModal(false);
      setNotifyForm({ title: "", message: "", data: "" });
    } catch {
      toast.error("Failed to send notification");
    }
  };

  const roles = ["ALL", "CUSTOMER", "ADMIN", "DELIVERY"];
  const roleColors: Record<string, string> = {
    CUSTOMER: "bg-blue-100 text-blue-700",
    ADMIN: "bg-purple-100 text-purple-700",
    DELIVERY: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">{users.length} shown</span>
      </div>

      {/* Active User Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Customers</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{userStats.totalUsers}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Active (30 days)</p>
          </div>
          <p className="text-3xl font-black text-green-700">{userStats.activeUsers}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide">New (7 days)</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{userStats.newUsers}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { setNotifyUser(null); setShowNotifyModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200 hover:bg-purple-700 transition-colors"
        >
          <Bell className="w-4 h-4" /> Notify All
        </button>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                roleFilter === r ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r === "ALL" ? "All" : r === "DELIVERY_PARTNER" ? "Delivery" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["User", "Email / Phone", "Role", "Orders", "Wallet", "Joined", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isMainAdmin = user.isMainAdmin || user.email === "admin@gmail.com";
                  return (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 relative">
                            <span className="text-green-700 font-bold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                            {isMainAdmin && (
                              <span title="Protected Main Admin" className="absolute -top-1 -right-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {user.name}
                            {isMainAdmin && <span className="ml-1 text-xs text-purple-600">(Main Admin)</span>}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</p>
                        {user.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{user.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColors[user.role] || "bg-gray-100 text-gray-600"}`}>
                          {user.isMainAdmin ? "Main Admin" : user.role === "ADMIN" ? "Sub Admin" : user.role === "DELIVERY_PARTNER" ? "Delivery" : user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                          {user._count?.orders || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{user.walletBalance?.toFixed(0) || 0}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                          {user.lastOrderAt && new Date(user.lastOrderAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && (
                            <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                              Ordered recently
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isMainAdmin ? (
                          <span title="Protected" className="text-purple-400">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setNotifyUser(user); setShowNotifyModal(true); }}
                              title="Send Notification"
                              className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(user)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleActive(user.id, user.isActive, user.email)}
                              title={user.isActive ? "Deactivate" : "Activate"}
                              className={`p-1.5 rounded-lg transition-colors ${user.isActive ? "hover:bg-red-50 text-red-500" : "hover:bg-green-50 text-green-600"}`}
                            >
                              {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name, user.isMainAdmin)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)} className="fixed inset-0 bg-black/40 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Edit User</h2>
                  <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                    <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowEditModal(false)}
                      className="flex-1 border-2 border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700">Update</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notify Modal */}
      <AnimatePresence>
        {showNotifyModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNotifyModal(false)} className="fixed inset-0 bg-black/40 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">
                    {notifyUser ? `Notify ${notifyUser.name}` : "Notify All Users"}
                  </h2>
                  <button onClick={() => setShowNotifyModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleNotify} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input value={notifyForm.title} onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })} required
                      placeholder="e.g. 50% OFF Flash Sale!"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                    <textarea value={notifyForm.message} onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })} required rows={3}
                      placeholder="Enter the notification message..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Link URL (Optional)</label>
                    <input value={notifyForm.data} onChange={(e) => setNotifyForm({ ...notifyForm, data: e.target.value })}
                      placeholder="e.g. /products?category=fruits"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowNotifyModal(false)}
                      className="flex-1 border-2 border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-purple-700">Send Notification</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
