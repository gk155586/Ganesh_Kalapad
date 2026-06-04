"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Clock, ChevronRight, RefreshCw, Star, X, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import api from "@/lib/api";
import { formatPrice, formatRelativeTime } from "@freshin10/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@freshin10/utils";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  deliveryPartnerId?: string;
  deliveryRating?: { rating: number; comment?: string };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    image?: string;
    productId: string;
    product?: { images: string[] };
  }>;
  payment: { status: string };
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110">
          <Star className={`w-7 h-7 transition-colors ${(hover || value) >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`} />
        </button>
      ))}
    </div>
  );
}

function RatingModal({ order, onClose, onSubmit }: {
  order: Order;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryComment, setDeliveryComment] = useState("");
  const [productRatings, setProductRatings] = useState<Record<string, number>>({});
  const [productComments, setProductComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!deliveryRating) { toast.error("Please rate the delivery!"); return; }
    setLoading(true);
    try {
      await api.post("/api/ratings", {
        orderId: order.id,
        deliveryRating,
        deliveryComment,
        productRatings: order.items.map((item) => ({
          productId: item.productId,
          rating: productRatings[item.productId] || 5,
          comment: productComments[item.productId] || "",
        })),
      });
      toast.success("Thank you for your rating! 🌟");
      onSubmit();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit rating");
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-black text-lg text-gray-900">Rate Your Order</h2>
              <p className="text-xs text-gray-400">{order.orderNumber}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Rating */}
          <div className="bg-green-50 rounded-2xl p-4 mb-4">
            <p className="font-bold text-gray-900 mb-2">🛵 Delivery Experience</p>
            <StarRating value={deliveryRating} onChange={setDeliveryRating} />
            <textarea
              value={deliveryComment}
              onChange={(e) => setDeliveryComment(e.target.value)}
              placeholder="How was your delivery experience? (optional)"
              rows={2}
              className="w-full mt-3 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Product Ratings */}
          <div className="space-y-3 mb-5">
            <p className="font-bold text-gray-900">🛒 Product Quality</p>
            {order.items.map((item) => {
              const img = (() => {
                try { const arr = JSON.parse(item.image || "[]"); return Array.isArray(arr) ? arr[0] : item.image; } catch { return item.image; }
              })();
              return (
                <div key={item.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                      <SafeImage src={img} alt={item.name} width={40} height={40} className="object-cover w-full h-full" fallbackIcon="🛒" fallbackClassName="w-full h-full flex items-center justify-center text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button"
                          onClick={() => setProductRatings({ ...productRatings, [item.productId]: s })}>
                          <Star className={`w-5 h-5 transition-colors ${(productRatings[item.productId] || 0) >= s ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  {(productRatings[item.productId] || 0) > 0 && (
                    <textarea
                      value={productComments[item.productId] || ""}
                      onChange={(e) => setProductComments({ ...productComments, [item.productId]: e.target.value })}
                      placeholder="Write a review for this product... (optional)"
                      rows={2}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={handleSubmit} disabled={loading || !deliveryRating}
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><CheckCircle className="w-4 h-4" />Submit Rating</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratedOrderIds, setRatedOrderIds] = useState<Set<string>>(new Set());

  const fetchOrders = () => {
    api.get("/api/orders/history")
      .then(({ data }) => setOrders(data.orders))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleRatingSubmit = (orderId: string) => {
    setRatedOrderIds((prev) => new Set([...prev, orderId]));
    setRatingOrder(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-app max-w-2xl">
          <div className="h-8 skeleton rounded w-40 mb-6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 mb-4 space-y-3">
              <div className="h-5 skeleton rounded w-32" />
              <div className="h-4 skeleton rounded w-full" />
              <div className="h-4 skeleton rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-2xl">
        <h1 className="text-2xl font-black text-gray-900 mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <Link href="/"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const isDelivered = order.status === "DELIVERED";
              const isRated = ratedOrderIds.has(order.id) || !!order.deliveryRating;
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <Link href={`/orders/${order.id}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{order.orderNumber}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3" />{formatRelativeTime(order.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, j) => {
                            const img = (() => { try { const arr = JSON.parse(item.image || "[]"); return Array.isArray(arr) ? arr[0] : item.image; } catch { return item.image; } })();
                            return (
                              <div key={j} className="w-8 h-8 bg-gray-100 rounded-lg border-2 border-white overflow-hidden">
                                <SafeImage src={img} alt={item.name} width={32} height={32} className="object-cover w-full h-full" fallbackIcon="🛒" fallbackClassName="w-full h-full flex items-center justify-center text-xs" />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.items.slice(0, 2).map((i) => i.name).join(", ")}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </p>
                      </div>
                    </Link>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                      {isDelivered ? (
                        isRated ? (
                          <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-green-600 text-green-600" />
                            {order.deliveryRating?.rating || 5} Stars
                          </span>
                        ) : (
                          <button
                            onClick={() => setRatingOrder(order)}
                            className="flex items-center gap-1 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-100 transition-colors">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />Rate Order
                          </button>
                        )
                      ) : (
                        <Link href="/" className="flex items-center gap-1 text-sm text-green-600 font-semibold hover:underline">
                          <RefreshCw className="w-3.5 h-3.5" />Reorder
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingOrder && (
          <RatingModal
            order={ratingOrder}
            onClose={() => setRatingOrder(null)}
            onSubmit={() => handleRatingSubmit(ratingOrder.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
