"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  images: string[];
  unit: string;
  rating: number;
  reviewCount: number;
  inventory?: { stock: number };
  category?: { name: string };
}

export function TrendingProducts({ title }: { title?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/products/trending")
      .then(({ data }) => setProducts(Array.isArray(data) ? data : data?.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-10 bg-white">
      <div className="container-app">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title || "Trending Now"}</h2>
              <p className="text-xs text-gray-500">Most popular this week</p>
            </div>
          </div>
          <Link href="/products?trending=true" className="text-sm font-semibold text-green-600 hover:text-green-700">
            See all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 6).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
