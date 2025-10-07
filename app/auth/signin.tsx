import React, { useEffect, useMemo, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Logo from '@/components/Logo';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { useI18n } from '@/hooks/i18n-store';
import { Mail, Lock, ArrowLeft, Smartphone, MessageSquare, Briefcase, Shield, ShieldCheck } from 'lucide-react-native';
import { GoogleSignInButton } from '@/components/GoogleAuthButton';
import ResponsiveModal from '@/components/ResponsiveModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emailService } from '@/services/email';
import GlassView from '@/components/GlassView';
import { LinearGradient } from 'expo-linear-gradient';

import { RESPONSIVE_SPACING, RESPONSIVE_FONT_SIZES, IS_SMALL_DEVICE, RESPONSIVE_LAYOUT, RESPONSIVE_COMPONENT_SIZES } from '@/constants/responsive';

function SignInScreen() {
  const router = useRouter();
  const { signIn } = useFirebaseUser();
  const { t } = useI18n();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [signInMethod, setSignInMethod] = useState<'email' | 'phone' | 'sms'>('email');
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string }>({});
  const [forgotVisible, setForgotVisible] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [captchaA, setCaptchaA] = useState<number>(0);
  const [captchaB, setCaptchaB] = useState<number>(0);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setCaptchaA(a);
    setCaptchaB(b);
    setCaptchaAnswer('');
  };

  const openForgot = () => {
    setResetEmail(email);
    generateCaptcha();
    setForgotVisible(true);
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        router.replace('/(tabs)/map');
      } else {
        Alert.alert('Sign In Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async () => {
    try {
      if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
        Alert.alert('Erreur', 'Veuillez entrer un email valide');
        return;
      }
      const expected = captchaA + captchaB;
      const provided = Number(captchaAnswer.trim());
      if (Number.isNaN(provided) || provided !== expected) {
        Alert.alert('Vérification', 'Réponse de sécurité incorrecte');
        generateCaptcha();
        return;
      }
      if (cooldown > 0) return;
      setResetLoading(true);
      const code = Math.random().toString(36).slice(-8).toUpperCase();
      await AsyncStorage.setItem(`passwordReset:${resetEmail.toLowerCase()}`, JSON.stringify({ code, ts: Date.now() }));
      await emailService.sendEmail({
        to: resetEmail,
        from: 'noreply@coppet.com',
        subject: 'Réinitialisation du mot de passe',
        html: `<p>Voici votre code de réinitialisation: <strong>${code}</strong></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
        text: `Code de réinitialisation: ${code}`,
      });
      setCooldown(60);
      setForgotVisible(false);
      Alert.alert('Si un compte existe', "Si un compte est associé à cet email, un message de réinitialisation a été envoyé.");
    } catch (e) {
      console.log('reset error', e);
      Alert.alert('Erreur', 'Impossible de traiter la demande pour le moment');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    try {
      Alert.alert('Info', `Connexion ${provider} bientôt disponible`);
    } catch (error) {
      Alert.alert('Error', `Failed to sign in with ${provider}`);
      console.error(error);
    }
  };
  
  const handleBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/onboarding');
      }
    } catch (error) {
      console.log('Navigation error in signin:', error);
      router.replace('/onboarding');
    }
  };
  
  const handleSignUp = () => {
    router.push('/auth/signup');
  };
  
  const spacing = RESPONSIVE_SPACING;
  const fonts = RESPONSIVE_FONT_SIZES;
  const layout = RESPONSIVE_LAYOUT;
  const components = RESPONSIVE_COMPONENT_SIZES;

  const dynamicStyles = useMemo(() => ({
    title: { fontSize: fonts.xxxl },
    subtitle: { fontSize: fonts.lg },
    methodText: { fontSize: IS_SMALL_DEVICE ? fonts.sm : fonts.md },
    socialButtonText: { fontSize: fonts.md },
    footerText: { fontSize: fonts.sm },
  }), [fonts]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 20}
      >
        <StatusBar style="dark" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Logo size="medium" />
        </View>
        
        <Text style={[styles.title, dynamicStyles.title]}>{t('auth.welcome')}</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>{t('auth.tagline')}</Text>
        
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodButton, signInMethod === 'email' && styles.methodButtonActive]}
            onPress={() => setSignInMethod('email')}
          >
            <Mail size={20} color={signInMethod === 'email' ? COLORS.white : COLORS.darkGray} />
            <Text style={[styles.methodText, dynamicStyles.methodText, signInMethod === 'email' && styles.methodTextActive]}>
              {t('auth.email')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.methodButton, signInMethod === 'phone' && styles.methodButtonActive]}
            onPress={() => setSignInMethod('phone')}
          >
            <Smartphone size={20} color={signInMethod === 'phone' ? COLORS.white : COLORS.darkGray} />
            <Text style={[styles.methodText, dynamicStyles.methodText, signInMethod === 'phone' && styles.methodTextActive]}>
              {t('auth.phone')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.methodButton, signInMethod === 'sms' && styles.methodButtonActive]}
            onPress={() => setSignInMethod('sms')}
          >
            <MessageSquare size={20} color={signInMethod === 'sms' ? COLORS.white : COLORS.darkGray} />
            <Text style={[styles.methodText, dynamicStyles.methodText, signInMethod === 'sms' && styles.methodTextActive]}>
              {t('auth.sms')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <GlassView style={styles.formContainer} liquidGlass tint="neutral" intensity={40} testID="signin-form">
          {signInMethod === 'email' && (
            <>
              <Input
                label={t('auth.email')}
                placeholder={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                leftIcon={<Mail size={20} color={COLORS.darkGray} />}
              />
              
              <Input
                label={t('auth.password')}
                placeholder={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                isPassword
                error={errors.password}
                leftIcon={<Lock size={20} color={COLORS.darkGray} />}
                testID="password-input"
              />
              <TouchableOpacity accessibilityRole="button" testID="forgot-password-button" onPress={openForgot} style={styles.forgotLinkContainer}>
                <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </>
          )}
          
          {(signInMethod === 'phone' || signInMethod === 'sms') && (
            <Input
              label={t('auth.phone')}
              placeholder="+33 6 12 34 56 78"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              error={errors.phone}
              leftIcon={<Smartphone size={20} color={COLORS.darkGray} />}
            />
          )}
          
          {signInMethod === 'email' && (
            <Button
              title={t('auth.sign_in')}
              onPress={handleSignIn}
              loading={loading}
              style={styles.button}
              testID="signin-submit"
            />
          )}
          {signInMethod !== 'email' && (
            <View>
              <View id="recaptcha-container" style={{ height: 0 }} />
              <Button
                title="Envoyer le code SMS"
                onPress={async () => {
                  const { initWebRecaptcha, sendSmsCode } = await import('@/services/phone-auth');
                  const init = initWebRecaptcha('recaptcha-container');
                  if (!init.ok) {
                    Alert.alert('Erreur', init.error);
                    return;
                  }
                  const phone = phoneNumber.trim();
                  if (!phone.startsWith('+')) {
                    Alert.alert('Format', 'Utilisez le format E.164, ex: +33612345678');
                    return;
                  }
                  const res = await sendSmsCode(phone);
                  if (!res.ok) Alert.alert('Erreur', res.error); else Alert.alert('SMS', 'Code envoyé. Entrez-le sur l\'écran Vérification.');
                }}
                style={styles.button}
                testID="send-sms"
              />
              <TouchableOpacity onPress={() => router.push('/auth/verify')} style={{ alignSelf: 'center', marginTop: 8 }}>
                <Text style={{ color: COLORS.maleAccent, fontWeight: '600' as const }}>J\'ai déjà un code</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            testID="prefill-test"
            onPress={() => {
              setSignInMethod('email');
              setEmail('test3@gmail.com');
              setPassword('123456');
            }}
            style={styles.fillTestButton}
          >
            <Text style={styles.fillTestText}>Remplir test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            testID="open-seed"
            onPress={() => router.push('/firebase-seed')}
            style={styles.seedLinkButton}
          >
            <Text style={styles.seedLinkText}>Ouvrir Seed Firestore</Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('auth.or_continue_with')}</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.socialButtonsContainer}>
            <GoogleSignInButton
              onSignInSuccess={(user) => {
                console.log('Google Sign-In Success:', user);
                router.replace('/(tabs)/map');
              }}
              onSignInError={(error) => {
                Alert.alert('Erreur Google', error);
              }}
              style={styles.googleButton}
            />
            
            <TouchableOpacity
              style={[styles.socialButton, SHADOWS.small]}
              onPress={() => handleSocialSignIn('apple')}
            >
              <Text style={[styles.socialButtonText, dynamicStyles.socialButtonText]}>{t('auth.apple')}</Text>
            </TouchableOpacity>
          </View>
        </GlassView>
        
        <View style={styles.footer} testID="signin-footer">
          <Text style={[styles.footerText, dynamicStyles.footerText]}>{t('auth.dont_have_account')}</Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.footerLink}>{t('auth.sign_up')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.professionalSection}>
          <TouchableOpacity 
            style={styles.professionalButton}
            onPress={() => router.push('/auth/pro-register')}
          >
            <Briefcase size={20} color={COLORS.maleAccent} />
            <Text style={styles.professionalText}>Je suis un professionnel</Text>
          </TouchableOpacity>
        </View>
        <ResponsiveModal isVisible={forgotVisible} onClose={() => setForgotVisible(false)} size="small" testID="forgot-modal">
          <View style={styles.modalHeader}>
            <ShieldCheck size={20} color={COLORS.maleAccent} />
            <Text style={styles.modalTitle}>Réinitialiser le mot de passe</Text>
          </View>
          <Input
            label="Email"
            placeholder="votre@email.com"
            value={resetEmail}
            onChangeText={setResetEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={COLORS.darkGray} />}
            testID="reset-email-input"
          />
          <View style={styles.captchaRow}>
            <Shield size={18} color={COLORS.darkGray} />
            <Text style={styles.captchaText}>{captchaA} + {captchaB} = ?</Text>
          </View>
          <Input
            label="Vérification"
            placeholder="Votre réponse"
            value={captchaAnswer}
            onChangeText={setCaptchaAnswer}
            keyboardType="number-pad"
            testID="captcha-input"
          />
          <Button
            title={cooldown > 0 ? `Envoyer (${cooldown}s)` : 'Envoyer le lien'}
            onPress={handleResetPassword}
            loading={resetLoading}
            disabled={cooldown > 0}
            style={styles.button}
            testID="send-reset"
          />
        </ResponsiveModal>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: IS_SMALL_DEVICE ? 16 : 24,
    paddingTop: IS_SMALL_DEVICE ? 32 : 48,
    paddingBottom: IS_SMALL_DEVICE ? 24 : 40,
  },
  backButton: {
    position: 'absolute',
    top: IS_SMALL_DEVICE ? 24 : 40,
    left: IS_SMALL_DEVICE ? 16 : 24,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: IS_SMALL_DEVICE ? 24 : 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: IS_SMALL_DEVICE ? 20 : 28,
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.mediumGray,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.darkGray,
  },
  forgotLinkContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  forgotLink: {
    color: COLORS.maleAccent,
    fontWeight: '600' as const,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: IS_SMALL_DEVICE ? 12 : 16,
  },
  socialButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
  },
  fillTestButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: COLORS.neutral,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
  },
  fillTestText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  seedLinkButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  seedLinkText: {
    color: COLORS.maleAccent,
    fontSize: 13,
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginRight: 4,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.maleAccent,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 4,
    marginBottom: IS_SMALL_DEVICE ? 16 : 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IS_SMALL_DEVICE ? 10 : 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  methodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
  },
  methodTextActive: {
    color: COLORS.white,
  },
  professionalSection: {
    marginTop: IS_SMALL_DEVICE ? 16 : 24,
    paddingTop: IS_SMALL_DEVICE ? 16 : 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  professionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IS_SMALL_DEVICE ? 12 : 16,
    paddingHorizontal: IS_SMALL_DEVICE ? 16 : 20,
    backgroundColor: COLORS.neutral,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.maleAccent,
    gap: 12,
    ...SHADOWS.small,
  },
  professionalText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.maleAccent,
  },
  googleButton: {
    flex: 1,
    marginRight: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  captchaText: {
    color: COLORS.darkGray,
  },
});

export default SignInScreen;
