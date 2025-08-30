import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserContext } from "@/hooks/user-store";
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
import { trpc, trpcClient } from "@/lib/trpc";
import AppBackground from "@/components/AppBackground";
import GlassView from "@/components/GlassView";

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
  headerBackTitle: "Retour",
  headerTitleStyle: {
    fontWeight: '600' as const,
    color: '#0B0B0C',
    fontSize: 18,
  },
  headerTintColor: '#0B0B0C',
  headerShadowVisible: false,
  gestureEnabled: true,
  headerTransparent: true,
  headerBackground: () => (
    <GlassView testID="glass-header" intensity={40} tint="light" style={{ flex: 1 }} />
  ),
};

const RootLayoutNav = React.memo(() => {
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signin" options={{ headerShown: true, title: "Se connecter" }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: true, title: "Créer un compte" }} />
      <Stack.Screen name="auth/pro-register" options={{ headerShown: true, title: "Inscription Pro" }} />
      <Stack.Screen name="auth/verify" options={{ headerShown: true, title: "Vérification" }} />
      <Stack.Screen name="menu" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="cat-sitter" options={{ title: "Cat Sitters", headerShown: false }} />
      <Stack.Screen name="cat-sitter/[id]" options={{ title: "Profil Cat Sitter" }} />
      <Stack.Screen name="pet/[id]" options={{ title: "Profil de l'animal" }} />
      <Stack.Screen name="profile/[id]" options={{ title: "Profil utilisateur" }} />
      <Stack.Screen name="messages/[id]" options={{ title: "Chat" }} />
      <Stack.Screen name="messages/new" options={{ title: "Nouveau message" }} />
      <Stack.Screen name="shop/product/[id]" options={{ title: "Détails du produit" }} />
      <Stack.Screen name="lost-found/report" options={{ title: "Signaler un animal perdu" }} />
      <Stack.Screen name="lost-found/[id]" options={{ title: "Détails animal perdu" }} />
      <Stack.Screen name="booking/[id]" options={{ title: "Réserver Cat Sitter" }} />
      <Stack.Screen name="booking/confirmation/[id]" options={{ title: "Confirmation de réservation" }} />
      <Stack.Screen name="premium" options={{ title: "Abonnement Premium" }} />
      <Stack.Screen name="(pro)" options={{ headerShown: false }} />
      <Stack.Screen name="cat-sitter-dashboard" options={{ title: "Dashboard Cat-Sitter" }} />
      <Stack.Screen name="cat-sitter-settings" options={{ title: "Paramètres Cat-Sitter" }} />
      <Stack.Screen name="legal/terms" options={{ title: "Conditions d'utilisation" }} />
      <Stack.Screen name="legal/privacy" options={{ title: "Politique de confidentialité" }} />
      <Stack.Screen name="firebase-test" options={{ title: "Firebase Connection Test" }} />
      <Stack.Screen name="admin-tools" options={{ title: "Outils Firebase" }} />
    </Stack>
  );
});

RootLayoutNav.displayName = 'RootLayoutNav';

// Optimized Provider composition to reduce nesting and improve performance
const AppProviders = React.memo(({ children }: { children: React.ReactNode }) => {
  return (
    <I18nContext>
      <FirebaseUserContext>
        <UserContext>
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
                                <ShopContext>
                                  <BadgesContext>
                                    {children}
                                  </BadgesContext>
                                </ShopContext>
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
        </UserContext>
      </FirebaseUserContext>
    </I18nContext>
  );
});

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
          <GestureHandlerRootView style={gestureHandlerStyle}>
            <AppProviders>
              <AppBackground>
                <RootLayoutNav />
              </AppBackground>
            </AppProviders>
          </GestureHandlerRootView>
        </trpc.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}