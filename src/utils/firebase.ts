import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, onSnapshot } from 'firebase/firestore';
import { AppSettings } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const authInstance = getAuth();
  const currentUser = authInstance.currentUser;
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let firebaseApp: any = null;
let firestoreDb: any = null;

export function initFirebase(settings?: AppSettings) {
  try {
    const config = settings ? {
      apiKey: settings.firebase_api_key,
      authDomain: settings.firebase_auth_domain,
      projectId: settings.firebase_project_id,
      storageBucket: settings.firebase_storage_bucket,
      messagingSenderId: settings.firebase_messaging_sender_id,
      appId: settings.firebase_app_id
    } : {
      apiKey: "AIzaSyDemoKeyCMSPro2026_Enterprise",
      authDomain: "cmspro-church-app.firebaseapp.com",
      projectId: "cmspro-church-app",
      storageBucket: "cmspro-church-app.appspot.com",
      messagingSenderId: "887766554433",
      appId: "1:887766554433:web:abc123def456"
    };

    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }
    
    firestoreDb = getFirestore(firebaseApp);
    return { app: firebaseApp, db: firestoreDb };
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
    return { app: null, db: null };
  }
}

export async function testConnection() {
  if (!firestoreDb) return false;
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration.");
    }
    return false;
  }
}
