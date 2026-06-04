"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Filter, Search, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { ProductCard } from "@/components/products/ProductCard";
import Link from "next/link";

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get(`/api/categories/${slug}`),
          api.get("/api/products", { params: { category: slug, limit: 100 } }),
        ]);
        setCategory(catRes.data);
        setProducts(prodRes.data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryData();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-100 py-8 md:py-12">
        <div className="container-app">
          <div className="h-4 w-32 skeleton rounded mb-6" />
          <div className="h-12 w-64 skeleton rounded-2xl mb-2" />
          <div className="h-6 w-32 skeleton rounded mb-8" />
        </div>
      </div>
      <div className="container-app py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-80 skeleton rounded-[40px]" />
          ))}
        </div>
      </div>
    </div>
  );

  if (!category) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-6">🔍</div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Category Not Found</h1>
      <button
        onClick={() => router.push("/")}
        className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95 mt-4"
      >
        Go Home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Category Header */}
      <div className="bg-white border-b border-gray-100 py-8 md:py-12">
        <div className="container-app">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">
            <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">{category.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">
                {category.name}
              </h1>
              <p className="text-lg text-gray-500 font-medium">
                {products.length} {products.length === 1 ? "item" : "items"} available
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-gray-50 px-6 py-3 rounded-2xl font-black text-sm text-gray-900 border border-gray-100 hover:bg-white hover:shadow-md transition-all active:scale-95">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 bg-gray-50 px-6 py-3 rounded-2xl font-black text-sm text-gray-900 border border-gray-100 hover:bg-white hover:shadow-md transition-all active:scale-95">
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>
          
          {category.children?.length > 0 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar mt-10 pb-2">
              {category.children.map((child: any) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="px-6 py-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-2xl border border-gray-100 hover:border-green-200 font-black text-sm text-gray-600 whitespace-nowrap transition-all active:scale-95"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container-app py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {products.length > 0 ? (
              products.map((product, i) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-20 flex flex-col items-center text-center bg-white rounded-[40px] border border-gray-100"
              >
                <div className="text-7xl mb-6">🥕</div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">No products in this category</h3>
                <p className="text-gray-500 font-medium mb-10 max-w-xs mx-auto">We're currently stocking up on fresh items for this category.</p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-green-600 text-white px-10 py-4 rounded-3xl font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                >
                  Explore Home
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
