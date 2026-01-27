import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react-native';
import { useFirebaseConnection } from '@/hooks/useFirebaseConnection';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  showWhenConnected?: boolean;
}

export default function ConnectionStatusBanner({ showWhenConnected = false }: Props) {
  const insets = useSafeAreaInsets();
  const { status, isConnected, checkConnection, error } = useFirebaseConnection();
  const [visible, setVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const shouldShow = !isConnected || (showWhenConnected && status === 'connecting');
    
    if (shouldShow && !visible) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && visible) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isConnected, status, showWhenConnected, visible, fadeAnim]);

  if (!visible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          backgroundColor: '#FEF3C7',
          textColor: '#92400E',
          icon: <RefreshCw size={16} color="#92400E" />,
          message: 'Connexion en cours...',
        };
      case 'error':
        return {
          backgroundColor: '#FEE2E2',
          textColor: '#991B1B',
          icon: <WifiOff size={16} color="#991B1B" />,
          message: error || 'Erreur de connexion',
        };
      case 'disconnected':
        return {
          backgroundColor: '#FEE2E2',
          textColor: '#991B1B',
          icon: <WifiOff size={16} color="#991B1B" />,
          message: 'Connexion perdue',
        };
      default:
        return {
          backgroundColor: '#D1FAE5',
          textColor: '#065F46',
          icon: <Wifi size={16} color="#065F46" />,
          message: 'Connecté',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          paddingTop: insets.top > 0 ? insets.top : 8,
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
        {config.icon}
        <Text style={[styles.text, { color: config.textColor }]}>
          {config.message}
        </Text>
        {(status === 'error' || status === 'disconnected') && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={checkConnection}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color={config.textColor} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  retryButton: {
    padding: 4,
  },
});
