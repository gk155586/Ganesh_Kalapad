"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, ChevronLeft, ChevronRight, MapPin, Package, IndianRupee,
  Star, TrendingUp, CheckCircle, X, Clock
} from "lucide-react";
import axios from "axios";
import { formatPrice } from "@freshin10/utils";
import { useTheme } from "@/components/ThemeProvider";

const API = process.env.NEXT_PUBLIC_API_URL || "https://freshin10-api.onrender.com";

export default function OrderCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const { theme } = useTheme();

  const token = () => localStorage.getItem("deliveryToken");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const { data } = await axios.get(`${API}/api/delivery/orders/calendar?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setGrouped(data.grouped || {});
    } catch {
      setGrouped({});
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
    return d.toLocaleDateString("en-CA");
  });

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDay(null);
  };

  const selectedDayOrders = selectedDay ? (grouped[selectedDay] || []) : [];

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300">
      <div className="header-dark px-4 py-6 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="font-black text-xl flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-neon-green" /> Delivery History
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl bg-slate-800/50"><ChevronLeft className="w-5 h-5" /></button>
            <p className="font-black text-xs uppercase tracking-widest">{currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-xl bg-slate-800/50"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map(d => (
            <span key={d} className="text-[10px] font-black opacity-30">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 bg-slate-800/20 rounded-3xl p-1">
          {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(d => {
            const dayNum = d.split("-")[2];
            const hasOrders = grouped[d] && grouped[d].length > 0;
            const isToday = d === new Date().toLocaleDateString("en-CA");
            const isSelected = selectedDay === d;

            return (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all ${isSelected ? "bg-green-600 text-white scale-110 z-10 shadow-lg" : isToday ? "bg-slate-700/50 text-green-400" : hasOrders ? "bg-green-500/10 text-green-500" : "opacity-30"}`}>
                <span className="text-sm font-black">{parseInt(dayNum)}</span>
                {hasOrders && !isSelected && <div className="w-1 h-1 rounded-full bg-green-500 mt-1" />}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedDay(null)} />
            <div className="w-full max-w-md mx-auto bg-slate-900 rounded-t-[40px] p-6 max-h-[85vh] overflow-y-auto relative border-t border-slate-800">
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="font-black text-2xl text-white">{new Date(selectedDay).toLocaleDateString("en-US", { day: "numeric", month: "long" })}</h2>
                   <p className="text-xs font-bold text-slate-500 uppercase">{selectedDayOrders.length} Deliveries</p>
                 </div>
                 <button onClick={() => setSelectedDay(null)} className="p-3 rounded-full bg-slate-800 text-slate-400"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                {selectedDayOrders.length === 0 ? (
                  <div className="py-20 text-center opacity-20"><Package className="w-16 h-16 mx-auto mb-4" /><p className="font-black">No deliveries this day</p></div>
                ) : (
                  selectedDayOrders.map((o, idx) => (
                    <div key={idx} className="bg-slate-800/40 border border-slate-800 p-4 rounded-3xl">
                       <div className="flex justify-between items-start mb-3">
                          <div>
                             <p className="font-black text-white">{o.orderNumber}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{o.paymentMethod} · {formatPrice(o.total)}</p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                       </div>
                       <div className="flex items-center gap-2 opacity-50">
                          <MapPin className="w-3 h-3" />
                          <p className="text-[11px] font-bold truncate">{o.address}</p>
                       </div>
                    </div>
                  ))
                )}

                {selectedDayOrders.length > 0 && (
                  <div className="bg-green-600 p-5 rounded-3xl text-white shadow-xl shadow-green-900/20">
                     <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total Earned</p>
                     <p className="text-2xl font-black">₹{selectedDayOrders.reduce((acc, o) => acc + (o.amountCollected || 0), 0)}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
