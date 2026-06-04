"use client";

import { motion } from "framer-motion";
import { Clock, Leaf, Shield, Headphones, Truck, Tag } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "10-Minute Delivery",
    description: "We promise delivery in 10 minutes or your next order is free.",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    icon: Leaf,
    title: "100% Fresh",
    description: "All products are sourced fresh daily from local farms and suppliers.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Contactless delivery with tamper-proof packaging for your safety.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Tag,
    title: "Best Prices",
    description: "Guaranteed lowest prices with daily deals and exclusive offers.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Free delivery on orders above ₹199. No hidden charges.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our customer support team is available round the clock.",
    color: "bg-pink-100 text-pink-600",
  },
];

export function WhyFreshIn10({ title }: { title?: string }) {
  return (
    <section className="py-16 bg-white">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-black text-gray-900 mb-3">
            {title || "Why Choose FreshIn10?"}
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            We&apos;re not just fast — we&apos;re the complete grocery experience you deserve.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-start gap-3 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
