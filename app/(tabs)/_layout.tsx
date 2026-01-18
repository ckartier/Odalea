import React, { useMemo, useCallback } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IS_TABLET, RESPONSIVE_LAYOUT, COLORS } from "@/constants/colors";
import AppHeader, { useAppHeaderHeight } from "@/components/AppHeader";
import { Heart, MessageCircle, Plus, User, Sparkles } from "lucide-react-native";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const headerHeight = useAppHeaderHeight();

  const showMenu = true;

  const handleMenuPress = useCallback(() => {
    router.push('/menu' as any);
  }, [router]);

  const containerStyle = useMemo(() => ([
    styles.container,
    {
      paddingTop: headerHeight,
      maxWidth: IS_TABLET ? RESPONSIVE_LAYOUT.contentMaxWidth : '100%',
      alignSelf: IS_TABLET ? 'center' : 'stretch',
    },
  ]), [headerHeight]);

  return (
    <>
      <AppHeader 
        showMenu={showMenu} 
        showNotifications={true}
        notificationCount={0}
        onMenuPress={handleMenuPress}
      />

      <View style={containerStyle}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.gray,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              height: 80 + insets.bottom,
              paddingBottom: insets.bottom + 8,
              paddingTop: 12,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginTop: 4,
            },
          }}
        >
          <Tabs.Screen 
            name="home" 
            options={{ 
              title: "Découvrir",
              tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
            }} 
          />
          <Tabs.Screen 
            name="challenges" 
            options={{ 
              title: "Matchs",
              tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
            }} 
          />
          <Tabs.Screen 
            name="shop" 
            options={{ 
              title: "Ajouter",
              tabBarIcon: ({ color, size }) => (
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Plus size={28} color="#FFFFFF" strokeWidth={3} />
                </View>
              ),
            }} 
          />
          <Tabs.Screen 
            name="messages" 
            options={{ 
              title: "Messages",
              tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
            }} 
          />
          <Tabs.Screen 
            name="profile" 
            options={{ 
              title: "Profil",
              tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
            }} 
          />
          <Tabs.Screen name="map" options={{ href: null }} />
          <Tabs.Screen name="community" options={{ href: null }} />
          <Tabs.Screen name="cat-sitter" options={{ href: null }} />
          <Tabs.Screen name="lost-found" options={{ href: null }} />
        </Tabs>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    width: '100%',
  },
});
