"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySlider } from "@/components/home/CategorySlider";
import { OfferBanners } from "@/components/home/OfferBanners";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WhyFreshIn10 } from "@/components/home/WhyFreshIn10";
import { Testimonials } from "@/components/home/Testimonials";
import { AppDownload } from "@/components/home/AppDownload";
import { ProduceShowcase } from "@/components/home/ProduceShowcase";
import api from "@/lib/api";
import Image from "next/image";

function Floating3DElements() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 600]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle Leaves and Berries instead of distracting carrots */}
      <motion.div style={{ y: y1, rotate: rotate1 }} className="absolute top-[15%] left-[2%] w-16 h-16 opacity-[0.07] blur-[0.5px]">
        <Image src="/images/leaf-3d.png" alt="" width={64} height={64} className="mix-blend-multiply" />
      </motion.div>
      <motion.div style={{ y: y2 }} className="absolute top-[45%] right-[3%] w-12 h-12 opacity-[0.05] blur-[1px]">
        <Image src="/images/berry-3d.png" alt="" width={48} height={48} className="mix-blend-multiply" />
      </motion.div>
      <motion.div style={{ y: y3 }} className="absolute bottom-[20%] left-[8%] w-20 h-20 opacity-[0.06] blur-[0.5px]">
        <Image src="/images/leaf-3d.png" alt="" width={80} height={80} className="mix-blend-multiply" />
      </motion.div>
      <motion.div style={{ y: y1 }} className="absolute top-[75%] right-[10%] w-10 h-10 opacity-[0.04] blur-[1px]">
        <Image src="/images/berry-3d.png" alt="" width={40} height={40} className="mix-blend-multiply" />
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const [layout, setLayout] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const { data } = await api.get("/api/config");
        if (data?.groceries?.layout) {
          setLayout(data.groceries.layout);
        } else {
          throw new Error("No layout found");
        }
      } catch (err) {
        setLayout([
          { id: "hero", type: "Hero" },
          { id: "categories", type: "Categories" },
          { id: "banners", type: "Banners" },
          { id: "trending", type: "Trending" },
          { id: "produce-showcase", type: "ProduceShowcase" },
          { id: "whyus", type: "WhyUs" },
          { id: "featured", type: "Featured" },
          { id: "testimonials", type: "Testimonials" },
          { id: "download", type: "AppDownload" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "CONFIG_UPDATE") {
        const newLayout = event.data.payload?.groceries?.layout;
        if (newLayout) setLayout(newLayout);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (loading) return <div className="min-h-screen bg-green-900" />;

  const renderSection = (section: any) => {
    switch (section.type) {
      case "Hero":
        return <div key={section.id} data-editor-id={section.id} data-editor-type="Hero" className="relative z-10"><HeroSection title={section.title} subtitle={section.subtitle} /></div>;
      case "Categories":
        return (
          <motion.div key={section.id} data-editor-id={section.id} data-editor-type="Categories" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="py-8 bg-white relative z-10">
            <CategorySlider title={section.title} />
          </motion.div>
        );
      case "Banners":
        return (
          <motion.div key={section.id} data-editor-id={section.id} data-editor-type="Banners" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="py-8 bg-white relative z-10">
            <OfferBanners title={section.title} />
          </motion.div>
        );
      case "Trending":
        return (
          <motion.div key={section.id} data-editor-id={section.id} data-editor-type="Trending" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="py-8 bg-white relative z-10">
            <TrendingProducts title={section.title} />
          </motion.div>
        );
      case "ProduceShowcase":
        return <div key={section.id} data-editor-id={section.id} data-editor-type="ProduceShowcase" className="relative z-10"><ProduceShowcase /></div>;
      case "WhyUs":
        return (
          <motion.div key={section.id} data-editor-id={section.id} data-editor-type="WhyUs" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="py-12 bg-slate-50 relative z-10">
            <WhyFreshIn10 title={section.title} />
          </motion.div>
        );
      case "Featured":
        return (
          <motion.div key={section.id} data-editor-id={section.id} data-editor-type="Featured" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="py-8 bg-white relative z-10">
            <FeaturedProducts title={section.title} />
          </motion.div>
        );
      case "Testimonials":
        return (
          <motion.div key={section.id} data-editor-id={section.id} data-editor-type="Testimonials" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="py-12 bg-white relative z-10">
            <Testimonials title={section.title} />
          </motion.div>
        );
      case "AppDownload":
        return (
          <motion.div key={section.id} data-editor-id={section.id} data-editor-type="AppDownload" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="pt-8 pb-16 bg-white relative z-10">
            <AppDownload title={section.title} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="relative bg-white overflow-x-hidden min-h-screen">
      <Floating3DElements />
      {(layout || []).map(renderSection)}
    </main>
  );
}
