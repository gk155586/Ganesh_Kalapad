"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  color?: string;
  _count?: { products: number };
}

// Fallback emoji icons for categories
const categoryEmojis: Record<string, string> = {
  vegetables: "🥦",
  fruits: "🍎",
  dairy: "🥛",
  bakery: "🍞",
  snacks: "🍿",
  beverages: "🥤",
  meat: "🥩",
  seafood: "🐟",
  frozen: "🧊",
  personal: "🧴",
  household: "🧹",
  baby: "👶",
  pet: "🐾",
  organic: "🌿",
};

const defaultCategories = [
  { id: "1", name: "Vegetables", slug: "vegetables", color: "#dcfce7", emoji: "🥦" },
  { id: "2", name: "Fruits", slug: "fruits", color: "#fef3c7", emoji: "🍎" },
  { id: "3", name: "Dairy & Eggs", slug: "dairy", color: "#dbeafe", emoji: "🥛" },
  { id: "4", name: "Bakery", slug: "bakery", color: "#fce7f3", emoji: "🍞" },
  { id: "5", name: "Snacks", slug: "snacks", color: "#fef9c3", emoji: "🍿" },
  { id: "6", name: "Beverages", slug: "beverages", color: "#e0f2fe", emoji: "🥤" },
  { id: "7", name: "Meat & Fish", slug: "meat", color: "#fee2e2", emoji: "🥩" },
  { id: "8", name: "Frozen", slug: "frozen", color: "#ede9fe", emoji: "🧊" },
  { id: "9", name: "Personal Care", slug: "personal", color: "#fdf4ff", emoji: "🧴" },
  { id: "10", name: "Household", slug: "household", color: "#f0fdf4", emoji: "🧹" },
];

export function CategorySlider({ title }: { title?: string }) {
  const [categories, setCategories] = useState(defaultCategories);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/api/categories")
      .then(({ data }) => {
        if (data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container-app">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">{title || "Shop by Category"}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar pb-2"
        >
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-3xl md:text-4xl transition-transform group-hover:scale-110 group-hover:shadow-lg"
                  style={{ backgroundColor: (cat as any).color || "#f0fdf4" }}
                >
                  {(cat as any).emoji || categoryEmojis[cat.slug] || "🛒"}
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 text-center max-w-[72px] leading-tight">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
