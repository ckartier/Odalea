import { useState, useCallback, useEffect, useRef } from 'react';
import { googleAuth, GoogleUser, GoogleAuthResponse } from '@/services/google-auth';
import { useFirebaseAuth } from './use-firebase-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseGoogleAuthReturn {
  user: GoogleUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => void;
  signOut: () => Promise<void>;
  isSignedIn: boolean;
  isReady: boolean;
}

const GOOGLE_USER_KEY = 'google_user';
const GOOGLE_TOKEN_KEY = 'google_token';

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const { user: firebaseUser } = useFirebaseAuth();
  const signInPromiseRef = useRef<Promise<GoogleAuthResponse | null> | null>(null);

  useEffect(() => {
    googleAuth.ensureRequestReady().then((ready) => {
      console.log('[useGoogleAuth] Request ready:', ready);
      setIsReady(ready);
    });
  }, []);

  const loadStoredUser = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem(GOOGLE_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading stored user:', err);
    }
  }, []);

  const signIn = useCallback(() => {
    if (isLoading) {
      console.log('[useGoogleAuth] Already signing in, ignoring');
      return;
    }
    
    console.log('[useGoogleAuth] signIn called - SYNCHRONOUS execution');
    setIsLoading(true);
    setError(null);
    
    signInPromiseRef.current = googleAuth.signIn();
    
    signInPromiseRef.current
      .then(async (result: GoogleAuthResponse | null) => {
        if (result) {
          setUser(result.user);
          await AsyncStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(result.user));
          await AsyncStorage.setItem(GOOGLE_TOKEN_KEY, result.accessToken);
          console.log('[useGoogleAuth] Sign-In successful:', result.user.name);
        } else {
          setError('Connexion annulée');
        }
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
        setError(errorMessage);
        console.error('[useGoogleAuth] Sign-In Error:', err);
      })
      .finally(() => {
        setIsLoading(false);
        signInPromiseRef.current = null;
      });
  }, [isLoading]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = await AsyncStorage.getItem(GOOGLE_TOKEN_KEY);
      
      if (token) {
        await googleAuth.revokeAccess(token);
      }
      
      await googleAuth.signOut();
      
      // Supprimer les données stockées
      await AsyncStorage.removeItem(GOOGLE_USER_KEY);
      await AsyncStorage.removeItem(GOOGLE_TOKEN_KEY);
      
      setUser(null);
      console.log('Google Sign-Out successful');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de déconnexion';
      setError(errorMessage);
      console.error('Google Sign-Out Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Synchroniser avec Firebase Auth
  useEffect(() => {
    if (firebaseUser && !user) {
      const googleUser: GoogleUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        picture: firebaseUser.photoURL || '',
        given_name: firebaseUser.displayName?.split(' ')[0] || '',
        family_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
      };
      setUser(googleUser);
    } else if (!firebaseUser && user) {
      setUser(null);
    }
  }, [firebaseUser, user]);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    loadStoredUser();
  }, [loadStoredUser]);

  return {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    isSignedIn: !!user,
    isReady,
  };
}