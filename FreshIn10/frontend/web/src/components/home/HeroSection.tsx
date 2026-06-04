"use client";

import { motion } from "framer-motion";
import { Clock, ShieldCheck, Star, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";
import Image from "next/image";

const stats = [
  { icon: Clock, label: "10 Min Delivery", color: "text-yellow-400" },
  { icon: ShieldCheck, label: "100% Fresh", color: "text-green-200" },
  { icon: Star, label: "4.9 Rating", color: "text-orange-400" },
];

export function HeroSection({ title, subtitle }: { title?: string, subtitle?: string }) {
  return (
    <section className="relative overflow-hidden min-h-[600px] lg:min-h-[700px] flex items-center bg-green-800">
      {/* Premium Green Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(22,163,74,0.4),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(132,204,22,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900" />
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-green-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="container-app relative z-10 py-12 md:py-20 px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 mb-8 shadow-2xl"
          >
            <div className="bg-yellow-400 p-1 rounded-full animate-bounce">
              <Zap className="w-3.5 h-3.5 text-gray-900 fill-gray-900" />
            </div>
            <span className="text-white text-xs sm:text-sm font-bold tracking-wide uppercase">
              India&apos;s Fastest Grocery Delivery
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight"
          >
            {title ? title : (
              <>
                <span className="text-yellow-400">FreshIn10</span> Grocery <br />
                Delivery in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 relative inline-block">
                  10 mins
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="absolute -bottom-2 left-0 right-0 h-2 bg-yellow-400/30 rounded-full origin-left blur-sm"
                  />
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-green-50 text-lg sm:text-xl mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium opacity-80"
          >
            {subtitle || "Fresh vegetables, fruits, and 5000+ products delivered ultra-fast. No minimum order. Free delivery above ₹199."}
          </motion.p>

          {/* Search Bar Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mb-10 max-w-md mx-auto lg:mx-0 relative z-50"
          >
            <SearchBar variant="hero" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col xs:flex-row gap-4 mb-12 justify-center lg:justify-start"
          >
            <Link
              href="/products"
              className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-950 font-black px-8 py-4.5 rounded-2xl hover:shadow-[0_20px_40px_-10px_rgba(234,179,8,0.5)] transition-all active:scale-95 shadow-xl w-full xs:w-auto text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              Shop Now
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold px-8 py-4.5 rounded-2xl hover:bg-white/10 transition-all w-full xs:w-auto text-lg"
            >
              Browse Categories
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-wrap gap-6 justify-center lg:justify-start"
          >
            {stats.map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 bg-white/10 backdrop-blur-lg border border-white/5 px-4 py-2 rounded-xl shadow-xl">
                <div className={`p-1.5 rounded-lg bg-white/5 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-white font-bold text-sm">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* 3D VISUAL SECTION */}
        <div className="relative hidden lg:flex items-center justify-center min-h-[500px]">
          {/* Main 3D Basket */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative z-20"
          >
            <div className="absolute inset-0 bg-green-400/20 blur-[80px] rounded-full scale-125 animate-pulse" />
            <Image 
              src="/images/basket-3d.png" 
              alt="Fresh Groceries" 
              width={500} 
              height={500} 
              className="relative z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)] animate-float mix-blend-multiply filter contrast-125"
            />
          </motion.div>

          {/* Floating 3D Elements (Subtle Leaves & Berries) */}
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              rotate: [0, 20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 z-30"
          >
            <Image 
              src="/images/leaf-3d.png" 
              alt="Leaf" 
              width={100} 
              height={100} 
              className="drop-shadow-2xl opacity-80 mix-blend-multiply filter contrast-125" 
            />
          </motion.div>

          <motion.div
            animate={{ 
              y: [0, 30, 0],
              rotate: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-0 z-30"
          >
            <Image 
              src="/images/berry-3d.png" 
              alt="Berry" 
              width={80} 
              height={80} 
              className="drop-shadow-2xl opacity-80 mix-blend-multiply filter contrast-125" 
            />
          </motion.div>

          <motion.div
            animate={{ 
              x: [0, 20, 0],
              rotate: [0, 10, 0]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 -left-10 z-10 opacity-40 blur-[1px]"
          >
            <Image 
              src="/images/leaf-3d.png" 
              alt="Leaf" 
              width={60} 
              height={60} 
              className="mix-blend-multiply filter contrast-125"
            />
          </motion.div>

          {/* 10 Min Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: "spring" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-40 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center"
          >
            <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg mb-2 animate-bounce">
              <Clock className="w-8 h-8 text-gray-900" />
            </div>
            <span className="text-4xl font-black text-white">10</span>
            <span className="text-xs font-black text-yellow-400 tracking-widest">MINUTES</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
