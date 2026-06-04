"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SafeImage } from "@/components/ui/SafeImage";
import api from "@/lib/api";
import { formatPrice } from "@freshin10/utils";
import { cn } from "@freshin10/ui";

interface SearchResult {
  id: string;
  name: string;
  price: number;
  images: string[];
  slug: string;
  category?: { name: string };
}

interface SearchBarProps {
  variant?: "default" | "hero";
  onClose?: () => void;
}

const recentSearches = ["Tomatoes", "Milk", "Bread", "Eggs", "Bananas"];
const trendingSearches = ["Organic Vegetables", "Fresh Fruits", "Dairy Products"];

export function SearchBar({ variant = "default", onClose }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/api/products/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSearch = (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    setQuery(searchQuery);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 transition-all duration-200",
          variant === "hero"
            ? "bg-white border-white/30 shadow-xl"
            : "bg-white border-gray-200 hover:border-green-400",
          isOpen && "border-green-500 shadow-md"
        )}
      >
        <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for groceries..."
          className="flex-1 py-2 md:py-3 text-[13px] md:text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
            className="p-1 mr-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <button
          onClick={() => handleSearch()}
          className="bg-green-600 text-white px-3 md:px-4 py-2 m-1 md:m-1.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors flex-shrink-0"
        >
          <span className="hidden xs:inline">Search</span>
          <Search className="w-4 h-4 xs:hidden" />
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {/* Search results */}
            {results.length > 0 ? (
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-400 px-3 py-2">RESULTS</p>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => { router.push(`/products/${result.id}`); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <SafeImage src={result.images?.[0]} alt={result.name} width={40} height={40} className="object-cover w-full h-full" fallbackIcon="🛒" fallbackClassName="w-full h-full flex items-center justify-center text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                      <p className="text-xs text-gray-400">{result.category?.name}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatPrice(result.price)}</span>
                  </button>
                ))}
              </div>
            ) : query && !isLoading ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 text-sm">No results for &ldquo;{query}&rdquo;</p>
                <button
                  onClick={() => handleSearch()}
                  className="mt-2 text-green-600 text-sm font-semibold hover:underline"
                >
                  Search anyway →
                </button>
              </div>
            ) : !query ? (
              <div className="p-3">
                {/* Recent */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-400 px-3 py-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> RECENT
                  </p>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearch(s)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {/* Trending */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 px-3 py-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> TRENDING
                  </p>
                  {trendingSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearch(s)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      🔥 {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {isLoading && (
              <div className="p-4 text-center">
                <div className="inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
