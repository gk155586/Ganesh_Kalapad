"use client";

import { useState, useEffect, useRef } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, Monitor, Layout, Palette, Save, RefreshCw, 
  ExternalLink, ShoppingBag, Truck, Undo2, Redo2, 
  GripVertical, Type, Image as ImageIcon, Plus, Trash2, 
  ChevronRight, ChevronDown, Check, X, Settings as SettingsIcon,
  Layers, MousePointer2, Zap, Globe
} from "lucide-react";

import adminApi from "@/lib/api";
import toast from "react-hot-toast";

type AppMode = "groceries" | "delivery";
type ViewSize = "mobile" | "desktop";

const SECTION_TYPES = [
  { type: "Hero", icon: Layout, label: "Hero Banner" },
  { type: "Categories", icon: Layers, label: "Categories Grid" },
  { type: "Banners", icon: ImageIcon, label: "Promo Banners" },
  { type: "Trending", icon: ShoppingBag, label: "Trending Products" },
  { type: "Featured", icon: StarIcon, label: "Featured Products" },
  { type: "WhyUs", icon: Check, label: "Why Us Section" },
  { type: "Testimonials", icon: Type, label: "Testimonials" },
  { type: "AppDownload", icon: Smartphone, label: "App Download" },
];

function StarIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  );
}

