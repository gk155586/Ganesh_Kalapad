"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, X, Pencil, Trash2 } from "lucide-react";
import adminApi from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "", color: "#16a34a", image: "" });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/categories");
      setCategories(data);
    } catch {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: "", description: "", icon: "", color: "#16a34a", image: "" });
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditCat(cat);
    setForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "", color: cat.color || "#16a34a", image: cat.image || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editCat) {
        await adminApi.put(`/api/admin/categories/${editCat.id}`, form);
        toast.success("Category updated!");
      } else {
        await adminApi.post("/api/admin/categories", form);
        toast.success("Category created!");
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("WARNING: Deleting this category will permanently delete ALL products inside it. Continue?")) return;
    try {
      await adminApi.delete(`/api/admin/categories/${id}`);
      toast.success("Category and associated products deleted");
      fetchCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow relative group"
            >
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: cat.color + "22" }}>
                {cat.icon || "🏷️"}
              </div>
              <p className="font-bold text-gray-900 text-sm">{cat.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.description || "No description"}</p>
              <p className="text-xs text-gray-400 mt-1">{cat._count?.products ?? ""} products</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/40 z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">{editCat ? "Edit Category" : "Add Category"}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {[
                    { label: "Category Name", key: "name", required: true },
                    { label: "Icon (emoji)", key: "icon" },
                    { label: "Image URL", key: "image" },
                    { label: "Description", key: "description" },
                  ].map(({ label, key, required }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                      <input
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        required={required}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                        className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                      <span className="text-sm text-gray-500">{form.color}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 border-2 border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit"
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700">
                      {editCat ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
