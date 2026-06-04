"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ArrowRight, Trash2, HeartOff } from "lucide-react";
import api from "@/lib/api";
import { ProductCard } from "@/components/products/ProductCard";
import Link from "next/link";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/wishlist");
        setWishlist(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-16">
      <div className="container-app">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">My Wishlist</h1>
            <p className="text-lg text-gray-500 font-medium">
              {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later
            </p>
          </div>
          <Link
            href="/products"
            className="hidden md:flex items-center gap-2 text-green-600 font-black text-sm hover:underline"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {wishlist.length > 0 ? (
              wishlist.map((item, i) => (
                <ProductCard key={item.id} product={item.product} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-24 flex flex-col items-center text-center bg-white rounded-[40px] border border-gray-100 shadow-sm"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 bg-red-50 rounded-full animate-pulse opacity-50" />
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm border border-red-100">
                    <HeartOff className="w-10 h-10 text-red-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Wishlist is empty</h3>
                <p className="text-gray-500 font-medium mb-10 max-w-xs mx-auto">Save your favorite fresh items here to buy them later with ease.</p>
                <Link
                  href="/products"
                  className="bg-green-600 text-white px-12 py-4 rounded-3xl font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                >
                  Explore Products
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
