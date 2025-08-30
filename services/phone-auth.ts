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
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        },
      } as any);
    }
    return { ok: true };
  } catch (e: any) {
    console.log('init recaptcha error', e?.message ?? String(e));
    return { ok: false, error: e?.message ?? 'Failed to init reCAPTCHA' };
  }
}

export async function sendSmsCode(e164Phone: string): Promise<PhoneSendResult> {
  if (Platform.OS !== 'web') {
    return { ok: false, error: 'SMS auth not supported in Expo Go (native). Use web.' };
  }
  try {
    if (!recaptchaVerifier) {
      const init = initWebRecaptcha();
      if (!init.ok) return { ok: false, error: init.error };
    }
    confirmation = await signInWithPhoneNumber(auth, e164Phone, recaptchaVerifier as RecaptchaVerifier);
    console.log('SMS sent');
    return { ok: true };
  } catch (e: any) {
    console.log('send sms error', e?.message ?? String(e));
    return { ok: false, error: e?.message ?? 'Failed to send SMS' };
  }
}

export async function confirmSmsCode(code: string): Promise<PhoneConfirmResult> {
  if (Platform.OS !== 'web') {
    return { ok: false, error: 'Not supported on native' };
  }
  try {
    if (!confirmation) return { ok: false, error: 'No pending verification' };
    const cred = await confirmation.confirm(code);
    return { ok: true, user: cred.user };
  } catch (e: any) {
    console.log('confirm sms error', e?.message ?? String(e));
    return { ok: false, error: e?.message ?? 'Invalid code' };
  }
}
