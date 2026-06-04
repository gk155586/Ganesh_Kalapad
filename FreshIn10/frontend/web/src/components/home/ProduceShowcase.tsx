"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Leaf, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import api from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

export function ProduceShowcase() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch specifically from vegetables and fruits category
    api.get("/api/products?category=vegetables&limit=4")
      .then(({ data }) => setProducts(data?.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative py-20 overflow-hidden bg-white">
      {/* Decorative 3D backgrounds - Subtler Leaves */}
      <div className="absolute top-0 right-0 w-1/4 h-full opacity-[0.03] pointer-events-none">
        <Image src="/images/leaf-3d.png" alt="" fill className="object-contain grayscale blur-2xl rotate-45" />
      </div>
      <div className="absolute bottom-0 left-0 w-1/4 h-full opacity-[0.03] pointer-events-none">
        <Image src="/images/leaf-3d.png" alt="" fill className="object-contain grayscale blur-2xl -rotate-45" />
      </div>

      <div className="container-app relative z-10">
        <div className="flex flex-col lg:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-black mb-4"
            >
              <Leaf className="w-4 h-4" />
              <span>FARM TO TABLE</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Fresh Produce <br />
              <span className="text-green-600">Straight from the Farm.</span>
            </h2>
            <p className="text-slate-500 text-lg mt-4 font-medium">
              Handpicked daily, our vegetables and fruits are sourced directly from local farmers to ensure maximum freshness and nutritional value.
            </p>
          </div>
          
          <Link 
            href="/categories/vegetables"
            className="group flex items-center gap-2 text-green-600 font-black text-lg hover:text-green-700 transition-colors"
          >
            Explore All Produce
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <ProductCard product={product} />
              {/* Subtle floating leaf hint instead of distracting carrot */}
              {i === 0 && (
                <motion.div 
                  animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 w-12 h-12 z-30 pointer-events-none drop-shadow-xl opacity-70"
                >
                  <Image src="/images/leaf-3d.png" alt="" width={48} height={48} className="mix-blend-multiply filter contrast-125" />
                </motion.div>
              )}
              {i === 3 && (
                <motion.div 
                  animate={{ y: [0, 8, 0], rotate: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-4 -left-4 w-10 h-10 z-30 pointer-events-none drop-shadow-xl opacity-70"
                >
                  <Image src="/images/berry-3d.png" alt="" width={40} height={40} className="mix-blend-multiply filter contrast-125" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
