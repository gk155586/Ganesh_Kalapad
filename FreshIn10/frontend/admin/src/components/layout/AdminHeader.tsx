"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, ChevronDown, Menu } from "lucide-react";

export function AdminHeader({ toggleMenu }: { toggleMenu?: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUser");
    router.replace("/login");
  };

  const typeIcon: Record<string, string> = { order: "🛍️", product: "📦", user: "👤" };
  const typeLabel: Record<string, string> = { order: "Order", product: "Product", user: "User" };

  return (
    <header className="header-blur px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
      <div className="flex-1 flex items-center gap-4">
        {toggleMenu && (
          <button onClick={toggleMenu} className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile dropdown */}
      <div ref={profileRef} className="relative">
        <button onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors btn-3d">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-700 font-bold text-sm">{user?.name?.[0]?.toUpperCase() || "A"}</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || "Admin"}</p>
            <p className="text-xs text-gray-400">{user?.role || "Administrator"}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} />
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={() => { router.push("/profile"); setShowProfile(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <User className="w-4 h-4" />My Profile
            </button>
            <button onClick={() => { router.push("/profile"); setShowProfile(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4" />Settings
            </button>
            <div className="border-t border-gray-100">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" />Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
