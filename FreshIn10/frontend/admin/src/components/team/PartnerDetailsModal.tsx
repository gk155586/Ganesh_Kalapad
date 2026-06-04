"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Truck, ShieldCheck, Mail, Phone, Calendar, 
  MapPin, Landmark, CreditCard, History, DollarSign,
  Edit3, Save, CheckCircle, XCircle, Loader2, Key,
  RefreshCw
} from "lucide-react";
import adminApi from "@/lib/api";
import toast from "react-hot-toast";
import { formatPrice } from "@freshin10/utils";

interface PartnerDetailsModalProps {
  partnerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function PartnerDetailsModal({ partnerId, onClose, onUpdate }: PartnerDetailsModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "financial" | "history" | "payouts">("overview");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payoutModal, setPayoutModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);

  const [form, setForm] = useState<any>({});
  const [payoutForm, setPayoutForm] = useState({ amount: "", period: "", referenceId: "" });
  const [resetForm, setResetForm] = useState({ password: "" });

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await adminApi.get(`/api/admin/delivery-partners/${partnerId}`);
      setData(data);
      setForm({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
        isActive: data.user.isActive,
        vehicleType: data.vehicleType || "",
        vehicleNo: data.vehicleNo || "",
        licenseNo: data.licenseNo || "",
        bankName: data.bankName || "",
        accountNo: data.accountNo || "",
        ifscCode: data.ifscCode || "",
        upiId: data.upiId || "",
        status: data.status,
        isVerified: data.isVerified,
      });
    } catch (err: any) {
      console.error("Fetch partner error:", err);
      setError(true);
      toast.error("Failed to load partner details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (partnerId) fetchData();
  }, [partnerId]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await adminApi.put(`/api/admin/delivery-partners/${partnerId}`, form);
      toast.success("Profile updated successfully");
      setEditMode(false);
      fetchData();
      onUpdate();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Update failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.post(`/api/admin/delivery-partners/${partnerId}/payouts`, payoutForm);
      toast.success("Payout logged successfully");
      setPayoutModal(false);
      setPayoutForm({ amount: "", period: "", referenceId: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Payout failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post(`/api/admin/delivery-partners/${partnerId}/reset-password`, resetForm);
      toast.success("Password reset successfully");
      setResetModal(false);
      setResetForm({ password: "" });
    } catch {
      toast.error("Reset failed");
    }
  };

  if (loading || error) return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-10 flex flex-col items-center max-w-sm text-center">
        {loading ? (
          <>
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="mt-4 font-bold text-gray-900">Loading partner profile...</p>
          </>
        ) : (
          <>
            <XCircle className="w-10 h-10 text-red-500" />
            <p className="mt-4 font-bold text-gray-900">Failed to load data</p>
            <p className="text-sm text-gray-500 mb-6">There was an error fetching the details. Please check your connection or try again.</p>
            <button onClick={fetchData} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-gray-800">
              <RefreshCw className="w-4 h-4" /> Retry Connection
            </button>
          </>
        )}
      </div>
    </div>
  );

  const stats = [
    { label: "Earnings", value: formatPrice(data.totalEarnings), icon: DollarSign, color: "text-green-600 bg-green-50" },
    { label: "Orders", value: data.totalOrders, icon: History, color: "text-blue-600 bg-blue-50" },
    { label: "Rating", value: `${data.rating} ★`, icon: CheckCircle, color: "text-orange-600 bg-orange-50" },
    { label: "Points", value: data.points, icon: Save, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-5xl shadow-2xl relative overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-gray-900 p-8 text-white">
          <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[32px] bg-green-500 flex items-center justify-center text-3xl font-black shadow-lg shadow-green-500/20">
              {data.user.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black">{data.user.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${data.user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {data.user.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-6 mt-3 text-gray-400">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {data.user.email}</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {data.user.phone || "No phone"}</div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined {new Date(data.user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setResetModal(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold flex items-center gap-2 transition-all">
                <Key className="w-4 h-4" /> Reset Pass
              </button>
              <button onClick={() => setEditMode(!editMode)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-600/30">
                {editMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {editMode ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-2">
            {[
              { id: "overview", label: "Overview", icon: ShieldCheck },
              { id: "financial", label: "Financial Details", icon: Landmark },
              { id: "history", label: "Delivery History", icon: History },
              { id: "payouts", label: "Payout Logs", icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === tab.id ? "bg-white text-green-600 shadow-md shadow-green-600/5 ring-1 ring-black/5" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
            
            <div className="mt-auto pt-6 border-t border-gray-200">
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 text-orange-700 font-bold text-sm mb-2">
                  <Truck className="w-4 h-4" /> Vehicle
                </div>
                <p className="text-xs text-orange-600 font-semibold">{data.vehicleType} • {data.vehicleNo || "NO PLATE"}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 bg-gray-50/50">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map(stat => (
                    <div key={stat.label} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-bold text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-green-600" /> Account Settings
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                        <input 
                          disabled={!editMode}
                          value={form.name}
                          onChange={e => setForm({...form, name: e.target.value})}
                          className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 disabled:opacity-70 px-4 py-2.5 font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                          <input 
                            disabled={!editMode}
                            value={form.phone}
                            onChange={e => setForm({...form, phone: e.target.value})}
                            className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 disabled:opacity-70 px-4 py-2.5 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Status</label>
                          <select 
                            disabled={!editMode}
                            value={String(form.isVerified)}
                            onChange={e => setForm({...form, isVerified: e.target.value === "true"})}
                            className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 disabled:opacity-70 px-4 py-2.5 font-bold text-blue-600"
                          >
                            <option value="true">Approved</option>
                            <option value="false">Pending Review</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-orange-600" /> Vehicle Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">License Number</label>
                        <input 
                          disabled={!editMode}
                          value={form.licenseNo}
                          onChange={e => setForm({...form, licenseNo: e.target.value})}
                          className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 disabled:opacity-70 px-4 py-2.5 font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Model/No</label>
                          <input 
                            disabled={!editMode}
                            value={form.vehicleNo}
                            onChange={e => setForm({...form, vehicleNo: e.target.value})}
                            className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 disabled:opacity-70 px-4 py-2.5 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Working Status</label>
                          <select 
                            disabled={!editMode}
                            value={form.status}
                            onChange={e => setForm({...form, status: e.target.value})}
                            className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 disabled:opacity-70 px-4 py-2.5 font-bold"
                          >
                            <option value="OFFLINE">Offline</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="BUSY">Busy</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {editMode && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                    <button onClick={handleUpdate} disabled={saving} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-green-700 shadow-xl shadow-green-600/20 disabled:opacity-60 transition-all">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Save Profile Changes
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === "financial" && (
              <div className="space-y-8">
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                  <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 text-xl">
                    <Landmark className="w-6 h-6 text-green-600" /> Banking Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank Name</label>
                      <input disabled={!editMode} value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">IFSC Code</label>
                      <input disabled={!editMode} value={form.ifscCode} onChange={e => setForm({...form, ifscCode: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Number</label>
                      <input disabled={!editMode} value={form.accountNo} onChange={e => setForm({...form, accountNo: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">UPI ID</label>
                      <input disabled={!editMode} value={form.upiId} onChange={e => setForm({...form, upiId: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-bold text-green-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-green-600 rounded-[32px] p-8 text-white shadow-xl shadow-green-600/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black">Current Earnings</h3>
                    <p className="text-green-100 opacity-80 mt-1">Total pending and processed payouts</p>
                    <div className="text-4xl font-black mt-4">{formatPrice(data.totalEarnings)}</div>
                  </div>
                  <button onClick={() => setPayoutModal(true)} className="bg-white text-green-600 px-8 py-4 rounded-[20px] font-black hover:bg-gray-100 transition-all flex items-center gap-2">
                    <DollarSign className="w-5 h-5" /> Log New Payout
                  </button>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-gray-900">Recent Deliveries</h3>
                  <div className="text-sm font-bold text-gray-400">{data.orders.length} Deliveries shown</div>
                </div>
                {data.orders.length === 0 ? (
                  <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
                    <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No delivery history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.orders.map((order: any) => (
                      <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-400 group-hover:text-green-600 transition-colors">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-400 font-semibold">{new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900">{formatPrice(order.total)}</p>
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Completed</span>
                        </div>
                        {order.deliveryRating && (
                          <div className="border-l border-gray-100 pl-4 flex items-center gap-1 text-orange-500">
                            <span className="font-black">{order.deliveryRating.rating}</span>
                            <Save className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "payouts" && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-gray-900">Recent Payouts</h3>
                {data.payouts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
                    <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No payout records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.payouts.map((payout: any) => (
                      <div key={payout.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                            <DollarSign className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{formatPrice(payout.amount)}</p>
                            <p className="text-xs text-gray-400 font-semibold">{payout.period}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${payout.status === "PROCESSED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {payout.status}
                          </span>
                          <p className="text-[10px] text-gray-400 font-mono">{payout.referenceId || "No Reference"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Payout Modal */}
      <AnimatePresence>
        {payoutModal && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Log New Payout</h3>
              <form onSubmit={handlePayout} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount (₹)</label>
                  <input required type="number" value={payoutForm.amount} onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-bold text-lg" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payout Period</label>
                  <input required value={payoutForm.period} onChange={e => setPayoutForm({...payoutForm, period: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-semibold" placeholder="e.g. 15-30 April 2024" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Reference</label>
                  <input value={payoutForm.referenceId} onChange={e => setPayoutForm({...payoutForm, referenceId: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-mono text-sm" placeholder="OPTIONAL" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setPayoutModal(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-2 bg-green-600 text-white px-8 py-3 rounded-xl font-black hover:bg-green-700 disabled:opacity-60 transition-all flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Payout
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetModal && (
          <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border-t-8 border-red-500">
              <h3 className="text-2xl font-black text-gray-900 mb-2">Reset Password</h3>
              <p className="text-gray-500 text-sm mb-6">Enter a new secure password for <b>{data.user.name}</b></p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                  <input required minLength={8} type="text" value={resetForm.password} onChange={e => setResetForm({...resetForm, password: e.target.value})} className="w-full bg-gray-50 border-gray-200 rounded-xl mt-1 px-4 py-3 font-bold" placeholder="••••••••" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setResetModal(false)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancel</button>
                  <button type="submit" className="flex-2 bg-red-500 text-white px-8 py-3 rounded-xl font-black hover:bg-red-600 transition-all">
                    Reset Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
