"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, MapPin, User, Bell, Menu, X,
  ChevronDown, LogOut, Package, Heart, Wallet, Trash2
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { SearchBar } from "@/components/search/SearchBar";
import { cn } from "@freshin10/ui";

export function Navbar() {
  const router = useRouter();
  const { itemCount, toggleCart } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      import("@/lib/api").then(({ default: api }) => {
        api.get("/api/users/addresses").then(({ data }) => {
          if (data && data.length > 0) setAddress(data[0]);
        }).catch(() => {});
        api.get("/api/users/notifications").then(({ data }) => {
          setNotifications(data || []);
        }).catch(() => {});
      });
    }
  }, [isAuthenticated]);

  const handleReadNotification = async (notif: any) => {
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      const { default: api } = await import("@/lib/api");
      await api.put(`/api/users/notifications/${notif.id}/read`);
    }
    if (notif.data) {
      setShowNotifications(false);
      router.push(notif.data);
    }
  };

  const count = itemCount();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          isScrolled
            ? "bg-white shadow-md"
            : "bg-white border-b border-gray-100"
        )}
      >
        <div className="container-app px-3 md:px-6">
          <div className="flex items-center h-16 gap-2 md:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">F</span>
              </div>
              <span className="font-black text-lg md:text-xl text-gray-900">
                Fresh<span className="text-green-600 hidden xs:inline">In10</span>
              </span>
            </Link>

            {/* Location */}
            <Link href={isAuthenticated ? "/profile" : "/login"} className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm text-gray-600 hover:text-green-600 transition-colors border border-gray-200 rounded-xl px-1.5 py-1 md:px-3 md:py-2 flex-shrink-0">
              <MapPin className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
              <span className="font-medium hidden lg:block">Deliver to</span>
              <span className="text-gray-900 font-bold max-w-[40px] xs:max-w-[80px] sm:max-w-[120px] truncate">
                {address ? (address.label || address.addressLine1 || address.city) : "Loc"}
              </span>
              <ChevronDown className="w-3 h-3 hidden sm:block" />
            </Link>

            {/* Search - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <SearchBar />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Search - Mobile */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 flex flex-col max-h-[400px]"
                      >
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{unreadCount} new</span>}
                        </div>
                        <div className="overflow-y-auto flex-1 p-2">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 text-sm">No notifications yet</div>
                          ) : (
                            notifications.map(notif => (
                              <button
                                key={notif.id}
                                onClick={() => handleReadNotification(notif)}
                                className={`w-full text-left p-3 rounded-xl transition-colors mb-1 ${notif.isRead ? "hover:bg-gray-50" : "bg-purple-50/50 hover:bg-purple-50"}`}
                              >
                                <h4 className={`text-sm ${notif.isRead ? "font-semibold text-gray-800" : "font-bold text-gray-900"}`}>{notif.title}</h4>
                                <p className={`text-xs mt-1 line-clamp-2 ${notif.isRead ? "text-gray-500" : "text-gray-700 font-medium"}`}>{notif.message}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl hover:bg-green-700 transition-colors flex-shrink-0"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden md:block text-sm font-semibold">Cart</span>
                {mounted && count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="bg-yellow-400 text-gray-900 text-[10px] font-black rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center"
                  >
                    {count}
                  </motion.span>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-700 font-bold text-sm">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-500 hidden md:block" />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <div className="p-2">
                          {[
                            { icon: Package, label: "My Orders", href: "/orders" },
                            { icon: Heart, label: "Wishlist", href: "/wishlist" },
                            { icon: Wallet, label: `Wallet ₹${user?.walletBalance || 0}`, href: "/wallet" },
                            { icon: User, label: "Profile", href: "/profile" },
                          ].map(({ icon: Icon, label, href }) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                            >
                              <Icon className="w-4 h-4 text-gray-400" />
                              {label}
                            </Link>
                          ))}
                          <button
                            onClick={() => { logout(); setShowUserMenu(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-600 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden md:flex items-center gap-2 px-4 py-2 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors text-sm font-semibold"
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              )}

              {/* Mobile menu */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1.5 md:p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden pb-3 overflow-hidden"
              >
                <SearchBar onClose={() => setShowSearch(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
            >
              <div className="container-app py-4 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/orders" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">My Orders</span>
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="block w-full text-center bg-green-600 text-white py-3 rounded-xl font-semibold"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
