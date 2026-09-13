import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { StorageManager } from '../utils/storage';
import { getNavbarTheme, isColorLight } from '../utils/themeHelper';
import { DEFAULT_CHURCH_LOGO } from '../data/initialData';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Sun,
  Moon,
  ExternalLink,
  Layers,
  Eye,
  X
} from 'lucide-react';

interface NavbarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onNavigateToSettings?: () => void;
}

const NAVBAR_PRESETS = [
  {
    id: 'DEFAULT_DARK',
    name: 'Dark Slate',
    desc: 'Default elegan transparan',
    previewBg: 'bg-slate-950',
    border: 'border-slate-800'
  },
  {
    id: 'MATCH_THEME',
    name: 'Sesuai Tema Gereja',
    desc: 'Mengikuti warna tema gereja',
    previewBg: 'bg-gradient-to-r from-rose-900 to-slate-900',
    border: 'border-rose-500/50'
  },
  {
    id: 'MIDNIGHT_BLUE',
    name: 'Midnight Blue',
    desc: 'Biru laut dalam berwibawa',
    previewBg: 'bg-[#060c1d]',
    border: 'border-blue-500/40'
  },
  {
    id: 'DEEP_PURPLE',
    name: 'Deep Amethyst',
    desc: 'Ungu royal megah',
    previewBg: 'bg-[#120520]',
    border: 'border-purple-500/40'
  },
  {
    id: 'EMERALD_GREEN',
    name: 'Forest Emerald',
    desc: 'Hijau zamrud teduh',
    previewBg: 'bg-[#031a0e]',
    border: 'border-emerald-500/40'
  },
  {
    id: 'CRIMSON_RED',
    name: 'Crimson Burgundy',
    desc: 'Merah marun anggun',
    previewBg: 'bg-[#20050b]',
    border: 'border-rose-500/40'
  },
  {
    id: 'WARM_GOLD',
    name: 'Warm Gold Luxe',
    desc: 'Emas hangat berkelas',
    previewBg: 'bg-[#1c1202]',
    border: 'border-amber-500/40'
  },
  {
    id: 'PURE_BLACK',
    name: 'Pure Obsidian',
    desc: 'Hitam pekat sejati OLED',
    previewBg: 'bg-black',
    border: 'border-neutral-800'
  },
  {
    id: 'CLEAN_LIGHT',
    name: 'Luxe Clean Light',
    desc: 'Putih terang minimalis',
    previewBg: 'bg-white text-slate-900',
    border: 'border-slate-300'
  },
  {
    id: 'CUSTOM_HEX',
    name: 'Kustom Warna Hex',
    desc: 'Bebas pilih kode warna apa saja',
    previewBg: 'bg-gradient-to-r from-indigo-900 to-purple-900',
    border: 'border-indigo-400'
  }
];

const QUICK_SWATCHES = [
  { name: 'Obsidian OLED', hex: '#000000' },
  { name: 'Slate 950', hex: '#020617' },
  { name: 'Navy Midnight', hex: '#0f172a' },
  { name: 'Deep Indigo', hex: '#1e1b4b' },
  { name: 'Royal Purple', hex: '#3b0764' },
  { name: 'Deep Teal', hex: '#042f2e' },
  { name: 'Forest Green', hex: '#052e16' },
  { name: 'Crimson Wine', hex: '#4c0519' },
  { name: 'Dark Amber', hex: '#451a03' },
  { name: 'Charcoal', hex: '#18181b' },
  { name: 'Terracotta', hex: '#CD5C5C' },
  { name: 'Clean White', hex: '#ffffff' }
];

