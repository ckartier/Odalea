import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log('[Splash] Redirecting to animated-splash');
    router.replace('/animated-splash');
  }, [router]);

  return <View style={styles.root} testID="splash-redirect" />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
