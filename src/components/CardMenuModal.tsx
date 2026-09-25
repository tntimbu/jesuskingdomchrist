import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { NavTab } from './Sidebar';
import { menuModules } from '../data/navigationMenu';
import { X, Search, Grid, ArrowRight, Sparkles, Building2, Palette, Smartphone, Download } from 'lucide-react';
import { downloadGoogleServicesJsonFile } from '../utils/googleServicesHelper';

interface CardMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: AppSettings;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSuperAdminSaaSPanel?: () => void;
  onOpenNavbarCustomizer?: () => void;
  onOpenAndroidStudioModal?: () => void;
}

export const CardMenuModal: React.FC<CardMenuModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  activeTab,
  onSelectTab,
  onOpenSuperAdminSaaSPanel,
  onOpenNavbarCustomizer,
  onOpenAndroidStudioModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

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

  const customHexColor = settings.warna_tema || '#059669';
  const isLightSystem = settings.theme_preset === 'EMERALD_LIGHT' || settings.theme_preset === 'LUXE_LIGHT';

  // Dynamic Theme Preset Style Classes matching Dashboard
  const getCardStyleClass = () => {
    const cardBg = settings.jemaat_cards_bg || 'DEFAULT_GLASS';
    const cardStyle = settings.card_style || 'GLASS';

    let base = isLightSystem
      ? 'bg-white border border-slate-200/90 shadow-xs hover:shadow-md text-slate-800'
      : 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl text-white';

    if (cardBg && cardBg !== 'DEFAULT_GLASS') {
      switch (cardBg) {
        case 'GRADIENT_INDIGO':
          base = 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/40 shadow-xl shadow-indigo-950/30 backdrop-blur-xl';
          break;
        case 'GRADIENT_PURPLE':
          base = 'bg-gradient-to-br from-purple-950/90 via-slate-900 to-purple-950/90 border border-purple-500/40 shadow-xl shadow-purple-950/30 backdrop-blur-xl';
          break;
        case 'GRADIENT_GOLD':
          base = 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/40 shadow-xl shadow-amber-950/30 backdrop-blur-xl';
          break;
        case 'GRADIENT_EMERALD':
          base = 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/40 shadow-xl shadow-emerald-950/30 backdrop-blur-xl';
          break;
        case 'OBSIDIAN_NIGHT':
          base = 'bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 border border-slate-700/80 shadow-2xl backdrop-blur-xl';
          break;
        case 'OCEAN_BLUE':
          base = 'bg-gradient-to-br from-blue-950/90 via-slate-900 to-cyan-950/90 border border-cyan-500/40 shadow-xl shadow-cyan-950/30 backdrop-blur-xl';
          break;
        case 'SOLID_SLATE':
          base = 'bg-slate-900 border border-slate-800 shadow-xl';
          break;
        case 'NEON_CYAN':
          base = 'bg-cyan-950/50 border border-cyan-400/50 shadow-lg shadow-cyan-500/20 backdrop-blur-xl';
          break;
        default:
          base = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
          break;
      }
    } else {
      switch (cardStyle) {
        case 'SOLID':
          base = 'bg-slate-900 border border-slate-800 shadow-xl';
          break;
        case 'NEON':
          base = 'bg-slate-900/90 border border-indigo-500/40 shadow-lg shadow-indigo-500/10 backdrop-blur-xl';
          break;
        case 'FLAT':
          base = 'bg-slate-900/60 border border-slate-700/60 shadow-none';
          break;
        case 'GLASS':
        default:
          base = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
          break;
      }
    }

    return base;
  };

  const cardStyleClass = getCardStyleClass();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in text-white overflow-y-auto">
      <div className="w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl space-y-4 sm:space-y-6 my-auto max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden relative">
        {/* Header Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
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
            {isAdmin && onOpenNavbarCustomizer && (
              <button
                onClick={() => {
                  onClose();
                  onOpenNavbarCustomizer();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-black shadow-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                title="Kustomisasi Warna & Tema Navbar (Khusus Admin)"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Kustom Warna Navbar</span>
                <span className="sm:hidden">Warna Navbar</span>
              </button>
            )}

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

            {isAdmin && (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAndroidStudioModal) {
                    onOpenAndroidStudioModal();
                  } else {
                    window.dispatchEvent(new CustomEvent('open_android_studio_modal'));
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                title="Konversi Android Studio & Download google-services.json"
              >
                <Smartphone className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">📱 Android Studio &amp; FCM</span>
                <span className="sm:hidden">Android</span>
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
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
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                }`}
                style={
                  selectedCategory === cat
                    ? { backgroundColor: customHexColor }
                    : {}
                }
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Spesial: Konversi Android Studio & FCM (Khusus Admin) */}
        {isAdmin && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/80 border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">📱 Konversi Android Studio &amp; Firebase FCM</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Resmi
                  </span>
                </div>
                <p className="text-slate-300 text-xs mt-0.5">
                  Target: <strong className="text-amber-300 font-mono">https://tntimbu.github.io/jesuskingdomchrist/</strong> &bull; Dapatkan file <code className="bg-slate-950 text-amber-300 px-1 py-0.2 rounded font-mono">google-services.json</code> &amp; kode Java lengkap.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  downloadGoogleServicesJsonFile(settings.firebase_package_name || settings.android_package_name || 'com.jesuskingdomchrist.app', settings);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 flex-1 sm:flex-initial"
                title="Download google-services.json"
              >
                <Download className="w-3.5 h-3.5" />
                <span>📥 Download .json</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenAndroidStudioModal) {
                    onOpenAndroidStudioModal();
                  } else {
                    window.dispatchEvent(new CustomEvent('open_android_studio_modal'));
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 flex-1 sm:flex-initial"
              >
                <span>Buka Generator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Grid Kartu Menu Utama - Selaras dengan Tema Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto pr-1 flex-1">
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
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} hover:border-indigo-500/50 hover:bg-white/10 active:scale-95 text-left transition-all duration-200 group cursor-pointer shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3 sm:space-y-4 border ${
                  isActive
                    ? 'ring-2 ring-indigo-400 border-indigo-400 shadow-indigo-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:bg-indigo-500/30 group-hover:text-indigo-300 group-hover:border-indigo-400/50 shadow-md group-hover:scale-105 transition-all">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 group-hover:text-indigo-300" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                        Aktif
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-extrabold border border-indigo-500/30 uppercase tracking-wider">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 space-y-1">
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug flex items-center justify-between group-hover:text-indigo-300 transition-colors">
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all shrink-0 ml-2" />
                  </h3>
                  <p className="text-xs text-slate-400 group-hover:text-slate-300 font-normal leading-relaxed line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] sm:text-xs">
              Navigasi Terpadu Berbasis Tema Dashboard — Multi-Device Connected &amp; Cloud Synchronized
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
