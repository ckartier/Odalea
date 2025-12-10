import React, { useMemo, useState, useCallback } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IS_TABLET, RESPONSIVE_LAYOUT } from "@/constants/colors";
import TopBar, { useTopBarHeight } from "@/components/TopBar";
import FloatingMenu from "@/components/FloatingMenu";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleMenuToggle = useCallback(() => {
    router.push('/menu');
  }, [router]);

  const topBarHeight = useTopBarHeight();

  const containerStyle = useMemo(() => ([
    styles.container,
    {
      paddingTop: topBarHeight,
      maxWidth: IS_TABLET ? RESPONSIVE_LAYOUT.contentMaxWidth : '100%',
      alignSelf: IS_TABLET ? 'center' : 'stretch',
    },
  ]), [topBarHeight]);

  return (
    <>
      <TopBar onMenuPress={handleMenuToggle} />
      {/* <FloatingMenu isOpen={isMenuOpen} onToggle={handleMenuToggle} /> */}

      <View style={containerStyle}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: { display: 'none' },
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tabs.Screen name="home" options={{ href: null }} />
          <Tabs.Screen name="community" options={{ title: "Communauté" }} />
          <Tabs.Screen name="map" options={{ title: "Carte" }} />
          <Tabs.Screen name="shop" options={{ title: "Boutique" }} />
          <Tabs.Screen name="challenges" options={{ title: "Défis" }} />
          <Tabs.Screen name="messages" options={{ title: "Messages" }} />
          <Tabs.Screen name="cat-sitter" options={{ title: "Cat Sitter" }} />
          <Tabs.Screen name="profile" options={{ title: "Profil" }} />
          <Tabs.Screen name="lost-found" options={{ href: null }} />
        </Tabs>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
  },
});