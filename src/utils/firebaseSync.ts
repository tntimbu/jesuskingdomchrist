import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

const COLLECTION_NAME = 'gkfc_cms';

// Comprehensive Mapping of all LocalStorage keys to Firestore Document IDs
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
};

/**
 * Gets the active Firebase configuration (Custom from Super Admin Settings or default automatic project)
 */
export function getActiveFirebaseConfig() {
  try {
    const rawSettings = localStorage.getItem('cms_pro_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      const custom = parsed.firebaseConfig;
      if (custom && custom.apiKey && custom.projectId) {
        return {
          apiKey: custom.apiKey.trim(),
          authDomain: (custom.authDomain || '').trim() || `${custom.projectId.trim()}.firebaseapp.com`,
          projectId: custom.projectId.trim(),
          storageBucket: (custom.storageBucket || '').trim() || `${custom.projectId.trim()}.firebasestorage.app`,
          messagingSenderId: (custom.messagingSenderId || '').trim() || defaultFirebaseConfig.messagingSenderId,
          appId: (custom.appId || '').trim() || defaultFirebaseConfig.appId,
          firestoreDatabaseId: (custom.firestoreDatabaseId || defaultFirebaseConfig.firestoreDatabaseId || '(default)').trim()
        };
      }
    }
  } catch (e) {
    console.warn('[FirebaseSync] Using default automatic Firebase config', e);
  }
  return defaultFirebaseConfig;
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

/**
 * Pushes updated local data to Cloud Firestore
 */
export async function pushToCloud(storageKey: string, data: any): Promise<void> {
  if (isRemoteUpdating) return;
  const docId = DOC_MAPPING[storageKey] || storageKey;

  try {
    const firestoreDb = getFirestoreInstance();
    const docRef = doc(firestoreDb, COLLECTION_NAME, docId);
    
    // Store payload as serialized string to avoid nested array/type mismatches
    const payloadString = typeof data === 'string' ? data : JSON.stringify(data);

    await setDoc(
      docRef,
      {
        payload: payloadString,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    syncConnectedStatus = true;
  } catch (error) {
    console.warn(`[FirebaseSync] Error syncing ${storageKey} to cloud:`, error);
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
      message: `TERHUBUNG REAL-TIME! Berhasil terhubung ke Firestore Cloud project ID: "${config.projectId}".`
    };
  } catch (err: any) {
    syncConnectedStatus = false;
    return {
      success: false,
      message: `Gagal terhubung ke Firestore: ${err?.message || 'Pastikan API Key & Project ID valid dan aturan Firestore Security Rules mengizinkan read/write.'}`
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
 * Initializes or re-initializes real-time listener for all collections across devices
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

  const firestoreDb = getFirestoreInstance();

  Object.entries(DOC_MAPPING).forEach(([storageKey, docId]) => {
    const docRef = doc(firestoreDb, COLLECTION_NAME, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        syncConnectedStatus = true;
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          if (cloudData && cloudData.payload !== undefined) {
            isRemoteUpdating = true;
            try {
              const cloudPayloadStr =
                typeof cloudData.payload === 'string'
                  ? cloudData.payload
                  : JSON.stringify(cloudData.payload);

              const currentLocalStr = localStorage.getItem(storageKey);

              if (currentLocalStr !== cloudPayloadStr) {
                localStorage.setItem(storageKey, cloudPayloadStr);

                // Notify app components of remote data updates
                window.dispatchEvent(new Event('cms_data_changed'));
                window.dispatchEvent(new Event('storage'));
                if (onDataReceived) onDataReceived();
              }
            } finally {
              isRemoteUpdating = false;
            }
          }
        } else {
          // If document does not exist in cloud yet, push initial local data to cloud
          const initialLocal = localStorage.getItem(storageKey);
          if (initialLocal) {
            try {
              const parsed = JSON.parse(initialLocal);
              pushToCloud(storageKey, parsed);
            } catch (e) {
              pushToCloud(storageKey, initialLocal);
            }
          }
        }
      },
      (error) => {
        console.warn(`[FirebaseSync] Error watching document ${docId}:`, error);
      }
    );

    activeUnsubscribers.push(unsubscribe);
  });

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
