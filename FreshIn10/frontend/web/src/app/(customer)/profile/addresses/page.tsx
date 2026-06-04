"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Trash2, Edit2, Check, ArrowLeft, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users/addresses");
      setAddresses(data);
    } catch (err) {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await api.delete(`/api/users/addresses/${id}`);
      setAddresses(addresses.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch (err) {
      toast.error("Failed to delete address");
    }
  };

  const setDefault = async (id: string) => {
    try {
      await api.put(`/api/users/addresses/${id}`, { isDefault: true });
      setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
      toast.success("Default address updated");
    } catch (err) {
      toast.error("Failed to set default address");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container-app max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-gray-900">Manage Addresses</h1>
          </div>
          <Link
            href="/profile/addresses/new"
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {addresses.length > 0 ? (
              addresses.map((addr, i) => (
                <motion.div
                  key={addr.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white rounded-3xl p-6 border-2 transition-all relative group ${
                    addr.isDefault ? "border-green-500 shadow-md" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        addr.isDefault ? "bg-green-100 text-green-600" : "bg-gray-50 text-gray-400"
                      }`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="font-black text-sm uppercase tracking-wider text-gray-400">
                        {addr.label}
                      </span>
                    </div>
                    {addr.isDefault && (
                      <span className="bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                        DEFAULT
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="font-black text-gray-900">{addr.fullName}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                      {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-sm text-gray-900 font-bold mt-2">
                      Phone: {addr.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/profile/addresses/${addr.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {!addr.isDefault && (
                      <button
                        onClick={() => setDefault(addr.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Default
                      </button>
                    )}
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 flex flex-col items-center text-center"
              >
                <div className="text-6xl mb-6">📍</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No addresses found</h3>
                <p className="text-gray-500 font-medium mb-8">Add a delivery address to start ordering</p>
                <Link
                  href="/profile/addresses/new"
                  className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                >
                  Add Your First Address
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
