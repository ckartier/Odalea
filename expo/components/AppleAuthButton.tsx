import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, Text } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Apple } from 'lucide-react-native';
import { appleAuth, AppleUser } from '@/services/apple-auth';


interface AppleSignInButtonProps {
  onSignInSuccess: (user: AppleUser) => void;
  onSignInError: (error: string) => void;
  style?: object;
}

export function AppleSignInButton({
  onSignInSuccess,
  onSignInError,
  style,
}: AppleSignInButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      const available = await appleAuth.isAvailable();
      setIsAvailable(available);
    };
    checkAvailability();
  }, []);

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);

    try {
      console.log('[AppleButton] Starting sign-in...');
      const result = await appleAuth.signIn();

      if (result) {
        console.log('[AppleButton] Sign-in successful:', result.user.id);
        onSignInSuccess(result.user);
      } else {
        console.log('[AppleButton] Sign-in cancelled');
      }
    } catch (error) {
      console.error('[AppleButton] Sign-in error:', error);
      const message = error instanceof Error ? error.message : 'Erreur de connexion Apple';
      onSignInError(message);
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        style={[styles.socialButton, style]}
        onPress={() => onSignInError('Apple Sign-In n\'est pas disponible sur le web')}
        activeOpacity={0.8}
      >
        <View style={styles.appleIconContainer}>
          <Apple size={20} color="#000" fill="#000" />
        </View>
      </TouchableOpacity>
    );
  }

  if (!isAvailable) {
    return (
      <TouchableOpacity
        style={[styles.socialButton, styles.disabledButton, style]}
        disabled
        activeOpacity={0.5}
      >
        <View style={styles.appleIconContainer}>
          <Apple size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, style]}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={28}
          style={styles.appleButton}
          onPress={handleSignIn}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.socialButton, style]}
      onPress={handleSignIn}
      disabled={loading}
      activeOpacity={0.8}
    >
      <View style={styles.appleIconContainer}>
        <Apple size={20} color="#000" fill="#000" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 56,
    overflow: 'hidden',
  },
  appleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  socialButton: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  appleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppleSignInButton;
