"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { MapPin, Phone, User, Landmark, Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const addressSchema = z.object({
  label: z.enum(["HOME", "WORK", "OTHER"]),
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  addressLine1: z.string().min(5, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialData?: any;
  onSubmit: (data: AddressFormData) => Promise<void>;
  loading: boolean;
  buttonText: string;
}

export function AddressForm({ initialData, onSubmit, loading, buttonText }: AddressFormProps) {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      label: "HOME",
      isDefault: false,
    },
  });

  const selectedLabel = watch("label");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Label Selection */}
      <div className="flex gap-3">
        {["HOME", "WORK", "OTHER"].map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setValue("label", label as any)}
            className={cn(
              "flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all border-2",
              selectedLabel === label
                ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100"
                : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register("fullName")}
              placeholder="John Doe"
              className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
            />
          </div>
          {errors.fullName && <p className="text-xs text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register("phone")}
              placeholder="9876543210"
              className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
            />
          </div>
          {errors.phone && <p className="text-xs text-red-500 font-bold ml-1">{errors.phone.message}</p>}
        </div>

        {/* Address Line 1 */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Flat / House No / Building</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register("addressLine1")}
              placeholder="123, Green Apartments"
              className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
            />
          </div>
          {errors.addressLine1 && <p className="text-xs text-red-500 font-bold ml-1">{errors.addressLine1.message}</p>}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Area / Sector / Locality</label>
          <input
            {...register("addressLine2")}
            placeholder="Sector 45, MG Road"
            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
          />
        </div>

        {/* Landmark */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Landmark (Optional)</label>
          <div className="relative">
            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              {...register("landmark")}
              placeholder="Near Apollo Hospital"
              className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Pincode */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
          <input
            {...register("pincode")}
            placeholder="560001"
            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
          />
          {errors.pincode && <p className="text-xs text-red-500 font-bold ml-1">{errors.pincode.message}</p>}
        </div>

        {/* City */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
          <input
            {...register("city")}
            placeholder="Bangalore"
            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
          />
          {errors.city && <p className="text-xs text-red-500 font-bold ml-1">{errors.city.message}</p>}
        </div>

        {/* State */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
          <input
            {...register("state")}
            placeholder="Karnataka"
            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
          />
          {errors.state && <p className="text-xs text-red-500 font-bold ml-1">{errors.state.message}</p>}
        </div>
      </div>

      {/* Set Default Toggle */}
      <label className="flex items-center gap-3 cursor-pointer group w-fit">
        <div className="relative">
          <input
            type="checkbox"
            {...register("isDefault")}
            className="sr-only"
          />
          <div className={cn(
            "w-12 h-6 rounded-full transition-colors",
            watch("isDefault") ? "bg-green-600" : "bg-gray-200"
          )} />
          <div className={cn(
            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
            watch("isDefault") ? "translate-x-6" : "translate-x-0"
          )} />
        </div>
        <span className="text-sm font-black text-gray-700 group-hover:text-gray-900">Set as default address</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-16 bg-green-600 text-white rounded-[24px] font-black text-lg hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </div>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
}
