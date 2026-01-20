import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { auth } from '@/services/firebase';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';

export interface AppleUser {
  id: string;
  email: string | null;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
}

export interface AppleAuthResponse {
  user: AppleUser;
  identityToken: string;
}

class AppleAuthService {
  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }

  async signIn(): Promise<AppleAuthResponse | null> {
    try {
      if (Platform.OS === 'web') {
        throw new Error('Apple Sign-In is not available on web');
      }

      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      console.log('[AppleAuth] Starting Apple Sign-In...');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      console.log('[AppleAuth] Apple credential received');

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const provider = new OAuthProvider('apple.com');
      const oAuthCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: nonce,
      });

      console.log('[AppleAuth] Signing in with Firebase...');
      const firebaseResult = await signInWithCredential(auth, oAuthCredential);
      const u = firebaseResult.user;

      console.log('[AppleAuth] Firebase sign-in successful:', u.uid);

      const fullName = credential.fullName;
      const displayName = fullName
        ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
        : u.displayName;

      return {
        user: {
          id: u.uid,
          email: credential.email ?? u.email,
          name: displayName ?? null,
          givenName: fullName?.givenName ?? null,
          familyName: fullName?.familyName ?? null,
        },
        identityToken: credential.identityToken,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const appleError = error as { code: string };
        if (appleError.code === 'ERR_REQUEST_CANCELED') {
          console.log('[AppleAuth] User cancelled sign-in');
          return null;
        }
      }
      console.error('[AppleAuth] Sign-In Error:', error);
      throw error instanceof Error ? error : new Error('Apple Sign-In failed');
    }
  }

  async getCredentialState(userId: string): Promise<AppleAuthentication.AppleAuthenticationCredentialState | null> {
    if (Platform.OS === 'web') {
      return null;
    }
    try {
      return await AppleAuthentication.getCredentialStateAsync(userId);
    } catch {
      return null;
    }
  }
}

export const appleAuth = new AppleAuthService();
