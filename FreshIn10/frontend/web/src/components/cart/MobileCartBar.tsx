"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@freshin10/utils";

export function MobileCartBar() {
  const pathname = usePathname();
  const { items, itemCount, subtotal, toggleCart, isOpen } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = itemCount();
  const sub = subtotal();
  const isHidePage = pathname?.includes("/checkout") || pathname?.includes("/auth");

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {count > 0 && !isOpen && !isHidePage && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 25 }}
          className="cart-bar"
        >
          <button
            onClick={toggleCart}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{count} item{count > 1 ? "s" : ""}</p>
                <p className="text-green-200 text-xs">View cart</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg">{formatPrice(sub)}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
