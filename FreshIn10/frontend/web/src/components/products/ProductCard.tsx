"use client";

import { useState, useRef } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, Minus, Heart, Star, ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { calculateDiscount, formatPrice } from "@freshin10/utils";
import { cn } from "@freshin10/ui";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  mrp: number;
  images: string[];
  unit: string;
  rating?: number;
  reviewCount?: number;
  inventory?: { stock: number };
  category?: { name: string };
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { items, addItem, updateItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toggle, isWishlisted: checkWishlist } = useWishlistStore();
  const isWishlisted = checkWishlist(product.id);

  const cartItem = items.find((i) => i.productId === product.id);
  const quantity = cartItem?.quantity || 0;
  const discount = calculateDiscount(product.mrp, product.price);
  const inStock = (product.inventory?.stock || 0) > 0;

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addItem(product.id, 1, product);
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    await updateItem(product.id, quantity + 1);
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    await updateItem(product.id, quantity - 1);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to use wishlist");
      return;
    }
    await toggle(product.id);
    toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, type: "spring", stiffness: 200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="perspective-1000"
    >
      <Link href={`/products/${product.id}`}>
        <div
          className={cn(
            "group relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500",
            className
          )}
        >
          {/* Discount badge */}
          {discount > 0 && (
            <motion.div
              className="absolute top-3 left-3 z-20 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)' }}
            >
              {discount}% OFF
            </motion.div>
          )}

          {/* Wishlist */}
          <motion.button
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.85 }}
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-20 w-9 h-9 backdrop-blur-xl rounded-full shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ 
              background: isWishlisted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.7)', 
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <Heart
              className={cn("w-4 h-4 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400")}
            />
          </motion.button>

          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-slate-50">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent z-0" />
            <SafeImage
              src={product.images?.[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out z-10"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              fallbackIcon="🛒"
              fallbackClassName="w-full h-full flex items-center justify-center text-4xl"
            />

            {!inStock && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[2px] z-20">
                <span className="text-[10px] font-black text-gray-500 bg-white px-3 py-1.5 rounded-xl border shadow-sm uppercase tracking-wider">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-white relative z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">{product.category?.name}</span>
              {product.rating && product.rating > 0 && (
                <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-lg">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-[11px] text-yellow-700 font-black">{product.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2 mb-1.5 min-h-[2.5rem]">
              {product.name}
            </h3>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg">{product.unit}</span>
              {product.inventory && product.inventory.stock <= 10 && product.inventory.stock > 0 && (
                <span className="text-[10px] font-black text-orange-600 animate-pulse">Only {product.inventory.stock} left!</span>
              )}
            </div>

            {/* Price + Cart */}
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
              <div className="flex flex-col">
                <span className="font-black text-slate-900 text-lg leading-none">{formatPrice(product.price)}</span>
                {product.mrp > product.price && (
                  <span className="text-[11px] text-slate-400 line-through font-bold mt-1 opacity-70">{formatPrice(product.mrp)}</span>
                )}
              </div>

              {/* Cart controls */}
              <AnimatePresence mode="wait">
                {quantity === 0 ? (
                  <motion.button
                    key="add"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAdd}
                    disabled={!inStock}
                    className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                      inStock
                        ? "bg-green-600 text-white hover:bg-green-500 shadow-green-600/20"
                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    )}
                  >
                    <Plus className="w-6 h-6" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="counter"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1 bg-green-600 rounded-2xl overflow-hidden shadow-lg shadow-green-600/20 p-1"
                  >
                    <button
                      onClick={handleDecrease}
                      className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                      {quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-white font-black text-sm min-w-[20px] text-center">{quantity}</span>
                    <button
                      onClick={handleIncrease}
                      className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
