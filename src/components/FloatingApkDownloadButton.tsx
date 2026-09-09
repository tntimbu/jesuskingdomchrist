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
  const [isOpenTooltip, setIsOpenTooltip] = useState(false);
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cms_apk_button_hidden') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleHiddenChange = (e: any) => {
      if (e?.detail?.hidden !== undefined) {
        setIsHidden(Boolean(e.detail.hidden));
      } else {
        try {
          setIsHidden(localStorage.getItem('cms_apk_button_hidden') === 'true');
        } catch {
          setIsHidden(false);
        }
      }
    };

    window.addEventListener('cms_apk_hidden_changed', handleHiddenChange);
    return () => {
      window.removeEventListener('cms_apk_hidden_changed', handleHiddenChange);
    };
  }, []);

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

  // Hidden if disabled by Admin in Settings OR hidden by user clicking (x)
  if (appSettings.show_apk_download_button === false || isHidden) {
    return null;
  }

  const downloadUrl = appSettings.apk_download_url || APK_DOWNLOAD_URL;

  const handleDownload = () => {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleHideFromDashboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHidden(true);
    try {
      localStorage.setItem('cms_apk_button_hidden', 'true');
      window.dispatchEvent(new CustomEvent('cms_apk_hidden_changed', { detail: { hidden: true } }));
    } catch (err) {
      // ignore
    }
  };

  return (
    <div
      id="floating-apk-container"
      className="fixed bottom-20 sm:bottom-24 lg:bottom-8 right-3 sm:right-6 z-[95] flex flex-col items-end gap-2 pointer-events-auto"
    >
      {/* Tooltip / Popup Info (Hanya jika dibuka) */}
      {isOpenTooltip && (
        <div className="relative p-3 max-w-[calc(100vw-2rem)] sm:max-w-xs rounded-2xl bg-slate-900/98 border-2 border-emerald-500 shadow-2xl text-white text-xs space-y-1.5 backdrop-blur-xl animate-fade-in ring-4 ring-emerald-500/20">
          <button
            onClick={() => setIsOpenTooltip(false)}
            className="absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Tutup Info"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 pr-5">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Aplikasi Android (.APK)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Pasang aplikasi resmi gereja di HP Android Anda untuk akses langsung, hemat kuota &amp; notifikasi instan.
          </p>
          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px]">
            <span className="text-emerald-300 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3" /> File Aman &amp; Terverifikasi
            </span>
            <button
              onClick={handleHideFromDashboard}
              className="text-slate-400 hover:text-rose-400 underline cursor-pointer text-[10px]"
              title="Sembunyikan dari dashboard"
            >
              Sembunyikan (x)
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Download Button with Tombol (X) untuk Menyembunyikan dari Dashboard */}
      <div className="relative flex items-center gap-1.5 animate-fade-in group">
        <button
          id="btn-floating-apk-download"
          onClick={handleDownload}
          className="relative px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-[0_8px_20px_-4px_rgba(16,185,129,0.6)] border-2 border-emerald-400/60 flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-emerald-500/20"
          title="Klik untuk Mengunduh Aplikasi Android (.APK)"
        >
          <div className="p-1.5 rounded-xl bg-white/20 text-white shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-100" />
          </div>
          
          {/* Teks terlihat jelas di HP Android maupun Desktop */}
          <div className="text-left leading-tight">
            <div className="text-[9px] sm:text-[10px] text-emerald-200 uppercase font-black tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
              <span>App Android</span>
            </div>
            <div className="text-[11px] sm:text-xs font-black text-white flex items-center gap-1">
              <span>Download APK</span>
            </div>
          </div>

          <div className="p-1 sm:p-1.5 rounded-xl bg-white text-emerald-800 shrink-0 shadow-md">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
          </div>
        </button>

        {/* Tombol (X) Khusus untuk Menyembunyikan dari Dashboard */}
        <button
          id="btn-hide-floating-apk"
          onClick={handleHideFromDashboard}
          className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/95 hover:bg-rose-600 text-slate-300 hover:text-white border-2 border-slate-700/90 hover:border-rose-500 shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shrink-0 flex items-center justify-center group/close"
          title="Sembunyikan Tombol Download APK dari Dashboard (x)"
          aria-label="Sembunyikan dari dashboard"
        >
          <X className="w-4 h-4 group-hover/close:rotate-90 transition-transform duration-200 text-slate-300 group-hover/close:text-white" />
        </button>
      </div>
    </div>
  );
};
