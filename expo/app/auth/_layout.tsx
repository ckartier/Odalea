import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="pro-register" />
      <Stack.Screen name="verify" options={{ headerShown: true }} />
    </Stack>
  );
}
