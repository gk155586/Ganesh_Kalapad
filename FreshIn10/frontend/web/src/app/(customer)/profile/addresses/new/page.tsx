"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { AddressForm } from "@/components/profile/AddressForm";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function NewAddressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.post("/api/users/addresses", data);
      toast.success("Address added successfully!");
      router.push("/profile/addresses");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="container-app max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Add New Address</h1>
            <p className="text-sm text-gray-500 font-medium">Add a new delivery location</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-gray-100"
        >
          <AddressForm
            onSubmit={onSubmit}
            loading={loading}
            buttonText="Save Address"
          />
        </motion.div>
      </div>
    </div>
  );
}
