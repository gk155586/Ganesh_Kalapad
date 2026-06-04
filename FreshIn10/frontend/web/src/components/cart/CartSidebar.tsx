"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, ArrowRight, Tag } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@freshin10/utils";
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from "@freshin10/utils";

export function CartSidebar() {
  const { items, isOpen, setCartOpen, updateItem, removeItem, subtotal, itemCount } = useCartStore();

  const sub = subtotal();
  const count = itemCount();
  const deliveryFee = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = sub + deliveryFee + 5; // +5 platform fee

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-[100dvh] w-full max-w-sm bg-white z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-gray-900">My Cart</h2>
                {count > 0 && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {count} items
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Delivery banner */}
            {sub > 0 && sub < FREE_DELIVERY_THRESHOLD && (
              <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                <span className="text-green-700">
                  Add <strong>{formatPrice(FREE_DELIVERY_THRESHOLD - sub)}</strong> more for free delivery!
                </span>
                <div className="mt-2 h-1.5 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${Math.min((sub / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center"
                  >
                    <div className="text-6xl mb-4 animate-float">🛒</div>
                    <h3 className="font-black text-gray-900 mb-2">Your cart is empty</h3>
                    <p className="text-sm text-gray-500 mb-6 font-medium">Add items to get started</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-200"
                    >
                      Start Shopping
                    </button>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3 bg-gray-50/50 rounded-2xl p-3 border border-gray-100"
                    >
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 p-1">
                        <SafeImage
                          src={item.product.images?.[0]}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="object-contain w-full h-full"
                          fallbackIcon="🛒"
                          fallbackClassName="w-full h-full flex items-center justify-center text-2xl"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-tight">{item.product.unit}</p>
                        <p className="text-sm font-black text-green-600">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        <button
                          onClick={() => updateItem(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-600 active:scale-90"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : "−"}
                        </button>
                        <span className="w-6 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.productId, item.quantity + 1)}
                          className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700 transition-all active:scale-90 shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 pb-10 md:pb-6 border-t border-gray-100 space-y-3 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {/* Coupon */}
                <button className="w-full flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
                  <Tag className="w-4 h-4" />
                  Apply coupon code
                </button>

                {/* Summary */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(sub)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery fee</span>
                    <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : ""}>
                      {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform fee</span>
                    <span>{formatPrice(5)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={() => setCartOpen(false)}
                  className="flex items-center justify-between w-full bg-green-600 text-white px-5 py-3.5 rounded-xl font-bold hover:bg-green-700 transition-colors"
                >
                  <span>Proceed to Checkout</span>
                  <div className="flex items-center gap-2">
                    <span>{formatPrice(total)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
