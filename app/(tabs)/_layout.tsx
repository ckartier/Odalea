import React, { useMemo, useCallback } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IS_TABLET, RESPONSIVE_LAYOUT, COLORS, SHADOWS } from "@/constants/colors";
import AppHeader, { useAppHeaderHeight } from "@/components/AppHeader";
import { Heart, MessageCircle, Sparkles, User } from "lucide-react-native";

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
            tabBarActiveTintColor: '#000000',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              position: 'absolute',
              bottom: insets.bottom + 20,
              marginHorizontal: '5%',
              width: '90%',
              alignSelf: 'center',
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              borderRadius: 28,
              height: 72,
              paddingBottom: 8,
              paddingTop: 8,
              ...SHADOWS.large,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: 4,
              marginBottom: 2,
            },
            tabBarItemStyle: {
              paddingVertical: 4,
            },
          }}
        >
          <Tabs.Screen 
            name="home" 
            options={{ 
              title: "Découvrir",
              tabBarIcon: ({ color, size }) => <Sparkles size={22} color={color} strokeWidth={2} />,
            }} 
          />
          <Tabs.Screen 
            name="challenges" 
            options={{ 
              title: "Matchs",
              tabBarIcon: ({ color, size }) => <Heart size={22} color={color} strokeWidth={2} />,
            }} 
          />
          <Tabs.Screen name="shop" options={{ href: null }} />
          <Tabs.Screen 
            name="messages" 
            options={{ 
              title: "Messages",
              tabBarIcon: ({ color, size }) => <MessageCircle size={22} color={color} strokeWidth={2} />,
            }} 
          />
          <Tabs.Screen 
            name="profile" 
            options={{ 
              title: "Profil",
              tabBarIcon: ({ color, size }) => <User size={22} color={color} strokeWidth={2} />,
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
