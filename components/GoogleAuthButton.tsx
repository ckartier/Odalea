import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { COLORS } from '@/constants/colors';

interface GoogleSignInButtonProps {
  onSignInSuccess?: (user: any) => void;
  onSignInError?: (error: string) => void;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
}

export function GoogleSignInButton({ 
  onSignInSuccess, 
  onSignInError, 
  style, 
  textStyle, 
  disabled = false 
}: GoogleSignInButtonProps) {
  const { signIn, isLoading, error, user, isSignedIn } = useGoogleAuth();

  React.useEffect(() => {
    if (user && onSignInSuccess) {
      onSignInSuccess(user);
    }
  }, [user, onSignInSuccess]);

  React.useEffect(() => {
    if (error && onSignInError) {
      onSignInError(error);
    }
  }, [error, onSignInError]);

  const handlePress = async () => {
    if (!isLoading && !disabled) {
      await signIn();
    }
  };

  if (isSignedIn) {
    return (
      <View style={[styles.button, styles.signedInButton, style]}>
        <Text style={[styles.buttonText, styles.signedInText, textStyle]}>
          Connecté en tant que {user?.name}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabledButton, style]}
      onPress={handlePress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.maleAccent} size="small" />
      ) : (
        <View style={styles.googleIconContainer}>
          <Text style={styles.googleIcon}>G</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface GoogleSignOutButtonProps {
  onSignOutSuccess?: () => void;
  onSignOutError?: (error: string) => void;
  style?: any;
  textStyle?: any;
}

export function GoogleSignOutButton({ 
  onSignOutSuccess, 
  onSignOutError, 
  style, 
  textStyle 
}: GoogleSignOutButtonProps) {
  const { signOut, isLoading, error, isSignedIn } = useGoogleAuth();

  React.useEffect(() => {
    if (!isSignedIn && onSignOutSuccess) {
      onSignOutSuccess();
    }
  }, [isSignedIn, onSignOutSuccess]);

  React.useEffect(() => {
    if (error && onSignOutError) {
      onSignOutError(error);
    }
  }, [error, onSignOutError]);

  const handlePress = async () => {
    if (!isLoading) {
      await signOut();
    }
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.signOutButton, style]}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>
          Se déconnecter
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  disabledButton: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderColor: 'rgba(200, 200, 200, 0.4)',
  },
  signedInButton: {
    backgroundColor: 'rgba(52, 168, 83, 0.3)',
    borderColor: 'rgba(52, 168, 83, 0.4)',
  },
  signOutButton: {
    backgroundColor: 'rgba(234, 67, 53, 0.3)',
    borderColor: 'rgba(234, 67, 53, 0.4)',
  },
  buttonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signedInText: {
    marginLeft: 0,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
});