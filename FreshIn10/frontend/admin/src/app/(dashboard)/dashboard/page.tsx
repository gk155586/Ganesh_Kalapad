"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, ShoppingBag, Users, Package,
  AlertTriangle, Calendar, ChevronDown, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import adminApi from "@/lib/api";
import { formatPrice, formatRelativeTime } from "@freshin10/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@freshin10/utils";

type Range = "today" | "week" | "month" | "quarter" | "year" | "custom";

const RANGE_LABELS: Record<Range, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  quarter: "This Quarter",
  year: "This Year",
  custom: "Custom Range",
};

function buildWeekData() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
    day, revenue: Math.floor(Math.random() * 30000) + 5000, orders: Math.floor(Math.random() * 80) + 20,
  }));
}

function buildMonthData() {
  return Array.from({ length: 30 }, (_, i) => ({
    day: `${i + 1}`, revenue: Math.floor(Math.random() * 40000) + 3000, orders: Math.floor(Math.random() * 100) + 10,
  }));
}

const STATUS_PIE = [
  { name: "Delivered", value: 0, color: "#16a34a" },
  { name: "Pending", value: 0, color: "#f59e0b" },
  { name: "Processing", value: 0, color: "#3b82f6" },
  { name: "Cancelled", value: 0, color: "#ef4444" },
];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("week");
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      let from = "", to = "";
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (range === "today") {
        from = today.toISOString();
        to = now.toISOString();
      } else if (range === "week") {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        from = d.toISOString();
      } else if (range === "month") {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 1);
        from = d.toISOString();
      } else if (range === "quarter") {
        const d = new Date(today);
        d.setMonth(d.getMonth() - 3);
        from = d.toISOString();
      } else if (range === "year") {
        const d = new Date(today);
        d.setFullYear(d.getFullYear() - 1);
        from = d.toISOString();
      } else if (range === "custom" && customFrom && customTo) {
        from = new Date(customFrom).toISOString();
        to = new Date(customTo).toISOString();
      }

      const { data: d } = await adminApi.get("/api/admin/dashboard", {
        params: { from, to }
      });
      setData(d);
      if (d.chartData) setChartData(d.chartData);
    } catch {} finally { setLoading(false); }
  }, [range, customFrom, customTo]);

  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    fetchDashboard();
    setTodayStr(new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, [fetchDashboard]);

  const stats = [
    {
      label: range === "today" ? "Today's Revenue" : `Revenue (${RANGE_LABELS[range]})`,
      value: data ? formatPrice(data.stats.totalRevenue) : "₹0",
      icon: TrendingUp, color: "bg-green-100 text-green-600",
      change: data?.stats.revenueChange || "0%", positive: !data?.stats.revenueChange?.includes("-"),
    },
    {
      label: range === "today" ? "Today's Orders" : `Orders (${RANGE_LABELS[range]})`,
      value: data?.stats.rangeOrders || 0,
      icon: ShoppingBag, color: "bg-blue-100 text-blue-600",
      change: data?.stats.ordersChange || "0%", positive: !data?.stats.ordersChange?.includes("-"),
    },
    { label: "Total Users", value: data?.stats.totalUsers || 0, icon: Users, color: "bg-purple-100 text-purple-600", change: "+5.1%", positive: true },
    { label: "Active Partners", value: data?.stats.activePartners || 0, icon: ShoppingBag, color: "bg-orange-100 text-orange-600", change: "Live", positive: true },
  ];

  const pieData = data?.ordersByStatus?.length > 0 
    ? data.ordersByStatus.map((c: any, i: number) => ({
        name: c.name,
        value: c.count,
        color: ["#16a34a", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"][i % 6]
      }))
    : STATUS_PIE;

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {todayStr}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchDashboard} className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl text-gray-500 shadow-sm transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Range Picker */}
          <div className="relative">
            <button onClick={() => setShowRangePicker(!showRangePicker)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
              <Calendar className="w-4 h-4 text-green-600" />
              {RANGE_LABELS[range]}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showRangePicker ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showRangePicker && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 bg-white border border-gray-200 rounded-3xl shadow-2xl z-40 overflow-hidden w-64 p-2">
                  {(Object.keys(RANGE_LABELS) as Range[]).filter(r => r !== "custom").map((r) => (
                    <button key={r} onClick={() => { setRange(r); setShowRangePicker(false); }}
                      className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all ${range === r ? "text-green-700 font-black bg-green-50" : "text-gray-600 hover:bg-gray-50"}`}>
                      {RANGE_LABELS[r]}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-2 p-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Custom Period</p>
                    <div className="space-y-2">
                      <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" />
                      <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none" />
                      <button onClick={() => { setRange("custom"); setShowRangePicker(false); }}
                        disabled={!customFrom || !customTo}
                        className="w-full py-2.5 bg-green-600 text-white text-xs font-black rounded-xl disabled:opacity-40 shadow-lg shadow-green-600/20 active:scale-95 transition-all">
                        Update View
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 perspective-1000">
        {stats.map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 30, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 180 }}
            className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${stat.positive ? "bg-green-100 text-green-700 badge-glow" : "bg-red-100 text-red-700"}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900 leading-none animate-number">{loading ? "—" : stat.value}</p>
            <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-wide">{stat.label}</p>
          </motion.div>
        ))}
      </div>


      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-900">Revenue Analytics</h2>
              <p className="text-sm text-gray-400 mt-1">Sales performance over time</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-black text-green-700 uppercase">Growth</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                formatter={(v: number) => [formatPrice(v), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={4} fill="url(#colorRevenue)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Categories Pie */}
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-1">Order Status Mix</h2>
          <p className="text-sm text-gray-400 mb-6">Real-time order statuses</p>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "Orders"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black text-gray-400 uppercase">Total Orders</p>
              <p className="text-lg font-black text-gray-900">{stats[1]?.value || "0"}</p>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            {pieData.slice(0, 6).map((s: any) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-sm font-bold text-gray-600">{s.name}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{s.value} Orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900">Live Activity</h2>
            <a href="/orders" className="text-sm font-black text-green-600 hover:text-green-700 flex items-center gap-1">
              View All Orders <ChevronDown className="-rotate-90 w-4 h-4" />
            </a>
          </div>
          <div className="space-y-4">
            {(data?.recentOrders || []).map((order: any, i: number) => (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-green-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${ORDER_STATUS_COLORS[order.status]} bg-white shadow-sm`}>
                    {order.orderNumber.slice(-2)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 group-hover:text-green-800 transition-colors">{order.orderNumber}</p>
                    <p className="text-xs font-bold text-gray-400">{order.user?.name} • {formatRelativeTime(order.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{formatPrice(order.total)}</p>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alerts & Insights */}
        <div className="space-y-6">
          {/* Inventory Alert */}
          {data?.lowStockProducts?.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-red-100 p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 -mr-8 -mt-8 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="font-black text-gray-900">Inventory Alerts</h3>
                </div>
                <div className="space-y-4">
                  {(data?.lowStockProducts || []).map((ls: any) => (
                    <div key={ls.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100">
                          <img src={ls.product.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 truncate w-32">{ls.product.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                        {ls.stock} Left
                      </span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 bg-red-600 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                  Restock All
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-[2rem] p-8 shadow-xl text-white">
            <h3 className="font-black mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Trending Products
            </h3>
            <div className="space-y-5">
              {(() => {
                const maxSold = Math.max(1, ...(data?.topProducts || []).map((p: any) => p.soldCount || 0));
                return (data?.topProducts || []).map((p: any, i: number) => (
                  <div key={p.id} className="flex items-center gap-4">
                    <span className="text-lg font-black text-gray-700">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(8, Math.round(((p.soldCount || 0) / maxSold) * 100))}%` }}
                            className="h-full bg-green-500 rounded-full" />
                        </div>
                        <span className="text-[10px] font-black text-gray-500">{p.soldCount || 0} Sold</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
