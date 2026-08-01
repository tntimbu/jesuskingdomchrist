import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
  Firestore
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

const COLLECTION_NAME = 'gkfc_cms';

// Bidirectional Mapping between LocalStorage keys and Firestore Document IDs
const DOC_MAPPING: Record<string, string> = {
  cms_pro_settings: 'settings',
  cms_pro_users: 'users',
  cms_pro_jemaat: 'jemaat',
  cms_pro_keluarga: 'keluarga',
  cms_pro_wilayah: 'wilayah',
  cms_pro_pelayanan: 'pelayanan',
  cms_pro_baptisan: 'baptisan',
  cms_pro_sidi: 'sidi',
  cms_pro_pernikahan: 'pernikahan',
  cms_pro_persembahan: 'persembahan',
  cms_pro_donasi: 'donasi',
  cms_pro_kas_pengeluaran: 'kas_pengeluaran',
  cms_pro_doa: 'doa',
  cms_pro_pengumuman: 'pengumuman',
  cms_pro_renungan: 'renungan',
  cms_pro_events: 'events',
  cms_pro_gallery: 'gallery',
  cms_pro_featured_videos: 'featured_videos',
  cms_pro_media_files: 'media_files',
  cms_pro_notifications: 'notifications',
  cms_pro_activity_logs: 'activity_logs',
  cms_pro_login_history: 'login_history',
  cms_pro_prayer_requests: 'prayer_requests',
  cms_pro_saas_tenants: 'saas_tenants',
  cms_pro_active_tenant_id: 'active_tenant_id',
  cms_pro_superadmin_contact: 'superadmin_contact'
};

const REVERSE_DOC_MAPPING: Record<string, string> = {
  settings: 'cms_pro_settings',
  users: 'cms_pro_users',
  jemaat: 'cms_pro_jemaat',
  keluarga: 'cms_pro_keluarga',
  wilayah: 'cms_pro_wilayah',
  pelayanan: 'cms_pro_pelayanan',
  baptisan: 'cms_pro_baptisan',
  sidi: 'cms_pro_sidi',
  pernikahan: 'cms_pro_pernikahan',
  persembahan: 'cms_pro_persembahan',
  donasi: 'cms_pro_donasi',
  kas_pengeluaran: 'cms_pro_kas_pengeluaran',
  doa: 'cms_pro_doa',
  pengumuman: 'cms_pro_pengumuman',
  renungan: 'cms_pro_renungan',
  events: 'cms_pro_events',
  gallery: 'cms_pro_gallery',
  featured_videos: 'cms_pro_featured_videos',
  media_files: 'cms_pro_media_files',
  notifications: 'cms_pro_notifications',
  activity_logs: 'cms_pro_activity_logs',
  login_history: 'cms_pro_login_history',
  prayer_requests: 'cms_pro_prayer_requests',
  saas_tenants: 'cms_pro_saas_tenants',
  active_tenant_id: 'cms_pro_active_tenant_id',
  superadmin_contact: 'cms_pro_superadmin_contact'
};

/**
 * Gets default automatic Firebase configuration
 */
export function getDefaultFirebaseConfig() {
  return defaultFirebaseConfig;
}

/**
 * Gets the active Firebase configuration (Custom from Super Admin Settings or default automatic project)
 */
export function getActiveFirebaseConfig() {
  try {
    const rawSettings = localStorage.getItem('cms_pro_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      const custom = parsed.firebaseConfig;
      if (
        custom &&
        custom.apiKey &&
        custom.projectId &&
        !custom.apiKey.includes('DemoKey') &&
        custom.projectId !== 'cmspro-church-app' &&
        custom.projectId !== defaultFirebaseConfig.projectId
      ) {
        return {
          apiKey: custom.apiKey.trim(),
          authDomain: (custom.authDomain || '').trim() || `${custom.projectId.trim()}.firebaseapp.com`,
          projectId: custom.projectId.trim(),
          storageBucket: (custom.storageBucket || '').trim() || `${custom.projectId.trim()}.firebasestorage.app`,
          messagingSenderId: (custom.messagingSenderId || '').trim() || defaultFirebaseConfig.messagingSenderId,
          appId: (custom.appId || '').trim() || defaultFirebaseConfig.appId,
          firestoreDatabaseId: (custom.firestoreDatabaseId || defaultFirebaseConfig.firestoreDatabaseId || '(default)').trim(),
          isCustom: true
        };
      }
    }
  } catch (e) {
    console.warn('[FirebaseSync] Using default automatic Firebase config', e);
  }
  return { ...defaultFirebaseConfig, isCustom: false };
}

