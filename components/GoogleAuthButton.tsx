import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useGoogleAuth } from '@/hooks/use-google-auth';

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
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Text style={[styles.googleIcon]}>G</Text>
          <Text style={[styles.buttonText, textStyle]}>
            Se connecter avec Google
          </Text>
        </>
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
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  signedInButton: {
    backgroundColor: '#34A853',
  },
  signOutButton: {
    backgroundColor: '#EA4335',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  signedInText: {
    marginLeft: 0,
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
  },
});