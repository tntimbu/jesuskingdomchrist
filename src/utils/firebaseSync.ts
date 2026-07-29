import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore Instance
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const COLLECTION_NAME = 'gkfc_cms';

// Map storage keys to Firestore document IDs
const DOC_MAPPING: Record<string, string> = {
  cms_pro_jemaat: 'jemaat',
  cms_pro_warta: 'warta',
  cms_pro_pengumuman: 'pengumuman',
  cms_pro_keuangan: 'keuangan',
  cms_pro_renungan: 'renungan',
  cms_pro_surat: 'surat',
  cms_pro_baptisan: 'baptisan',
  cms_pro_sidi: 'sidi',
  cms_pro_pernikahan: 'pernikahan',
  cms_pro_events: 'events',
  cms_pro_doa: 'doa',
  cms_pro_gallery: 'gallery',
  cms_pro_featured_videos: 'featured_videos',
  cms_pro_media_files: 'media_files',
  cms_pro_settings: 'settings',
  cms_pro_users: 'users',
  cms_pro_wilayah: 'wilayah',
  cms_pro_activity_logs: 'activity_logs',
  cms_pro_persembahan: 'persembahan',
  cms_pro_donasi: 'donasi',
  cms_pro_kas_pengeluaran: 'kas_pengeluaran',
};

// Flag to prevent echo loops when updating from Firestore to localStorage
let isRemoteUpdating = false;

/**
 * Pushes updated local data to Firestore
 */
export async function pushToCloud(storageKey: string, data: any): Promise<void> {
  if (isRemoteUpdating) return;
  const docId = DOC_MAPPING[storageKey] || storageKey;

  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await setDoc(docRef, {
      payload: data,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    console.warn(`[FirebaseSync] Error syncing ${storageKey} to cloud:`, error);
  }
}

/**
 * Initializes real-time listener for all collections across devices
 */
export function initRealtimeCloudSync(onDataReceived?: () => void): () => void {
  const unsubscribers: Array<() => void> = [];

  Object.entries(DOC_MAPPING).forEach(([storageKey, docId]) => {
    const docRef = doc(db, COLLECTION_NAME, docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          if (cloudData && cloudData.payload !== undefined) {
            isRemoteUpdating = true;
            try {
              const cloudPayloadStr = typeof cloudData.payload === 'string'
                ? cloudData.payload
                : JSON.stringify(cloudData.payload);

              const currentLocalStr = localStorage.getItem(storageKey);

              if (currentLocalStr !== cloudPayloadStr) {
                localStorage.setItem(storageKey, cloudPayloadStr);

                // Notify app
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
              console.warn(`[FirebaseSync] Error pushing initial state for ${storageKey}:`, e);
            }
          }
        }
      },
      (error) => {
        console.warn(`[FirebaseSync] Error watching document ${docId}:`, error);
      }
    );

    unsubscribers.push(unsubscribe);
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