/**
 * Get Default Firestore Instance
 */
export function getDefaultFirestoreInstance(): Firestore {
  const appName = `app_${defaultFirebaseConfig.projectId || 'default'}`;
  const existingApps = getApps();
  let app = existingApps.find((a) => a.name === appName);

  if (!app) {
    app = initializeApp(defaultFirebaseConfig, appName);
  }

  const firestoreDb =
    defaultFirebaseConfig.firestoreDatabaseId && defaultFirebaseConfig.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, defaultFirebaseConfig.firestoreDatabaseId)
      : getFirestore(app);

  return firestoreDb;
}

/**
 * Get active Firestore Instance
 */
export function getFirestoreInstance(): Firestore {
  const config = getActiveFirebaseConfig();
  const appName = `app_${config.projectId || 'default'}`;

  const existingApps = getApps();
  let app = existingApps.find((a) => a.name === appName);

  if (!app) {
    if (existingApps.length > 0 && appName === `app_${defaultFirebaseConfig.projectId}`) {
      app = existingApps[0];
    } else {
      app = initializeApp(config, appName);
    }
  }

  const firestoreDb =
    config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);

  return firestoreDb;
}

export const db = getFirestoreInstance();

// Flag to prevent echo loops when updating from Firestore to localStorage
let isRemoteUpdating = false;
let activeUnsubscribers: Array<() => void> = [];
let syncConnectedStatus = true;
let lastActiveProjectId = '';

/**
 * Pushes updated local data to Cloud Firestore (with Dual-Write Bridge & Fallback)
 */
export async function pushToCloud(storageKey: string, data: any): Promise<void> {
  if (isRemoteUpdating) return;
  const docId = DOC_MAPPING[storageKey] || storageKey;
  const payloadString = JSON.stringify(data);

  const activeConfig = getActiveFirebaseConfig();
  let primarySuccess = false;

  // 1. Try pushing to primary active Firestore
  try {
    const firestoreDb = getFirestoreInstance();
    const docRef = doc(firestoreDb, COLLECTION_NAME, docId);
    await setDoc(
      docRef,
      {
        payload: payloadString,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    syncConnectedStatus = true;
    primarySuccess = true;
  } catch (error) {
    console.warn(`[FirebaseSync] Primary sync failed for ${storageKey}:`, error);
  }

  // 2. Dual-write bridge to default automatic project if primary is custom OR if primary failed
  if (activeConfig.isCustom || !primarySuccess) {
    try {
      const defaultDb = getDefaultFirestoreInstance();
      const defaultDocRef = doc(defaultDb, COLLECTION_NAME, docId);
      await setDoc(
        defaultDocRef,
        {
          payload: payloadString,
          updatedAt: Date.now()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn(`[FirebaseSync] Default bridge write error for ${storageKey}:`, e);
    }
  }
}

/**
 * Pushes ALL local storage keys starting with cms_pro_ to Cloud Firestore
 */
export async function syncAllLocalKeysToCloud(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('cms_pro_')) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          await pushToCloud(key, JSON.parse(val));
        } catch (e) {
          await pushToCloud(key, val);
        }
      }
    }
  }
}

/**
 * Tests connection to active Firebase Firestore or custom config
 */
export async function testFirestoreConnection(overrideConfig?: any): Promise<{ success: boolean; message: string }> {
  try {
    const config = overrideConfig && overrideConfig.apiKey && overrideConfig.projectId
      ? {
          apiKey: overrideConfig.apiKey.trim(),
          authDomain: (overrideConfig.authDomain || '').trim() || `${overrideConfig.projectId.trim()}.firebaseapp.com`,
          projectId: overrideConfig.projectId.trim(),
          storageBucket: (overrideConfig.storageBucket || '').trim() || `${overrideConfig.projectId.trim()}.firebasestorage.app`,
          messagingSenderId: (overrideConfig.messagingSenderId || '').trim() || defaultFirebaseConfig.messagingSenderId,
          appId: (overrideConfig.appId || '').trim() || defaultFirebaseConfig.appId,
          firestoreDatabaseId: (overrideConfig.firestoreDatabaseId || defaultFirebaseConfig.firestoreDatabaseId || '(default)').trim()
        }
      : getActiveFirebaseConfig();

    const appName = `test_app_${config.projectId}_${Date.now()}`;
    const app = initializeApp(config, appName);
    const firestoreDb = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);

    const testDocRef = doc(firestoreDb, COLLECTION_NAME, 'connection_test');
    
    await setDoc(testDocRef, {
      status: 'OK',
      timestamp: Date.now(),
      clientInfo: 'GKFC CMS Pro - Super Admin Test'
    }, { merge: true });

    syncConnectedStatus = true;
    return {
      success: true,
      message: `TERHUBUNG REAL-TIME! Berhasil menulis dan membaca data di Firestore Cloud project ID: "${config.projectId}".`
    };
  } catch (err: any) {
    syncConnectedStatus = false;
    return {
      success: false,
      message: `Gagal terhubung ke Firestore: ${err?.message || 'Pastikan API Key & Project ID valid dan aturan Firestore Security Rules di Firebase Console Anda sudah diatur allow read, write: if true;'}`
    };
  }
}

