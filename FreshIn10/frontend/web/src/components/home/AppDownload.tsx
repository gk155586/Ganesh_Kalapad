"use client";

import { motion } from "framer-motion";
import { Smartphone, Star, Download } from "lucide-react";

export function AppDownload({ title }: { title?: string }) {
  return (
    <section className="py-16 gradient-hero overflow-hidden">
      <div className="container-app">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-lg"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <Smartphone className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm font-semibold">Download the App</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              {title || "Get the FreshIn10 app for a better experience"}
            </h2>
            <p className="text-green-100 mb-8 leading-relaxed">
              Track your orders in real-time, get exclusive app-only deals, and enjoy a seamless shopping experience.
            </p>

            <div className="flex flex-wrap gap-4 mb-8">
              <button className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-900 transition-colors">
                <div className="text-2xl">🍎</div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Download on the</div>
                  <div className="font-bold text-sm">App Store</div>
                </div>
              </button>
              <button className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-900 transition-colors">
                <div className="text-2xl">▶</div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">Get it on</div>
                  <div className="font-bold text-sm">Google Play</div>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-white font-bold ml-1">4.9</span>
              </div>
              <div className="text-green-200 text-sm">
                <Download className="w-4 h-4 inline mr-1" />
                1M+ Downloads
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center">
              <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center">
                <Smartphone className="w-24 h-24 text-white/60" />
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-gray-900 font-black text-sm px-3 py-1.5 rounded-xl shadow-lg">
              FREE APP
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
