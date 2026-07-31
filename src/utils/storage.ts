import {
  User,
  Jemaat,
  Keluarga,
  Wilayah,
  Pelayanan,
  Baptisan,
  Sidi,
  Pernikahan,
  Persembahan,
  Donasi,
  KasPengeluaran,
  Doa,
  Pengumuman,
  Renungan,
  EventSchedule,
  GalleryItem,
  NotificationItem,
  AppSettings,
  ActivityLog,
  LoginHistory,
  PrayerRequest,
  FeaturedVideo,
  EventReservation
} from '../types';

import {
  initialSettings,
  initialUsers,
  initialJemaat,
  initialKeluarga,
  initialWilayah,
  initialPelayanan,
  initialBaptisan,
  initialSidi,
  initialPernikahan,
  initialPersembahan,
  initialDonasi,
  initialPengumuman,
  initialRenungan,
  initialEvents,
  initialGallery,
  initialNotifications,
  initialActivityLogs,
  initialLoginHistory,
  initialPrayerRequests,
  initialFeaturedVideos
} from '../data/initialData';

import { pushToCloud, initRealtimeCloudSync } from './firebaseSync';

const KEYS = {
  SETTINGS: 'cms_pro_settings',
  USERS: 'cms_pro_users',
  JEMAAT: 'cms_pro_jemaat',
  KELUARGA: 'cms_pro_keluarga',
  WILAYAH: 'cms_pro_wilayah',
  PELAYANAN: 'cms_pro_pelayanan',
  BAPTISAN: 'cms_pro_baptisan',
  SIDI: 'cms_pro_sidi',
  PERNIKAHAN: 'cms_pro_pernikahan',
  PERSEMBAHAN: 'cms_pro_persembahan',
  DONASI: 'cms_pro_donasi',
  KAS_PENGELUARAN: 'cms_pro_kas_pengeluaran',
  DOA: 'cms_pro_doa',
  PENGUMUMAN: 'cms_pro_pengumuman',
  RENUNGAN: 'cms_pro_renungan',
  EVENTS: 'cms_pro_events',
  GALLERY: 'cms_pro_gallery',
  FEATURED_VIDEOS: 'cms_pro_featured_videos',
  NOTIFICATIONS: 'cms_pro_notifications',
  ACTIVITY_LOGS: 'cms_pro_activity_logs',
  LOGIN_HISTORY: 'cms_pro_login_history',
  PRAYER_REQUESTS: 'cms_pro_prayer_requests',
  EVENT_RESERVATIONS: 'cms_pro_event_reservations',
  CURRENT_USER: 'cms_pro_current_user'
};

const defaultKas: KasPengeluaran[] = [
  {
    kas_id: 'KAS-2026-001',
    tanggal: '2026-07-26',
    kategori: 'Biaya Operasional & Listrik',
    jumlah: 3250000,
    tipe: 'Pengeluaran',
    keterangan: 'Pembayaran Rekening PLN & AC Gedung Utama',
    pic: 'Dkn. Samuel Santoso'
  },
  {
    kas_id: 'KAS-2026-002',
    tanggal: '2026-07-20',
    kategori: 'Maintenance Sound System',
    jumlah: 1850000,
    tipe: 'Pengeluaran',
    keterangan: 'Perbaikan Mixer Digital Yamaha & Kabel Stage',
    pic: 'Ev. Joshua Tan'
  }
];

const defaultDoa: Doa[] = [
  {
    doa_id: 'DOA-2026-001',
    nama_pemohon: 'Bpk. Yohanes Pratama',
    kategori: 'Kesehatan & Kesembuhan',
    isi_permohonan: 'Mohon dukungan doa untuk pemulihan kesehatan Ibu Ruth pasca operasi.',
    tanggal: '2026-07-27',
    status: 'Proses Doa'
  },
  {
    doa_id: 'DOA-2026-002',
    nama_pemohon: 'Daniel Pratama',
    kategori: 'Pekerjaan & Usaha',
    isi_permohonan: 'Mohon hikmat Tuhan dalam sidang skripsi akhir bulan ini.',
    tanggal: '2026-07-25',
    status: 'Dijawab'
  }
];

function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

// Realtime synchronization channel & pub/sub listeners for instant sync
type StorageListener = () => void;
const internalListeners = new Set<StorageListener>();

function notifyStorageListeners() {
  internalListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in storage listener:', e);
    }
  });
}

