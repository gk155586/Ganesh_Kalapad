"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Package, MapPin, Wallet, Star, Coins,
  ToggleLeft, ToggleRight, LogOut, RefreshCw
} from "lucide-react";
import axios from "axios";
import { formatPrice } from "@freshin10/utils";
import toast from "react-hot-toast";
import { io as socketIO } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://freshin10-api.onrender.com";

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [paymentModes, setPaymentModes] = useState<Record<string, 'CASH' | 'SCANNER'>>({});
  const [verifying, setVerifying] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<any>(null);
  
  const socketRef = useRef<any>(null);
  const router = useRouter();

  const token = () => typeof window !== "undefined" ? localStorage.getItem("deliveryToken") : null;

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/delivery/orders`, { 
        headers: { Authorization: `Bearer ${token()}` } 
      });
      setOrders(data);
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchEarnings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/delivery/earnings`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setEarnings(data);
    } catch {}
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/delivery/profile`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setPartner(data);
      setIsOnline(data.status === "AVAILABLE" || data.status === "BUSY");
    } catch {}
  }, []);

  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    fetchProfile();
    fetchOrders();
    fetchEarnings();

    const socket = socketIO(API_URL, { auth: { token: token() } });
    socketRef.current = socket;

    socket.on("order:assigned", (data: any) => {
      toast.success(`New order! ${data.orderNumber}`);
      fetchOrders();
    });

    return () => { socket.disconnect(); };
  }, [fetchProfile, fetchOrders, fetchEarnings, router]);

  // Real-time location tracking
  useEffect(() => {
    if (!isOnline || typeof window === "undefined" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("delivery:location", { latitude, longitude });
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => {
      if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isOnline]);

  const toggleStatus = async () => {
    if (isToggling) return;
    setIsToggling(true);
    const newStatus = isOnline ? "OFFLINE" : "AVAILABLE";
    try {
      await axios.put(`${API_URL}/api/delivery/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      setIsOnline(!isOnline);
      toast.success(isOnline ? "You are now Offline" : "You are now Online 🟢");
    } catch { toast.error("Failed to update status"); } finally { setIsToggling(false); }
  };

  const markPickup = async (id: string) => {
    try {
      await axios.put(`${API_URL}/api/delivery/orders/${id}/pickup`, {}, { headers: { Authorization: `Bearer ${token()}` } });
      toast.success("Order picked up!");
      fetchOrders();
    } catch { toast.error("Failed to update"); }
  };

  const markDelivered = async (id: string) => {
    try {
      await axios.put(`${API_URL}/api/delivery/orders/${id}/deliver`, {}, { headers: { Authorization: `Bearer ${token()}` } });
      toast.success("Order delivered! +20 points");
      fetchOrders();
      fetchEarnings();
    } catch { toast.error("Failed to update"); }
  };

  const verifyPayment = async (orderId: string) => {
    setVerifying(orderId);
    try {
      await axios.put(`${API_URL}/api/delivery/orders/${orderId}/verify-payment`, {}, { headers: { Authorization: `Bearer ${token()}` } });
      toast.success("Payment Verified Successfully! ✓");
      fetchOrders();
    } catch {
      toast.error("Verification failed. Please check internet connection.");
    } finally {
      setVerifying(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("deliveryToken");
    router.push("/login");
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
            <button onClick={toggleStatus} disabled={isToggling}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${isOnline ? "status-online text-white" : "status-offline text-slate-500"}`}>
              {isOnline ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
              {isOnline ? "Online" : "Offline"}
            </button>
         </div>
         <button onClick={handleLogout} className="p-2 rounded-xl bg-red-500/10 text-red-500">
            <LogOut className="w-4 h-4" />
         </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Package, label: "Orders", value: earnings?.totalOrders || 0, color: "text-blue-400" },
          { icon: Wallet, label: "Earned", value: `₹${earnings?.totalEarnings || 0}`, color: "text-green-400" },
          { icon: Coins, label: "Points", value: earnings?.points || 0, color: "text-purple-400" },
          { icon: Star, label: "Rating", value: (earnings?.rating || 5.0).toFixed(1), color: "text-yellow-400" },
        ].map((s, i) => (
          <div key={i} className="stat-tile p-3 text-center">
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="font-black text-sm">{s.value}</p>
            <p className="text-[9px] uppercase opacity-40 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active Orders */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-black text-xs uppercase opacity-40 tracking-widest">Active Deliveries</h2>
          <button onClick={fetchOrders} className="text-neon-green p-1"><RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        
        {loading ? <div className="skeleton h-32" /> : orders.length === 0 ? (
          <div className="p-12 text-center opacity-20 border border-dashed rounded-[32px] border-slate-700">
            <Package className="w-10 h-10 mx-auto mb-2" />
            <p className="text-xs font-black uppercase">No active orders</p>
          </div>
        ) : (
          orders.map((o) => (
            <motion.div key={o.id} layout className="card-neon p-5 space-y-4">
               <div className="flex justify-between items-center">
                  <p className="font-black text-lg tracking-tighter">{o.orderNumber}</p>
                  <span className="text-[10px] font-black px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-widest">
                    {o.status}
                  </span>
               </div>
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-black uppercase tracking-tight">{o.user?.name}</p>
                     <p className="text-[11px] font-bold opacity-40 mt-0.5">
                       {[o.address?.addressLine1, o.address?.addressLine2, o.address?.city, o.address?.pincode].filter(Boolean).join(', ')}
                     </p>
                  </div>
                  <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([o.address?.addressLine1, o.address?.addressLine2, o.address?.city, o.address?.pincode].filter(Boolean).join(', '))}`, '_blank')} className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-500/20 transition" title="Open in Google Maps">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </button>
               </div>
               <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-800">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    loading="lazy" 
                    allowFullScreen 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent([o.address?.addressLine1, o.address?.addressLine2, o.address?.city, o.address?.pincode].filter(Boolean).join(', '))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  ></iframe>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => markPickup(o.id)} className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20">Pickup</button>
                  {o.paymentMethod === "COD" && o.payment?.status !== "SUCCESS" ? (
                    <div className="flex-1 flex flex-col gap-2">
                       <div className="flex gap-2">
                         <button onClick={() => setPaymentModes({...paymentModes, [o.id]: 'CASH'})} className={`flex-1 py-2 rounded-xl font-bold text-xs ${paymentModes[o.id] === 'CASH' || !paymentModes[o.id] ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}>CASH</button>
                         <button onClick={() => setPaymentModes({...paymentModes, [o.id]: 'SCANNER'})} className={`flex-1 py-2 rounded-xl font-bold text-xs ${paymentModes[o.id] === 'SCANNER' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>SCANNER</button>
                       </div>
                       
                       {paymentModes[o.id] === 'SCANNER' ? (
                         <div className="bg-slate-800 p-4 rounded-xl flex flex-col items-center gap-3">
                           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=freshin10@upi&pn=FreshIn10&am=${o.total}`} alt="QR Code" className="w-32 h-32 rounded-lg bg-white p-2" />
                           <p className="text-xs font-bold text-slate-300">Scan to Pay {formatPrice(o.total)}</p>
                           <button onClick={() => verifyPayment(o.id)} disabled={verifying === o.id} className="w-full py-2 bg-blue-500 rounded-lg text-white font-bold text-xs disabled:opacity-50 hover:bg-blue-400">
                             {verifying === o.id ? "Verifying..." : "Verify Payment ✓"}
                           </button>
                         </div>
                       ) : (
                         <button onClick={() => verifyPayment(o.id)} disabled={verifying === o.id} className="py-4 rounded-2xl bg-green-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20 disabled:opacity-50">
                            {verifying === o.id ? "Updating..." : `Cash Received (${formatPrice(o.total)})`}
                         </button>
                       )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-2">
                      {o.paymentMethod === "COD" && o.payment?.status === "SUCCESS" && (
                        <div className="bg-green-600/20 text-green-500 font-bold text-xs p-3 rounded-xl text-center animate-pulse">
                          Payment Received Successfully! Thank You
                        </div>
                      )}
                      <button onClick={() => markDelivered(o.id)} className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20">Deliver ✓</button>
                    </div>
                  )}
               </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
