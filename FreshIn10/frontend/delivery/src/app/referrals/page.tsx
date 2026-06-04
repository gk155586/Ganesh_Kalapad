"use client";

import { motion } from "framer-motion";
import { Gift, Users, Share2, Copy, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ReferralsPage() {
  const referralCode = "FRESH10PARTNER";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-black text-lg text-gray-900">Refer & Earn</h1>
        <p className="text-xs text-gray-400">Invite friends and earn points</p>
      </div>

      <div className="p-4 space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-[32px] p-8 text-white text-center relative overflow-hidden shadow-xl shadow-purple-100">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          
          <Gift className="w-16 h-16 text-purple-200 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2">Earn 500 Points</h2>
          <p className="text-purple-100 text-sm mb-8 opacity-90">For every friend who joins as a delivery partner and completes 50 deliveries.</p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mb-1">Your Referral Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-black tracking-widest">{referralCode}</span>
              <button onClick={handleCopy} className="p-2 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <h3 className="font-black text-gray-900 px-1">How it works</h3>
          {[
            { step: 1, title: "Share your code", desc: "Share your unique referral code with friends interested in joining." },
            { step: 2, title: "They join", desc: "Ask them to enter your code during their registration process." },
            { step: 3, title: "Earn rewards", desc: "Once they complete 50 deliveries, 500 points will be added to your profile." },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-black flex-shrink-0">
                {s.step}
              </div>
              <div>
                <p className="font-bold text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95">
          <Share2 className="w-5 h-5" />
          Invite Friends
        </button>
      </div>
    </div>
  );
}
