"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit, Trash2, Package, X } from "lucide-react";
import adminApi from "@/lib/api";
import { formatPrice } from "@freshin10/utils";
import toast from "react-hot-toast";
import Image from "next/image";

const SafeImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [error, setError] = useState(false);
  let isValidUrl = false;
  try {
    if (src) {
      new URL(src);
      isValidUrl = true;
    }
  } catch {
    if (src?.startsWith("/")) isValidUrl = true;
  }

  if (!isValidUrl || error || !src) {
    return <div className="w-full h-full flex items-center justify-center text-lg bg-gray-100">📦</div>;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editProduct, setEditProduct] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price: "", mrp: "", unit: "",
    stock: "", categoryId: "", images: "", isActive: true,
    isFeatured: false, isTrending: false,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/admin/products", {
        params: { 
          search: search || undefined,
          category: selectedCategory || undefined,
          limit: 1000, // Fetch more products to show everything
        },
      });
      setProducts(data.products);
    } catch {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await adminApi.get("/api/categories");
      setCategories(data);
    } catch {}
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchProducts, search === "" ? 0 : 400);
    return () => clearTimeout(t);
  }, [search, selectedCategory]);

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", price: "", mrp: "", unit: "", stock: "", categoryId: "", images: "", isActive: true, isFeatured: false, isTrending: false });
    setShowModal(true);
  };

  const openEdit = (product: any) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      mrp: product.mrp.toString(),
      unit: product.unit,
      stock: product.inventory?.stock?.toString() || "0",
      categoryId: product.categoryId,
      images: product.images.join(", "),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await adminApi.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const currentImages = form.images ? form.images + ", " : "";
      setForm({ ...form, images: currentImages + data.url });
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        mrp: parseFloat(form.mrp),
        stock: parseInt(form.stock),
        images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      };

      if (editProduct) {
        await adminApi.put(`/api/admin/products/${editProduct.id}`, payload);
        toast.success("Product updated");
      } else {
        await adminApi.post("/api/admin/products", payload);
        toast.success("Product created");
      }

      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this product?")) return;
    try {
      await adminApi.delete(`/api/admin/products/${id}`);
      toast.success("Product deactivated");
      fetchProducts();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Products</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedCategory === ""
                ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                selectedCategory === cat.id
                  ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Product", "Category", "Price", "MRP", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <SafeImage src={product.images?.[0]} alt={product.name} className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 line-through">{formatPrice(product.mrp)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        (product.inventory?.stock || 0) <= 10
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {product.inventory?.stock || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">{editProduct ? "Edit Product" : "Add Product"}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 p-5 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                  {[
                    { label: "Product Name", key: "name", type: "text", required: true },
                    { label: "Unit (e.g. 500g, 1L)", key: "unit", type: "text", required: true },
                    { label: "Price (₹)", key: "price", type: "number", required: true },
                    { label: "MRP (₹)", key: "mrp", type: "number", required: true },
                    { label: "Stock", key: "stock", type: "number", required: true },
                  ].map(({ label, key, type, required }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                      <input
                        type={type}
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        required={required}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Images (URLs comma separated or upload)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.images}
                        onChange={(e) => setForm({ ...form, images: e.target.value })}
                        required
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="relative flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl px-4 cursor-pointer transition-colors overflow-hidden">
                        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          {uploadingImage ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                          {uploadingImage ? "Uploading..." : "Upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    {[
                      { label: "Active", key: "isActive" },
                      { label: "Featured", key: "isFeatured" },
                      { label: "Trending", key: "isTrending" },
                    ].map(({ label, key }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(form as any)[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                          className="accent-green-600 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 border-2 border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700"
                    >
                      {editProduct ? "Update" : "Create"}
                    </button>
                  </div>
                </form>

                {/* RIGHT - PREVIEW */}
                <div className="w-full md:w-80 flex flex-col items-center justify-center border border-gray-100 bg-gray-50/50 p-6 rounded-2xl">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                    🛒 Groceries Preview
                  </p>
                  
                  {/* Product Card Mock */}
                  <div className="w-64 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden group">
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-green-50 to-slate-50 flex items-center justify-center">
                      <SafeImage 
                        src={form.images.split(",")[0]?.trim()} 
                        alt={form.name} 
                        className="object-cover w-full h-full transform hover:scale-110 transition duration-700 ease-out" 
                      />
                    </div>
                    
                    <div className="p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                          {categories.find(c => c.id === form.categoryId)?.name || "Category"}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">{form.name || "Product Title"}</h3>
                      {form.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-1">{form.description}</p>
                      )}
                      <p className="text-xs text-gray-400 font-medium mb-2">{form.unit || "Unit"}</p>
                      
                      {parseInt(form.stock) > 0 && (
                        <p className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md inline-block self-start mb-3">
                          🔥 {form.stock} left in stock
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 text-base">₹{form.price || "0"}</span>
                          {parseFloat(form.mrp) > parseFloat(form.price) && (
                            <span className="text-[10px] text-gray-400 line-through font-medium">₹{form.mrp}</span>
                          )}
                        </div>
                        
                        <div className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-600/30">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
