import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import Button from '@/components/Button';
import { useAuth } from '@/hooks/auth-store';
import { ArrowLeft } from 'lucide-react-native';

export default function VerifyScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [initialSmsSent, setInitialSmsSent] = useState<boolean>(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  // Set up timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timer]);
  
  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  // Auto-init reCAPTCHA and send SMS on web on first mount
  useEffect(() => {
    const sendInitial = async () => {
      if (initialSmsSent) return;
      if (!user?.phoneNumber) return;
      if (Platform.OS !== 'web') return;
      try {
        const { initWebRecaptcha, sendSmsCode } = await import('@/services/phone-auth');
        const init = initWebRecaptcha('recaptcha-container');
        if (!init.ok) {
          console.log('Failed to init recaptcha on mount', init.error);
          return;
        }
        const formatted = user.phoneNumber.startsWith('+') ? user.phoneNumber : `+33${user.phoneNumber}`;
        const res = await sendSmsCode(formatted);
        if (!res.ok) {
          console.log('Initial SMS send failed', res.error);
        } else {
          console.log('Initial SMS sent');
          setInitialSmsSent(true);
          setTimer(60);
        }
      } catch (e) {
        console.log('Auto SMS init/send failed', e);
      }
    };
    sendInitial();
  }, [initialSmsSent, user?.phoneNumber]);
  
  const handleCodeChange = (text: string, index: number) => {
    const numeric = text.replace(/\D/g, '');
    if (numeric.length === 6) {
      const arr = numeric.split('').slice(0, 6);
      setCode(arr);
      inputRefs.current[5]?.focus();
      return;
    }
    const newCode = [...code];
    newCode[index] = numeric.slice(-1);
    setCode(newCode);
    if (numeric && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyPress = (e: any, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit code');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Verifying code', verificationCode);
      if (Platform.OS === 'web') {
        try {
          const { confirmSmsCode } = await import('@/services/phone-auth');
          const res = await confirmSmsCode(verificationCode);
          if (!res.ok) {
            Alert.alert('Code invalide', res.error);
            return;
          }
        } catch (e) {
          console.log('phone confirm not used on native', e);
        }
      }
      if (type === 'professional' || user?.isProfessional) {
        router.replace('/(pro)/dashboard');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResend = async () => {
    // Reset timer
    setTimer(60);
    
    if (Platform.OS === 'web') {
      try {
        const { initWebRecaptcha, sendSmsCode } = await import('@/services/phone-auth');
        initWebRecaptcha('recaptcha-container');
        if (!user?.phoneNumber) {
          Alert.alert('Téléphone manquant', 'Ajoutez un numéro dans votre profil.');
          return;
        }
        const res = await sendSmsCode(user.phoneNumber.startsWith('+') ? user.phoneNumber : `+33${user.phoneNumber}`);
        if (!res.ok) Alert.alert('Erreur', res.error); else Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé.');
      } catch (e) {
        console.log('resend not available', e);
        Alert.alert('Non disponible', 'La réémission du code n’est disponible que sur le web pour le moment.');
      }
    } else {
      Alert.alert('Non disponible', 'La réémission du code n’est disponible que sur le web pour le moment.');
    }
  };
  
  const handleBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/auth/signup');
      }
    } catch (error) {
      console.log('Navigation error in verify:', error);
      router.replace('/auth/signup');
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <ArrowLeft size={24} color={COLORS.black} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to your phone number
        </Text>
        
        <View style={styles.codeContainer}>
          <View id="recaptcha-container" style={{ height: 0 }} />
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
                SHADOWS.small,
              ]}
              value={digit}
              onChangeText={text => handleCodeChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              testID={`otp-input-${index}`}
              accessibilityLabel={`OTP digit ${index + 1}`}
            />
          ))}
        </View>
        
        <Button
          title="Verify"
          onPress={handleVerify}
          loading={loading}
          style={styles.button}
          testID="verify-submit"
        />

        <TouchableOpacity onPress={async () => {
          try {
            const email = user?.email?.trim();
            if (!email) {
              Alert.alert('Email manquant', 'Ajoutez un email à votre compte.');
              return;
            }
            const magic = Math.random().toString(36).slice(-6).toUpperCase();
            const { emailService } = await import('@/services/email');
            await emailService.sendEmail({
              to: email,
              from: 'noreply@coppet.com',
              subject: 'Lien magique de vérification',
              html: `<p>Votre code: <b>${magic}</b></p><p>Entrez ce code dans l’app pour vérifier votre compte.</p>`,
              text: `Code: ${magic}`,
            });
            Alert.alert('Envoyé', 'Nous avons envoyé un code à votre email.');
          } catch (e) {
            Alert.alert('Erreur', "Impossible d'envoyer le lien magique");
          }
        }} style={{ marginTop: 12 }}>
          <Text style={{ color: COLORS.maleAccent, fontWeight: '600' as const }}>Recevoir un lien magique par email</Text>
        </TouchableOpacity>
        
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.mediumGray,
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: COLORS.maleAccent,
    backgroundColor: COLORS.default,
  },
  button: {
    width: '100%',
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginRight: 4,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.maleAccent,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
});