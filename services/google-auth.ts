import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { auth } from '@/services/firebase';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  signInWithPopup,
} from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export interface GoogleAuthResponse {
  user: GoogleUser;
  accessToken: string;
  idToken?: string;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
    const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
    const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';

    const fallbacks = {
      web: web || ios || android || '',
      ios: ios || web || android || '',
      android: android || web || ios || '',
    } as const;

    this.clientId = (Platform.select({ ios: fallbacks.ios, android: fallbacks.android, web: fallbacks.web, default: fallbacks.web }) ?? '') as string;

    const scheme = (Constants.expoConfig?.scheme as string | undefined)
      ?? (Constants.expoConfig?.slug as string | undefined)
      ?? 'myapp';

    if (Platform.OS === 'web') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      this.redirectUri = `${origin}/`;
    } else {
      this.redirectUri = AuthSession.makeRedirectUri({
        scheme,
      });
    }

    console.log('[GoogleAuth] Using scheme:', scheme);
    console.log('[GoogleAuth] Redirect URI:', this.redirectUri);
  }

  async signIn(): Promise<GoogleAuthResponse | null> {
    try {
      if (Platform.OS === 'web') {
        if (!this.clientId) {
          throw new Error('Google client ID missing');
        }

        const codeVerifier = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        const codeChallengeRaw = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          codeVerifier,
          { encoding: Crypto.CryptoEncoding.BASE64 },
        );
        const codeChallenge = codeChallengeRaw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        const request = new AuthSession.AuthRequest({
          clientId: this.clientId,
          scopes: ['openid', 'profile', 'email'],
          responseType: AuthSession.ResponseType.Code,
          redirectUri: this.redirectUri,
          codeChallenge,
          codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
          extraParams: { access_type: 'offline', prompt: 'consent' },
        });

        const result = await request.promptAsync({
          authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        });

        if (result.type !== 'success') return null;

        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: this.clientId,
            code: result.params.code,
            redirectUri: this.redirectUri,
            extraParams: { code_verifier: codeVerifier },
          },
          { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
        );

        if (!tokenResponse.idToken) {
          throw new Error('No id_token returned by Google');
        }

        const credential = GoogleAuthProvider.credential(
          tokenResponse.idToken,
          tokenResponse.accessToken,
        );
        const firebaseResult = await signInWithCredential(auth, credential);
        const u = firebaseResult.user;
        return {
          user: {
            id: u.uid,
            email: u.email ?? '',
            name: u.displayName ?? '',
            picture: u.photoURL ?? '',
            given_name: (u.displayName ?? '').split(' ')[0] ?? '',
            family_name: (u.displayName ?? '').split(' ').slice(1).join(' ') ?? '',
          },
          accessToken: tokenResponse.accessToken ?? '',
          idToken: tokenResponse.idToken,
        };
      }

      if (!this.clientId) {
        throw new Error('Google client ID missing');
      }

      const codeVerifier = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const codeChallengeRaw = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 },
      );
      const codeChallenge = codeChallengeRaw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      const request = new AuthSession.AuthRequest({
        clientId: this.clientId,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri: this.redirectUri,
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        extraParams: { access_type: 'offline', prompt: 'consent' },
      });

      const result = await request.promptAsync(
        {
          authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        }
      );

      if (result.type !== 'success') return null;

      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: this.clientId,
          code: result.params.code,
          redirectUri: this.redirectUri,
          extraParams: { code_verifier: codeVerifier },
        },
        { tokenEndpoint: 'https://oauth2.googleapis.com/token' },
      );

      if (!tokenResponse.idToken) {
        throw new Error('No id_token returned by Google');
      }

      const credential = GoogleAuthProvider.credential(
        tokenResponse.idToken,
        tokenResponse.accessToken,
      );
      const firebaseResult = await signInWithCredential(auth, credential);
      const u = firebaseResult.user;
      return {
        user: {
          id: u.uid,
          email: u.email ?? '',
          name: u.displayName ?? '',
          picture: u.photoURL ?? '',
          given_name: (u.displayName ?? '').split(' ')[0] ?? '',
          family_name: (u.displayName ?? '').split(' ').slice(1).join(' ') ?? '',
        },
        accessToken: tokenResponse.accessToken ?? '',
        idToken: tokenResponse.idToken,
      };
    } catch (error: unknown) {
      console.error('Google Sign-In Error:', error);
      throw error instanceof Error ? error : new Error('Sign-in failed');
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      if (Platform.OS === 'web') {
        await WebBrowser.openBrowserAsync('https://accounts.google.com/logout');
      }
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
    }
  }

  async revokeAccess(accessToken: string): Promise<void> {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: 'POST' });
    } catch (error) {
      console.error('Google Revoke Access Error:', error);
    }
  }
}

export const googleAuth = new GoogleAuthService();