let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('cms_realtime_sync_channel');
    syncChannel.onmessage = (event) => {
      if (typeof window !== 'undefined') {
        notifyStorageListeners();
        window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: event.data }));
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel initialization fallback:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('cms_pro_')) {
      notifyStorageListeners();
      window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { key: e.key } }));
    }
  });
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      const payload = { key, timestamp: Date.now() };
      notifyStorageListeners();
      window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: payload }));
      if (syncChannel) {
        try {
          syncChannel.postMessage(payload);
        } catch (err) {
          // ignore
        }
      }
      // Push to Firebase Firestore for cross-device real-time sync
      pushToCloud(key, value);
    }
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

// Auto-start real-time cloud synchronization across devices
if (typeof window !== 'undefined') {
  initRealtimeCloudSync(() => {
    notifyStorageListeners();
  });
}

export const StorageManager = {
  subscribe: (listener: StorageListener): (() => void) => {
    internalListeners.add(listener);
    return () => {
      internalListeners.delete(listener);
    };
  },
  getSettings: (): AppSettings => {
    const saved = getItem<AppSettings>(KEYS.SETTINGS, initialSettings);
    const settings = { ...initialSettings, ...saved };
    if (settings.video_url && settings.video_url.includes('5qap5aO4i9A')) {
      settings.video_url = 'https://www.youtube.com/watch?v=wX2S6AebnI8';
    }
    return settings;
  },
  saveSettings: (settings: AppSettings): void => setItem(KEYS.SETTINGS, settings),

  getUsers: (): User[] => {
    const list = getItem<User[]>(KEYS.USERS, initialUsers);
    const hasSuperAdmin = list.some((u) => u.role === 'SUPER_ADMIN' || u.username.toLowerCase() === 'superadmin');
    if (!hasSuperAdmin) {
      const merged = [initialUsers[0], initialUsers[1], ...list];
      setItem(KEYS.USERS, merged);
      return merged;
    }
    return list;
  },
  saveUsers: (users: User[]): void => {
    setItem(KEYS.USERS, users);
    const current = getItem<User | null>(KEYS.CURRENT_USER, null);
    if (current) {
      const fresh = users.find(
        (u) => u.user_id === current.user_id || u.username.toLowerCase() === current.username.toLowerCase()
      );
      if (fresh) {
        setItem(KEYS.CURRENT_USER, { ...current, ...fresh });
      }
    }
    window.dispatchEvent(new Event('cms_data_changed'));
  },
  resetAdminAccounts: (): void => {
    const currentUsers = getItem<User[]>(KEYS.USERS, initialUsers);
    const nonAdmins = currentUsers.filter((u) => u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN');
    const resetList = [initialUsers[0], initialUsers[1], ...nonAdmins];
    setItem(KEYS.USERS, resetList);
  },

  getJemaat: (): Jemaat[] => getItem(KEYS.JEMAAT, initialJemaat),
  saveJemaat: (list: Jemaat[]): void => setItem(KEYS.JEMAAT, list),

  getKeluarga: (): Keluarga[] => getItem(KEYS.KELUARGA, initialKeluarga),
  saveKeluarga: (list: Keluarga[]): void => setItem(KEYS.KELUARGA, list),

  getWilayah: (): Wilayah[] => getItem(KEYS.WILAYAH, initialWilayah),
  saveWilayah: (list: Wilayah[]): void => setItem(KEYS.WILAYAH, list),

  getPelayanan: (): Pelayanan[] => getItem(KEYS.PELAYANAN, initialPelayanan),
  savePelayanan: (list: Pelayanan[]): void => setItem(KEYS.PELAYANAN, list),

  getBaptisan: (): Baptisan[] => getItem(KEYS.BAPTISAN, initialBaptisan),
  saveBaptisan: (list: Baptisan[]): void => setItem(KEYS.BAPTISAN, list),

  getSidi: (): Sidi[] => getItem(KEYS.SIDI, initialSidi),
  saveSidi: (list: Sidi[]): void => setItem(KEYS.SIDI, list),

  getPernikahan: (): Pernikahan[] => getItem(KEYS.PERNIKAHAN, initialPernikahan),
  savePernikahan: (list: Pernikahan[]): void => setItem(KEYS.PERNIKAHAN, list),

  getPersembahan: (): Persembahan[] => getItem(KEYS.PERSEMBAHAN, initialPersembahan),
  savePersembahan: (list: Persembahan[]): void => setItem(KEYS.PERSEMBAHAN, list),

  getDonasi: (): Donasi[] => getItem(KEYS.DONASI, initialDonasi),
  saveDonasi: (list: Donasi[]): void => setItem(KEYS.DONASI, list),

  getKasPengeluaran: (): KasPengeluaran[] => getItem(KEYS.KAS_PENGELUARAN, defaultKas),
  saveKasPengeluaran: (list: KasPengeluaran[]): void => setItem(KEYS.KAS_PENGELUARAN, list),

  getDoa: (): Doa[] => {
    const items = getItem<Doa[]>(KEYS.DOA, defaultDoa);
    const seen = new Set<string>();
    return items.map((item, idx) => {
      let id = item.doa_id || `DOA-2026-${idx + 1}`;
      if (seen.has(id)) {
        id = `${id}-${idx}`;
      }
      seen.add(id);
      return { ...item, doa_id: id };
    });
  },
  saveDoa: (list: Doa[]): void => setItem(KEYS.DOA, list),

  getPengumuman: (): Pengumuman[] => {
    const items = getItem<Pengumuman[]>(KEYS.PENGUMUMAN, initialPengumuman);
    const seen = new Set<string>();
    return items.map((item, idx) => {
      let id = item.pengumuman_id || `PNG-${idx + 1}`;
      if (seen.has(id)) {
        id = `${id}-${idx}`;
      }
      seen.add(id);
      return { ...item, pengumuman_id: id };
    });
  },
  savePengumuman: (list: Pengumuman[]): void => setItem(KEYS.PENGUMUMAN, list),

  getRenungan: (): Renungan[] => {
    const items = getItem<Renungan[]>(KEYS.RENUNGAN, initialRenungan);
    const seen = new Set<string>();
    return items.map((item, idx) => {
      let id = item.renungan_id || `RNG-${idx + 1}`;
      if (seen.has(id)) {
        id = `${id}-${idx}`;
      }
      seen.add(id);
      return { ...item, renungan_id: id };
    });
  },
  saveRenungan: (list: Renungan[]): void => setItem(KEYS.RENUNGAN, list),

  getEvents: (): EventSchedule[] => {
    const items = getItem<EventSchedule[]>(KEYS.EVENTS, initialEvents);
    const seen = new Set<string>();
    return items.map((item, idx) => {
      let id = item.event_id || `EVT-2026-${idx + 1}`;
      if (seen.has(id)) {
        id = `${id}-${idx}`;
      }
      seen.add(id);
      return { ...item, event_id: id };
    });
  },
  saveEvents: (list: EventSchedule[]): void => setItem(KEYS.EVENTS, list),

  getGallery: (): GalleryItem[] => getItem(KEYS.GALLERY, initialGallery),
  saveGallery: (list: GalleryItem[]): void => setItem(KEYS.GALLERY, list),

  getFeaturedVideos: (): FeaturedVideo[] => {
    const list = getItem<FeaturedVideo[]>(KEYS.FEATURED_VIDEOS, initialFeaturedVideos);
    return list.map((v) => {
      if (v.video_url && v.video_url.includes('5qap5aO4i9A')) {
        return {
          ...v,
          video_url: 'https://www.youtube.com/watch?v=wX2S6AebnI8'
        };
      }
      return v;
    });
  },
  saveFeaturedVideos: (list: FeaturedVideo[]): void => {
    setItem(KEYS.FEATURED_VIDEOS, list);
    // Automatically sync active video to settings for backward compatibility
    const active = list.find((v) => v.is_active) || list[0];
    if (active) {
      const currentSettings = StorageManager.getSettings();
      StorageManager.saveSettings({
        ...currentSettings,
        video_url: active.video_url,
        video_title: active.judul,
        video_description: active.keterangan || ''
      });
    }
  },

  getNotifications: (): NotificationItem[] => getItem(KEYS.NOTIFICATIONS, initialNotifications),
  saveNotifications: (list: NotificationItem[]): void => setItem(KEYS.NOTIFICATIONS, list),

  getActivityLogs: (): ActivityLog[] => getItem(KEYS.ACTIVITY_LOGS, initialActivityLogs),
  logActivity: (user: string, aktivitas: string, moduleName: string = 'General'): void => {
    const current = getItem<ActivityLog[]>(KEYS.ACTIVITY_LOGS, initialActivityLogs);
    const newLog: ActivityLog = {
      log_id: `ACT-${Date.now().toString().slice(-4)}`,
      user,
      aktivitas,
      tanggal: new Date().toLocaleString('id-ID'),
      ip_address: '180.252.12.99',
      module: moduleName
    };
    setItem(KEYS.ACTIVITY_LOGS, [newLog, ...current]);
  },

  getLoginHistory: (): LoginHistory[] => getItem(KEYS.LOGIN_HISTORY, initialLoginHistory),
  recordLogin: (user: string): string => {
    const current = getItem<LoginHistory[]>(KEYS.LOGIN_HISTORY, initialLoginHistory);
    const historyId = `LOG-${Date.now().toString().slice(-4)}`;
    const newEntry: LoginHistory = {
      history_id: historyId,
      user,
      login: new Date().toLocaleString('id-ID'),
      logout: 'Sedang Aktif',
      device: window.innerWidth < 768 ? 'Mobile / PWA Client' : 'Desktop / Web Client',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome Enterprise' : 'Web Browser',
      ip_address: '180.252.12.99'
    };
    setItem(KEYS.LOGIN_HISTORY, [newEntry, ...current]);
    return historyId;
  },

  recordLogout: (historyId: string): void => {
    const current = getItem<LoginHistory[]>(KEYS.LOGIN_HISTORY, initialLoginHistory);
    const updated = current.map((item) => (item.history_id === historyId ? { ...item, logout: new Date().toLocaleString('id-ID') } : item));
    setItem(KEYS.LOGIN_HISTORY, updated);
  },

  getPrayerRequests: (): PrayerRequest[] => getItem(KEYS.PRAYER_REQUESTS, initialPrayerRequests),
  savePrayerRequests: (list: PrayerRequest[]): void => setItem(KEYS.PRAYER_REQUESTS, list),

  getEventReservations: (): EventReservation[] => {
    const items = getItem<EventReservation[]>(KEYS.EVENT_RESERVATIONS, [
      {
        reservation_id: 'RES-2026-001',
        event_id: 'EVT-2026-001',
        nama_jemaat: 'Bpk. Herman Setyawan',
        nomor_wa: '081234567890',
        jumlah_kursi: 3,
        catatan: 'Duduk di barisan tengah bersama keluarga',
        tanggal_reservasi: '2026-07-28 10:15',
        status: 'TERKONFIRMASI'
      },
      {
        reservation_id: 'RES-2026-002',
        event_id: 'EVT-2026-001',
        nama_jemaat: 'Ibu Maria Setyawati',
        nomor_wa: '081987654321',
        jumlah_kursi: 2,
        catatan: 'Membawa lansia',
        tanggal_reservasi: '2026-07-29 14:20',
        status: 'TERKONFIRMASI'
      }
    ]);
    const seen = new Set<string>();
    return items.map((item, idx) => {
      let id = item.reservation_id || `RES-2026-${idx + 1}`;
      if (seen.has(id)) {
        id = `${id}-${idx}`;
      }
      seen.add(id);
      return { ...item, reservation_id: id };
    });
  },
  saveEventReservations: (list: EventReservation[]): void => setItem(KEYS.EVENT_RESERVATIONS, list),

  getCurrentUser: (): User | null => {
    const saved = getItem<User | null>(KEYS.CURRENT_USER, null);
    if (!saved) return null;
    const allUsers = getItem<User[]>(KEYS.USERS, initialUsers);
    const fresh = allUsers.find(
      (u) => u.user_id === saved.user_id || u.username.toLowerCase() === saved.username.toLowerCase()
    );
    if (fresh) {
      return { ...saved, ...fresh };
    }
    return saved;
  },
  saveCurrentUser: (user: User | null): void => setItem(KEYS.CURRENT_USER, user),
  clearCurrentUser: (): void => {
    localStorage.removeItem(KEYS.CURRENT_USER);
    notifyStorageListeners();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { key: KEYS.CURRENT_USER } }));
    }
  },

  resetToDefault: (): void => {
    localStorage.clear();
    setItem(KEYS.SETTINGS, initialSettings);
    setItem(KEYS.USERS, initialUsers);
    setItem(KEYS.JEMAAT, initialJemaat);
    setItem(KEYS.KELUARGA, initialKeluarga);
    setItem(KEYS.WILAYAH, initialWilayah);
    setItem(KEYS.PELAYANAN, initialPelayanan);
    setItem(KEYS.BAPTISAN, initialBaptisan);
    setItem(KEYS.SIDI, initialSidi);
    setItem(KEYS.PERNIKAHAN, initialPernikahan);
    setItem(KEYS.PERSEMBAHAN, initialPersembahan);
    setItem(KEYS.DONASI, initialDonasi);
    setItem(KEYS.KAS_PENGELUARAN, defaultKas);
    setItem(KEYS.DOA, defaultDoa);
    setItem(KEYS.PENGUMUMAN, initialPengumuman);
    setItem(KEYS.RENUNGAN, initialRenungan);
    setItem(KEYS.EVENTS, initialEvents);
    setItem(KEYS.GALLERY, initialGallery);
    setItem(KEYS.NOTIFICATIONS, initialNotifications);
    setItem(KEYS.ACTIVITY_LOGS, initialActivityLogs);
    setItem(KEYS.LOGIN_HISTORY, initialLoginHistory);
    setItem(KEYS.PRAYER_REQUESTS, initialPrayerRequests);
    localStorage.removeItem(KEYS.CURRENT_USER);
  },
  resetAllDataToDefaults: (): void => {
    StorageManager.resetToDefault();
  }
};
