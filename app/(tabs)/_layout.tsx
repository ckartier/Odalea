import React, { useMemo } from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IS_TABLET, RESPONSIVE_LAYOUT, COLORS } from "@/constants/colors";
import AppHeader, { useAppHeaderHeight } from "@/components/AppHeader";
import { Map, MessageCircle, Users, User } from "lucide-react-native";

export default function TabLayout() {
  const insets = useSafeAreaInsets();



  const headerHeight = useAppHeaderHeight();

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
      <AppHeader showMenu={false} showNotifications={false} />

      <View style={containerStyle}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.gray,
            tabBarHideOnKeyboard: true,
            tabBarStyle: {
              backgroundColor: COLORS.white,
              borderTopWidth: 1,
              borderTopColor: COLORS.borderLight,
              height: 60 + insets.bottom,
              paddingBottom: insets.bottom,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tabs.Screen 
            name="map" 
            options={{ 
              title: "Carte",
              tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
            }} 
          />
          <Tabs.Screen 
            name="community" 
            options={{ 
              title: "Communauté",
              tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
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
          <Tabs.Screen name="home" options={{ href: null }} />
          <Tabs.Screen name="shop" options={{ href: null }} />
          <Tabs.Screen name="cat-sitter" options={{ href: null }} />
          <Tabs.Screen name="lost-found" options={{ href: null }} />
          <Tabs.Screen name="challenges" options={{ href: null }} />
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
