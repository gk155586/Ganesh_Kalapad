"use client";

import { motion } from "framer-motion";
import { 
  User, Mail, Phone, MapPin, Package, Heart, 
  Wallet, Settings, ChevronRight, LogOut, Camera
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: Package, label: "My Orders", href: "/orders", desc: "View and track your orders" },
    { icon: Heart, label: "Wishlist", href: "/wishlist", desc: "Your favorite items" },
    { icon: Wallet, label: "Wallet", href: "/wallet", desc: `Balance: ₹${user?.walletBalance || 0}` },
    { icon: MapPin, label: "Addresses", href: "/profile/addresses", desc: "Manage delivery addresses" },
    { icon: Settings, label: "Settings", href: "/profile/settings", desc: "Account preferences" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-app max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Profile Header */}
          <div className="relative h-32 bg-green-600">
            <div className="absolute -bottom-12 left-8">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg">
                  <div className="w-full h-full bg-green-100 rounded-xl flex items-center justify-center overflow-hidden">
                    <SafeImage 
                      src={user?.avatar} 
                      alt={user?.name || "User"} 
                      fill 
                      className="object-cover" 
                      fallbackIcon={user?.name?.[0]?.toUpperCase()} 
                      fallbackClassName="text-3xl font-black text-green-700" 
                    />
                  </div>
                </div>
                <button className="absolute -right-2 -bottom-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100 text-gray-600 hover:text-green-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </div>
                  )}
                </div>
              </div>
              <button className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-95">
                Edit Profile
              </button>
            </div>
          </div>
        </motion.div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                  <item.icon className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.label}</h3>
                  <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          ))}

          {/* Logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 hover:border-red-100 hover:bg-red-50 transition-all group text-left"
            >
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-600">Logout</h3>
                <p className="text-xs text-red-400 font-medium">Sign out from your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-red-200 group-hover:translate-x-1 transition-all" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
