"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Share2, Star, Clock, ShieldCheck, ArrowLeft, Plus, Minus, ShoppingCart } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import api from "@/lib/api";
import { formatPrice } from "@freshin10/utils";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/products/ProductCard";
import { cn } from "@/lib/utils";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { items, addItem, updateItem } = useCartStore();

  const cartItem = items.find((i) => i.productId === product?.id);
  const quantity = cartItem?.quantity || 0;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/products/${id}`);
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-6">🏜️</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Product Not Found</h1>
      <button
        onClick={() => router.back()}
        className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95 mt-4"
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Nav */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 md:hidden">
        <div className="container-app py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 shadow-sm active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 shadow-sm active:scale-90 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 shadow-sm active:scale-90 transition-all">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container-app py-4 md:py-8">
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Image Gallery */}
            <div className="lg:w-1/2 p-6 md:p-12 lg:border-r border-gray-100">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-[32px] overflow-hidden bg-gray-50 border border-gray-100"
              >
                <SafeImage 
                  src={product.images?.[0]} 
                  alt={product.name} 
                  fill 
                  className="object-contain p-8 md:p-16 hover:scale-110 transition-transform duration-700" 
                  fallbackIcon="🛒"
                  fallbackClassName="w-full h-full flex items-center justify-center text-6xl md:text-8xl"
                />
                
                {product.isFeatured && (
                  <div className="absolute top-6 left-6 bg-yellow-400 text-gray-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-lg shadow-yellow-100 flex items-center gap-1.5 animate-bounce-soft">
                    <Star className="w-3.5 h-3.5 fill-gray-900" />
                    BEST SELLER
                  </div>
                )}
              </motion.div>
            </div>

            {/* Product Details */}
            <div className="lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-green-100 text-green-700 text-[11px] font-black px-3 py-1.5 rounded-lg tracking-wider uppercase">
                    {product.category?.name}
                  </span>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-black text-yellow-700">{product.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-yellow-400 font-bold ml-1">({product.reviewCount} Reviews)</span>
                    </div>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">
                  {product.name}
                </h1>
                <p className="text-lg font-bold text-gray-400 mb-6">{product.unit}</p>
                
                <div className="flex items-baseline gap-4 mb-8">
                  <span className="text-4xl font-black text-gray-900">{formatPrice(product.price)}</span>
                  {product.mrp > product.price && (
                    <span className="text-xl font-bold text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                  )}
                  {product.mrp > product.price && (
                    <span className="bg-red-100 text-red-600 text-sm font-black px-3 py-1.5 rounded-xl">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                    </span>
                  )}
                </div>

                <p className="text-gray-500 font-medium leading-relaxed text-base mb-8 line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                  {product.description || "No description available for this product."}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery</p>
                      <p className="text-sm font-black text-gray-900">10 Minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quality</p>
                      <p className="text-sm font-black text-gray-900">Super Fresh</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add to Cart Footer/Section */}
              <div className="mt-auto pt-8 border-t border-gray-100">
                <AnimatePresence mode="wait">
                  {quantity === 0 ? (
                    <motion.button
                      key="add"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => addItem(product.id, 1, product)}
                      disabled={!product.inventory?.stock}
                      className={cn(
                        "w-full h-16 rounded-2xl flex items-center justify-center gap-4 font-black text-lg transition-all shadow-xl active:scale-95",
                        product.inventory?.stock
                          ? "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <ShoppingCart className="w-6 h-6" />
                      {product.inventory?.stock ? "Add to Cart" : "Out of Stock"}
                    </motion.button>
                  ) : (
                    <motion.div
                      key="counter"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center bg-gray-900 rounded-2xl p-2 shadow-xl flex-1">
                        <button
                          onClick={() => updateItem(product.id, quantity - 1)}
                          className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-all active:scale-75"
                        >
                          <Minus className="w-6 h-6" />
                        </button>
                        <span className="flex-1 text-center text-xl font-black text-white">{quantity}</span>
                        <button
                          onClick={() => updateItem(product.id, quantity + 1)}
                          className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-all active:scale-75"
                        >
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</p>
                        <p className="text-xl font-black text-gray-900">{formatPrice(product.price * quantity)}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {product.similar?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-gray-900 mb-8">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {product.similar.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
