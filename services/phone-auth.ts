import { Platform } from 'react-native';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, UserCredential } from 'firebase/auth';
import { auth } from '@/services/firebase';

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmation: ConfirmationResult | null = null;

export type PhoneAuthInitResult = { ok: true } | { ok: false; error: string };
export type PhoneSendResult = { ok: true } | { ok: false; error: string };
export type PhoneConfirmResult = { ok: true; user: UserCredential['user'] } | { ok: false; error: string };

export function initWebRecaptcha(containerId = 'recaptcha-container'): PhoneAuthInitResult {
  if (Platform.OS !== 'web') {
    return { ok: false, error: 'SMS auth not supported in Expo Go (native). Use web.' };
  }
  try {
    if (!recaptchaVerifier) {
      console.log('[PhoneAuth] Initializing reCAPTCHA with container:', containerId);
      const container = typeof document !== 'undefined' ? document.getElementById(containerId) : null;
      if (!container) {
        console.error('[PhoneAuth] Container element not found:', containerId);
        return { ok: false, error: 'reCAPTCHA container not found' };
      }
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('[PhoneAuth] reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('[PhoneAuth] reCAPTCHA expired');
        },
      } as any);
      console.log('[PhoneAuth] reCAPTCHA initialized successfully');
    }
    return { ok: true };
  } catch (e: any) {
    console.error('[PhoneAuth] init recaptcha error', e?.message ?? String(e));
    return { ok: false, error: e?.message ?? 'Failed to init reCAPTCHA' };
  }
}

export async function sendSmsCode(e164Phone: string): Promise<PhoneSendResult> {
  if (Platform.OS !== 'web') {
    return { ok: false, error: 'SMS auth not supported in Expo Go (native). Use web.' };
  }
  try {
    console.log('[PhoneAuth] Sending SMS to:', e164Phone);
    if (!recaptchaVerifier) {
      console.log('[PhoneAuth] reCAPTCHA not initialized, initializing now');
      const init = initWebRecaptcha();
      if (!init.ok) {
        console.error('[PhoneAuth] Failed to initialize reCAPTCHA:', init.error);
        return { ok: false, error: init.error };
      }
    }
    console.log('[PhoneAuth] Calling signInWithPhoneNumber');
    confirmation = await signInWithPhoneNumber(auth, e164Phone, recaptchaVerifier as RecaptchaVerifier);
    console.log('[PhoneAuth] SMS sent successfully');
    return { ok: true };
  } catch (e: any) {
    console.error('[PhoneAuth] send sms error', e?.message ?? String(e), e);
    let errorMsg = e?.message ?? 'Failed to send SMS';
    if (errorMsg.includes('auth/invalid-phone-number')) {
      errorMsg = 'Numéro de téléphone invalide. Utilisez le format E.164 (ex: +33612345678)';
    } else if (errorMsg.includes('auth/quota-exceeded')) {
      errorMsg = 'Quota SMS dépassé. Réessayez plus tard.';
    } else if (errorMsg.includes('auth/captcha-check-failed')) {
      errorMsg = 'Vérification reCAPTCHA échouée. Réessayez.';
      recaptchaVerifier = null;
    }
    return { ok: false, error: errorMsg };
  }
}

export async function confirmSmsCode(code: string): Promise<PhoneConfirmResult> {
  if (Platform.OS !== 'web') {
    return { ok: false, error: 'Not supported on native' };
  }
  try {
    console.log('[PhoneAuth] Confirming SMS code:', code);
    if (!confirmation) {
      console.error('[PhoneAuth] No pending verification');
      return { ok: false, error: 'Aucune vérification en attente. Veuillez d\'abord demander un code.' };
    }
    const cred = await confirmation.confirm(code);
    console.log('[PhoneAuth] SMS code confirmed successfully');
    confirmation = null;
    return { ok: true, user: cred.user };
  } catch (e: any) {
    console.error('[PhoneAuth] confirm sms error', e?.message ?? String(e));
    let errorMsg = e?.message ?? 'Code invalide';
    if (errorMsg.includes('auth/invalid-verification-code')) {
      errorMsg = 'Code de vérification invalide';
    } else if (errorMsg.includes('auth/code-expired')) {
      errorMsg = 'Code expiré. Demandez un nouveau code.';
      confirmation = null;
    }
    return { ok: false, error: errorMsg };
  }
}
