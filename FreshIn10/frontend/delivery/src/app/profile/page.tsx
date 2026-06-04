"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Phone, Mail, Truck, Star, Coins, Package, Wallet,
  LogOut, ChevronRight, Edit2, RefreshCw, MapPin, Bell, Gift
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "https://freshin10-api.onrender.com";
const token = () => typeof window !== "undefined" ? localStorage.getItem("deliveryToken") : null;
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function DeliveryProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState("");
  const router = useRouter();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        axios.get(`${API}/api/delivery/profile`, { headers: headers() }),
        axios.get(`${API}/api/delivery/earnings`, { headers: headers() }),
      ]);
      setProfile(pRes.data);
      setEarnings(eRes.data);
      setLastSynced(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLogout = () => {
    localStorage.removeItem("deliveryToken");
    router.replace("/login");
    toast.success("Logged out");
  };

  if (loading) return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
    </div>
  );

  const initials = profile?.user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "D";

  const menuItems = [
    { icon: Wallet, label: "Salary & Payouts", action: () => router.push("/salary") },
    { icon: Gift, label: "Refer & Earn", action: () => router.push("/referrals") },
    { icon: Truck, label: "Hub Information", action: () => router.push("/store-info") },
    { icon: Bell, label: "Notifications", action: () => toast("Coming soon") },
    { icon: MapPin, label: "Location Settings", action: () => toast("Coming soon") },
    { icon: RefreshCw, label: "Refresh Data", action: fetchAll },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="font-black text-lg text-gray-900">My Profile</h1>
        <button onClick={fetchAll} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black">{profile?.user?.name}</h2>
              <div className="flex items-center gap-1 text-green-200 text-xs mt-0.5">
                <div className={`w-2 h-2 rounded-full ${profile?.status === "AVAILABLE" ? "bg-green-300 animate-pulse" : profile?.status === "BUSY" ? "bg-yellow-300" : "bg-gray-400"}`} />
                {profile?.status || "OFFLINE"}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${profile?.isVerified ? "bg-white/20 text-gray-900" : "bg-yellow-400/30 text-yellow-100"}`}>
                  {profile?.isVerified ? "✓ Verified" : "Pending Verification"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Package, label: "Orders", value: earnings?.totalOrders || 0, color: "text-blue-600 bg-blue-100" },
            { icon: Wallet, label: "Earned", value: `₹${(earnings?.totalEarnings || 0).toFixed(0)}`, color: "text-green-600 bg-green-100" },
            { icon: Coins, label: "Points", value: earnings?.points || 0, color: "text-purple-600 bg-purple-100" },
            { icon: Star, label: "Rating", value: (earnings?.rating || 5.0).toFixed(1), color: "text-yellow-600 bg-yellow-100" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="font-black text-gray-900 text-sm">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Partner Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Account Details</h3>
          {[
            { icon: User, label: "Full Name", value: profile?.user?.name },
            { icon: Mail, label: "Email", value: profile?.user?.email },
            { icon: Phone, label: "Phone", value: profile?.user?.phone || "Not set" },
            { icon: Truck, label: "Vehicle", value: `${profile?.vehicleType || "—"} • ${profile?.vehicleNo || "—"}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bank Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Bank & Financial Info</h3>
          {[
            { icon: Wallet, label: "Bank Name", value: profile?.bankName },
            { icon: Coins, label: "Account No.", value: profile?.accountNo },
            { icon: RefreshCw, label: "IFSC Code", value: profile?.ifscCode },
            { icon: Gift, label: "UPI ID", value: profile?.upiId },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{value || "—"}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {menuItems.map(({ icon: Icon, label, action }, i) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-700 text-left">{label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

        {/* Last synced */}
        <p className="text-center text-xs text-gray-400">Last synced: {lastSynced || "—"}</p>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
          <LogOut className="w-4 h-4" />Logout
        </button>
      </div>
    </div>
  );
}
