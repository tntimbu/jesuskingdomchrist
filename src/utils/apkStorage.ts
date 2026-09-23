/**
 * APK Storage & Direct Downloader Manager
 * Menyediakan penyimpanan file APK mandiri langsung di Web (IndexedDB)
 * sehingga pengguna/jemaat bisa mengunduh dan menginstal aplikasi Android
 * secara langsung TANPA melalui Google Drive!
 */

export interface ApkMetadata {
  hasCustomApk: boolean;
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  uploadedAt: string;
  source: 'LOCAL_WEB' | 'CUSTOM_UPLOAD' | 'DIRECT_URL';
}

const DB_NAME = 'CMS_APK_STORAGE';
const STORE_NAME = 'apk_binaries';
const DB_VERSION = 1;
const STORAGE_META_KEY = 'cms_apk_current_metadata';
export const DEFAULT_BUILTIN_APK_PATH = '/downloads/church-app.apk';

/**
 * Inisialisasi koneksi IndexedDB
 */
function openApkDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Format bytes ke MB / KB
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Menyimpan file APK yang diunggah Admin langsung ke dalam web browser (IndexedDB)
 */
export async function saveUploadedApk(file: File): Promise<ApkMetadata> {
  if (!file) {
    throw new Error('File tidak valid.');
  }

  // Validasi ekstensi
  const isApk = file.name.toLowerCase().endsWith('.apk');
  if (!isApk) {
    throw new Error('Berkas harus berekstensi .apk (Contoh: app-release.apk)');
  }

  const db = await openApkDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id: 'active_apk',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/vnd.android.package-archive',
      uploadedAt: new Date().toISOString(),
      blob: file
    };

    const putRequest = store.put(record);

    putRequest.onsuccess = () => {
      const metadata: ApkMetadata = {
        hasCustomApk: true,
        fileName: file.name,
        fileSizeFormatted: formatBytes(file.size),
        fileSizeBytes: file.size,
        uploadedAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        source: 'CUSTOM_UPLOAD'
      };

      try {
        localStorage.setItem(STORAGE_META_KEY, JSON.stringify(metadata));
        window.dispatchEvent(new CustomEvent('cms_apk_updated', { detail: metadata }));
      } catch (e) {
        console.warn('Gagal menyimpan metadata ringkas APK ke localStorage', e);
      }

      resolve(metadata);
    };

    putRequest.onerror = () => {
      reject(putRequest.error || new Error('Gagal menyimpan berkas APK ke penyimpanan.'));
    };
  });
}

/**
 * Mengambil metadata file APK yang tersimpan saat ini
 */
export function getStoredApkMetadata(): ApkMetadata {
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.fileName) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    hasCustomApk: false,
    fileName: 'Aplikasi-Gereja-Mobile.apk',
    fileSizeFormatted: '15.2 MB',
    fileSizeBytes: 15200000,
    uploadedAt: 'Siap diunduh',
    source: 'LOCAL_WEB'
  };
}

/**
 * Menghapus file APK kustom dari penyimpanan lokal dan kembali ke bawaan
 */
export async function deleteUploadedApk(): Promise<void> {
  try {
    const db = await openApkDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete('active_apk');
  } catch (e) {
    console.warn('Gagal menghapus dari IndexedDB', e);
  }

  try {
    localStorage.removeItem(STORAGE_META_KEY);
    window.dispatchEvent(new CustomEvent('cms_apk_updated', { detail: null }));
  } catch (e) {
    // ignore
  }
}

/**
 * EKSEKUSI UTAMA: Mengunduh langsung file APK ke HP/Komputer pengguna
 * TANPA diarahkan ke Google Drive!
 */
export async function triggerDirectApkDownload(options?: {
  customUrl?: string;
  suggestedName?: string;
}): Promise<{ success: boolean; message: string }> {
  const fallbackFileName = options?.suggestedName || 'Aplikasi-Gereja-Mobile.apk';

  // 1. Coba ambil dari IndexedDB jika ada file custom yang diunggah admin
  try {
    const db = await openApkDatabase();
    const blobRecord = await new Promise<any>((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('active_apk');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (blobRecord && blobRecord.blob) {
      const blob = blobRecord.blob instanceof Blob 
        ? blobRecord.blob 
        : new Blob([blobRecord.blob], { type: 'application/vnd.android.package-archive' });
      
      const downloadName = blobRecord.fileName || fallbackFileName;
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = downloadName;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();

      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
      }, 5000);

      return {
        success: true,
        message: `Mengunduh ${downloadName}... Setelah selesai, ketuk notifikasi untuk menginstal.`
      };
    }
  } catch (err) {
    console.log('Tidak ada file APK di IndexedDB, beralih ke direct download web...', err);
  }

  // 2. Jika ada direct custom URL yang BUKAN Google Drive
  const customUrl = options?.customUrl?.trim();
  const isGoogleDrive = customUrl && (customUrl.includes('drive.google.com') || customUrl.includes('docs.google.com'));

  if (customUrl && !isGoogleDrive && (customUrl.startsWith('http://') || customUrl.startsWith('https://') || customUrl.startsWith('/'))) {
    const anchor = document.createElement('a');
    anchor.href = customUrl;
    anchor.download = fallbackFileName;
    anchor.target = '_self';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }, 2000);

    return {
      success: true,
      message: `Mengunduh berkas APK langsung... Setelah selesai, ketuk notifikasi untuk menginstal.`
    };
  }

  // 3. Gunakan file bawaan internal web (/downloads/church-app.apk)
  try {
    const anchor = document.createElement('a');
    anchor.href = DEFAULT_BUILTIN_APK_PATH;
    anchor.download = fallbackFileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor);
      }
    }, 2000);

    return {
      success: true,
      message: `Mengunduh berkas APK mandiri... Buka notifikasi HP Anda setelah selesai untuk memasang.`
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Gagal memulai unduhan: ${e?.message || 'Kesalahan browser'}`
    };
  }
}
