import React, { useMemo } from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, DimensionValue, FlexAlignType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IS_TABLET, RESPONSIVE_LAYOUT, COLORS, SHADOWS } from "@/constants/colors";
import { Home, Sparkles, Heart, MessageCircle, User } from "lucide-react-native";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const containerStyle = useMemo(() => ([
    styles.container,
    {
      maxWidth: (IS_TABLET ? RESPONSIVE_LAYOUT.contentMaxWidth : '100%') as DimensionValue,
      alignSelf: (IS_TABLET ? 'center' : 'stretch') as FlexAlignType,
    },
  ]), []);

  return (
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
            fontWeight: '600' as const,
            marginTop: 4,
            marginBottom: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        {/* Home/Accueil - Default screen after login */}
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: "Accueil",
            tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
          }} 
        />
        <Tabs.Screen 
          name="home" 
          options={{ 
            title: "Découvrir",
            tabBarIcon: ({ color }) => <Sparkles size={22} color={color} strokeWidth={2} />,
          }} 
        />
        <Tabs.Screen 
          name="challenges" 
          options={{ 
            title: "Matchs",
            tabBarIcon: ({ color }) => <Heart size={22} color={color} strokeWidth={2} />,
          }} 
        />
        <Tabs.Screen 
          name="messages" 
          options={{ 
            title: "Messages",
            tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} strokeWidth={2} />,
          }} 
        />
        
        {/* Hidden tabs - accessible via navigation but not shown in tab bar */}
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="shop" options={{ href: null }} />
        <Tabs.Screen name="map" options={{ href: null }} />
        <Tabs.Screen name="community" options={{ href: null }} />
        <Tabs.Screen name="cat-sitter" options={{ href: null }} />
        <Tabs.Screen name="lost-found" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    width: '100%',
  },
  
});
