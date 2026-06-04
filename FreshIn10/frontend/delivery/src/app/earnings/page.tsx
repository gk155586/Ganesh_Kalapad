"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Package, Star, Coins, TrendingUp, Calendar, Info } from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "https://freshin10-api.onrender.com";
const token = () => typeof window !== "undefined" ? localStorage.getItem("deliveryToken") : null;
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function EarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"today" | "week" | "month" | "total">("week");

  useEffect(() => {
    axios.get(`${API}/api/delivery/earnings/breakdown`, { headers: headers() })
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = data?.[tab];
  const EARNING_PER_ORDER = data?.earningRate || 50;

  const tabs = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "total", label: "All Time" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-black text-lg text-gray-900">My Earnings</h1>
        <p className="text-xs text-gray-400">₹{EARNING_PER_ORDER} per delivery • 20 points per delivery</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === t.key ? "bg-white text-green-700 shadow-sm" : "text-gray-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Main earnings card */}
            <motion.div key={tab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-gray-900">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-5 h-5 text-green-200" />
                <p className="text-green-200 text-sm font-medium">{tabs.find(t => t.key === tab)?.label} Earnings</p>
              </div>
              <p className="text-4xl font-black mb-1">₹{(current?.earnings || 0).toFixed(0)}</p>
              <p className="text-green-200 text-sm">{current?.orders || 0} deliveries completed</p>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Package, label: "Deliveries", value: current?.orders || 0, color: "bg-blue-100 text-blue-600" },
                { icon: Coins, label: "Points Earned", value: (current?.orders || 0) * 20, color: "bg-purple-100 text-purple-600" },
                { icon: Star, label: "Avg Rating", value: (data?.total?.rating || 5.0).toFixed(1), color: "bg-yellow-100 text-yellow-600" },
                { icon: TrendingUp, label: "Per Order", value: `₹${EARNING_PER_ORDER}`, color: "bg-green-100 text-green-600" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="font-black text-xl text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* All time summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />All Time Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Total Earnings", value: `₹${(data?.total?.earnings || 0).toFixed(0)}`, highlight: true },
                  { label: "Total Deliveries", value: data?.total?.orders || 0 },
                  { label: "Points Balance", value: `${data?.total?.points || 0} pts` },
                  { label: "Average Rating", value: `⭐ ${(data?.total?.rating || 5.0).toFixed(1)} / 5.0` },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`font-bold text-sm ${highlight ? "text-green-600" : "text-gray-900"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Points info */}
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900 text-sm">Points System</p>
                <p className="text-xs text-purple-600 mt-0.5">You earn 20 points per delivery. Points can be redeemed or adjusted by admin. Total points: <strong>{data?.total?.points || 0}</strong></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
