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
} from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '636879478460-35suv6bcvirou1k1ma8e7emggq9odsth.apps.googleusercontent.com';

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

interface PreparedRequest {
  request: AuthSession.AuthRequest;
  codeVerifier: string;
}

class GoogleAuthService {
  private clientId: string;
  private redirectUri: string;
  private preparedRequest: PreparedRequest | null = null;
  private isPreparingRequest: boolean = false;

  constructor() {
    const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

    this.clientId = web;
    
    console.log('[GoogleAuth] HARDCODED WEB CLIENT ID:', GOOGLE_WEB_CLIENT_ID);
    console.log('[GoogleAuth] FINAL CLIENT ID:', this.clientId);

    const scheme = (Constants.expoConfig?.scheme as string | undefined)
      ?? (Constants.expoConfig?.slug as string | undefined)
      ?? 'myapp';

    if (Platform.OS === 'web') {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:19006';
      this.redirectUri = `${origin}/`;
    } else {
      this.redirectUri = AuthSession.makeRedirectUri({
        scheme,
      });
    }

    console.log('[GoogleAuth] Using scheme:', scheme);
    console.log('[GoogleAuth] Redirect URI:', this.redirectUri);
    console.log('[GoogleAuth] Client ID present:', !!this.clientId);
    console.log('[GoogleAuth] Platform:', Platform.OS);

    this.prepareRequest();
  }

  private async prepareRequest(): Promise<PreparedRequest | null> {
    if (this.isPreparingRequest) {
      console.log('[GoogleAuth] Already preparing request, waiting...');
      while (this.isPreparingRequest) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.preparedRequest;
    }

    if (this.preparedRequest) {
      return this.preparedRequest;
    }

    this.isPreparingRequest = true;
    
    try {
      console.log('[GoogleAuth] Pre-building auth request...');
      
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

      this.preparedRequest = { request, codeVerifier };
      console.log('[GoogleAuth] Auth request pre-built successfully');
      return this.preparedRequest;
    } catch (error) {
      console.error('[GoogleAuth] Failed to pre-build request:', error);
      return null;
    } finally {
      this.isPreparingRequest = false;
    }
  }

  async ensureRequestReady(): Promise<boolean> {
    if (this.preparedRequest) return true;
    const prepared = await this.prepareRequest();
    return prepared !== null;
  }

  signIn(): Promise<GoogleAuthResponse | null> {
    console.log('[GoogleAuth] signIn called - executing SYNCHRONOUSLY');
    
    if (!this.clientId) {
      console.error('[GoogleAuth] Missing client ID');
      return Promise.reject(new Error('Google client ID missing'));
    }

    if (!this.preparedRequest) {
      console.error('[GoogleAuth] Request not prepared - call ensureRequestReady() first');
      return Promise.reject(new Error('Auth request not ready. Please try again.'));
    }

    const { request, codeVerifier } = this.preparedRequest;
    
    this.preparedRequest = null;
    this.prepareRequest();

    console.log('[GoogleAuth] Calling promptAsync IMMEDIATELY (synchronous with user gesture)');
    
    return request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }).then(async (result) => {
      console.log('[GoogleAuth] promptAsync result:', result.type);
      
      if (result.type !== 'success') {
        console.log('[GoogleAuth] Auth cancelled or failed');
        return null;
      }

      console.log('[GoogleAuth] Exchanging code for tokens...');
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

      console.log('[GoogleAuth] Signing in to Firebase...');
      const credential = GoogleAuthProvider.credential(
        tokenResponse.idToken,
        tokenResponse.accessToken,
      );
      const firebaseResult = await signInWithCredential(auth, credential);
      const u = firebaseResult.user;
      
      console.log('[GoogleAuth] Sign-in successful:', u.email);
      
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
    }).catch((error: unknown) => {
      console.error('[GoogleAuth] Sign-In Error:', error);
      throw error instanceof Error ? error : new Error('Sign-in failed');
    });
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