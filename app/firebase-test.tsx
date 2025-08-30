import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import FirebaseTest from '@/components/FirebaseTest';
import { databaseService } from '@/services/database';
import { COLORS } from '@/constants/colors';

export default function FirebaseTestPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Firebase Connection Test',
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      <View style={styles.content}>
        <FirebaseTest testId="firebase-connection-test" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  content: {
    flex: 1,
    padding: 0,
  },
});