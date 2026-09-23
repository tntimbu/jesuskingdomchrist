import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  UploadCloud, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  FileCode2, 
  FolderCheck,
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  saveUploadedApk, 
  getStoredApkMetadata, 
  deleteUploadedApk, 
  triggerDirectApkDownload,
  ApkMetadata,
  formatBytes,
  DEFAULT_BUILTIN_APK_PATH
} from '../utils/apkStorage';

interface ApkUploadSectionProps {
  onSuccess?: () => void;
}

export const ApkUploadSection: React.FC<ApkUploadSectionProps> = ({ onSuccess }) => {
  const [metadata, setMetadata] = useState<ApkMetadata>(getStoredApkMetadata());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [isTestingDownload, setIsTestingDownload] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setMetadata(getStoredApkMetadata());
    };
    window.addEventListener('cms_apk_updated', handleUpdate);
    return () => window.removeEventListener('cms_apk_updated', handleUpdate);
  }, []);

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.apk')) {
      setFeedback({
        type: 'error',
        text: 'Berkas harus berekstensi .apk (Contoh: app-debug.apk atau app-release.apk)'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);
    setFeedback(null);

    try {
      // Simulasi progress bar upload yang mulus
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 80);

      const savedMeta = await saveUploadedApk(file);
      clearInterval(interval);
      setUploadProgress(100);

      setMetadata(savedMeta);
      setFeedback({
        type: 'success',
        text: `Berhasil! File ${file.name} (${formatBytes(file.size)}) telah tersimpan langsung di web ini. Pengunjung sekarang akan mengunduh file ini secara langsung tanpa Google Drive!`
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Gagal menyimpan file APK.'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleTestDownload = async () => {
    setIsTestingDownload(true);
    try {
      const res = await triggerDirectApkDownload({
        suggestedName: metadata.fileName || 'Aplikasi-Gereja.apk'
      });
      setFeedback({
        type: 'success',
        text: res.message
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        text: 'Gagal mengunduh: ' + (e?.message || 'Error')
      });
    } finally {
      setIsTestingDownload(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus file APK kustom ini dan kembali ke file bawaan web?')) {
      await deleteUploadedApk();
      setMetadata(getStoredApkMetadata());
      setFeedback({
        type: 'success',
        text: 'File APK kustom dihapus. Menggunakan file default internal.'
      });
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/95 border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl space-y-5 text-white backdrop-blur-xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Hosting File APK Mandiri (Direct Install)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Tanpa Google Drive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tempatkan file APK hasil build Android Studio Anda langsung di web ini. Ketika jemaat mengklik tombol melayang, file otomatis terunduh ke HP mereka untuk langsung dipasang.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>{showGuide ? 'Tutup Panduan' : 'Lokasi File APK di Android Studio'}</span>
        </button>
      </div>

      {/* Guide Box (Jika dibuka) */}
      {showGuide && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 text-xs space-y-2 animate-fade-in">
          <div className="font-bold text-indigo-400 flex items-center gap-1.5">
            <FolderCheck className="w-4 h-4" />
            <span>Di Mana Letak File APK Hasil Build Android Studio?</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Setelah Anda klik menu <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> di Android Studio:
          </p>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all select-all">
            C:\Users\tntim\AndroidStudioProjects\CMSApp2\app\build\outputs\apk\debug\app-debug.apk
          </div>
          <p className="text-slate-400 text-[11px]">
            💡 <em>Tips:</em> Klik notifikasi <strong>"locate"</strong> di sudut kanan bawah Android Studio sesaat setelah build selesai, maka folder tempat file <strong>app-debug.apk</strong> akan langsung terbuka di Windows Explorer. Cukup tarik (drag &amp; drop) file itu ke kotak di bawah ini!
          </p>
        </div>
      )}

      {/* Status File APK Aktif Saat Ini */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white">{metadata.fileName}</span>
              {metadata.hasCustomApk ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  File Kustom Anda
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  File Bawaan Web
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Ukuran: <strong className="text-emerald-400">{metadata.fileSizeFormatted}</strong></span>
              <span>•</span>
              <span>Diperbarui: {metadata.uploadedAt}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Siap Unduh Langsung
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleTestDownload}
            disabled={isTestingDownload}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span>{isTestingDownload ? 'Mengunduh...' : 'Tes Direct Download'}</span>
          </button>

          {metadata.hasCustomApk && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
              title="Hapus file custom dan kembali ke file default"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Area Drag & Drop / Pilih File */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <div className="font-bold text-sm sm:text-base text-white">
            Tarik &amp; Lepaskan File APK ke Sini, atau <span className="text-emerald-400 underline">Klik untuk Memilih File</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mendukung file APK hasil build Android Studio (Maksimal ukuran 150 MB).
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>File disimpan langsung di penyimpanan aplikasi &amp; siap diunduh otomatis tanpa pihak ketiga</span>
        </div>
      </div>

      {/* Progress Bar Upload */}
      {isUploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Menyimpan file APK ke web...</span>
            <span className="text-emerald-400 font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          )}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}
    </div>
  );
};
