import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, setLogLevel, persistentLocalCache } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure Firebase configuration using environment variables
// Use platform-specific App ID
const getAppId = () => {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "";
  }
  // Web and Android use the main App ID (web by default)
  return process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "";
};

const rawConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: getAppId(),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
} as const;

const firebaseConfig = {
  ...rawConfig,
  storageBucket: rawConfig.storageBucket?.includes('firebasestorage.app') ? rawConfig.storageBucket.replace('.firebasestorage.app', '.appspot.com') : rawConfig.storageBucket,
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase initialized successfully');
    console.log('📊 Project ID:', firebaseConfig.projectId);
    console.log('📱 Platform:', Platform.OS, '| App ID:', firebaseConfig.appId);
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    app = initializeApp({
      apiKey: "demo-key",
      authDomain: "demo.firebaseapp.com",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo"
    });
  }
} else {
  app = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(app);
// Ensure stable persistence according to platform
if (Platform.OS === 'web') {
  try {
    setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('🔐 Auth persistence set to browserLocalPersistence'))
      .catch((e) => console.warn('⚠️ Failed to set web auth persistence:', e?.message ?? String(e)));
  } catch (e) {
    console.warn('⚠️ setPersistence threw (web):', (e as any)?.message ?? String(e));
  }
} else {
  try {
    const rnAuth = require('firebase/auth/react-native');
    const getReactNativePersistence: ((storage: typeof AsyncStorage) => any) | undefined = rnAuth?.getReactNativePersistence;
    if (getReactNativePersistence) {
      setPersistence(auth, getReactNativePersistence(AsyncStorage))
        .then(() => console.log('🔐 Auth persistence set to React Native AsyncStorage'))
        .catch((e: unknown) => console.warn('⚠️ Failed to set native auth persistence:', (e as any)?.message ?? String(e)));
    } else {
      console.warn('⚠️ getReactNativePersistence not available, using in-memory persistence');
    }
  } catch (e) {
    console.warn('⚠️ setPersistence threw (native):', (e as any)?.message ?? String(e));
  }
}
const db = initializeFirestore(
  app,
  {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache(),
  },
);
// Persistence configured via persistentLocalCache above to avoid runtime conflicts
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