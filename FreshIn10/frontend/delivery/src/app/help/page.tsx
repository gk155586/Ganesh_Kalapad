"use client";

import { ChevronRight, Phone, MessageCircle, HelpCircle, FileText, AlertCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

const helpItems = [
  {
    section: "Support",
    items: [
      { icon: Phone, label: "Call Support", sub: "+91 1800-XXX-XXXX", action: () => window.open("tel:+911800000000") },
      { icon: MessageCircle, label: "WhatsApp Support", sub: "Chat with our team", action: () => window.open("https://wa.me/911234567890") },
    ],
  },
  {
    section: "Information",
    items: [
      { icon: FileText, label: "Delivery Guidelines", sub: "Rules and best practices", action: () => toast("Opening guidelines…") },
      { icon: HelpCircle, label: "FAQs", sub: "Common questions answered", action: () => toast("Opening FAQs…") },
      { icon: AlertCircle, label: "Report an Issue", sub: "Something went wrong?", action: () => toast("Opening issue report form…") },
    ],
  },
  {
    section: "Legal",
    items: [
      { icon: FileText, label: "Terms of Service", sub: "Delivery partner agreement", action: () => toast("Opening ToS…") },
      { icon: FileText, label: "Privacy Policy", sub: "How we use your data", action: () => toast("Opening privacy policy…") },
    ],
  },
];

const faqs = [
  { q: "When do I get paid?", a: "Earnings are credited to your account weekly every Monday." },
  { q: "How are points calculated?", a: "You earn 20 points per successful delivery. Points can be redeemed by admin." },
  { q: "What if I miss a delivery?", a: "Contact support immediately. Missed deliveries may affect your rating." },
  { q: "How to update my location?", a: "Location is automatically updated when you are Online status. GPS must be enabled." },
  { q: "How do ratings work?", a: "Customers rate you after delivery (1-5 stars). Your average appears in your profile." },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-black text-lg text-gray-900">Help & Support</h1>
        <p className="text-xs text-gray-400">FreshIn10 Delivery Partner Support</p>
      </div>

      <div className="p-4 space-y-5">
        {helpItems.map(({ section, items }) => (
          <div key={section}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{section}</p>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {items.map(({ icon: Icon, label, sub, action }, i) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* FAQs */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Frequently Asked Questions</p>
          <div className="space-y-2">
            {faqs.map(({ q, a }) => (
              <details key={q} className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer group">
                <summary className="text-sm font-semibold text-gray-900 list-none flex items-center justify-between">
                  {q}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* App version */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-300">FreshIn10 Delivery App v1.0.0</p>
          <p className="text-xs text-gray-300">Made with ❤️ by FreshIn10 Team</p>
        </div>
      </div>
    </div>
  );
}
