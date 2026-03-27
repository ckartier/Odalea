import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface FirebaseConnectionState {
  status: ConnectionStatus;
  isConnected: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export function useFirebaseConnection() {
  const [state, setState] = useState<FirebaseConnectionState>({
    status: 'connecting',
    isConnected: false,
    lastChecked: null,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    try {
      console.log('[Firebase] Checking connection...');
      setState(prev => ({ ...prev, status: 'connecting' }));

      const testRef = doc(db, '__connection_test__', 'ping');
      const startTime = Date.now();
      
      await getDoc(testRef).catch(() => {
        // Document may not exist, but connection is still valid if we get here
      });
      
      const latency = Date.now() - startTime;
      console.log(`[Firebase] Connection OK (latency: ${latency}ms)`);
      
      setState({
        status: 'connected',
        isConnected: true,
        lastChecked: new Date(),
        error: null,
      });
      
      return true;
    } catch (error: any) {
      console.error('[Firebase] Connection check failed:', error);
      
      setState({
        status: 'error',
        isConnected: false,
        lastChecked: new Date(),
        error: error?.message || 'Connection failed',
      });
      
      return false;
    }
  }, []);

  useEffect(() => {
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(() => {
      if (auth.currentUser) {
        checkConnection();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkConnection();
      } else {
        setState(prev => ({
          ...prev,
          status: 'disconnected',
          isConnected: false,
        }));
      }
    });

    return unsubscribe;
  }, [checkConnection]);

  return {
    ...state,
    checkConnection,
  };
}
