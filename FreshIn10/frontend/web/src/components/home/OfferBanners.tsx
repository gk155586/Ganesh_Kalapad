"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  image: string;
  link?: string;
}

const defaultBanners: Banner[] = [
  { id: "1", title: "Fresh Vegetables", subtitle: "Up to 40% off", color: "#16a34a", image: "🥦" },
  { id: "2", title: "Dairy & Eggs", subtitle: "Free delivery today", color: "#3b82f6", image: "🥛" },
  { id: "3", title: "Snacks & Drinks", subtitle: "Buy 2 Get 1 Free", color: "#f97316", image: "🍿" },
];

export function OfferBanners({ title }: { title?: string }) {
  const [banners, setBanners] = useState<Banner[]>(defaultBanners);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get("/api/config");
        if (data.groceries?.banners) {
          setBanners(data.groceries.banners);
        }
      } catch (err) {
        // Silently fallback to defaults
      }
    };
    fetchConfig();
  }, []);

  return (
    <section className="py-8 bg-gray-50">
      <div className="container-app">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {banners.map((banner, i) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={banner.link || "/products"}>
                <div
                  style={{ backgroundColor: banner.color }}
                  className="relative overflow-hidden rounded-2xl p-6 h-40 flex items-center justify-between cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="z-10">
                    <span className="inline-block bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full mb-2 uppercase tracking-tight">
                      SPECIAL DEAL
                    </span>
                    <h3 className="text-white font-black text-xl leading-tight">{banner.title}</h3>
                    <p className="text-white/80 text-sm mb-3 font-medium">{banner.subtitle}</p>
                    <span className="inline-flex items-center gap-1 bg-white text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition-colors uppercase">
                      Shop Now →
                    </span>
                  </div>
                  
                  {/* Image/Emoji area */}
                  <div className="text-6xl opacity-20 absolute -right-2 top-1/2 -translate-y-1/2 select-none group-hover:scale-110 transition-transform">
                    {banner.image.length < 5 ? banner.image : "📦"}
                  </div>

                  {/* Glassmorphism decorative elements */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

