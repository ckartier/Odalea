import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, setLogLevel, persistentLocalCache, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { Platform } from 'react-native';

// Declare global singleton to prevent double initialization during Fast Refresh
declare global {
  var __FIREBASE_APP__: FirebaseApp | undefined;
  var __FIREBASE_DB__: Firestore | undefined;
}

// Platform-specific App ID
const getAppId = () => {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "";
  }
  return process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "";
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: getAppId(),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
} as const;

// Validate required environment variables
const validateConfig = () => {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missing.push('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missing.push('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missing.push('EXPO_PUBLIC_FIREBASE_APP_ID or EXPO_PUBLIC_FIREBASE_IOS_APP_ID');
  
  if (missing.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missing.join(', '));
    console.error('⚠️ Firebase will not work correctly without these variables');
  }
};

validateConfig();

// Initialize Firebase App (singleton pattern)
let app: FirebaseApp;
if (globalThis.__FIREBASE_APP__) {
  app = globalThis.__FIREBASE_APP__;
  console.log('♻️ Reusing existing Firebase app instance (Fast Refresh)');
} else if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  globalThis.__FIREBASE_APP__ = app;
  console.log('🔥 Firebase initialized successfully');
  console.log('📊 Project ID:', firebaseConfig.projectId);
  console.log('📦 Storage Bucket:', firebaseConfig.storageBucket);
  console.log('📱 Platform:', Platform.OS, '| App ID:', firebaseConfig.appId);
} else {
  app = getApps()[0];
  globalThis.__FIREBASE_APP__ = app;
  console.log('🔄 Using existing Firebase app from getApps()');
}

// Initialize Auth
const auth = getAuth(app);
if (Platform.OS === 'web') {
  setPersistence(auth, browserLocalPersistence)
    .then(() => console.log('🔐 Auth persistence: browserLocalPersistence'))
    .catch((e) => console.warn('⚠️ Auth persistence error:', e?.message ?? String(e)));
}

// Initialize Firestore (singleton pattern with platform-specific cache)
let db: Firestore;
if (globalThis.__FIREBASE_DB__) {
  db = globalThis.__FIREBASE_DB__;
  console.log('♻️ Reusing existing Firestore instance (Fast Refresh)');
} else {
  try {
    if (Platform.OS === 'web') {
      // Web: Use persistentLocalCache for offline support
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
        localCache: persistentLocalCache(),
      });
      console.log('🔥 Firestore initialized (web) with persistentLocalCache');
    } else {
      // React Native mobile: Use default cache (no persistentLocalCache)
      db = getFirestore(app);
      console.log('🔥 Firestore initialized (native) with default cache');
    }
    globalThis.__FIREBASE_DB__ = db;
  } catch (error: any) {
    if (error?.message?.includes('already been called')) {
      console.warn('⚠️ Firestore already initialized, using getFirestore()');
      db = getFirestore(app);
      globalThis.__FIREBASE_DB__ = db;
    } else {
      console.error('❌ Firestore initialization error:', error);
      throw error;
    }
  }
}

// Initialize Storage
const storage = getStorage(app);

// Connect to emulators in development (disabled for now to avoid connection issues)
// Only enable emulators when you have them running locally
if (__DEV__ && Platform.OS === 'web' && false) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('🔧 Connected to Firebase emulators');
  } catch {
    console.log('⚠️ Emulators not available, using production Firebase');
  }
}

// Network connectivity helpers
export const reconnectFirestore = async () => {
  try {
    await enableNetwork(db);
    console.log('🔄 Firestore network re-enabled');
    return true;
  } catch (error) {
    console.error('❌ Failed to reconnect Firestore:', error);
    return false;
  }
};

export const disconnectFirestore = async () => {
  try {
    await disableNetwork(db);
    console.log('📴 Firestore network disabled');
    return true;
  } catch (error) {
    console.error('❌ Failed to disconnect Firestore:', error);
    return false;
  }
};

// Auto-reconnect on app focus (for mobile)
if (Platform.OS !== 'web') {
  enableNetwork(db).catch(error => {
    console.log('⚠️ Initial network enable failed:', error);
  });
}

if (__DEV__) {
  try {
    setLogLevel('debug');
  } catch {}
}

export { auth, db, storage, enableNetwork, disableNetwork };
export default app;