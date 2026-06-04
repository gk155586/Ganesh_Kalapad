"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MapPin, Package, ArrowRight, Download } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { formatPrice, formatDateTime } from "@freshin10/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  estimatedAt: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  address: { fullName: string; addressLine1: string; city: string };
  payment: { method: string; status: string };
}

export default function OrderSuccessPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    api.get(`/api/orders/${id}`)
      .then(({ data }) => setOrder(data))
      .catch(() => router.push("/"));
  }, [id]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-app max-w-lg">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Order Placed! 🎉</h1>
          <p className="text-gray-500">Your groceries are on their way</p>
        </motion.div>

        {/* Order card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
        >
          {/* Header */}
          <div className="gradient-green p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Order Number</p>
                <p className="font-black text-lg">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-sm">Total</p>
                <p className="font-black text-lg">{formatPrice(order.total)}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* ETA */}
            <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-4">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Estimated Delivery</p>
                <p className="text-yellow-700 font-black text-lg">~10 minutes</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{order.address.fullName}</p>
                <p className="text-sm text-gray-500">{order.address.addressLine1}, {order.address.city}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-gray-400" />
                <p className="font-semibold text-gray-900 text-sm">{order.items.length} items</p>
              </div>
              <div className="space-y-1">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
              <span className="text-gray-500">Payment</span>
              <span className="font-semibold text-gray-900">
                {order.payment.method} • {order.payment.status}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-3"
        >
          <Link
            href={`/orders/${order.id}`}
            className="flex items-center justify-between w-full bg-green-600 text-white px-5 py-4 rounded-xl font-bold hover:bg-green-700 transition-colors"
          >
            <span>Track Order</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Invoice
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center border-2 border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
