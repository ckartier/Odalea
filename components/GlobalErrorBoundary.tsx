import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { COLORS } from '@/constants/colors';

type GlobalErrorBoundaryProps = {
  children: React.ReactNode;
};

type GlobalErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export default class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = {
    hasError: false,
    errorMessage: undefined,
  };

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message ?? 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary] Captured error', { error, info });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="global-error-boundary">
          <View style={styles.card} testID="global-error-card">
            <Text style={styles.title}>Quelque chose s’est mal passé</Text>
            <Text style={styles.message} numberOfLines={3}>
              {this.state.errorMessage ?? 'Erreur inconnue'}
            </Text>
            <Pressable onPress={this.handleRetry} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} testID="global-error-retry">
              <Text style={styles.buttonText}>Réessayer</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  button: {
    borderRadius: 18,
    backgroundColor: COLORS.primary ?? '#635BFF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
