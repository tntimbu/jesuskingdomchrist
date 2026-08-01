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
  EventReservation,
  ChurchTenant,
  ChurchStatus,
  SuperAdminContact
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
  initialFeaturedVideos,
  initialTenants,
  initialSuperAdminContact
} from '../data/initialData';

import { pushToCloud, initRealtimeCloudSync } from './firebaseSync';

const KEYS = {
  TENANTS: 'cms_pro_saas_tenants',
  ACTIVE_TENANT: 'cms_pro_active_tenant_id',
  SUPERADMIN_CONTACT: 'cms_pro_superadmin_contact',
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

function getTenantScopedKey(baseKey: string, specificTenantId?: string): string {
  if (
    baseKey === KEYS.TENANTS ||
    baseKey === KEYS.ACTIVE_TENANT ||
    baseKey === KEYS.SUPERADMIN_CONTACT ||
    baseKey === KEYS.CURRENT_USER ||
    baseKey === KEYS.USERS
  ) {
    return baseKey;
  }

  let activeId = specificTenantId;
  if (!activeId && typeof localStorage !== 'undefined') {
    activeId = localStorage.getItem(KEYS.ACTIVE_TENANT) || 'CHURCH-001';
  }
  if (!activeId || activeId === 'CHURCH-001' || activeId === 'ALL') {
    return baseKey;
  }

  return `cms_pro_${activeId}_${baseKey.replace('cms_pro_', '')}`;
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const scopedKey = getTenantScopedKey(key);
    const item = localStorage.getItem(scopedKey);
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
    const scopedKey = getTenantScopedKey(key);
    localStorage.setItem(scopedKey, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      const payload = { key: scopedKey, baseKey: key, timestamp: Date.now() };
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
      pushToCloud(scopedKey, value);
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

  // --- SaaS Multi-Tenant & Buyer Church Management ---
  getTenants: (): ChurchTenant[] => {
    return getItem<ChurchTenant[]>(KEYS.TENANTS, initialTenants);
  },
  saveTenants: (tenants: ChurchTenant[]): void => setItem(KEYS.TENANTS, tenants),

  getActiveTenantId: (): string => {
    return getItem<string>(KEYS.ACTIVE_TENANT, 'CHURCH-001');
  },
  setActiveTenantId: (tenantId: string): void => {
    setItem(KEYS.ACTIVE_TENANT, tenantId);
    notifyStorageListeners();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { key: KEYS.ACTIVE_TENANT, tenantId } }));
    }
  },
  getActiveTenant: (): ChurchTenant | null => {
    const activeId = StorageManager.getActiveTenantId();
    const tenants = StorageManager.getTenants();
    return tenants.find((t) => t.tenant_id === activeId) || tenants[0] || null;
  },
  createChurchTenant: (tenant: ChurchTenant, adminAccount?: User): void => {
    const currentTenants = StorageManager.getTenants();
    const updatedTenants = [tenant, ...currentTenants];
    StorageManager.saveTenants(updatedTenants);

    if (adminAccount) {
      const currentUsers = getItem<User[]>(KEYS.USERS, initialUsers);
      const userExists = currentUsers.some((u) => u.username.toLowerCase() === adminAccount.username.toLowerCase());
      if (!userExists) {
        setItem(KEYS.USERS, [adminAccount, ...currentUsers]);
      }
    }

    const newChurchSettings: AppSettings = {
      ...initialSettings,
      nama_gereja: tenant.nama_gereja,
      email: tenant.admin_email,
      telepon: tenant.admin_wa,
      alamat: tenant.alamat
    };
    const tenantSettingsKey = getTenantScopedKey(KEYS.SETTINGS, tenant.tenant_id);
    localStorage.setItem(tenantSettingsKey, JSON.stringify(newChurchSettings));

    StorageManager.logActivity(
      'SUPER_ADMIN',
      `Membuat Akun Gereja Baru: ${tenant.nama_gereja} (${tenant.kode_unik})`,
      'SaaS'
    );
  },
  updateChurchTenantStatus: (tenantId: string, status: ChurchStatus, tanggalKadaluarsa?: string): void => {
    const tenants = StorageManager.getTenants();
    const updated = tenants.map((t) => {
      if (t.tenant_id === tenantId) {
        return {
          ...t,
          status,
          ...(tanggalKadaluarsa ? { tanggal_kadaluarsa: tanggalKadaluarsa } : {})
        };
      }
      return t;
    });
    StorageManager.saveTenants(updated);
    StorageManager.logActivity(
      'SUPER_ADMIN',
      `Mengubah Status Lisensi Gereja ${tenantId} menjadi ${status}`,
      'SaaS'
    );
  },
  deleteChurchTenant: (tenantId: string): void => {
    const tenants = StorageManager.getTenants();
    const updated = tenants.filter((t) => t.tenant_id !== tenantId);
    StorageManager.saveTenants(updated);
  },
  getSuperAdminContact: (): SuperAdminContact => {
    return getItem<SuperAdminContact>(KEYS.SUPERADMIN_CONTACT, initialSuperAdminContact);
  },
  saveSuperAdminContact: (contact: SuperAdminContact): void => {
    setItem(KEYS.SUPERADMIN_CONTACT, contact);
  },
  checkTenantStatus: (tenantId?: string): { isLocked: boolean; reason: 'NONAKTIF' | 'KADALUARSA' | 'DIBLOKIR' | 'NONE'; tenant: ChurchTenant | null; message: string } => {
    const targetId = tenantId || StorageManager.getActiveTenantId();
    const tenants = StorageManager.getTenants();
    const tenant = tenants.find((t) => t.tenant_id === targetId) || tenants[0] || null;

    if (!tenant) {
      return { isLocked: false, reason: 'NONE', tenant: null, message: '' };
    }

    if (tenant.status === 'DIBLOKIR') {
      return {
        isLocked: true,
        reason: 'DIBLOKIR',
        tenant,
        message: `Akun ${tenant.nama_gereja} telah diblokir oleh SuperAdmin. Hubungi SuperAdmin untuk pengaktifan kembali.`
      };
    }

    if (tenant.status === 'NONAKTIF') {
      return {
        isLocked: true,
        reason: 'NONAKTIF',
        tenant,
        message: `Akun ${tenant.nama_gereja} sedang dalam status Nonaktif.`
      };
    }

    if (tenant.tanggal_kadaluarsa) {
      const expDate = new Date(tenant.tanggal_kadaluarsa);
      expDate.setHours(23, 59, 59, 999);
      if (new Date() > expDate || tenant.status === 'KADALUARSA') {
        return {
          isLocked: true,
          reason: 'KADALUARSA',
          tenant,
          message: `Masa berlaku lisensi ${tenant.nama_gereja} telah kadaluarsa pada ${tenant.tanggal_kadaluarsa}. Silahkan lakukan pembayaran untuk perpanjangan.`
        };
      }
    }

    return { isLocked: false, reason: 'NONE', tenant, message: '' };
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
    let list = getItem<User[]>(KEYS.USERS, initialUsers);

    // Consolidate any tenant-scoped user keys into the main global users directory
    if (typeof localStorage !== 'undefined') {
      let migrated = false;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cms_pro_') && k.endsWith('_users') && k !== KEYS.USERS) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const tenantUsers: User[] = JSON.parse(raw);
              if (Array.isArray(tenantUsers)) {
                tenantUsers.forEach((tu) => {
                  if (tu && tu.username && !list.some((u) => u.username.toLowerCase() === tu.username.toLowerCase())) {
                    list.push(tu);
                    migrated = true;
                  }
                });
              }
            }
          } catch (e) {
            console.error('Error consolidating tenant users:', e);
          }
        }
      }
      if (migrated) {
        setItem(KEYS.USERS, list);
      }
    }

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
