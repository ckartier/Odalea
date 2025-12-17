import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="blocked-users" />
      <Stack.Screen name="faq" />
      <Stack.Screen name="help" />
      <Stack.Screen name="support" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="rgpd" />
    </Stack>
  );
}
