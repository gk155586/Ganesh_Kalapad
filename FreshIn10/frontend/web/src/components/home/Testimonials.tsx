"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Mumbai",
    rating: 5,
    text: "Absolutely love FreshIn10! Got my groceries in exactly 8 minutes. The vegetables were super fresh and the app is so easy to use.",
    avatar: "PS",
    color: "bg-pink-100 text-pink-700",
  },
  {
    name: "Rahul Mehta",
    location: "Bangalore",
    rating: 5,
    text: "Best grocery app I've used. The 10-minute promise is real! Prices are competitive and the quality is top-notch.",
    avatar: "RM",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Anita Patel",
    location: "Delhi",
    rating: 5,
    text: "I order from FreshIn10 every day. The delivery partners are always on time and very professional. Highly recommended!",
    avatar: "AP",
    color: "bg-green-100 text-green-700",
  },
  {
    name: "Vikram Singh",
    location: "Hyderabad",
    rating: 5,
    text: "The app is brilliant. Real-time tracking, instant notifications, and the freshness of products is unmatched.",
    avatar: "VS",
    color: "bg-orange-100 text-orange-700",
  },
];

export function Testimonials({ title }: { title?: string }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-black text-gray-900 mb-3">
            {title || "Loved by 1M+ Customers"}
          </h2>
          <p className="text-gray-500">Don&apos;t just take our word for it</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <Quote className="w-6 h-6 text-green-200 mb-3" />
              <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
