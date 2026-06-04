"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, Star, Package, Wallet, Coins, ShieldCheck, ShieldX,
  MapPin, ChevronRight, RefreshCw, Plus, Minus, MessageSquare, X, Clock
} from "lucide-react";
import adminApi from "@/lib/api";
import toast from "react-hot-toast";

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${value >= s ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}`} />
      ))}
    </div>
  );
}

function formatTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(a?: string, b?: string) {
  if (!a || !b) return "—";
  const mins = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function PointsModal({ partner, onClose, onSuccess }: { partner: any; onClose: () => void; onSuccess: () => void }) {
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (points === 0) { toast.error("Enter points amount"); return; }
    setLoading(true);
    try {
      await adminApi.put(`/api/admin/delivery-partners/${partner.id}/points`, { points, reason });
      toast.success(points > 0 ? `+${points} points added!` : `${Math.abs(points)} points deducted`);
      onSuccess();
    } catch (e: any) { toast.error(e.response?.data?.error || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Manage Points — {partner?.user?.name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Current points: <span className="font-bold text-purple-600">{partner?.points || 0}</span></p>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setPoints(Math.abs(points) * -1)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${points < 0 ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600"}`}>
            <Minus className="w-4 h-4 inline mr-1" />Deduct
          </button>
          <button onClick={() => setPoints(Math.abs(points))} className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${points >= 0 ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"}`}>
            <Plus className="w-4 h-4 inline mr-1" />Add
          </button>
        </div>
        <input type="number" min="1" placeholder="Points amount" value={Math.abs(points) || ""}
          onChange={(e) => setPoints(points < 0 ? -Number(e.target.value) : Number(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <input type="text" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500" />
        <button onClick={submit} disabled={loading || points === 0}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm">
          {loading ? "Saving..." : "Apply Changes"}
        </button>
      </motion.div>
    </div>
  );
}

export default function AdminDeliveryPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pointsModal, setPointsModal] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      const { data } = await adminApi.get("/api/admin/delivery-partners", { params });
      setPartners(data.partners);
    } catch { toast.error("Failed to fetch partners"); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchPartners(); }, [statusFilter]);

  // Auto-refresh every 15s for live status
  useEffect(() => {
    const interval = setInterval(fetchPartners, 15000);
    return () => clearInterval(interval);
  }, [fetchPartners]);

  const fetchDetail = async (partner: any) => {
    setSelected(partner);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await adminApi.get(`/api/admin/delivery-partners/${partner.id}`);
      setDetail(data);
    } catch { toast.error("Failed to fetch partner details"); }
    finally { setDetailLoading(false); }
  };

  const toggleVerify = async (partner: any) => {
    try {
      await adminApi.put(`/api/admin/delivery-partners/${partner.id}`, { isVerified: !partner.isVerified });
      toast.success(partner.isVerified ? "Partner unverified" : "Partner verified ✅");
      fetchPartners();
      if (selected?.id === partner.id) fetchDetail(partner);
    } catch { toast.error("Failed to update"); }
  };

  const handleNotifyPartner = async (partner: any) => {
    const msg = prompt(`Enter message for ${partner.user?.name}:`);
    if (!msg) return;
    try {
      await adminApi.post("/api/admin/users/notify", {
        userId: partner.userId,
        title: "Admin Notification",
        message: msg,
        type: "SYSTEM"
      });
      toast.success("Notification sent!");
    } catch {
      toast.error("Failed to send notification");
    }
  };

  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-700",
    BUSY: "bg-orange-100 text-orange-700",
    OFFLINE: "bg-gray-100 text-gray-500",
  };

  const statusDot: Record<string, string> = {
    AVAILABLE: "bg-green-500",
    BUSY: "bg-orange-500",
    OFFLINE: "bg-gray-400",
  };

  return (
    <div className="flex gap-5 h-full">
      {/* ── Left: Partner List ── */}
      <div className="w-80 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900">Delivery Partners</h1>
          <button onClick={fetchPartners} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "AVAILABLE", "BUSY", "OFFLINE"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          )) : partners.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No partners found</div>
          ) : partners.map((p) => (
            <button key={p.id} onClick={() => fetchDetail(p)} className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${selected?.id === p.id ? "border-green-500 bg-green-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusDot[p.status] || "bg-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{p.user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.user?.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${statusColors[p.status]}`}>{p.status}</span>
                    <div className="flex items-center gap-0.5 text-xs text-gray-500">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{p.rating?.toFixed(1)}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Partner Detail ── */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Truck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Select a partner to view details</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </div>
        ) : detail ? (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                    <Truck className="w-7 h-7 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{detail.user?.name}</h2>
                    <p className="text-sm text-gray-400">{detail.user?.email}</p>
                    <p className="text-xs text-gray-400">{detail.vehicleType} • {detail.vehicleNo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[detail.status]}`}>{detail.status}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${detail.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {detail.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={async () => {
                    const newStatus = detail.status === "OFFLINE" ? "AVAILABLE" : "OFFLINE";
                    try {
                      await adminApi.put(`/api/admin/delivery-partners/${detail.id}`, { status: newStatus });
                      toast.success(`Partner marked as ${newStatus}`);
                      fetchDetail(detail);
                      fetchPartners();
                    } catch { toast.error("Failed to update status"); }
                  }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border ${detail.status !== "OFFLINE" ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}>
                    <Truck className="w-3.5 h-3.5" />
                    {detail.status !== "OFFLINE" ? "Mark Offline" : "Mark Online"}
                  </button>
                  <button onClick={() => setPointsModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-semibold hover:bg-purple-100">
                    <Coins className="w-3.5 h-3.5" />Points
                  </button>
                  <button onClick={() => toggleVerify(detail)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border ${detail.isVerified ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}>
                    {detail.isVerified ? <ShieldX className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {detail.isVerified ? "Unverify" : "Verify"}
                  </button>
                  <button onClick={() => handleNotifyPartner(detail)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100">
                    <MessageSquare className="w-3.5 h-3.5" />Message
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-3 mt-4">
                {[
                  { icon: Package, label: "Total Orders", value: detail.totalOrders, color: "bg-blue-100 text-blue-600" },
                  { icon: Wallet, label: "Total Earnings", value: `₹${detail.totalEarnings?.toFixed(0) || 0}`, color: "bg-green-100 text-green-600" },
                  { icon: Coins, label: "Points", value: detail.points || 0, color: "bg-purple-100 text-purple-600" },
                  { icon: Star, label: "Avg Rating", value: detail.rating?.toFixed(1) || "5.0", color: "bg-yellow-100 text-yellow-600" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="font-black text-gray-900 text-sm">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Location */}
              {detail.latitude && detail.longitude && (
                <a href={`https://maps.google.com/?q=${detail.latitude},${detail.longitude}`} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <MapPin className="w-4 h-4" />View Last Known Location on Map
                </a>
              )}
            </div>

            {/* Order History */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Order History ({detail.orders?.length || 0})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Order #", "Assigned", "Bike Started", "Arrived", "Delivered", "Duration", "Amount", "Rating"].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!detail.orders?.length ? (
                      <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No orders yet</td></tr>
                    ) : detail.orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-gray-900">{order.orderNumber}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{formatTime(order.assignedAt)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{formatTime(order.pickedUpAt)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{formatTime(order.arrivedAt)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{formatTime(order.deliveredAt)}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-green-700">
                          {formatDuration(order.assignedAt, order.deliveredAt)}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-900">₹{order.total?.toFixed(0)}</td>
                        <td className="px-4 py-3">
                          {order.deliveryRating ? (
                            <div>
                              <StarDisplay value={order.deliveryRating.rating} />
                              {order.deliveryRating.comment && (
                                <p className="text-xs text-gray-400 mt-0.5 max-w-24 truncate" title={order.deliveryRating.comment}>
                                  "{order.deliveryRating.comment}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Ratings */}
            {detail.ratings?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-yellow-500" />
                  Customer Reviews ({detail.ratings.length})
                </h3>
                <div className="space-y-3">
                  {detail.ratings.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Star className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <StarDisplay value={r.rating} />
                          <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 mt-1">"{r.comment}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Points Modal */}
      <AnimatePresence>
        {pointsModal && detail && (
          <PointsModal
            partner={detail}
            onClose={() => setPointsModal(false)}
            onSuccess={() => { setPointsModal(false); fetchDetail(selected); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