export default function AppCustomizer() {
  const [mode, setMode] = useState<AppMode>("groceries");
  const [viewSize, setViewSize] = useState<ViewSize>("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isVisualSelect, setIsVisualSelect] = useState(false);

  // State & History for Undo/Redo
  const [config, setConfig] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchConfig = async () => {
    try {
      let response;
      try {
        response = await adminApi.get("/api/admin/config");
      } catch (err) {
        response = await adminApi.get("/api/config");
      }
      
      const data = response.data;
      const loadedConfig = { ...data };
      if (!loadedConfig.groceries) loadedConfig.groceries = {};
      if (!loadedConfig.groceries.layout) {
        loadedConfig.groceries.layout = [
          { id: "hero", type: "Hero", title: "Groceries at your door in 10 minutes", subtitle: "Fresh vegetables, fruits, dairy & more." },
          { id: "categories", type: "Categories", title: "Shop by Category" },
          { id: "banners", type: "Banners", title: "Special Offers" },
          { id: "trending", type: "Trending", title: "Trending Products" },
          { id: "whyus", type: "Why Choose FreshIn10?" },
        ];
      }
      if (!loadedConfig.groceries.banners) {
        loadedConfig.groceries.banners = [
          { id: "1", title: "Fresh Vegetables", subtitle: "Up to 40% off", color: "#16a34a", image: "🥦" },
          { id: "2", title: "Dairy & Eggs", subtitle: "Free delivery today", color: "#3b82f6", image: "🥛" },
        ];
      }
      if (!loadedConfig.delivery) {
        loadedConfig.delivery = { primaryColor: "#3b82f6", theme: "black" };
      }
      
      setConfig(loadedConfig);
      setHistory([JSON.parse(JSON.stringify(loadedConfig))]);
      setHistoryIndex(0);
    } catch (err) {
      toast.error("Using local default config.");
      const defaults = {
        appName: "FreshIn10",
        groceries: {
          primaryColor: "#16a34a",
          layout: [
            { id: "hero", type: "Hero", title: "Groceries in 10 minutes", subtitle: "Ultra-fast delivery" },
            { id: "categories", type: "Categories", title: "Shop Categories" },
            { id: "banners", type: "Banners", title: "Special Offers" },
          ],
          banners: [{ id: "1", title: "Fresh Veggies", subtitle: "40% off", color: "#16a34a", image: "🥦" }]
        },
        delivery: { primaryColor: "#3b82f6", theme: "black" }
      };
      setConfig(defaults);
      setHistory([defaults]);
      setHistoryIndex(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "EDITOR_ELEMENT_CLICKED") {
        const { id } = event.data.payload;
        setActiveSectionId(id);
        setIsVisualSelect(false);
        // Highlight in sidebar
        const element = document.getElementById(`sidebar-section-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        toast.success(`Selected section: ${id}`, { duration: 1000 });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const updateConfig = (newConfig: any) => {
    const cleanConfig = JSON.parse(JSON.stringify(newConfig));
    setConfig(cleanConfig);
    
    // History management
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cleanConfig);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Sync with iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "CONFIG_UPDATE", payload: cleanConfig }, "*");
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setConfig(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setConfig(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.put("/api/admin/config", config);
      toast.success("Changes published live!");
    } catch (err) {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const addSection = (type: string) => {
    const newSection = {
      id: `${type.toLowerCase()}-${Date.now()}`,
      type,
      title: `New ${type} Section`,
      subtitle: "Edit this description"
    };
    const newLayout = [...config.groceries.layout, newSection];
    updateConfig({
      ...config,
      groceries: { ...config.groceries, layout: newLayout }
    });
    setActiveSectionId(newSection.id);
  };

  const removeSection = (id: string) => {
    const newLayout = config.groceries.layout.filter((s: any) => s.id !== id);
    updateConfig({
      ...config,
      groceries: { ...config.groceries, layout: newLayout }
    });
    if (activeSectionId === id) setActiveSectionId(null);
  };

  const highlightInPreview = (id: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "EDITOR_HIGHLIGHT", payload: { id } }, "*");
    }
  };

  if (loading || !config) return <div className="h-full flex items-center justify-center bg-white"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;

  // Real Vercel URLs for live editing
  const previewUrls = {
    groceries: "https://fresh-in10-web.vercel.app/",
    delivery: "https://fresh-in10-delivery.vercel.app/dashboard"
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-gray-50 -m-6">
      {/* Sidebar Controls */}
      <div className="w-80 border-r bg-white flex flex-col shadow-xl z-20">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-black">F</div>
            <h1 className="font-black text-lg tracking-tight">App Customizer</h1>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button 
              onClick={() => setMode("groceries")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === "groceries" ? "bg-white shadow-sm text-green-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Groceries
            </button>
            <button 
              onClick={() => setMode("delivery")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === "delivery" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Truck className="w-3.5 h-3.5" /> Delivery
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {mode === "groceries" ? (
            <div className="space-y-6">
              {/* Branding Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <Palette className="w-3 h-3" /> Branding & Identity
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">App Name</label>
                    <input 
                      type="text" 
                      value={config.appName}
                      onChange={(e) => updateConfig({ ...config, appName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 ring-green-500/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Primary Brand Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={config.groceries.primaryColor}
                        onChange={(e) => updateConfig({ ...config, groceries: { ...config.groceries, primaryColor: e.target.value } })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                      />
                      <input 
                        type="text" 
                        value={config.groceries.primaryColor}
                        onChange={(e) => updateConfig({ ...config, groceries: { ...config.groceries, primaryColor: e.target.value } })}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Reordering */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                    <Layout className="w-3 h-3" /> Page Structure
                  </div>
                  <button 
                    onClick={() => setIsVisualSelect(!isVisualSelect)} 
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight ${isVisualSelect ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 text-gray-400"}`}
                  >
                    <MousePointer2 className="w-3.5 h-3.5" /> {isVisualSelect ? "On" : "Off"}
                  </button>
                </div>

                <Reorder.Group 
                  axis="y" 
                  values={config.groceries.layout} 
                  onReorder={(newLayout) => updateConfig({ ...config, groceries: { ...config.groceries, layout: newLayout } })}
                  className="space-y-2"
                >
                  {config.groceries.layout.map((section: any) => (
                    <Reorder.Item 
                      key={section.id} 
                      value={section}
                      id={`sidebar-section-${section.id}`}
                      className={`group rounded-xl border p-3 bg-white hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${activeSectionId === section.id ? "ring-2 ring-green-500 border-transparent shadow-lg" : "border-gray-100"}`}
                      onClick={() => {
                        setActiveSectionId(activeSectionId === section.id ? null : section.id);
                        highlightInPreview(section.id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                        <div className="flex-1">
                          <p className="text-[11px] font-black uppercase text-gray-400 tracking-wider mb-0.5">{section.type}</p>
                          <p className="text-xs font-bold text-gray-700 truncate">{section.title}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <AnimatePresence>
                        {activeSectionId === section.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pt-3 border-t mt-3 space-y-3"
                          >
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Title</label>
                              <input 
                                type="text"
                                value={section.title}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newLayout = config.groceries.layout.map((s: any) => s.id === section.id ? { ...s, title: e.target.value } : s);
                                  updateConfig({ ...config, groceries: { ...config.groceries, layout: newLayout } });
                                }}
                                className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs font-bold outline-none focus:bg-white focus:ring-2 ring-green-500/10"
                              />
                            </div>
                            {section.subtitle !== undefined && (
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtitle / Description</label>
                                <textarea 
                                  value={section.subtitle}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const newLayout = config.groceries.layout.map((s: any) => s.id === section.id ? { ...s, subtitle: e.target.value } : s);
                                    updateConfig({ ...config, groceries: { ...config.groceries, layout: newLayout } });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-gray-50 border rounded-lg text-xs font-medium min-h-[60px] resize-none outline-none focus:bg-white focus:ring-2 ring-green-500/10"
                                />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <div className="pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_TYPES.map((st) => (
                      <button 
                        key={st.type}
                        onClick={() => addSection(st.type)}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-gray-200 hover:border-green-500 hover:bg-green-50 group transition-all"
                      >
                        <st.icon className="w-4 h-4 text-gray-400 group-hover:text-green-600 mb-2" />
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-green-700">{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <Palette className="w-3 h-3" /> Delivery Theme
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Interface Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["black", "blue", "white"].map((t) => (
                        <button 
                          key={t}
                          onClick={() => updateConfig({ ...config, delivery: { ...config.delivery, theme: t } })}
                          className={`py-2 px-1 rounded-lg border text-[10px] font-black uppercase tracking-tight transition-all ${config.delivery.theme === t ? "bg-blue-600 text-white border-transparent" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Delivery Primary Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={config.delivery.primaryColor}
                        onChange={(e) => updateConfig({ ...config, delivery: { ...config.delivery, primaryColor: e.target.value } })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                      />
                      <input 
                        type="text" 
                        value={config.delivery.primaryColor}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex gap-3">
                  <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-xs font-black text-blue-900 mb-1">Partner App Controls</h3>
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">Changes here reflect on the driver app dashboard used by your delivery fleet.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-xl bg-white border text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-xl bg-white border text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-green-600/20 active:scale-95 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0a0a]">
        {/* Toolbar */}
        <div className="h-14 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Preview Server Active</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                <button 
                  onClick={() => setViewSize("mobile")}
                  className={`p-1.5 rounded-md transition-all ${viewSize === "mobile" ? "bg-white text-gray-900" : "text-white/40 hover:text-white"}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setViewSize("desktop")}
                  className={`p-1.5 rounded-md transition-all ${viewSize === "desktop" ? "bg-white text-gray-900" : "text-white/40 hover:text-white"}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <a 
               href={previewUrls[mode]} 
               target="_blank" 
               className="flex items-center gap-2 text-[10px] font-black text-white/60 hover:text-white transition-colors uppercase tracking-widest"
             >
               View Live <ExternalLink className="w-3 h-3" />
             </a>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex items-center gap-2 text-white/80">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono opacity-50 truncate max-w-[200px]">{previewUrls[mode]}</span>
             </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-12 overflow-hidden relative">
          {/* Background Grid Decoration */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
          />
          
          <motion.div 
            layout
            className={`bg-white shadow-[0_0_80px_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden border-8 border-[#1a1a1a] relative ${viewSize === "mobile" ? "w-[375px] h-[667px]" : "w-full h-full"}`}
          >
            {/* Phone Notch for mobile */}
            {viewSize === "mobile" && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1a1a] rounded-b-2xl z-50 flex items-center justify-center gap-2">
                <div className="w-8 h-1 bg-white/10 rounded-full" />
                <div className="w-1 h-1 bg-white/10 rounded-full" />
              </div>
            )}

            <iframe 
              ref={iframeRef}
              src={`${previewUrls[mode]}${mode === 'delivery' ? '' : '?editor=true'}`}
              className="w-full h-full border-none"
              title="App Preview"
            />

            {/* Visual Select Overlay */}
            {isVisualSelect && (
              <div className="absolute inset-0 bg-green-500/5 cursor-crosshair z-30 pointer-events-none flex items-center justify-center">
                <div className="px-4 py-2 bg-green-600 text-white rounded-full text-xs font-black shadow-xl animate-bounce">
                  Click to select element
                </div>
              </div>
            )}
          </motion.div>

          {/* Hint Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20">
             <Zap className="w-4 h-4 text-yellow-400" />
             <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
               {isVisualSelect ? "Visual Selection Enabled" : `Rendering Live View (0.1s latency)`}
             </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}
