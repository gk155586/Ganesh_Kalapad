"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, CalendarDays, Wallet, User, HelpCircle, Palette, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  { href: "/dashboard", icon: Home,        label: "Home" },
  { href: "/orders",    icon: CalendarDays, label: "Calendar" },
  { href: "/earnings",  icon: Wallet,       label: "Earnings" },
  { href: "/profile",   icon: User,         label: "Profile" },
];

export function DeliveryNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== "/login" && pathname !== "/";
  const { theme, setTheme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="min-h-screen flex justify-center bg-transparent transition-colors duration-300">
      <div className="w-full max-w-md relative min-h-screen shadow-2xl flex flex-col bg-transparent border-x border-transparent">
        
        {showNav && (
          <div className="header-dark px-4 py-3 flex justify-between items-center sticky top-0 z-40">
             <h2 className="font-black text-sm tracking-tighter uppercase">Fresh<span className="text-neon-green">In10</span></h2>
             <button onClick={() => setShowPicker(true)} className="p-2 rounded-xl bg-slate-800/20 text-slate-400">
                <Palette className="w-4 h-4" />
             </button>
          </div>
        )}

        <main className={`flex-1 overflow-y-auto no-scrollbar ${showNav ? "pb-20" : ""}`}>
          {children}
        </main>

        {showNav && (
          <nav className="absolute bottom-0 left-0 right-0 z-30 header-dark border-t border-transparent shadow-lg">
            <div className="flex items-center">
              {tabs.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link key={href} href={href}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all ${active ? "text-green-500" : "opacity-40"}`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={active ? 3 : 2} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        {/* Global Theme Picker */}
        <AnimatePresence>
          {showPicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                 className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-white">Switch Theme</h3>
                    <X className="w-5 h-5 text-slate-500 cursor-pointer" onClick={() => setShowPicker(false)} />
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: "black", label: "Pure Black", bg: "bg-black" },
                      { id: "blue", label: "Ocean Blue", bg: "bg-slate-900" },
                      { id: "white", label: "Classic White", bg: "bg-white" },
                    ].map((t) => (
                      <button key={t.id} onClick={() => { setTheme(t.id as any); setShowPicker(false); }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border ${theme === t.id ? "border-green-500 ring-1 ring-green-500" : "border-slate-800"}`}>
                        <div className={`w-8 h-8 rounded-lg ${t.bg} border border-slate-700`} />
                        <span className="font-black text-xs text-white uppercase">{t.label}</span>
                      </button>
                    ))}
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
