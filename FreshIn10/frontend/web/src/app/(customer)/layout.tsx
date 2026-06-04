"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartSidebar } from "@/components/cart/CartSidebar";
import { MobileCartBar } from "@/components/cart/MobileCartBar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthStore();
  const { setItems, fetchCart } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);



  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pb-20 md:pb-0">
        {children}
      </div>
      <Footer />
      <MobileCartBar />
      <CartSidebar />
    </div>
  );
}
