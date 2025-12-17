import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MessagingContext } from "@/hooks/messaging-store";
import { ShopContext } from "@/hooks/shop-store";
import { BadgesContext } from "@/hooks/badges-store";
import { PetsContext } from "@/hooks/pets-store";
import { I18nContext } from "@/hooks/i18n-store";
import { EmergencyContext } from "@/hooks/emergency-store";
import { ThemeContext } from "@/hooks/theme-store";
import { LostFoundContext } from "@/hooks/lost-found-store";
import { BookingContext } from "@/hooks/booking-store";
import { ChallengesContext } from "@/hooks/challenges-store";
import { PremiumContext } from "@/hooks/premium-store";
import { CatSitterContext } from "@/hooks/cat-sitter-store";
import { UnifiedMessagingContext } from "@/hooks/unified-messaging-store";
import { FirebaseUserContext } from "@/hooks/firebase-user-store";
import { SocialContext } from "@/hooks/social-store";
import { FriendsContext } from "@/hooks/friends-store";
import { trpc, trpcClient } from "@/lib/trpc";
import AppBackground from "@/components/AppBackground";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import AdaptiveHeader from "@/components/AdaptiveHeader";
import { useNotifications } from "@/hooks/use-notifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Optimize QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Memoize screen options to prevent unnecessary re-renders
const screenOptions = {
  headerBackTitle: "",
  headerTitle: "",
  headerTintColor: '#0B0B0C',
  headerShadowVisible: false,
  gestureEnabled: true,
  headerTransparent: false,
  headerStyle: {
    backgroundColor: 'transparent',
  },
  headerBackVisible: false,
  header: (props: NativeStackHeaderProps) => <AdaptiveHeader {...props} />,
};

const RootLayoutNav = React.memo(() => {
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signin" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="auth/pro-register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/verify" options={{ headerShown: true }} />
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cat-sitter" options={{ headerShown: false }} />
      <Stack.Screen name="cat-sitter/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="cat-sitter-dashboard" options={{ headerShown: true }} />
      <Stack.Screen name="cat-sitter-settings" options={{ headerShown: true }} />
      <Stack.Screen name="pet/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="pet/add" options={{ headerShown: true }} />
      <Stack.Screen name="pet/edit/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="profile/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: true }} />
      <Stack.Screen name="messages/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="messages/new" options={{ headerShown: true }} />
      <Stack.Screen name="shop/product/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="shop/cart" options={{ headerShown: true }} />
      <Stack.Screen name="shop/order-confirmation" options={{ headerShown: true }} />
      <Stack.Screen name="lost-found/report" options={{ headerShown: true }} />
      <Stack.Screen name="lost-found/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="booking/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="booking/confirmation/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="challenges/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="community/create" options={{ headerShown: true }} />
      <Stack.Screen name="premium" options={{ headerShown: true }} />
      <Stack.Screen name="badges" options={{ headerShown: true }} />
      <Stack.Screen name="friends" options={{ headerShown: true }} />
      <Stack.Screen name="search" options={{ headerShown: true }} />
      <Stack.Screen name="legal/terms" options={{ headerShown: true }} />
      <Stack.Screen name="legal/privacy" options={{ headerShown: true }} />
      <Stack.Screen name="(pro)" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: true }} />
      <Stack.Screen name="firestore-collections" options={{ headerShown: true }} />
      <Stack.Screen name="firebase-seed-challenges" options={{ headerShown: true }} />
    </Stack>
  );
});

RootLayoutNav.displayName = 'RootLayoutNav';

// Optimized Provider composition to reduce nesting and improve performance
const AppProviders = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <I18nContext>
      <FirebaseUserContext>
        <NotificationsProvider>
          <EmergencyContext>
            <PetsContext>
              <ThemeContext>
                <LostFoundContext>
                  <BookingContext>
                    <ChallengesContext>
                      <PremiumContext>
                        <CatSitterContext>
                          <MessagingContext>
                            <UnifiedMessagingContext>
                              <SocialContext>
                                <FriendsContext>
                                  <ShopContext>
                                    <BadgesContext>
                                      {children}
                                    </BadgesContext>
                                  </ShopContext>
                                </FriendsContext>
                              </SocialContext>
                            </UnifiedMessagingContext>
                          </MessagingContext>
                        </CatSitterContext>
                      </PremiumContext>
                    </ChallengesContext>
                  </BookingContext>
                </LostFoundContext>
              </ThemeContext>
            </PetsContext>
          </EmergencyContext>
        </NotificationsProvider>
      </FirebaseUserContext>
    </I18nContext>
  );
});

// Separate notifications provider that uses FirebaseUser
const NotificationsProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  useNotifications();
  return <>{children}</>;
});

NotificationsProvider.displayName = 'NotificationsProvider';

AppProviders.displayName = 'AppProviders';

export default function RootLayout() {
  // Memoize the gesture handler style to prevent re-creation
  const gestureHandlerStyle = useMemo(() => ({ flex: 1 }), []);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <GlobalErrorBoundary>
            <GestureHandlerRootView style={gestureHandlerStyle}>
              <AppProviders>
                <AppBackground>
                  <RootLayoutNav />
                </AppBackground>
              </AppProviders>
            </GestureHandlerRootView>
          </GlobalErrorBoundary>
        </trpc.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}