export const NavbarCustomizerModal: React.FC<NavbarCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onNavigateToSettings
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(settings);
      setSavedSuccess(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const currentNavbarTheme = getNavbarTheme(form);

  const applyChange = (updated: AppSettings) => {
    setForm(updated);
    onUpdateSettings(updated);
    StorageManager.saveSettings(updated);
  };

  const handleSelectPreset = (presetId: string) => {
    const updated: AppSettings = {
      ...form,
      navbar_theme_preset: presetId as any
    };
    applyChange(updated);
  };

  const handleCustomColorChange = (hex: string) => {
    const updated: AppSettings = {
      ...form,
      navbar_theme_preset: 'CUSTOM_HEX',
      navbar_custom_bg: hex
    };
    applyChange(updated);
  };

  const handleStyleChange = (style: 'GLASS' | 'SOLID' | 'GRADIENT') => {
    const updated: AppSettings = {
      ...form,
      navbar_style: style
    };
    applyChange(updated);
  };

  const handleBorderChange = (border: 'NONE' | 'THEME_COLOR' | 'SUBTLE' | 'GLOW') => {
    const updated: AppSettings = {
      ...form,
      navbar_border_accent: border
    };
    applyChange(updated);
  };

  const handleTextContrastChange = (contrast: 'AUTO' | 'WHITE' | 'DARK' | 'GOLD') => {
    const updated: AppSettings = {
      ...form,
      navbar_custom_text: contrast
    };
    applyChange(updated);
  };

  const handleResetToDefault = () => {
    const updated: AppSettings = {
      ...form,
      navbar_theme_preset: 'DEFAULT_DARK',
      navbar_custom_bg: '#1e293b',
      navbar_custom_text: 'AUTO',
      navbar_style: 'GLASS',
      navbar_border_accent: 'SUBTLE'
    };
    applyChange(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 text-white shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Kustomisasi Warna & Tema Navbar</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Admin Pro
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pilih tema warna, gaya transparansi, dan garis aksen bar navigasi atas secara instan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Live Mini Preview Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Pratinjau Langsung Navbar</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">
                {savedSuccess ? 'Tersimpan!' : 'Live Interactive'}
              </span>
            </div>
            <div
              className={`w-full rounded-2xl p-3 sm:p-4 transition-all duration-300 border flex items-center justify-between ${currentNavbarTheme.containerClass} ${currentNavbarTheme.borderBottomClass} shadow-xl`}
              style={{
                ...currentNavbarTheme.containerStyle,
                ...currentNavbarTheme.borderBottomStyle
              }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-xl text-white font-black text-[11px] shadow flex items-center gap-1.5 shrink-0"
                  style={currentNavbarTheme.menuBtnStyle}
                >
                  <span>Kartu Menu</span>
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={form.logo || DEFAULT_CHURCH_LOGO}
                    alt="Logo"
                    className="w-7 h-7 rounded-lg object-cover border border-white/20 shrink-0"
                  />
                  <div className="truncate">
                    <p className={`text-xs font-extrabold truncate ${currentNavbarTheme.titleClass}`}>
                      {form.nama_gereja || 'Gereja Kemenangan'}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-amber-400 font-bold leading-none">
                      Enterprise CMS Pro
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold ${currentNavbarTheme.pillClass}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>09:41 WIB • Real-Time Cloud</span>
                </div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    currentNavbarTheme.isLight ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'
                  }`}
                >
                  AD
                </div>
              </div>
            </div>
          </div>

          {/* Preset Theme Selection */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-bold text-amber-300">
              1. Pilih Preset Warna Tema Navbar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {NAVBAR_PRESETS.map((p) => {
                const isSelected = (form.navbar_theme_preset || 'DEFAULT_DARK') === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg scale-[1.02] bg-slate-800'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/70 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`w-4 h-4 rounded-full border border-white/20 shadow-inner ${p.previewBg}`}
                      />
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Color Picker (Always available, highlights when CUSTOM_HEX) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>2. Kustom Warna Hex Navbar Khusus (Bebas)</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Ketik kode warna hex apa saja atau gunakan pemilih warna visual.
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-md shrink-0 flex items-center justify-center font-mono text-[9px] text-white font-bold"
                style={{ backgroundColor: form.navbar_custom_bg || '#1e293b' }}
              >
                {form.navbar_custom_bg || '#1e293b'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">
                  HEX:
                </span>
                <input
                  type="text"
                  value={form.navbar_custom_bg || '#1e293b'}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#1e293b"
                  className="w-full pl-14 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs focus:ring-2 focus:ring-amber-400 outline-none uppercase"
                />
              </div>

              <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-200 shrink-0">
                <input
                  type="color"
                  value={
                    form.navbar_custom_bg && /^#[0-9A-F]{6}$/i.test(form.navbar_custom_bg)
                      ? form.navbar_custom_bg
                      : '#1e293b'
                  }
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
                <span>Pilih Visual</span>
              </label>
            </div>

            {/* Quick Palette Swatches */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                Rekomendasi Warna Navbar Populer:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SWATCHES.map((chip) => {
                  const isActive =
                    form.navbar_theme_preset === 'CUSTOM_HEX' &&
                    (form.navbar_custom_bg || '').toUpperCase() === chip.hex.toUpperCase();
                  return (
                    <button
                      key={chip.hex}
                      type="button"
                      onClick={() => handleCustomColorChange(chip.hex)}
                      className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'border-amber-400 text-white bg-slate-800 ring-2 ring-amber-400/40'
                          : 'border-slate-800 text-slate-300 hover:border-slate-600 bg-slate-900/90'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: chip.hex }}
                      />
                      <span>{chip.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Style & Transparansi Navbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>3. Gaya &amp; Transparansi Navbar</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'GLASS', label: '✨ Glass Blur', desc: 'Transparan' },
                  { id: 'SOLID', label: '⬛ Solid', desc: 'Pekat Tanpa Blur' },
                  { id: 'GRADIENT', label: '🌈 Gradient', desc: 'Gradasi Halus' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStyleChange(s.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      (form.navbar_style || 'GLASS') === s.id
                        ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold ring-2 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-[11px] font-bold">{s.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Garis Bawah Aksen (Border Accent) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Garis Bawah Aksen Navbar</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'SUBTLE', label: '➖ Garis Halus', desc: 'Standar Elegan' },
                  { id: 'THEME_COLOR', label: '🔲 Warna Tema', desc: 'Aksen Garis Tema' },
                  { id: 'GLOW', label: '✨ Glowing Glow', desc: 'Cahaya Neon Menawan' },
                  { id: 'NONE', label: '✖️ Tanpa Garis', desc: 'Menyatu Bersih' }
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleBorderChange(b.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      (form.navbar_border_accent || 'SUBTLE') === b.id
                        ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold ring-2 ring-indigo-500/30'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-[11px] font-bold truncate">{b.label}</p>
                    <p className="text-[9px] text-slate-500 truncate mt-0.5">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pilihan Kontras Teks */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>5. Kontras Warna Teks &amp; Icon Navbar</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'AUTO', label: '⚡ Otomatis Pintar', desc: 'Deteksi kecerahan' },
                { id: 'WHITE', label: '⚪ Selalu Putih', desc: 'Teks putih terang' },
                { id: 'DARK', label: '⚫ Selalu Gelap', desc: 'Teks abu pekat/hitam' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTextContrastChange(t.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    (form.navbar_custom_text || 'AUTO') === t.id
                      ? 'border-amber-400 bg-amber-500/15 text-white font-bold ring-2 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="text-[11px] font-bold">{t.label}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default Navbar</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {onNavigateToSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToSettings();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Pengaturan Lengkap</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Selesai &amp; Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
