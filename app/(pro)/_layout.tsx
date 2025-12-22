import { Stack, Redirect } from "expo-router";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, DIMENSIONS } from "@/constants/colors";
import { useUser } from "@/hooks/user-store";
import ProTopBar from "@/components/ProTopBar";
import FloatingMenu from "@/components/FloatingMenu";

export default function ProLayout() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Only redirect if user is logged in but not allowed in the pro area.
  // Cat-sitter dashboard lives under /(pro), so allow cat sitters too.
  // Allow access for non-logged in users (they might want to register as pro)
  if (user && !user.isProfessional && !user.isCatSitter) {
    return <Redirect href="/(tabs)/community" />;
  }

  return (
    <>
      {/* Professional Top Bar */}
      <ProTopBar onMenuPress={handleMenuToggle} />
      
      {/* Floating Menu */}
      <FloatingMenu 
        isOpen={isMenuOpen} 
        onToggle={handleMenuToggle}
        isProfessional={true}
      />
      
      <View style={[styles.container, { paddingTop: insets.top + DIMENSIONS.COMPONENT_SIZES.HEADER_HEIGHT }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
              color: '#1A1A1A',
            },
            headerStyle: {
              backgroundColor: COLORS.screenBackground,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="cat-sitter-dashboard" />
          <Stack.Screen name="shop" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="services" />
        </Stack>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
});