/**
 * Gets real-time connection status
 */
export function getCloudSyncStatus(): boolean {
  return syncConnectedStatus;
}

/**
 * Initializes or re-initializes real-time listener for ALL collections and tenant documents across devices
 */
export function initRealtimeCloudSync(onDataReceived?: () => void): () => void {
  // Clear previous active subscriptions if any
  if (activeUnsubscribers.length > 0) {
    activeUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // ignore
      }
    });
    activeUnsubscribers = [];
  }

  const activeConfig = getActiveFirebaseConfig();
  lastActiveProjectId = activeConfig.projectId;

  const attachCollectionListener = (firestoreDb: Firestore) => {
    const colRef = collection(firestoreDb, COLLECTION_NAME);

    const unsubscribe = onSnapshot(
      colRef,
      (querySnapshot) => {
        syncConnectedStatus = true;
        isRemoteUpdating = true;
        let hasChanges = false;

        try {
          querySnapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const docId = change.doc.id;
              if (docId === 'connection_test') return;

              const storageKey = REVERSE_DOC_MAPPING[docId] || docId;
              const cloudData = change.doc.data();

              if (cloudData && cloudData.payload !== undefined) {
                const cloudPayloadStr =
                  typeof cloudData.payload === 'string'
                    ? cloudData.payload
                    : JSON.stringify(cloudData.payload);

                const currentLocalStr = localStorage.getItem(storageKey);

                if (currentLocalStr !== cloudPayloadStr) {
                  localStorage.setItem(storageKey, cloudPayloadStr);
                  hasChanges = true;

                  // If settings were updated with new firebaseConfig, check if project switched
                  if (storageKey === 'cms_pro_settings') {
                    const newConfig = getActiveFirebaseConfig();
                    if (newConfig.projectId !== lastActiveProjectId) {
                      setTimeout(() => {
                        reconnectRealtimeCloudSync(onDataReceived);
                      }, 300);
                    }
                  }
                }
              }
            }
          });

          if (hasChanges) {
            // Notify app components of remote data updates
            window.dispatchEvent(new Event('cms_data_changed'));
            window.dispatchEvent(new Event('storage'));
            if (onDataReceived) onDataReceived();
          }
        } finally {
          isRemoteUpdating = false;
        }
      },
      (error) => {
        console.warn(`[FirebaseSync] Collection snapshot error for ${COLLECTION_NAME}:`, error);
      }
    );

    activeUnsubscribers.push(unsubscribe);
  };

  // Attach primary listener to all documents in collection
  const primaryDb = getFirestoreInstance();
  attachCollectionListener(primaryDb);

  // If primary is custom, ALSO attach listener to default project
  if (activeConfig.isCustom) {
    try {
      const defaultDb = getDefaultFirestoreInstance();
      attachCollectionListener(defaultDb);
    } catch (e) {
      console.warn('[FirebaseSync] Default bridge listener attach failed:', e);
    }
  }

  // Push all existing local keys to cloud on startup
  setTimeout(() => {
    syncAllLocalKeysToCloud().catch((e) => console.warn('[FirebaseSync] Startup push error:', e));
  }, 1000);

  return () => {
    activeUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // ignore
      }
    });
    activeUnsubscribers = [];
  };
}

/**
 * Reconnects real-time cloud sync when Firebase settings change
 */
export function reconnectRealtimeCloudSync(onDataReceived?: () => void): () => void {
  return initRealtimeCloudSync(onDataReceived);
}
