import React from 'react';
import { Smartphone, Download, CheckCircle2, ShieldCheck, Zap, X, MoreVertical, Chrome, Apple, Sparkles } from 'lucide-react';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectInstall?: () => void;
  canDirectInstall?: boolean;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
  onDirectInstall,
  canDirectInstall
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        id="pwa-install-guide-modal"
        className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-950/80 text-white overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-inner">
              <Smartphone className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> PWA Standalone Ready
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Pasang Aplikasi ke Layar HP Android
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs sm:text-sm">
          {/* Quick Direct Install CTA if supported by browser */}
          {canDirectInstall && onDirectInstall && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-2 border-emerald-500/60 text-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Browser Anda Siap Menginstal Langsung!</span>
                </div>
                <p className="text-xs text-emerald-300/90 leading-snug">
                  Klik tombol di samping untuk memunculkan dialog resmi instalasi Google Chrome.
                </p>
              </div>
              <button
                onClick={() => {
                  onDirectInstall();
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Instal Sekarang</span>
              </button>
            </div>
          )}

          {/* Guide 1: Chrome Android 3 Dots */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-black">
              <Chrome className="w-4 h-4 text-amber-400" />
              <span>Cara Instal Lewat Titik Tiga (⋮) Google Chrome:</span>
            </div>

            <ol className="space-y-2.5 pl-1 text-slate-300 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-black flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                  1
                </span>
                <div className="leading-relaxed">
                  Buka website gereja ini di browser <strong className="text-white">Google Chrome</strong> di HP Android Anda.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-black flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                  2
                </span>
                <div className="leading-relaxed">
                  Ketuk ikon <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-bold text-amber-300"><MoreVertical className="w-3.5 h-3.5 inline" /> Titik Tiga</span> di pojok kanan atas layar browser Chrome.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-black flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                  3
                </span>
                <div className="leading-relaxed">
                  Pilih menu <strong className="text-emerald-400">"Instal aplikasi"</strong> atau <strong className="text-emerald-400">"Tambahkan ke Layar Utama"</strong> (<em>Add to Home screen</em>).
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-black flex items-center justify-center shrink-0 text-xs border border-indigo-500/30">
                  4
                </span>
                <div className="leading-relaxed">
                  Konfirmasi dengan menekan tombol <strong className="text-white">"Instal"</strong>.
                </div>
              </li>
            </ol>
          </div>

          {/* Guide 2: iOS Safari */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-300 font-black text-xs sm:text-sm">
              <Apple className="w-4 h-4 text-slate-200" />
              <span>Untuk Pengguna Apple iPhone / iPad (Safari):</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-6">
              Buka di browser Safari, ketuk tombol <strong>Share</strong> (kotak dengan panah ke atas) di menu bawah, lalu geser ke bawah dan pilih <strong>"Tambahkan ke Layar Utama"</strong> (<em>Add to Home Screen</em>).
            </p>
          </div>

          {/* PWA Features Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white">Akses Instan & Offline</div>
                <div className="text-[11px] text-slate-400 leading-tight">Service Worker menyimpan modul utama secara otomatis.</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white">Display Standalone</div>
                <div className="text-[11px] text-slate-400 leading-tight">Layar penuh native tanpa gangguan address bar browser.</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-white">Aman & Terenkripsi</div>
                <div className="text-[11px] text-slate-400 leading-tight">Berjalan di atas protokol HTTPS yang terverifikasi.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
