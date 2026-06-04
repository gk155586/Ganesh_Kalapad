"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Package, Truck, MessageSquare, Trash2, ShieldAlert } from "lucide-react";
import adminApi from "@/lib/api";
import { formatRelativeTime } from "@freshin10/utils";


export default function ReviewsPage() {
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [deliveryRatings, setDeliveryRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"product" | "delivery">("product");

  useEffect(() => {
    Promise.all([
      adminApi.get("/api/admin/reviews"),
      adminApi.get("/api/admin/reviews/delivery")
    ]).then(([prRes, drRes]) => {
      setProductReviews(prRes.data);
      setDeliveryRatings(drRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-3.5 h-3.5 ${rating >= s ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Customer Feedback</h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">Monitor ratings and reviews across your platform</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
          <button onClick={() => setTab("product")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2.5 transition-all ${tab === "product" ? "bg-white text-gray-900 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}>
            <Package className="w-4 h-4" /> Products
          </button>
          <button onClick={() => setTab("delivery")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2.5 transition-all ${tab === "delivery" ? "bg-white text-gray-900 shadow-md transform scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}`}>
            <Truck className="w-4 h-4" /> Delivery
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 h-40 skeleton shadow-sm" />
          ))}
        </div>
      ) : tab === "product" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {productReviews.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40 text-gray-400" />
              <p className="font-semibold text-gray-500">No product reviews yet</p>
              <p className="text-xs mt-1">When customers review groceries, they'll appear here.</p>
            </div>
          ) : productReviews.map((review, i) => {
            const productImg = (() => {
              if (!review.product?.images) return "";
              try {
                const arr = JSON.parse(review.product.images);
                return Array.isArray(arr) ? arr[0] : review.product.images;
              } catch {
                return review.product.images;
              }
            })();
            
            return (
            <motion.div key={review.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                  {productImg ? (
                    <img src={productImg} alt="Product" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  ) : "📦"}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm leading-tight pr-4">{review.product?.name}</h3>
                      <div className="mt-1.5 flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase">{formatRelativeTime(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50/80 p-3.5 rounded-2xl relative">
                <MessageSquare className="absolute top-3 right-3 w-4 h-4 text-gray-200 rotate-12" />
                <p className="text-sm text-gray-700 italic relative z-10 leading-relaxed font-medium">
                  "{review.comment || <span className="text-gray-400">Left a rating without a comment.</span>}"
                </p>
              </div>
              
              <div className="pt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full flex items-center justify-center text-xs font-black text-blue-700 shadow-inner">
                    {review.user?.name?.[0] || "?"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block leading-none">{review.user?.name || "Unknown Customer"}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Verified Buyer</span>
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {deliveryRatings.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-40 text-gray-400" />
              <p className="font-semibold text-gray-500">No delivery ratings yet</p>
              <p className="text-xs mt-1">Feedback for delivery partners will appear here.</p>
            </div>
          ) : deliveryRatings.map((rating, i) => (
            <motion.div key={rating.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-green-100">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1">
                      {rating.deliveryPartner?.user?.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      {renderStars(rating.rating)}
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{formatRelativeTime(rating.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-md transform rotate-2 group-hover:rotate-0 transition-transform">
                  <span className="text-xs font-black tracking-wider">ORDER #{i + 1}</span>
                </div>
              </div>
              
              <div className="bg-orange-50/50 p-3.5 rounded-2xl relative border border-orange-100/50">
                <MessageSquare className="absolute top-3 right-3 w-4 h-4 text-orange-200 rotate-12" />
                <p className="text-sm text-gray-800 italic relative z-10 leading-relaxed font-medium">
                  "{rating.comment || <span className="text-gray-400">Delivered smoothly without comment.</span>}"
                </p>
              </div>
              
              <div className="pt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-tr from-orange-100 to-amber-50 rounded-full flex items-center justify-center text-xs font-black text-orange-700 shadow-inner">
                    {rating.user?.name?.[0] || "?"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block leading-none">{rating.user?.name || "Unknown Customer"}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Rated the delivery</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
