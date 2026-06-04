"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Package, Clock, CheckCircle, XCircle, RefreshCw, Phone, Star, Download } from "lucide-react";
import api from "@/lib/api";
import { formatPrice, formatDateTime } from "@freshin10/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@freshin10/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { socket, connectSocket } from "@/lib/socket";

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    // Initial fetch
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/api/orders/${id}`);
        setOrder(data);
      } catch {
        router.push("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Socket real-time updates
    if (accessToken) {
      connectSocket(accessToken);
      
      socket.emit("order:subscribe", id);

      const handleStatusUpdate = (data: { orderId: string; status: string }) => {
        if (data.orderId === id) {
          setOrder((prev: any) => prev ? ({ ...prev, status: data.status }) : null);
          toast.success(`Order status updated to ${data.status.replace(/_/g, " ")}`);
          
          // Re-fetch full order to get delivery partner details if they were just assigned
          api.get(`/api/orders/${id}`).then(({ data }) => setOrder(data));
        }
      };

      const handleDelivered = (data: { orderId: string }) => {
        if (data.orderId === id) {
          setOrder((prev: any) => prev ? ({ ...prev, status: "DELIVERED" }) : null);
          toast.success("Order Delivered! 🎉");
          api.get(`/api/orders/${id}`).then(({ data }) => setOrder(data));
        }
      };

      socket.on("order:status", handleStatusUpdate);
      socket.on("order:delivered", handleDelivered);
      socket.on("order:arrived", () => {
        toast.success("Delivery partner has arrived! 🛵");
        api.get(`/api/orders/${id}`).then(({ data }) => setOrder(data));
      });

      socket.on("order:location", (data: { latitude: number; longitude: number }) => {
        setOrder((prev: any) => prev ? ({
          ...prev,
          deliveryPartner: {
            ...prev.deliveryPartner,
            latitude: data.latitude,
            longitude: data.longitude
          }
        }) : null);
      });

      return () => {
        socket.emit("order:unsubscribe", id);
        socket.off("order:status", handleStatusUpdate);
        socket.off("order:delivered", handleDelivered);
        socket.off("order:arrived");
        socket.off("order:location");
      };
    }
  }, [id, accessToken, router]);

  const cancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await api.post(`/api/orders/${id}/cancel`, { reason: "Customer requested cancellation" });
      toast.success("Order cancelled");
      setOrder({ ...order, status: "CANCELLED" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Cannot cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const submitRating = async (r: number) => {
    if (order.deliveryRating) return;
    setSubmittingRating(true);
    try {
      await api.post(`/api/orders/${id}/rate-delivery`, { rating: r });
      toast.success("Thanks for your feedback!");
      setOrder({ ...order, deliveryRating: { rating: r } });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
  );

  if (!order) return null;

  const trackingSteps = [
    { status: "PENDING", label: "Order Placed", icon: Package },
    { status: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
    { status: "PREPARING", label: "Preparing", icon: Clock },
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: RefreshCw },
    { status: "DELIVERED", label: "Delivered", icon: CheckCircle },
  ];

  const currentStepIndex = trackingSteps.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 print:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="print:hidden">
            <h1 className="font-black text-xl text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-400">{formatDateTime(order.createdAt)}</p>
          </div>
          <button 
            onClick={() => window.print()}
            className="ml-auto flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors print:hidden"
          >
            <Download className="w-4 h-4" />
            Invoice
          </button>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full print:hidden ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* --- PRINTABLE INVOICE SECTION --- */}
        <div className="hidden print:block font-sans bg-white p-8">
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-green-600 mb-1">FreshIn10</h1>
              <p className="text-gray-500 text-sm">Your Daily Groceries, Fast.</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-1">INVOICE</h2>
              <p className="font-semibold text-gray-700">{order.orderNumber}</p>
              <p className="text-gray-500 text-sm">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>
          
          <div className="flex justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bill To:</p>
              <p className="font-bold text-gray-800">{order.user?.name}</p>
              <p className="text-gray-600 text-sm">{order.user?.phone}</p>
              <p className="text-gray-600 text-sm">{order.user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Delivery Address:</p>
              <p className="font-semibold text-gray-800">{order.address?.fullName}</p>
              <p className="text-gray-600 text-sm">{order.address?.addressLine1}</p>
              {order.address?.addressLine2 && <p className="text-gray-600 text-sm">{order.address?.addressLine2}</p>}
              <p className="text-gray-600 text-sm">{order.address?.city} - {order.address?.pincode}</p>
            </div>
          </div>

          <table className="w-full mb-8 text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-2 text-gray-600 uppercase text-xs tracking-wider">Item Description</th>
                <th className="py-2 text-right text-gray-600 uppercase text-xs tracking-wider">Qty</th>
                <th className="py-2 text-right text-gray-600 uppercase text-xs tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right font-semibold text-gray-800">{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Platform Fee</span>
                <span>{formatPrice(order.platformFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600 text-sm font-semibold">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-lg border-t-2 border-gray-200 pt-2 mt-2">
                <span>Total Amount</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-gray-400 text-sm border-t pt-4">
            <p className="font-semibold text-gray-500 mb-1">Thank you for shopping with FreshIn10!</p>
            <p>Payment Status: {order.payment?.status === "SUCCESS" ? "PAID" : "PENDING"} ({order.paymentMethod})</p>
          </div>
        </div>
        {/* --- END INVOICE SECTION --- */}

        {/* Existing Content */}
        <div className="print:hidden">
          {order.status !== "CANCELLED" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <h2 className="font-bold text-gray-900 mb-4">Order Tracking</h2>
            <div className="space-y-3">
              {trackingSteps.map((step, i) => {
                const isDone = i <= currentStepIndex;
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-green-600" : "bg-gray-100"}`}>
                      <step.icon className={`w-4 h-4 ${isDone ? "text-white" : "text-gray-400"}`} />
                    </div>
                    <span className={`text-sm font-semibold ${isDone ? "text-gray-900" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                    {i === currentStepIndex && (
                      <span className="ml-auto text-xs text-green-600 font-semibold">Current</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery Partner */}
        {order.deliveryPartner && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center overflow-hidden border border-green-100">
                {order.deliveryPartner.user.avatar ? (
                  <img src={order.deliveryPartner.user.avatar} alt={order.deliveryPartner.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🛵</span>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{order.deliveryPartner.user.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 font-medium">Delivery Partner</p>
                  {order.deliveryPartner.latitude && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-black uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded-full animate-pulse">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                      Live Tracking
                    </span>
                  )}
                </div>
              </div>
            </div>
            {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
              <a 
                href={`tel:${order.deliveryPartner.user.phone}`} 
                className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100 hover:scale-105 transition-all shadow-sm"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {/* Delivery Rating */}
        {order.status === "DELIVERED" && order.deliveryPartner && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 text-center">
            <h2 className="font-bold text-gray-900 mb-2">How was your delivery?</h2>
            <p className="text-sm text-gray-500 mb-4">Rate {order.deliveryPartner.user.name}'s service</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                   key={star}
                  disabled={!!order.deliveryRating || submittingRating}
                  onClick={() => submitRating(star)}
                  className="p-1 transition-transform hover:scale-110 disabled:hover:scale-100"
                >
                  <Star 
                    className={`w-8 h-8 ${order.deliveryRating && order.deliveryRating.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`} 
                  />
                </button>
              ))}
            </div>
            {order.deliveryRating && (
              <p className="text-sm text-green-600 font-semibold mt-3">Thanks for rating!</p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-900 mb-3">Items ({order.items?.length})</h2>
          <div className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-semibold">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <h2 className="font-bold text-gray-900">Delivery Address</h2>
          </div>
          <p className="text-sm text-gray-600">{order.address?.fullName}</p>
          <p className="text-sm text-gray-500">{order.address?.addressLine1}, {order.address?.city}</p>
        </div>

        {/* Cancel button */}
        {["PENDING", "CONFIRMED"].includes(order.status) && (
          <button
            onClick={cancelOrder}
            disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
