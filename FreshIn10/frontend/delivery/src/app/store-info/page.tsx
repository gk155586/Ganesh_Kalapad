"use client";

import { MapPin, Phone, Clock, ShieldCheck, ExternalLink, Info } from "lucide-react";

export default function StoreInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="font-black text-lg text-gray-900">Hub Information</h1>
        <p className="text-xs text-gray-400">Your assigned pickup location</p>
      </div>

      <div className="p-4 space-y-5">
        {/* Hub Card */}
        <div className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-1">FreshIn10 Hub — Pune East</h2>
          <p className="text-sm text-gray-500 mb-6">Central Distribution Center, Sector 12, Kharadi, Pune, MH 411014</p>
          
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hub Manager</p>
              <p className="text-sm font-bold text-gray-900">Ramesh Kumar</p>
              <button className="flex items-center gap-1 text-xs text-green-600 font-bold mt-1">
                <Phone className="w-3 h-3" /> Call Manager
              </button>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Operating Hours</p>
              <p className="text-sm font-bold text-gray-900">06:00 AM - 11:00 PM</p>
              <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Open Now
              </p>
            </div>
          </div>
        </div>

        {/* Location Link */}
        <button className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Get Directions</p>
              <p className="text-xs text-gray-400">Open in Google Maps</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-300" />
        </button>

        {/* Guidelines */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Hub Guidelines
          </h3>
          <ul className="space-y-3">
            {[
              "Always wear your FreshIn10 ID card and vest.",
              "Park your vehicle in the designated delivery zone.",
              "Verify all items and bags before leaving the hub.",
              "Report any damaged items immediately to the manager.",
              "Maintain silence and decorum inside the hub premises."
            ].map((g, i) => (
              <li key={i} className="flex gap-3 text-xs text-gray-500 leading-relaxed">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                {g}
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 leading-relaxed">
            If you are unable to reach the hub or face any issues with the security, please use the <strong>Help</strong> section to contact support immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
