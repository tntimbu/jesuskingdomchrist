import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles, ShieldCheck } from 'lucide-react';
import { StorageManager } from '../utils/storage';
import { AppSettings } from '../types';

export const APK_DOWNLOAD_URL = 'https://drive.google.com/file/d/1TlnvPxgIPWQ13CE_EJnj4gUMAipCWy1s/view?usp=sharing';

interface FloatingApkDownloadButtonProps {
  settings?: AppSettings;
}

export const FloatingApkDownloadButton: React.FC<FloatingApkDownloadButtonProps> = ({ settings }) => {
  const [appSettings, setAppSettings] = useState<AppSettings>(() => settings || StorageManager.getSettings());
  const [isOpenTooltip, setIsOpenTooltip] = useState(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('cms_apk_button_dismissed') === 'true';
  });

  useEffect(() => {
    if (settings) {
      setAppSettings(settings);
    }
    const handleSync = () => {
      setAppSettings(StorageManager.getSettings());
    };
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [settings]);

  // Hidden if disabled by Admin or dismissed by user
  if (appSettings.show_apk_download_button === false || isDismissed) {
    return null;
  }

  const downloadUrl = appSettings.apk_download_url || APK_DOWNLOAD_URL;

  const handleDownload = () => {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDismissAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem('cms_apk_button_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 lg:bottom-8 right-4 sm:right-6 z-[90] flex flex-col items-end gap-2 group animate-bounce-subtle pointer-events-auto">
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
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 pr-5">
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
            <span className="text-amber-300 font-bold">Versi 2026</span>
          </div>
        </div>
      )}

      {/* Main Floating Download Button with Close Icon */}
      <div className="relative flex items-center gap-1">
        <button
          onClick={handleDownload}
          className="relative px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)] border-2 border-emerald-400/50 flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-500/20 group"
          title="Klik untuk Mengunduh Aplikasi Android (.APK)"
        >
          <div className="p-1.5 rounded-xl bg-white/20 text-white shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-[10px] text-emerald-200 uppercase font-black tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>App Mobile Android</span>
            </div>
            <div className="text-xs font-black text-white">Download APK</div>
          </div>
          <div className="p-1.5 rounded-xl bg-white text-emerald-800 shrink-0 shadow-md">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
          </div>
        </button>

        {/* Tombol Silang Menyembunyikan Widget APK */}
        <button
          onClick={handleDismissAll}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 shadow-xl transition-all cursor-pointer"
          title="Sembunyikan Tombol Download APK (Sudah Diinstal)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
