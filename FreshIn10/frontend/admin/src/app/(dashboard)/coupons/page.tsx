"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Percent, X, Trash2, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import adminApi from "@/lib/api";
import { formatPrice, formatDateTime } from "@freshin10/utils";
import toast from "react-hot-toast";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: "", type: "PERCENTAGE", value: "", minOrderAmount: "0",
    maxDiscount: "", usageLimit: "", expiresAt: "", isActive: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/admin/coupons");
      setCoupons(data);
    } catch { toast.error("Failed to fetch coupons"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post("/api/admin/coupons", {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount || "0"),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
      });
      toast.success("Coupon created!");
      setShowModal(false);
      setForm({ code: "", type: "PERCENTAGE", value: "", minOrderAmount: "0", maxDiscount: "", usageLimit: "", expiresAt: "", isActive: true });
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create coupon");
    }
  };

  const toggleCoupon = async (coupon: any) => {
    try {
      await adminApi.put(`/api/admin/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? "Coupon deactivated" : "Coupon activated");
      fetchCoupons();
    } catch { toast.error("Failed to update coupon"); }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await adminApi.delete(`/api/admin/coupons/${id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch { toast.error("Failed to delete coupon"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)
        ) : coupons.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <Percent className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">No coupons yet</p>
          </div>
        ) : coupons.map((coupon) => (
          <motion.div key={coupon.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-2xl border-2 p-5 relative ${coupon.isActive ? "border-green-100" : "border-gray-100 opacity-60"}`}>
            <div className="absolute top-3 right-3 flex gap-1">
              <button onClick={() => toggleCoupon(coupon)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                {coupon.isActive ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
              </button>
              <button onClick={() => deleteCoupon(coupon.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-black text-xl text-gray-900 tracking-wider">{coupon.code}</p>
                <p className="text-sm text-gray-500">
                  {coupon.type === "PERCENTAGE" ? `${coupon.value}% off` : `₹${coupon.value} off`}
                  {coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ""}
                </p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              <p>Min order: {formatPrice(coupon.minOrderAmount || 0)}</p>
              <p>Used: {coupon._count?.usages || coupon.usedCount || 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""} times</p>
              {coupon.expiresAt && (
                <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires {formatDateTime(coupon.expiresAt)}</p>
              )}
            </div>
            <span className={`mt-3 inline-block text-xs font-semibold px-2 py-1 rounded-full ${coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {coupon.isActive ? "Active" : "Inactive"}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/40 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Create Coupon</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Coupon Code</label>
                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required
                      placeholder="e.g. SAVE20"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount (₹)</option>
                    </select>
                  </div>
                  {[
                    { label: `Value (${form.type === "PERCENTAGE" ? "%" : "₹"})`, key: "value", required: true },
                    { label: "Min Order Amount (₹)", key: "minOrderAmount" },
                    { label: "Max Discount (₹, optional)", key: "maxDiscount" },
                    { label: "Usage Limit (optional)", key: "usageLimit" },
                  ].map(({ label, key, required }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                      <input type="number" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        required={required}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date (optional)</label>
                    <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-green-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Active immediately</span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 border-2 border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700">Create Coupon</button>
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
