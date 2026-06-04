"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Landmark, Download, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "https://freshin10-api.onrender.com";
const token = () => typeof window !== "undefined" ? localStorage.getItem("deliveryToken") : null;
const headers = () => ({ Authorization: `Bearer ${token()}` });

export default function SalaryPage() {
  const [profile, setProfile] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, payRes] = await Promise.all([
        axios.get(`${API}/api/delivery/profile`, { headers: headers() }),
        axios.get(`${API}/api/delivery/payouts`, { headers: headers() }),
      ]);
      setProfile(pRes.data);
      setPayouts(payRes.data);
    } catch {
      toast.error("Failed to fetch salary data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="p-4 space-y-4">
      <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-black text-lg text-gray-900">Salary & Payouts</h1>
          <p className="text-xs text-gray-400">Weekly payouts to your bank account</p>
        </div>
        <button onClick={fetchData} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Active Bank Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Linked Bank Account</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Landmark className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{profile?.bankName || "No Bank Linked"}</p>
              <p className="text-xs text-gray-400">
                {profile?.accountNo ? `XXXX XXXX ${profile.accountNo.slice(-4)}` : "Please contact admin to link bank"}
              </p>
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white rounded-3xl p-6 text-gray-900 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Lifetime Earnings</p>
              <p className="text-xs font-medium">Accumulated total</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          </div>
          <p className="text-3xl font-black mb-1">₹{(profile?.totalEarnings || 0).toLocaleString()}</p>
          <p className="text-gray-400 text-xs">Total points earned: {profile?.points || 0}</p>
        </div>

        {/* Payout History */}
        <div>
          <h3 className="font-black text-gray-900 mb-3 px-1">Recent Payouts</h3>
          {payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-900">{p.period || "Weekly Payout"}</p>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Ref: {p.referenceId || p.id.slice(0, 8)} • {new Date(p.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">₹{p.amount.toLocaleString()}</p>
                    <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase">{p.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">No payouts logged yet</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            Payouts are processed by the administrator. Please ensure your bank details (IFSC, Account No) are correct to avoid transfer failures.
          </p>
        </div>
      </div>
    </div>
  );
}

