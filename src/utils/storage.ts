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
  PrayerRequest
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
  initialPrayerRequests
} from '../data/initialData';

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
  NOTIFICATIONS: 'cms_pro_notifications',
  ACTIVITY_LOGS: 'cms_pro_activity_logs',
  LOGIN_HISTORY: 'cms_pro_login_history',
  PRAYER_REQUESTS: 'cms_pro_prayer_requests',
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

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
}

export const StorageManager = {
  getSettings: (): AppSettings => getItem(KEYS.SETTINGS, initialSettings),
  saveSettings: (settings: AppSettings): void => setItem(KEYS.SETTINGS, settings),

  getUsers: (): User[] => getItem(KEYS.USERS, initialUsers),
  saveUsers: (users: User[]): void => setItem(KEYS.USERS, users),

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

  getDoa: (): Doa[] => getItem(KEYS.DOA, defaultDoa),
  saveDoa: (list: Doa[]): void => setItem(KEYS.DOA, list),

  getPengumuman: (): Pengumuman[] => getItem(KEYS.PENGUMUMAN, initialPengumuman),
  savePengumuman: (list: Pengumuman[]): void => setItem(KEYS.PENGUMUMAN, list),

  getRenungan: (): Renungan[] => getItem(KEYS.RENUNGAN, initialRenungan),
  saveRenungan: (list: Renungan[]): void => setItem(KEYS.RENUNGAN, list),

  getEvents: (): EventSchedule[] => getItem(KEYS.EVENTS, initialEvents),
  saveEvents: (list: EventSchedule[]): void => setItem(KEYS.EVENTS, list),

  getGallery: (): GalleryItem[] => getItem(KEYS.GALLERY, initialGallery),
  saveGallery: (list: GalleryItem[]): void => setItem(KEYS.GALLERY, list),

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

  getCurrentUser: (): User | null => getItem<User | null>(KEYS.CURRENT_USER, initialUsers[0]),
  saveCurrentUser: (user: User | null): void => setItem(KEYS.CURRENT_USER, user),
  clearCurrentUser: (): void => localStorage.removeItem(KEYS.CURRENT_USER),

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
    setItem(KEYS.CURRENT_USER, initialUsers[0]);
  },
  resetAllDataToDefaults: (): void => {
    StorageManager.resetToDefault();
  }
};
