"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag,
  Image, Truck, BarChart3, Settings, LogOut, Percent, UserPlus, UserCircle, Star, Paintbrush
} from "lucide-react";

import { cn } from "@freshin10/ui";
import toast from "react-hot-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ShoppingBag, label: "Orders", href: "/orders" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: Tag, label: "Categories", href: "/categories" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Paintbrush, label: "App Customizer", href: "/view" },
  { icon: Truck, label: "Delivery Partners", href: "/delivery" },

  { icon: Percent, label: "Coupons", href: "/coupons" },
  { icon: Star, label: "Reviews", href: "/reviews" },
  { icon: UserPlus, label: "Team Management", href: "/team" },
  { icon: UserCircle, label: "My Profile", href: "/profile" },
];

export function AdminSidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean, setMobileOpen?: (v: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileOpen && setMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-gray-100 flex flex-col h-full fixed md:static z-50 transition-transform w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <div>
            <span className="font-black text-gray-900">FreshIn10</span>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "sidebar-link",
                isActive ? "sidebar-link-active" : "sidebar-link-inactive"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 mt-auto">
        <button
          onClick={handleLogout}
          className="sidebar-link sidebar-link-inactive w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
      </aside>
    </>
  );
}
