"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, SlidersHorizontal, Search, X } from "lucide-react";
import api from "@/lib/api";
import { ProductCard } from "@/components/products/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";

function ProductsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(category);
  
  // Sync URL changes to local state
  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);
  
  // New Filters
  const [sortOrder, setSortOrder] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/products", {
          params: {
            search: query,
            category: selectedCategory,
            limit: 100, // fetch more for local filtering
          },
        });
        setProducts(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, selectedCategory]);

  useEffect(() => {
    api.get("/api/categories").then(({ data }) => setCategories(data));
  }, []);

  // Client-side filtering and sorting
  useEffect(() => {
    let result = [...products];

    if (unitFilter) {
      result = result.filter(p => {
        const u = p.unit.toLowerCase().trim();
        const f = unitFilter.toLowerCase();
        if (f === "g") return u.endsWith("g") && !u.endsWith("kg");
        if (f === "l") return u.endsWith("l") && !u.endsWith("ml");
        return u.includes(f);
      });
    }

    if (sortOrder === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    setFilteredProducts(result);
  }, [products, sortOrder, unitFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-green-50/30 py-8 relative overflow-hidden">
      {/* Decorative 3D background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30 mix-blend-multiply animate-blob" />
      <div className="absolute top-40 left-0 -ml-20 w-72 h-72 bg-emerald-200 rounded-full blur-3xl opacity-30 mix-blend-multiply animate-blob animation-delay-2000" />

      <div className="container-app relative z-10">
        {/* Header & Controls */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-500"
              >
                {query ? `Search: "${query}"` : selectedCategory ? `Category: ${selectedCategory}` : "Fresh Groceries"}
              </motion.h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {loading ? "Harvesting items..." : `${filteredProducts.length} items ready for you`}
              </p>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                showFilters ? "bg-green-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:border-green-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Advanced Filters
            </button>
          </div>

          {/* Filter Panel (3D dropdown effect) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -10, rotateX: 15 }}
                className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 md:grid-cols-2 gap-6 origin-top"
              >
                {/* Sort */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "", label: "Featured" },
                      { id: "price-asc", label: "Price: Low to High" },
                      { id: "price-desc", label: "Price: High to Low" },
                      { id: "rating", label: "Highest Rated" },
                    ].map(s => (
                      <button
                        key={s.id} onClick={() => setSortOrder(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sortOrder === s.id ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unit Filter */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Package Size</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "", label: "Any Size" },
                      { id: "kg", label: "Kilograms (kg)" },
                      { id: "g", label: "Grams (g)" },
                      { id: "l", label: "Liters (L)" },
                      { id: "ml", label: "Milliliters (ml)" },
                      { id: "piece", label: "Pieces/Units" },
                    ].map(u => (
                      <button
                        key={u.id} onClick={() => setUnitFilter(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          unitFilter === u.id ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300 shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-2 pt-1">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex-shrink-0 relative overflow-hidden group ${
                !selectedCategory ? "text-white shadow-xl shadow-green-200/50 scale-105" : "bg-white text-gray-600 border border-gray-100 hover:border-green-200 hover:shadow-md"
              }`}
            >
              {!selectedCategory && <span className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 z-0"></span>}
              <span className="relative z-10">All Categories</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all flex-shrink-0 relative overflow-hidden group ${
                  selectedCategory === cat.slug ? "text-white shadow-xl shadow-green-200/50 scale-105" : "bg-white text-gray-600 border border-gray-100 hover:border-green-200 hover:shadow-md"
                }`}
              >
                {selectedCategory === cat.slug && <span className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 z-0"></span>}
                <span className="relative z-10">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 perspective-1000">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 h-72 animate-pulse border border-white">
                  <div className="bg-gray-200/50 rounded-xl w-full aspect-square mb-4" />
                  <div className="h-4 bg-gray-200/50 rounded-lg w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200/50 rounded-lg w-1/2" />
                </div>
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} className="hover:z-10 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(22,163,74,0.3)] transition-all duration-300" />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                className="col-span-full py-24 flex flex-col items-center text-center bg-white/50 backdrop-blur-md rounded-3xl border border-white shadow-xl"
              >
                <div className="text-7xl mb-6 drop-shadow-xl animate-bounce">🥬</div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">No groceries found</h3>
                <p className="text-gray-500 font-medium mb-8 max-w-sm">We couldn't find any products matching your current filters. Try exploring other categories!</p>
                <button
                  onClick={() => { setSelectedCategory(""); setSortOrder(""); setUnitFilter(""); }}
                  className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-green-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                >
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
