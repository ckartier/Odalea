import React from 'react';
import { Redirect } from 'expo-router';
import { useUser } from '@/hooks/user-store';

export default function IndexScreen() {
  const { user, loading } = useUser();

  // Show loading while checking auth state
  if (loading) {
    return null;
  }

  // If user is authenticated, redirect based on user type
  if (user) {
    // Professional users go to their dashboard
    if (user.isProfessional) {
      return <Redirect href="/(pro)/dashboard" />;
    }
    // Regular users go to community page (new home)
    return <Redirect href="/(tabs)/community" />;
  }

  // For non-authenticated users, redirect to splash screen
  return <Redirect href="/splash" />;
}