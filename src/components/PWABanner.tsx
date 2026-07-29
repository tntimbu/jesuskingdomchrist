import React from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface PWABannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWABanner: React.FC<PWABannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 border-b border-indigo-700/50 text-white px-4 py-3 flex items-center justify-between shadow-lg relative z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-indigo-300 animate-bounce" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold">Install Church Management System (CMS Pro)</h4>
          <p className="text-[11px] text-indigo-200">
            Akses offline lebih cepat, notifikasi push realtime, dan tampilan layaknya aplikasi Android/iOS native.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onInstall}
          className="px-3 py-1.5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 shadow-md flex items-center gap-1.5 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Sekarang</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
