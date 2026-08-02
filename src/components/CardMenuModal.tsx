import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { NavTab } from './Sidebar';
import { menuModules } from '../data/navigationMenu';
import { X, Search, Grid, ArrowRight, Sparkles, Building2 } from 'lucide-react';

interface CardMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: AppSettings;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSuperAdminSaaSPanel?: () => void;
}

export const CardMenuModal: React.FC<CardMenuModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  activeTab,
  onSelectTab,
  onOpenSuperAdminSaaSPanel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Filter modules based on user role
  const availableModules = menuModules.filter((m) =>
    m.roles.includes(currentUser.role)
  );

  const categories = ['ALL', ...Array.from(new Set(availableModules.map((m) => m.category)))];

  const filteredModules = availableModules.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const customHexColor = settings.warna_tema || '#CD5C5C';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in text-white overflow-y-auto">
      <div className="w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-auto relative">
        {/* Header Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div
              className="p-3 rounded-2xl text-white shadow-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: customHexColor }}
            >
              <Grid className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                  Kartu Menu Utama Mewah
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {availableModules.length} Modul Aktif
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Pusat Navigasi &amp; Modul Pelayanan Gereja
              </h2>
              <p className="text-xs text-slate-400">
                Pilih kartu menu di bawah ini untuk berpindah modul secara instan dari perangkat manapun.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && onOpenSuperAdminSaaSPanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSuperAdminSaaSPanel();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">SuperAdmin SaaS</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kartu menu atau modul..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'text-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                style={
                  selectedCategory === cat
                    ? { backgroundColor: customHexColor }
                    : {}
                }
              >
                {cat === 'ALL' ? 'Semua Category' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Kartu Menu Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {filteredModules.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`p-5 rounded-2xl bg-gradient-to-br ${item.gradient} hover:scale-[1.02] active:scale-95 text-left transition-all duration-200 group cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4 border ${
                  isActive
                    ? 'ring-4 ring-white/50 border-white scale-[1.02]'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                        Aktif
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/20 uppercase tracking-wider">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 space-y-1">
                  <span className="text-[9px] font-extrabold text-white/80 uppercase tracking-widest block">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug flex items-center justify-between group-hover:text-amber-200 transition-colors">
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0 ml-2" />
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium leading-relaxed line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              Navigasi Berbasis Kartu Mewah — Multi-Device Connected &amp; Cloud Synchronized
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
