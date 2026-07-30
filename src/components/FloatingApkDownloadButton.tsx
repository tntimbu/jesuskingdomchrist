import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles, ShieldCheck } from 'lucide-react';

export const APK_DOWNLOAD_URL = 'https://drive.google.com/file/d/1TlnvPxgIPWQ13CE_EJnj4gUMAipCWy1s/view?usp=sharing';

export const FloatingApkDownloadButton: React.FC = () => {
  const [isOpenTooltip, setIsOpenTooltip] = useState(true);

  const handleDownload = () => {
    window.open(APK_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col items-end gap-2 group animate-bounce-subtle">
      {/* Tooltip / Popup Info */}
      {isOpenTooltip && (
        <div className="relative p-3 max-w-xs rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 shadow-2xl text-white text-xs space-y-1.5 backdrop-blur-xl animate-fade-in ring-4 ring-emerald-500/20">
          <button
            onClick={() => setIsOpenTooltip(false)}
            className="absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Download App Android (.APK)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Instal aplikasi resmi gereja di HP Android Anda untuk akses cepat &amp; notifikasi realtime.
          </p>
          <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-emerald-300 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3" /> File Aman &amp; Terverifikasi
            </span>
            <span className="text-amber-300 font-bold">Terbaru 2026</span>
          </div>
        </div>
      )}

      {/* Main Floating Download Button */}
      <button
        onClick={handleDownload}
        className="relative px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)] border-2 border-emerald-400/50 flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-500/20 group"
        title="Klik untuk Mengunduh Aplikasi Android (.APK)"
      >
        <div className="p-1.5 rounded-xl bg-white/20 text-white shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
          <Smartphone className="w-5 h-5 text-emerald-100" />
        </div>
        <div className="text-left leading-tight hidden sm:block">
          <div className="text-[10px] text-emerald-200 uppercase font-black tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>App Mobile Android</span>
          </div>
          <div className="text-xs font-black text-white">Download APK</div>
        </div>
        <div className="p-1.5 rounded-xl bg-white text-emerald-800 shrink-0 shadow-md">
          <Download className="w-4 h-4 animate-pulse" />
        </div>
      </button>
    </div>
  );
};
