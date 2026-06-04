"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ChevronDown, Trash2, Zap, ZapOff, Users, UserCheck, Clock, RefreshCw, X, CheckCircle } from "lucide-react";
import adminApi from "@/lib/api";
import { formatPrice, formatDateTime } from "@freshin10/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@freshin10/utils";
import toast from "react-hot-toast";

const statusOptions = ["ALL", "PENDING", "CONFIRMED", "PREPARING", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [autoAssign, setAutoAssign] = useState(true);
  const [autoLoading, setAutoLoading] = useState(false);
  const [onlinePartners, setOnlinePartners] = useState<any[]>([]);
  const [assignModal, setAssignModal] = useState<any>(null); // order to manually assign
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [earningRate, setEarningRate] = useState<number>(50);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (selectedDate) params.date = selectedDate;
      const { data } = await adminApi.get("/api/admin/orders", { params });
      setOrders(data.orders);
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedDate]);

  const fetchOnlinePartners = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/api/admin/delivery-partners/online");
      setOnlinePartners(data);
    } catch {}
  }, []);

  const fetchAutoSetting = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/api/admin/settings/auto-assign");
      setAutoAssign(data.enabled);
    } catch {}
  }, []);

  const fetchEarningRate = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/api/admin/settings/earning-per-order");
      setEarningRate(data.amount);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchOnlinePartners();
    fetchAutoSetting();
    fetchEarningRate();
    const interval = setInterval(fetchOnlinePartners, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchOnlinePartners, fetchAutoSetting, fetchEarningRate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleAutoAssign = async () => {
    setAutoLoading(true);
    try {
      const { data } = await adminApi.put("/api/admin/settings/auto-assign", { enabled: !autoAssign });
      setAutoAssign(data.enabled);
      toast.success(data.enabled ? "🟢 Auto-Assign is now ON" : "🔴 Auto-Assign is now OFF");
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setAutoLoading(false);
    }
  };

  const updateEarningRate = async (newRate: number) => {
    if (newRate < 0 || isNaN(newRate)) return;
    setIsUpdatingRate(true);
    try {
      const { data } = await adminApi.put("/api/admin/settings/earning-per-order", { amount: newRate });
      setEarningRate(data.amount);
      toast.success(`Earning rate updated to ₹${data.amount}/order`);
    } catch {
      toast.error("Failed to update earning rate");
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const handleAssignToPartner = async (orderId: string, partnerId: string) => {
    setAssigningId(partnerId);
    try {
      await adminApi.post(`/api/admin/orders/${orderId}/assign`, { partnerId });
      toast.success("✅ Order assigned successfully!");
      setAssignModal(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to assign order");
    } finally {
      setAssigningId(null);
    }
  };

  const handleAutoAssignOrder = async (orderId: string) => {
    try {
      await adminApi.post(`/api/admin/orders/${orderId}/assign`, { partnerId: "AUTO" });
      toast.success("✅ Auto-assigned to best available partner!");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "No available partners");
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await adminApi.put(`/api/admin/orders/${orderId}/status`, { status });
      toast.success("Order status updated");
      fetchOrders();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const updatePartnerStatus = async (partnerId: string, status: string) => {
    try {
      await adminApi.put(`/api/admin/delivery-partners/${partnerId}/status`, { status });
      toast.success(`Partner marked as ${status}`);
      fetchOrders();
    } catch {
      toast.error("Failed to update partner status");
    }
  };

  const handleDeleteOrder = async (id: string, number: string) => {
    if (!confirm(`Delete order ${number}?`)) return;
    try {
      await adminApi.delete(`/api/admin/orders/${id}`);
      toast.success("Order deleted");
      fetchOrders();
    } catch {
      toast.error("Failed to delete order");
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Header Row ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{orders.length} orders in view</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 outline-none hover:border-gray-300 transition-colors shadow-sm"
          />
          <button onClick={fetchOrders} className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-gray-600 btn-3d">
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Earning Rate Control */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-2xl shadow-sm">
            <span className="text-sm font-bold text-gray-600">₹</span>
            <input 
              type="number"
              value={earningRate}
              disabled={isUpdatingRate}
              onChange={(e) => setEarningRate(Number(e.target.value))}
              onBlur={(e) => updateEarningRate(Number(e.target.value))}
              onKeyDown={(e) => { if (e.key === 'Enter') updateEarningRate(Number(e.currentTarget.value)) }}
              className="w-12 text-sm font-black text-gray-900 outline-none bg-transparent"
            />
            <span className="text-xs text-gray-400 font-semibold">/ order</span>
          </div>

          {/* Auto / Manual toggle */}
          <button
            onClick={toggleAutoAssign}
            disabled={autoLoading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all btn-3d ${
              autoAssign
                ? "gradient-green-3d text-white shadow-lg"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {autoAssign ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            {autoAssign ? "Auto Assign ON" : "Manual Assign"}
          </button>
        </div>
      </div>

      {/* ── Online Partners Panel ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
            Online Delivery Partners ({onlinePartners.length})
          </h2>
        </div>
        {onlinePartners.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No delivery partners online right now</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlinePartners.map(p => (
              <div key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border"
                style={{
                  background: p.status === "AVAILABLE" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                  borderColor: p.status === "AVAILABLE" ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)",
                  color: p.status === "AVAILABLE" ? "#15803d" : "#b45309",
                }}>
                <UserCheck className="w-3.5 h-3.5" />
                {p.name}
                <span className="opacity-60 text-[10px] ml-1">
                  {p.status === "AVAILABLE" ? "Free" : "Busy"} · ⭐{p.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Status Filters ─────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all btn-3d ${
              statusFilter === s
                ? "gradient-green-3d text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s === "ALL" ? "All" : ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* ── Orders Table ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                {["#", "Order", "Customer", "Items", "Total", "Partner", "Status", "Time", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-black text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 skeleton rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-semibold">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-gray-50 table-row-hover"
                  >
                    {/* Sequential # */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-black text-gray-400">#{idx + 1}</span>
                    </td>

                    {/* Order Number */}
                    <td className="px-4 py-3">
                      <p className="font-black text-sm text-gray-900">{order.orderNumber}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">{order.paymentMethod}</p>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.phone}</p>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 font-semibold">{order.items?.length} items</p>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3">
                      <p className="font-black text-sm text-gray-900">{formatPrice(order.total)}</p>
                    </td>

                    {/* Partner column */}
                    <td className="px-4 py-3">
                      {order.deliveryPartner ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-black text-green-700">
                            {order.deliveryPartner.user.name[0]}
                          </div>
                          <div>
                            <div className="relative group">
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors" title="Click to change status">
                                  {order.deliveryPartner.user.name}
                                </p>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${order.deliveryPartner.status === 'AVAILABLE' ? 'bg-green-500' : order.deliveryPartner.status === 'BUSY' ? 'bg-orange-500' : 'bg-gray-400'}`} title={`Status: ${order.deliveryPartner.status}`}></span>
                              </div>
                              <select 
                                value=""
                                onChange={(e) => updatePartnerStatus(order.deliveryPartner.id, e.target.value)}
                                className="absolute opacity-0 inset-0 cursor-pointer"
                              >
                                <option value="" disabled>Change Status</option>
                                <option value="AVAILABLE">Make AVAILABLE</option>
                                <option value="BUSY">Make BUSY</option>
                                <option value="OFFLINE">Make OFFLINE</option>
                              </select>
                            </div>
                            <p className="text-[10px] text-gray-400">{order.deliveryPartner.user.phone}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer appearance-none pr-6 ${ORDER_STATUS_COLORS[order.status]}`}
                        >
                          {statusOptions.filter(s => s !== "ALL").map((s) => (
                            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(order.createdAt)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Assign button — shown when unassigned */}
                        {!order.deliveryPartnerId && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                          <button
                            onClick={() => autoAssign ? handleAutoAssignOrder(order.id) : setAssignModal(order)}
                            className="px-2.5 py-1 rounded-lg text-xs font-black btn-3d"
                            style={{
                              background: autoAssign ? "linear-gradient(135deg,#15803d,#22c55e)" : "rgba(59,130,246,0.1)",
                              color: autoAssign ? "white" : "#2563eb",
                              border: autoAssign ? "none" : "1px solid rgba(59,130,246,0.3)",
                            }}
                            title={autoAssign ? "Auto-assign to best partner" : "Select a partner manually"}
                          >
                            {autoAssign ? "⚡ Auto" : "👤 Assign"}
                          </button>
                        )}
                        {/* Reassign button — shown when already has a partner and not delivered */}
                        {order.deliveryPartnerId && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                          <button
                            onClick={() => setAssignModal(order)}
                            className="px-2.5 py-1 rounded-lg text-xs font-black btn-3d"
                            style={{
                              background: "rgba(245,158,11,0.1)",
                              color: "#b45309",
                              border: "1px solid rgba(245,158,11,0.3)",
                            }}
                            title="Reassign to a different delivery partner"
                          >
                            🔄 Reassign
                          </button>
                        )}
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id, order.orderNumber)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Manual Assign Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotateX: -15 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-black text-gray-900 text-lg">Assign Delivery Partner</h2>
                    <p className="text-xs text-gray-400">{assignModal.orderNumber}</p>
                  </div>
                  <button onClick={() => setAssignModal(null)} className="p-2 rounded-xl hover:bg-gray-100 btn-3d">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {onlinePartners.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-semibold">No verified partners found</p>
                    <p className="text-xs text-gray-300 mt-1">Add and verify a delivery partner first</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {onlinePartners.map(p => (
                      <button
                        key={p.id}
                        disabled={assigningId === p.id}
                        onClick={() => handleAssignToPartner(assignModal.id, p.id)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all btn-3d disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400"
                        style={{
                          borderColor: p.status === "AVAILABLE" ? "rgba(34,197,94,0.3)" : p.status === "BUSY" ? "rgba(245,158,11,0.3)" : "rgba(156,163,175,0.3)",
                          background: p.status === "AVAILABLE" ? "rgba(34,197,94,0.04)" : p.status === "BUSY" ? "rgba(245,158,11,0.04)" : "rgba(156,163,175,0.04)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-black text-green-700">
                            {p.name[0]}
                          </div>
                          <div className="text-left">
                            <p className="font-black text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.phone} · ★{p.rating.toFixed(1)} · {p.totalOrders} orders</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            p.status === "AVAILABLE" ? "bg-green-100 text-green-700" : p.status === "BUSY" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {p.status === "AVAILABLE" ? "Free" : p.status === "BUSY" ? "Busy" : "Offline"}
                          </span>
                          {assigningId === p.id && <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />}
                          {assigningId !== p.id && p.status === "AVAILABLE" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Order Detail Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-gray-900 text-xl">{selectedOrder.orderNumber}</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl hover:bg-gray-100 btn-3d">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${ORDER_STATUS_COLORS[selectedOrder.status]}`}>
                  {ORDER_STATUS_LABELS[selectedOrder.status]}
                </div>

                {/* Customer */}
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs font-black text-gray-400 uppercase mb-2">Customer</p>
                  <p className="font-bold text-gray-900">{selectedOrder.user?.name}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.user?.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedOrder.address?.addressLine1}, {selectedOrder.address?.city}
                  </p>
                </div>

                {/* Delivery Partner */}
                {selectedOrder.deliveryPartner && (
                  <div className="p-4 bg-green-50 rounded-2xl">
                    <p className="text-xs font-black text-gray-400 uppercase mb-2">Delivery Partner</p>
                    <p className="font-bold text-gray-900">{selectedOrder.deliveryPartner.user.name}</p>
                    <p className="text-sm text-green-700">{selectedOrder.deliveryPartner.user.phone}</p>
                  </div>
                )}

                {/* Items */}
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs font-black text-gray-400 uppercase mb-2">Items</p>
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{item.name} × {item.quantity}</span>
                      <span className="font-bold">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-gray-900 mt-2 pt-2">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex gap-3">
                  <div className="flex-1 p-3 bg-blue-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-blue-400 uppercase">Method</p>
                    <p className="font-black text-blue-700">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div className="flex-1 p-3 bg-purple-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-purple-400 uppercase">Payment</p>
                    <p className="font-black text-purple-700">{selectedOrder.payment?.status || "—"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
