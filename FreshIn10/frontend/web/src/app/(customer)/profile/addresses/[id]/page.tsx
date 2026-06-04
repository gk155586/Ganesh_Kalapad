"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin } from "lucide-react";
import { AddressForm } from "@/components/profile/AddressForm";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function EditAddressPage() {
  const { id } = useParams();
  const router = useRouter();
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const { data } = await api.get("/api/users/addresses");
        const found = data.find((a: any) => a.id === id);
        if (!found) {
          toast.error("Address not found");
          router.push("/profile/addresses");
          return;
        }
        setAddress(found);
      } catch (err) {
        toast.error("Failed to load address");
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [id, router]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await api.put(`/api/users/addresses/${id}`, data);
      toast.success("Address updated successfully!");
      router.push("/profile/addresses");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update address");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600" />
    </div>
  );

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
            <h1 className="text-2xl font-black text-gray-900">Edit Address</h1>
            <p className="text-sm text-gray-500 font-medium">Update your delivery location</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-gray-100"
        >
          <AddressForm
            initialData={address}
            onSubmit={onSubmit}
            loading={submitting}
            buttonText="Update Address"
          />
        </motion.div>
      </div>
    </div>
  );
}
